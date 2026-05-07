import { validationResult } from 'express-validator';
import { ApiError } from '../utils/api-error.js';

function validate(req, res, next) {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }

    const extractedErrors = [];
    errors.array().forEach((err) => {
        extractedErrors.push({
            [err.path]: err.msg,
        });
    });

    throw new ApiError(
        400,
        'Provide the data in correct form',
        extractedErrors
    );
}

export default validate;
