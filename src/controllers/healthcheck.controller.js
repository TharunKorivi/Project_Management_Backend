import { ApiResponse } from '../utils/api-response.js';
import { asyncHandler } from '../utils/async-handler.js';

import mongoose from 'mongoose';

const healthCheckController = asyncHandler(async (req, res) => {
    const healthData = {
        status: 'OK',

        timestamp: new Date(),

        uptime: process.uptime(),

        environment: process.env.NODE_ENV,

        database: {
            status:
                mongoose.connection.readyState === 1
                    ? 'connected'
                    : 'disconnected',
        },

        memory: {
            rss: process.memoryUsage().rss,
            heapUsed: process.memoryUsage().heapUsed,
            heapTotal: process.memoryUsage().heapTotal,
        },
    };

    return res
        .status(200)
        .json(new ApiResponse(200, healthData, 'Health check successful'));
});

export { healthCheckController };
