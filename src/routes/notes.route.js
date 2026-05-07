import { Router } from 'express';
import {
    verifyJWT,
    authorizeProjectRoles,
} from '../middlewares/auth.middleware.js';
import { verifyProjectExists } from '../middlewares/tasks.middleware.js';
import {
    addNote,
    deleteNote,
    getNoteById,
    getNotes,
    updateNote,
} from '../controllers/notes.controller.js';
import { AvailableUserRoles, UserRoleEnum } from '../utils/constansts.js';

const router = Router({ mergeParams: true });

router.use(verifyJWT);
router.use(verifyProjectExists);

router
    .route('/')
    .get(authorizeProjectRoles(...AvailableUserRoles), getNotes)
    .post(authorizeProjectRoles(UserRoleEnum.ADMIN), addNote);

router
    .route('/note/:noteId')
    .get(authorizeProjectRoles(...AvailableUserRoles), getNoteById)
    .put(authorizeProjectRoles(UserRoleEnum.ADMIN), updateNote)
    .delete(authorizeProjectRoles(UserRoleEnum.ADMIN), deleteNote);

export default router;
