import { Router } from 'express';
import {
    verifyJWT,
    authorizeProjectRoles,
} from '../middlewares/auth.middleware.js';
import {
    UserRoleEnum,
    AvailableTaskStatuses,
    TaskStatusEnum,
    AvailableUserRoles,
} from '../utils/constansts.js';
import validate from '../middlewares/validate.middleware.js';
import {
    addSubTask,
    addTask,
    deleteSubTask,
    deleteTask,
    getTaskById,
    getTasks,
    updateSubTask,
    updateTask,
} from '../controllers/tasks.controller.js';
import { upload } from '../middlewares/multer.middleware.js';
import {
    addTaskValidator,
    updateSubTaskValidator,
} from '../validators/tasks.validator.js';

import { verifyProjectExists } from '../middlewares/tasks.middleware.js';

const router = Router({ mergeParams: true });

router.use(verifyJWT);
router.use(verifyProjectExists);

router
    .route('/')
    .post(
        authorizeProjectRoles(UserRoleEnum.ADMIN, UserRoleEnum.PROJECT_ADMIN),
        upload.array('attachments', 10),
        addTaskValidator(),
        validate,
        addTask
    )
    .get(authorizeProjectRoles(...AvailableUserRoles), getTasks);

router
    .route('/task/:taskId')
    .get(authorizeProjectRoles(...AvailableUserRoles), getTaskById)
    .put(
        authorizeProjectRoles(UserRoleEnum.ADMIN, UserRoleEnum.PROJECT_ADMIN),
        addTaskValidator(),
        validate,
        updateTask
    )
    .delete(
        authorizeProjectRoles(UserRoleEnum.ADMIN, UserRoleEnum.PROJECT_ADMIN),
        deleteTask
    );

router.route('/task/:taskId/subtasks').post(addSubTask);

router
    .route('/subtask/:subTaskId')
    .put(updateSubTaskValidator(), validate, updateSubTask)
    .delete(
        authorizeProjectRoles(UserRoleEnum.ADMIN, UserRoleEnum.PROJECT_ADMIN),
        deleteSubTask
    );

export default router;
