import express from 'express';
import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

// ✅ CORS first
app.use(
    cors({
        origin: process.env.CROSS_ORIGIN
            ? process.env.CROSS_ORIGIN.split(',')
            : ['http://localhost:5173'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization'],
        methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    })
);

// ✅ body parsers
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));

// cookie parser

app.use(cookieParser());

// ✅ static files
app.use('/images', express.static('public/images'));

// routes
import healthCheckRouter from './routes/healthcheck.route.js';
import authRouter from './routes/auth.route.js';
import projectsRouter from './routes/projects.route.js';
import tasksRouter from './routes/tasks.route.js';
import notesRouter from './routes/notes.route.js';

const url = '/api/v1/';
app.use(`${url}auth`, authRouter);
app.use(`${url}healthcheck`, healthCheckRouter);
app.use(`${url}projects`, projectsRouter);
app.use(`${url}tasks/:projectId`, tasksRouter);
app.use(`${url}notes/:projectId`, notesRouter);

// error Handler middleware
app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json({
        success: false,
        statusCode: err.statusCode,
        message: err.message || 'Internal Server Error',
        errors: err.errors || null,
        stack: err.stack || null,
    });
});

export default app;
