import express from "express";
const router = express.Router();
import { isAuthenticatedCompany } from "../middlewares/isAuthenticatedCompany.js";
import { catchAsync } from "../utils/catchAsync.js";
import {
  assignTask,
  completeTask,
  getUserTask,
} from "../controllers/task.controller.js";
import { checkPermission } from "../middlewares/rolePermission.js";
import { isAuthenticated } from "../middlewares/isAuthenticatedUser.js";

// router.use(authentication())
router.post( "/assign-task/:id",isAuthenticated,checkPermission('create', 'task'), catchAsync(assignTask),);
router.patch( "/complete-task/:companyId/:taskId", catchAsync(completeTask),);
router.get( "/getEmployeeTask", catchAsync(getUserTask),);

export default router;
