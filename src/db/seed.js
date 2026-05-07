import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

import { User } from '../models/user.model.js';
import { Project } from '../models/project.model.js';
import { ProjectMember } from '../models/projectmember.model.js';
import { Task } from '../models/task.model.js';
import { SubTask } from '../models/subtask.model.js';
import { ProjectNote } from '../models/note.model.js';
import { config } from 'dotenv';
import { UserRoleEnum, TaskStatusEnum } from '../utils/constansts.js';

config();

await mongoose.connect(process.env.MONGO_URI).catch((err) => {
    console.log('mongo db connection failed, error : ', err);
    process.exit(1);
});

console.log('MongoDB connected');

try {
    // =========================
    // CLEAN DATABASE
    // =========================

    await Promise.all([
        SubTask.deleteMany({}),
        Task.deleteMany({}),
        ProjectNote.deleteMany({}),
        ProjectMember.deleteMany({}),
        Project.deleteMany({}),
        User.deleteMany({}),
    ]);

    console.log('Old data deleted');

    // =========================
    // USERS
    // =========================

    const hashedPassword = await bcrypt.hash('Password@1', 10);

    const users = await User.insertMany([
        {
            username: 'tharun',
            email: 'tharun@test.com',
            fullName: 'Tharun Korivi',
            password: hashedPassword,
        },
        {
            username: 'ravi',
            email: 'ravi@test.com',
            fullName: 'Ravi Charan',
            password: hashedPassword,
        },
        {
            username: 'kiran',
            email: 'kiran@test.com',
            fullName: 'Kiran Kumar',
            password: hashedPassword,
        },
        {
            username: 'vijay',
            email: 'vijay@test.com',
            fullName: 'Vijay Kumar',
            password: hashedPassword,
        },
        {
            username: 'anusha',
            email: 'anusha@test.com',
            fullName: 'Anusha Reddy',
            password: hashedPassword,
        },
    ]);

    const [tharun, ravi, kiran, vijay, anusha] = users;

    console.log('Users seeded');

    // =========================
    // PROJECTS
    // =========================

    const projects = await Project.insertMany([
        {
            name: 'AI Project Camp',
            description: 'AI driven project management system',
            createdBy: tharun._id,
        },
        {
            name: 'MERN Collaboration Platform',
            description: 'Team collaboration system using MERN',
            createdBy: ravi._id,
        },
    ]);

    const [aiProject, mernProject] = projects;

    console.log('Projects seeded');

    // =========================
    // PROJECT MEMBERS
    // =========================

    await ProjectMember.insertMany([
        // AI PROJECT
        {
            project: aiProject._id,
            user: tharun._id,
            role: UserRoleEnum.ADMIN,
        },
        {
            project: aiProject._id,
            user: ravi._id,
            role: UserRoleEnum.PROJECT_ADMIN,
        },
        {
            project: aiProject._id,
            user: kiran._id,
            role: UserRoleEnum.MEMBER,
        },
        {
            project: aiProject._id,
            user: anusha._id,
            role: UserRoleEnum.MEMBER,
        },

        // MERN PROJECT
        {
            project: mernProject._id,
            user: ravi._id,
            role: UserRoleEnum.ADMIN,
        },
        {
            project: mernProject._id,
            user: vijay._id,
            role: UserRoleEnum.PROJECT_ADMIN,
        },
        {
            project: mernProject._id,
            user: anusha._id,
            role: UserRoleEnum.MEMBER,
        },
    ]);

    console.log('Project members seeded');

    // =========================
    // TASKS
    // =========================

    const tasks = await Task.insertMany([
        {
            title: 'Implement JWT Authentication',
            description: 'Access token + refresh token flow',
            project: aiProject._id,
            assignedTo: ravi._id,
            assignedBy: tharun._id,
            status: TaskStatusEnum.IN_PROGRESS,
            attachments: [
                {
                    url: 'http://localhost:8080/images/jwt-flow.png',
                    mimetype: 'image/png',
                    size: 23000,
                },
            ],
        },
        {
            title: 'Aggregation Pipeline Optimization',
            description: 'Optimize project aggregation queries',
            project: aiProject._id,
            assignedTo: kiran._id,
            assignedBy: ravi._id,
            status: TaskStatusEnum.TODO,
            attachments: [],
        },
        {
            title: 'Frontend Dashboard',
            description: 'Create dashboard UI using React',
            project: mernProject._id,
            assignedTo: anusha._id,
            assignedBy: vijay._id,
            status: TaskStatusEnum.DONE,
            attachments: [
                {
                    url: 'http://localhost:8080/images/dashboard-design.pdf',
                    mimetype: 'application/pdf',
                    size: 120000,
                },
            ],
        },
    ]);

    const [jwtTask, aggregationTask, dashboardTask] = tasks;

    console.log('Tasks seeded');

    // =========================
    // SUBTASKS
    // =========================

    await SubTask.insertMany([
        {
            title: 'Generate access token',
            task: jwtTask._id,
            isCompleted: true,
            createdBy: tharun._id,
        },
        {
            title: 'Implement refresh token rotation',
            task: jwtTask._id,
            isCompleted: false,
            createdBy: ravi._id,
        },
        {
            title: 'Optimize nested lookups',
            task: aggregationTask._id,
            isCompleted: false,
            createdBy: ravi._id,
        },
        {
            title: 'Setup React Router',
            task: dashboardTask._id,
            isCompleted: true,
            createdBy: vijay._id,
        },
    ]);

    console.log('Subtasks seeded');

    // =========================
    // PROJECT NOTES
    // =========================

    await ProjectNote.insertMany([
        {
            project: aiProject._id,
            createdBy: tharun._id,
            content: 'Authentication module architecture finalized',
        },
        {
            project: aiProject._id,
            createdBy: tharun._id,
            content: 'Need caching for aggregation-heavy endpoints',
        },
        {
            project: mernProject._id,
            createdBy: ravi._id,
            content: 'Frontend dashboard completed successfully',
        },
    ]);

    console.log('Project notes seeded');

    console.log('Database seeded successfully');

    process.exit(0);
} catch (error) {
    console.log('Seed error:', error);

    process.exit(1);
}
