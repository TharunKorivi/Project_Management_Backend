import { ApiResponse } from '../utils/api-response.js';
import { ApiError } from '../utils/api-error.js';
import { Project } from '../models/project.model.js';
import { ProjectNote } from '../models/note.model.js';
import { asyncHandler } from '../utils/async-handler.js';
import mongoose from 'mongoose';

const getNotes = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    const notes = await ProjectNote.find(
        { project: projectId },
        { _id: 1, createdBy: 1, content: 1 }
    ).populate('createdBy', '_id avatar email username');

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { notes, noteCount: notes.length },
                'Project notes fetched successfully'
            )
        );
});

const getNoteById = asyncHandler(async (req, res) => {
    const { projectId, noteId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(noteId)) {
        throw new ApiError(400, 'Invalid Note ID');
    }

    const note = await ProjectNote.findOne(
        { project: projectId, _id: noteId },
        { _id: 1, createdBy: 1, content: 1 }
    ).populate('createdBy', '_id avatar email username');

    if (!note) {
        throw new ApiError(404, 'Project note not found');
    }

    return res
        .status(200)
        .json(new ApiResponse(200, note, 'Project note fetched successfully'));
});

const addNote = asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { content } = req.body;

    if (!content) {
        throw new ApiError(400, 'Content is required');
    }

    const note = await ProjectNote.create({
        createdBy: req.user._id,
        project: projectId,
        content,
    });

    return res
        .status(201)
        .json(new ApiResponse(201, note, 'Project note added successfully'));
});

const updateNote = asyncHandler(async (req, res) => {
    const { projectId, noteId } = req.params;
    const { content } = req.body;

    if (!content) {
        throw new ApiError(400, 'Content is required');
    }

    if (!mongoose.Types.ObjectId.isValid(noteId)) {
        throw new ApiError(400, 'Invalid Note ID');
    }

    const note = await ProjectNote.findOneAndUpdate(
        {
            project: projectId,
            _id: noteId,
        },
        {
            $set: {
                content,
            },
        },
        {
            returnDocument: 'after',
        }
    );

    if (!note) {
        throw new ApiError(404, 'Project note not found');
    }

    return res
        .status(200)
        .json(new ApiResponse(200, note, 'Project note updated successfully'));
});

const deleteNote = asyncHandler(async (req, res) => {
    const { projectId, noteId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(noteId)) {
        throw new ApiError(400, 'Invalid Note ID');
    }

    const note = await ProjectNote.findOneAndDelete({
        project: projectId,
        _id: noteId,
    });

    if (!note) {
        throw new ApiError(404, 'Project note not found');
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, 'Project note deleted successfully'));
});

export { getNoteById, getNotes, updateNote, deleteNote, addNote };
