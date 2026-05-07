import { body } from 'express-validator';
import { AvailableTaskStatuses } from '../utils/constansts.js';
import mongoose from 'mongoose';

const addTaskValidator = () => {
    return [
        body('title').trim().notEmpty().withMessage('Title is required'),

        body('description')
            .trim()
            .notEmpty()
            .withMessage('Description is required'),

        body('status')
            .optional()
            .trim()
            .isIn(AvailableTaskStatuses)
            .withMessage('Invalid status provided'),

        body('assignedTo')
            .optional()
            .trim()
            .custom(mongoose.Types.ObjectId.isValid)
            .withMessage('Invalid assigned user ID'),
    ];
};

const updateSubTaskValidator = () => {
    return [
        body('title').trim().notEmpty().withMessage('Title is required'),

        body('isCompleted')
            .optional()
            .isBoolean()
            .withMessage('isCompleted must be boolean')
            .toBoolean(),
    ];
};
export { addTaskValidator, updateSubTaskValidator };
