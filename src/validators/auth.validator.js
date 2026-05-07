import { body } from 'express-validator';

const registerValidator = () => {
    return [
        body('username')
            .trim()
            .notEmpty()
            .withMessage('Username is required')
            .toLowerCase()
            .isLength({ min: 3 })
            .withMessage('Username must have atleast 3 letters'),
        body('email')
            .trim()
            .notEmpty()
            .withMessage('Email is required')
            .toLowerCase()
            .isEmail()
            .withMessage('Email is invalid'),
        body('password')
            .trim()
            .notEmpty()
            .withMessage('Password is required')
            .custom((value) => {
                const passwordRegex =
                    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

                if (!passwordRegex.test(value)) {
                    throw new Error(
                        'Password must be 8+ characters and include uppercase, lowercase, number, and special character.'
                    );
                }
                return true;
            }),
        body('fullName')
            .optional()
            .trim()
            .notEmpty()
            .withMessage('Fullname cannot be empty.'),
    ];
};

const loginValidator = () => {
    return [
        body('email')
            .trim()
            .notEmpty()
            .withMessage('Email is required.')
            .toLowerCase()
            .isEmail()
            .withMessage('Email is invalid'),
        body('password')
            .trim()
            .notEmpty()
            .withMessage('Password is required.')
            .custom((value) => {
                const passwordRegex =
                    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

                if (!passwordRegex.test(value)) {
                    throw new Error(
                        'Password must be 8+ characters and include uppercase, lowercase, number, and special character.'
                    );
                }
                return true;
            }),
    ];
};

const forgotPasswordValidator = () => {
    return [
        body('email')
            .trim()
            .toLowerCase()
            .notEmpty()
            .withMessage('Email is required.')
            .isEmail()
            .withMessage('Email is invalid.'),
    ];
};

const resetPasswordRequestValidator = () => {
    return [
        body('newPassword')
            .trim()
            .isEmpty()
            .withMessage('Password is required.')
            .custom((value) => {
                const passwordRegex =
                    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

                if (!passwordRegex.test(value)) {
                    throw new Error(
                        'Password must be 8+ characters and include uppercase, lowercase, number, and special character.'
                    );
                }
                return true;
            }),
    ];
};

const changePasswordValidator = () => {
    return [
        body('newPassword')
            .trim()
            .notEmpty()
            .withMessage('New password required.')
            .custom((value) => {
                const passwordRegex =
                    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

                if (!passwordRegex.test(value)) {
                    throw new Error(
                        'New password must be 8+ characters and include uppercase, lowercase, number, and special character.'
                    );
                }
                return true;
            }),
        body('currentPassword')
            .trim()
            .notEmpty()
            .withMessage()
            .custom((value) => {
                const passwordRegex =
                    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

                if (!passwordRegex.test(value)) {
                    throw new Error(
                        'Current password must be 8+ characters and include uppercase, lowercase, number, and special character.'
                    );
                }
                return true;
            }),
    ];
};

export {
    registerValidator,
    loginValidator,
    forgotPasswordValidator,
    resetPasswordRequestValidator,
    changePasswordValidator,
};
