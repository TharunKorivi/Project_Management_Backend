import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/api-error.js';
import { User } from '../models/user.model.js';
import mongoose from 'mongoose';
import { ProjectMember } from '../models/projectmember.model.js';

const verifyJWT = async (req, res, next) => {
    try {
        // support both cookie & header

        const token =
            req.cookies?.accessToken ||
            req.headers.authorization?.split(' ')[1];

        if (!token) {
            console.log('Invalid token');
            throw new ApiError(401, 'Unauthorized request (no token)');
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decoded._id).select(
            '-password -emailVerificationToken -emailVerificationExpiry'
        );

        if (!user) {
            console.log('Invalid token, user does not exist');
            throw new ApiError(401, 'Invalid token: user does not exist');
        }
        req.user = user;
        next();
    } catch (error) {
        console.log('JWT error:', error.message);
        next(new ApiError(401, 'Invalid or expired token'));
    }
};

const authorizeProjectRoles = (...allowedRoles) => {
    return async (req, res, next) => {
        const { projectId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            throw new ApiError(400, 'Invalid Project ID');
        }

        const membership = await ProjectMember.findOne({
            project: projectId,
            user: req.user._id,
        });

        if (!membership) {
            return next(
                new ApiError(403, 'You are not a member of this project')
            );
        }

        if (!allowedRoles.includes(membership.role)) {
            return next(
                new ApiError(
                    403,
                    'You are not authorized to perform this action'
                )
            );
        }

        req.projectRole = membership.role;
        next();
    };
};
export { verifyJWT, authorizeProjectRoles };
