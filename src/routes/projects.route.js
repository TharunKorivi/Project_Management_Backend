import { Router } from 'express';
import {
    verifyJWT,
    authorizeProjectRoles,
} from '../middlewares/auth.middleware.js';
import {
    addProjectMember,
    createProject,
    deleteProject,
    getProject,
    getProjectMembers,
    getProjects,
    removeProjectMember,
    updateProject,
    updateProjectMemberRole,
} from '../controllers/projects.controller.js';
import { AvailableUserRoles, UserRoleEnum } from '../utils/constansts.js';
import validate from '../middlewares/validate.middleware.js';
import {
    createProjectValidator,
    addProjectMemberValidator,
} from '../validators/project.validator.js';

const router = Router();
router.use(verifyJWT);

router
    .route('/')
    .post(createProjectValidator(), validate, createProject)
    .get(getProjects);

router
    .route('/:projectId')
    .put(
        authorizeProjectRoles(UserRoleEnum.ADMIN),
        createProjectValidator(),
        validate,
        updateProject
    )
    .delete(authorizeProjectRoles(UserRoleEnum.ADMIN), deleteProject)
    .get(authorizeProjectRoles(...AvailableUserRoles), getProject);

router
    .route('/:projectId/members')
    .get(getProjectMembers)
    .post(
        authorizeProjectRoles(UserRoleEnum.ADMIN),
        addProjectMemberValidator(),
        validate,
        addProjectMember
    );

router
    .route('/:projectId/members/:userId')
    .put(authorizeProjectRoles(UserRoleEnum.ADMIN), updateProjectMemberRole)
    .delete(authorizeProjectRoles(UserRoleEnum.ADMIN), removeProjectMember);

export default router;
