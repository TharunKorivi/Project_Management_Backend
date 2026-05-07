import { body } from 'express-validator';
import { AvailableUserRoles } from '../utils/constansts.js';

const createProjectValidator = () => {
    return [
        body('name').trim().notEmpty().withMessage('Name is required.'),
        body('description')
            .trim()
            .notEmpty()
            .withMessage('Description is required'),
    ];
};

const addProjectMemberValidator = () => {
    return [
        body('email')
            .trim()
            .notEmpty()
            .withMessage('Email is required')
            .toLowerCase()
            .isEmail()
            .withMessage('Email is invalid.'),

        body('role')
            .optional()
            .trim()
            .isIn(AvailableUserRoles)
            .withMessage('Invalid Role provided'),
    ];
};

export { addProjectMemberValidator, createProjectValidator };
