import { ApiResponse } from '../utils/api-response.js';
import { ApiError } from '../utils/api-error.js';
import { Project } from '../models/project.model.js';
import { ProjectMember } from '../models/projectmember.model.js';
import { User } from '../models/user.model.js';
import { asyncHandler } from '../utils/async-handler.js';
import { AvailableUserRoles, UserRoleEnum } from '../utils/constansts.js';
import mongoose from 'mongoose';
import { SubTask } from '../models/subtask.model.js';
import { Task } from '../models/task.model.js';
import { ProjectNote } from '../models/note.model.js';

const getProjects = asyncHandler(async (req, res) => {
    const projects = await ProjectMember.aggregate([
        {
            $match: { user: new mongoose.Types.ObjectId(req.user._id) },
        },
        {
            $lookup: {
                from: 'projects',
                localField: 'project',
                foreignField: '_id',
                as: 'project',
            },
        },
        {
            $unwind: '$project',
        },
        {
            $lookup: {
                from: 'projectmembers',
                localField: 'project._id',
                foreignField: 'project',
                as: 'members',
            },
        },
        {
            $lookup: {
                from: 'users',
                let: { memberIds: '$members.user' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $in: ['$_id', '$$memberIds'],
                            },
                        },
                    },
                    {
                        $project: {
                            _id: 1,
                            avatar: 1,
                            username: 1,
                            email: 1,
                        },
                    },
                ],
                as: 'users',
            },
        },
        {
            $addFields: {
                members: {
                    $map: {
                        input: '$members',
                        as: 'm',
                        in: {
                            role: '$$m.role',
                            user: {
                                $first: {
                                    $filter: {
                                        input: '$users',
                                        as: 'u',
                                        cond: { $eq: ['$$u._id', '$$m.user'] },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        {
            $addFields: {
                createdBy: {
                    $first: {
                        $filter: {
                            input: '$users',
                            as: 'u',
                            cond: { $eq: ['$$u._id', '$project.createdBy'] },
                        },
                    },
                },
            },
        },

        {
            $project: {
                role: 1,
                project: {
                    _id: '$project._id',
                    name: '$project.name',
                    description: '$project.description',
                    createdBy: '$createdBy',
                    createdAt: '$project.createdAt',
                    members: '$members',
                    memberCount: { $size: '$members' },
                },
                _id: 0,
            },
        },
    ]);

    if (!projects || projects.length === 0) {
        throw new ApiError(404, 'No project found.');
    }

    return res
        .status(200)
        .json(new ApiResponse(200, projects, 'Projects fetched successfully'));
});

const createProject = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { name, description } = req.body;

    const project = await Project.create({
        name,
        description,
        createdBy: new mongoose.Types.ObjectId(userId),
    });

    await ProjectMember.create({
        user: new mongoose.Types.ObjectId(userId),
        project: new mongoose.Types.ObjectId(project._id),
        role: UserRoleEnum.ADMIN,
    });

    return res
        .status(201)
        .json(new ApiResponse(201, project, 'Project created successfully.'));
});

const updateProject = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { name, description } = req.body;

    const project = await Project.findByIdAndUpdate(
        projectId,
        {
            name,
            description,
        },
        { returnDocument: 'after' }
    );

    if (!project) {
        throw new ApiError(404, 'Project not found.');
    }

    return res
        .status(200)
        .json(new ApiResponse(200, project, 'Project updated successfully'));
});

const deleteProject = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    const session = await mongoose.startSession();

    session.startTransaction();

    try {
        // verify project
        const project = await Project.findById(projectId).session(session);

        if (!project) {
            throw new ApiError(404, 'Project not found');
        }

        const tasks = await Task.find({ project: projectId }, '_id', {
            session,
        });

        const taskIds = tasks.map((task) => task._id);

        await SubTask.deleteMany(
            {
                task: { $in: taskIds },
            },
            { session }
        );

        await Task.deleteMany({ project: projectId }, { session });

        await ProjectNote.deleteMany({ project: projectId }, { session });

        await ProjectMember.deleteMany({ project: projectId }, { session });

        await Project.findByIdAndDelete(projectId, { session });

        await session.commitTransaction();

        return res
            .status(200)
            .json(new ApiResponse(200, {}, 'Project deleted successfully'));
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        await session.endSession();
    }
});

