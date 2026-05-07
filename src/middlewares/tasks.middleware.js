import { Project } from '../models/project.model.js';
import mongoose from 'mongoose';
import { ApiError } from '../utils/api-error.js';
import { asyncHandler } from '../utils/async-handler.js';

const verifyProjectExists = asyncHandler(async (req, res, next) => {
    const { projectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return next(new ApiError(400, 'Invalid Project ID'));
    }

    const project = await Project.findById(projectId);

    if (!project) {
        return next(new ApiError(404, 'Project Not found'));
    }

    req.project = project;
    next();
});

export { verifyProjectExists };
