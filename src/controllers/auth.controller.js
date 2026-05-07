import { ApiResponse } from '../utils/api-response.js';
import { ApiError } from '../utils/api-error.js';
import { User } from '../models/user.model.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
    sendMail,
    emailVerificationMailgenContent,
    forgotPasswordResetMailgenContent,
} from '../utils/mail.js';

import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const generateTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        console.log('Something went wrong while generating access tokens');
        throw new ApiError(
            500,
            'Something went wrong while generating access tokens'
        );
    }
};

const registerUser = asyncHandler(async (req, res) => {
    // get details from body
    const { email, username, password } = req.body;

    // check if user exists;

    const existingUser = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (existingUser) {
        throw new ApiError(
            409,
            'User already exist with a same username or email'
        );
    }

    // if not exist save to the db

    const user = new User({
        username: username,
        email: email,
        password: password,
    });
    await user.save();

    // generate Tempory tokens for email verification

    const { unHashedToken, hashedToken, tokenExpiry } =
        user.generateTemporaryToken();

    // save hashedToken in db

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = tokenExpiry;

    await user.save({ validateBeforeSave: false });

    // send verification mail
    try {
        await sendMail({
            email: user.email,
            subject: 'Email verification of your account',
            mailGenContent: emailVerificationMailgenContent(
                user.username,
                `${req.protocol}://${req.get('host')}/api/v1/auth/verify-email/${unHashedToken}`
            ),
        });
    } catch (error) {
        console.log('Error while sending email : ', error.message);
        throw new ApiError(500, 'Failed to send verification email.');
    }

    // send response

    const createdUser = await User.findById(user._id).select(
        '-password -emailVerificationToken -emailVerificationExpiry'
    );

    if (!createdUser) {
        console.log(createdUser);
        console.log('Error while registering the user');
        throw new ApiError(500, 'Something went wrong while registering user');
    }

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                { user: createdUser },
                'User registered sucessfully and email verification link is sent'
            )
        );
});

const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // check is user exists

    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(401, 'Invalid email or password');
    }

    // check if the password is correct

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid email or password');
    }

    // generate access tokens

    const { accessToken, refreshToken } = await generateTokens(user._id);

    const options = {
        httpOnly: true,
        secure: true,
    };

    const loggedInUser = await User.findById(user._id).select(
        '-password -emailVerificationToken -emailVerificationExpiry'
    );

    return res
        .status(200)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken,
                },
                'User logged in successfully.'
            )
        );
});

const logout = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    if (userId) {
        await User.findByIdAndUpdate(userId, {
            $unset: { refreshToken: '' },
        });
    }

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie('accessToken', options)
        .clearCookie('refreshToken', options)
        .json(new ApiResponse(200, {}, 'User logged out successfully.'));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(
        new ApiResponse(
            200,
            {
                user: req.user,
            },
            'Current user data fetched successfully.'
        )
    );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    // get the AT from cookies

    const incomingRefreshToken =
        req.cookies?.refreshToken || req.headers.authorization?.split(' ')[1];

    console.log(`Cliecnt token : ${incomingRefreshToken}`);

    if (!incomingRefreshToken) {
        throw new ApiError(401, 'Unauthorized request (no token).');
    }

    // decode the token
    let decodedToken;
    try {
        decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );
    } catch (e) {
        throw new ApiError(401, 'Invalid or expired refresh token');
    }

    const user = await User.findById(decodedToken?._id).select(
        '-password -emailVerificationToken -emailVerificationExpiry'
    );

    // check if user exists , server token with client token
    if (!user || user.refreshToken !== incomingRefreshToken) {
        console.log(`Server token : ${user.refreshToken}`);

        throw new ApiError(401, 'Invalid refresh token');
    }

    // generate tokens and save to db
    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(
        user._id
    );

    user.refreshToken = newRefreshToken;

    await user.save({ validateBeforeSave: false });

    // send cookies as AT RT

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                { user, accessToken, refreshToken: newRefreshToken },
                'Tokens refreshed successfully.'
            )
        );
});

const verifyEmail = asyncHandler(async (req, res) => {
    const { verificationToken } = req.params;

    if (!verificationToken) {
        throw new ApiError(400, 'Verification token is required');
    }

    const hashedToken = crypto
        .createHash('sha256')
        .update(verificationToken)
        .digest('hex');

    const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpiry: { $gt: Date.now() },
    });

    if (!user) {
        throw new ApiError(400, 'Invalid or expired verification token');
    }

    if (user.isEmailVerified) {
        return res
            .status(200)
            .json(new ApiResponse(200, {}, 'Email already verified'));
    }

    await User.findByIdAndUpdate(user._id, {
        $set: { isEmailVerified: true },
        $unset: {
            emailVerificationExpiry: 1,
            emailVerificationToken: 1,
        },
    });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, 'Email verified successfully.'));
});

const resendEmailVerification = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    if (user.isEmailVerified) {
        throw new ApiError(400, 'Email is already verified.');
    }

    //generate new tokens

    const { unHashedToken, hashedToken, tokenExpiry } =
        user.generateTemporaryToken();

    // save state to db

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = tokenExpiry;

    await user.save({ validateBeforeSave: false });

    try {
        await sendMail({
            mailGenContent: emailVerificationMailgenContent(
                user.username,
                `${req.protocol}://${req.get('host')}/api/v1/auth/verify-email/${unHashedToken}`
            ),
            email: user.email,
            subject: 'Email Verification of your account',
        });
    } catch (error) {
        console.log('Error while sending email : ', error.message);
        throw new ApiError(500, 'Failed to send email verification.');
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                'Email verification link has been sent to your mail successfully.'
            )
        );
});

const forgotPasswordRequest = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        throw new ApiError(404, "User with email doesn't exist.");
    }

    const { unHashedToken, hashedToken, tokenExpiry } =
        user.generateTemporaryToken();

    // save token to db

    user.forgotPasswordExpiry = tokenExpiry;
    user.forgotPasswordToken = hashedToken;

    await user.save({ validateBeforeSave: false });

    // send mail

    try {
        await sendMail({
            mailGenContent: forgotPasswordResetMailgenContent(
                user.username,
                `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${unHashedToken}`
            ),
            email: user.email,
            subject: 'Password Reset Link',
        });
    } catch (error) {
        //rollback

        console.log(
            'Error while sending password reset mail : ',
            error.message
        );
        throw new ApiError(500, 'Failed to send Password reset mail.');
    }
    return res
        .status(200)
        .json(
            new ApiResponse(200, {}, 'Password reset mail sent successfully.')
        );
});

const resetPasswordRequest = asyncHandler(async (req, res) => {
    const { resetToken } = req.params;
    const { newPassword } = req.body;

    if (!resetToken) {
        throw new ApiError(400, 'Reset token is missing.');
    }

    const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    const user = await User.findOne({
        forgotPasswordToken: hashedToken,
        forgotPasswordExpiry: { $gt: Date.now() },
    });

    if (!user) {
        throw new ApiError(400, 'Token is invalid or expired');
    }

    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });
    return res
        .status(200)
        .json(new ApiResponse(200, {}, 'Password reset successfull'));
});

const changePassword = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(400, "User doesn't exist.");
    }

    const isPasswordValid = await user.isPasswordCorrect(currentPassword);

    if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid current password');
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, 'Password changed successfully.'));
});

export {
    registerUser,
    login,
    logout,
    getCurrentUser,
    refreshAccessToken,
    verifyEmail,
    resendEmailVerification,
    forgotPasswordRequest,
    resetPasswordRequest,
    changePassword,
};