const getProject = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new ApiError(400, 'Invalid project ID');
    }

    const project = await Project.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(projectId),
            },
        },
        {
            $lookup: {
                from: 'users',
                localField: 'createdBy',
                foreignField: '_id',
                as: 'createdBy',
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            avatar: 1,
                            username: 1,
                            email: 1,
                        },
                    },
                ],
            },
        },
        {
            $unwind: '$createdBy',
        },
        {
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                createdBy: 1,
                createdAt: 1,
            },
        },
    ]);

    if (!project || project.length === 0) {
        throw new ApiError(404, 'Project not found.');
    }

    return res
        .status(200)
        .json(new ApiResponse(200, project, 'Project fetched successfully.'));
});

const getProjectMembers = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new ApiError(400, 'Invalid project ID');
    }

    const project = await Project.findById(projectId);

    if (!project) {
        throw new ApiError(404, 'Project not found');
    }

    const members = await ProjectMember.aggregate([
        {
            $match: {
                project: new mongoose.Types.ObjectId(projectId),
            },
        },
        {
            $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'user',
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            avatar: 1,
                            username: 1,
                            email: 1,
                        },
                    },
                ],
            },
        },
        {
            $unwind: '$user',
        },
        {
            $project: {
                role: 1,
                user: 1,
                _id: 0,
            },
        },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { members, memberCount: members.length },
                'Project members fetched successfully'
            )
        );
});

const addProjectMember = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { email, role } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        throw new ApiError(400, 'User not found.');
    }

    const existing = await ProjectMember.findOne({
        project: projectId,
        user: user._id,
    });

    if (existing) {
        throw new ApiError(409, 'Project member already exists');
    }

    const projectMember = await ProjectMember.create({
        user: user._id,
        project: projectId,
        role: role || UserRoleEnum.MEMBER,
    });

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                projectMember,
                'Project member added successfully'
            )
        );
});

const updateProjectMemberRole = asyncHandler(async (req, res) => {
    const { projectId, userId } = req.params;
    const { role } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, 'Invalid User ID');
    }

    if (!role || !AvailableUserRoles.includes(role)) {
        throw new ApiError(400, 'Invalid role provided');
    }

    if (req.user._id.toString() === userId && role !== UserRoleEnum.ADMIN) {
        throw new ApiError(400, 'Admin cannot remove their own admin role');
    }

    const projectMember = await ProjectMember.findOneAndUpdate(
        { user: userId, project: projectId },
        { $set: { role: role } },
        {
            returnDocument: 'after',
            projection: { _id: 1, project: 1, user: 1, role: 1, createdAt: 1 },
        }
    );

    if (!projectMember) {
        throw new ApiError(404, 'Project Member not found');
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                projectMember,
                'Project member role updated successfully'
            )
        );
});

const removeProjectMember = asyncHandler(async (req, res) => {
    const { projectId, userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, 'Invalid User ID');
    }

    const targetMember = await ProjectMember.findOne({
        user: userId,
        project: projectId,
    });

    if (!targetMember) {
        throw new ApiError(404, 'Project Member not found');
    }

    if (targetMember.role === UserRoleEnum.ADMIN) {
        const adminCount = await ProjectMember.countDocuments({
            project: projectId,
            role: UserRoleEnum.ADMIN,
        });

        if (adminCount === 1) {
            throw new ApiError(400, 'Cannot remove the last admin');
        }
    }

    await ProjectMember.findOneAndDelete({
        user: userId,
        project: projectId,
    });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, 'Project member removed successfully'));
});

export {
    createProject,
    getProjects,
    updateProject,
    deleteProject,
    getProject,
    getProjectMembers,
    addProjectMember,
    updateProjectMemberRole,
    removeProjectMember,
};
