import mongoose, { Schema } from 'mongoose';
import { UserRoleEnum, AvailableUserRoles } from '../utils/constansts.js';

const projectmemberSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        project: {
            type: Schema.Types.ObjectId,
            ref: 'Project',
            required: true,
        },
        role: {
            type: String,
            enum: AvailableUserRoles,
            default: UserRoleEnum.MEMBER,
        },
    },
    { timestamps: true }
);

export const ProjectMember = mongoose.model(
    'ProjectMember',
    projectmemberSchema
);
