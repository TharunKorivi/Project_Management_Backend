import mongoose, { Schema } from 'mongoose';
import { AvailableTaskStatuses, TaskStatusEnum } from '../utils/constansts.js';

const taskSchema = new Schema(
    {
        title: {
            type: String,
            trim: true,
            required: true,
        },
        description: String,
        project: {
            type: Schema.Types.ObjectId,
            ref: 'Project',
            required: true,
        },
        assignedTo: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        assignedBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        status: {
            type: String,
            enum: AvailableTaskStatuses,
            default: TaskStatusEnum.TODO,
        },
        attachments: {
            type: [
                {
                    url: String,
                    mimetype: String,
                    size: Number,
                },
            ],
            default: [],
        },
    },
    { timestamps: true }
);

export const Task = mongoose.model('Task', taskSchema);
