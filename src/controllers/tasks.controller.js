import { ApiResponse } from '../utils/api-response.js';
import { ApiError } from '../utils/api-error.js';
import { Project } from '../models/project.model.js';
import { ProjectMember } from '../models/projectmember.model.js';
import { Task } from '../models/task.model.js';
import { SubTask } from '../models/subtask.model.js';
import { User } from '../models/user.model.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
    AvailableUserRoles,
    TaskStatusEnum,
    UserRoleEnum,
} from '../utils/constansts.js';
import mongoose from 'mongoose';

const getTasks = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const tasks = await Task.find({
        project: new mongoose.Types.ObjectId(projectId),
    }).populate('assignedTo', '_id username email');
    return res
        .status(200)
        .json(new ApiResponse(200, tasks, 'Tasks fetched successfully'));
});

const addTask = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    let { title, description, status, assignedTo } = req.body;

    if (assignedTo) {
        const user = await User.findById(assignedTo);

        if (!user) {
            throw new ApiError(404, 'Assigned user not found');
        }

        const member = await ProjectMember.findOne({
            user: new mongoose.Types.ObjectId(assignedTo),
            project: new mongoose.Types.ObjectId(projectId),
        });

        if (!member) {
            throw new ApiError(400, 'Assigned user is not a project member');
        }
    }

    const files = req.files || [];

    const attachments = files.map((file) => {
        return {
            url: `${req.protocol}://${req.get('host')}/images/${file.filename}`,
            mimetype: file.mimetype,
            size: file.size,
        };
    });

    const task = await Task.create({
        title,
        description,
        status: status || TaskStatusEnum.TODO,
        assignedTo: assignedTo
            ? new mongoose.Types.ObjectId(assignedTo)
            : undefined,
        attachments,
        project: new mongoose.Types.ObjectId(projectId),
        assignedBy: new mongoose.Types.ObjectId(req.user._id),
    });

    return res
        .status(201)
        .json(new ApiResponse(201, task, 'Task added successfully.'));
});

const updateTask = asyncHandler(async (req, res) => {
    //

    const { projectId, taskId } = req.params;
    let { title, description, status, assignedTo } = req.body;

    const task = await Task.findOne({
        project: projectId,
        _id: taskId,
    });

    if (!task) {
        throw new ApiError(404, 'Task not found');
    }

    if (!status) {
        status = task.status;
    }

    if (assignedTo) {
        const user = await User.findById(assignedTo);

        if (!user) {
            throw new ApiError(404, 'Assigned user not found');
        }

        const member = await ProjectMember.findOne({
            user: new mongoose.Types.ObjectId(assignedTo),
            project: new mongoose.Types.ObjectId(projectId),
        });

        if (!member) {
            throw new ApiError(400, 'Assigned user is not a project member');
        }
    }

    task.status = status;
    task.title = title;
    task.description = description;

    if (assignedTo !== undefined || assignedTo !== '') {
        task.assignedTo = assignedTo;
    }

    await task.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, task, 'Task updated successfully.'));
});

const getTaskById = asyncHandler(async (req, res) => {
    const { projectId, taskId } = req.params;

    const task = await Task.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(taskId),
                project: new mongoose.Types.ObjectId(projectId),
            },
        },
        {
            $lookup: {
                from: 'users',
                localField: 'assignedTo',
                foreignField: '_id',
                as: 'assignedTo',
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            username: 1,
                            email: 1,
                        },
                    },
                ],
            },
        },
        {
            $unwind: {
                path: '$assignedTo',
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $lookup: {
                from: 'subtasks',
                localField: '_id',
                foreignField: 'task',
                as: 'subtasks',
                pipeline: [
                    {
                        $project: {
                            title: 1,
                            isCompleted: 1,
                        },
                    },
                ],
            },
        },
        {
            $project: {
                title: 1,
                description: 1,
                assignedTo: 1,
                subtasks: 1,
            },
        },
    ]);

    if (!task || task.length === 0) {
        throw new ApiError(404, 'Task not found');
    }
    return res
        .status(200)
        .json(new ApiResponse(200, task[0], 'Task fetched successfully'));
});

const deleteTask = asyncHandler(async (req, res) => {
    const { projectId, taskId } = req.params;

    const session = await mongoose.startSession();

    session.startTransaction();

    try {
        const task = await Task.findOne({
            _id: taskId,
            project: projectId,
        }).session(session);

        if (!task) {
            throw new ApiError(404, 'Task not found');
        }

        // delete subtasks

        await SubTask.deleteMany(
            {
                task: taskId,
            },
            { session }
        );

        // delete task

        await Task.findOneAndDelete(
            {
                _id: taskId,
                project: projectId,
            },
            { session }
        );

        await session.commitTransaction();

        return res
            .status(200)
            .json(new ApiResponse(200, {}, 'Task deleted successfully'));
    } catch (error) {
        await session.abortTransaction();

        throw error;
    } finally {
        await session.endSession();
    }
});

const addSubTask = asyncHandler(async (req, res) => {
    const { projectId, taskId } = req.params;

    const { title } = req.body;

    if (!title) {
        throw new ApiError(400, 'Title is required');
    }

    const task = await Task.findOne({
        project: projectId,
        _id: taskId,
    });

    if (!task) {
        throw new ApiError(404, 'No task found');
    }

    const subtask = await SubTask.create({
        title,
        task: new mongoose.Types.ObjectId(task._id),
        createdBy: new mongoose.Types.ObjectId(req.user._id),
    });

    return res
        .status(201)
        .json(new ApiResponse(201, subtask, 'Sub task created successfully'));
});

const updateSubTask = asyncHandler(async (req, res) => {
    const { projectId, subTaskId } = req.params;

    let { title, isCompleted } = req.body;

    const subtask = await SubTask.findById(subTaskId);

    if (!subtask) {
        throw new ApiError(404, 'Sub task not found');
    }

    const task = await Task.findOne({
        _id: subtask.task,
        project: projectId,
    });

    if (!task) {
        throw new ApiError('Sub Task does not belong to this project');
    }

    if (
        isCompleted === undefined ||
        isCompleted === '' ||
        isCompleted === null
    ) {
        isCompleted = subtask.isCompleted;
    }

    subtask.title = title;
    subtask.isCompleted = isCompleted;

    await subtask.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, subtask, 'Sub task updated successfully'));
});
const deleteSubTask = asyncHandler(async (req, res) => {
    const { projectId, subTaskId } = req.params;

    const subtask = await SubTask.findById(subTaskId);

    if (!subtask) {
        throw new ApiError(404, 'Sub task not found');
    }

    const task = await Task.findOne({
        _id: subtask.task,
        project: projectId,
    });

    if (!task) {
        throw new ApiError('Sub Task does not belong to this project');
    }

    await SubTask.findByIdAndDelete(subTaskId);
    return res
        .status(200)
        .json(new ApiResponse(200, {}, 'Sub task deleted successfully'));
});

export {
    getTaskById,
    getTasks,
    addTask,
    updateTask,
    deleteTask,
    addSubTask,
    updateSubTask,
    deleteSubTask,
};
