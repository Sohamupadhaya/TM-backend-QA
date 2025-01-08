import express from "express"
const router = express.Router()
import {applyLeave, leaveStatusUpadate, deleteleave, getallleave, displayLeaveStatusOfEmployee, getEmployeAllLeave, displayLeaveRequestOfEmployee, sendLeavePDF, reconsiderLeave } from "../controllers/leave.controller.js"
import { catchAsync } from "../utils/catchAsync.js"
import { isAuthenticatedEmployee } from "../middlewares/isAuthenticatedEmployee.js";
import { isAuthenticatedCompany } from "../middlewares/isAuthenticatedCompany.js"
import { isAuthenticated } from "../middlewares/isAuthenticatedUser.js";
import { checkPermission } from "../middlewares/rolePermission.js";


router.post("/apply-leave", catchAsync(isAuthenticatedEmployee), catchAsync(applyLeave));
router.put("/leave-status-update/:leaveId", isAuthenticated,checkPermission('edit','leave'),  catchAsync(leaveStatusUpadate));
router.put("/leave-reconsideration/:leaveId", isAuthenticated,checkPermission('edit','leave'),  catchAsync(reconsiderLeave));
router.delete("/delete-leave/:leaveId", catchAsync(isAuthenticatedEmployee), catchAsync(deleteleave));
router.get("/get-all-leave", isAuthenticated,checkPermission('getAll','leave'), catchAsync(getallleave))
router.get("/view-leave-status", catchAsync(isAuthenticatedEmployee), catchAsync(displayLeaveStatusOfEmployee))
router.get("/view-all-leave-of-specific-employees/:employeeId",  isAuthenticated,checkPermission('getAllLeaveOfSpecificEmployee','leave'), catchAsync(getEmployeAllLeave))
router.get("/display-employee-leave-request/:leaveId", catchAsync(isAuthenticatedCompany), catchAsync(displayLeaveRequestOfEmployee))
router.get("/leave-report-in-mail/:employeeId?", isAuthenticatedCompany, catchAsync(sendLeavePDF))

export default router