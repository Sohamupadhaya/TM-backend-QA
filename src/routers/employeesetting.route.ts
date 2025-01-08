import express from "express"
const router = express.Router()
import { catchAsync } from "../utils/catchAsync.js"
import { isAuthenticated } from "../middlewares/isAuthenticatedUser.js"
import { checkPermission } from "../middlewares/rolePermission.js"
import { deleteEmployee } from "../controllers/employeesettings.controller.js"


router.delete(
    "/delete-employee/:employeeId", isAuthenticated, checkPermission('delete','employee'),  catchAsync(deleteEmployee),
);




export default router