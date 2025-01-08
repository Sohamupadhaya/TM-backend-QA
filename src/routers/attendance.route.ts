import express from "express";
const router = express.Router();
import { catchAsync } from "../utils/catchAsync.js";
import { isAuthenticatedEmployee } from "../middlewares/isAuthenticatedEmployee.js";
import {
  allEmployeeAttendanceInCompany,
  breakOut,
  displayMonthlyInOutReport,
  displayMonthlyInOutReportByEmpId,
  displayOwnAttendanceOfSpecificDate,
  displayUserAttendanceOfCurrentDate,
  displayUserAttendanceOfMonths,
  displayUserAttendanceOfSpecificDate,
  employeeAllAttendance,
  employeeAllAttendanceByDept,
  employeeAttendanceClockIn,
  employeeAttendanceClockOut,
  employeeTodayClockInAndClockOutData,
  get15DaysAttendance,
  ownAttendance,
  sendDailyAttInMail,
  sendLateReportInMail,
  sendMonthlyAttInMail,
  sendMonthlyInOutInMail,
  sendOverTimeAttInMail,
  takeBreak,
} from "../controllers/attendance.controller.js";
import { isAuthenticatedCompany } from "../middlewares/isAuthenticatedCompany.js";
import { isAuthenticated } from "../middlewares/isAuthenticatedUser.js";
import { checkPermission } from "../middlewares/rolePermission.js";

router.post(
  "/clock-in",
  catchAsync(isAuthenticatedEmployee),
  catchAsync(employeeAttendanceClockIn)
);
router.post(
  "/clock-out",
  catchAsync(isAuthenticatedEmployee),
  catchAsync(employeeAttendanceClockOut)
);
router.post(
  "/take-break",
  catchAsync(isAuthenticatedEmployee),
  catchAsync(takeBreak)
);
router.post(
  "/break-out",
  catchAsync(isAuthenticatedEmployee),
  catchAsync(breakOut)
);
router.get(
  "/today-clockin",
  catchAsync(isAuthenticatedEmployee),
  catchAsync(employeeTodayClockInAndClockOutData)
);
router.get(
  "/get-own-attendance",
  catchAsync(isAuthenticatedEmployee),
  catchAsync(ownAttendance)
);

router.get(
  "/employee/:employeeId",
  isAuthenticated,
  checkPermission("getMonthly", "attendence"),
  catchAsync(displayUserAttendanceOfMonths)
);
router.get(
  "/now",
  isAuthenticated,
  checkPermission("getDaily", "attendence"),
  catchAsync(displayUserAttendanceOfCurrentDate)
);
router.get(
  "/date",
  isAuthenticated,
  checkPermission("getSpecificDate", "attendence"),
  catchAsync(displayUserAttendanceOfSpecificDate)
);
router.get(
  "/all-employee-attendance",
  isAuthenticated,
  checkPermission("getAll", "attendence"),
  catchAsync(allEmployeeAttendanceInCompany)
);
router.get(
  "/get-employee-all-attendance/:employeeId",
  isAuthenticated,
  checkPermission("getEmployee", "attendence"),
  catchAsync(employeeAllAttendance)
);
router.get(
  "/get-dept-employee-attendance/:departmentId",
  isAuthenticated,
  checkPermission("getEmployee", "attendence"),
  catchAsync(employeeAllAttendanceByDept)
);
router.post(
  "/monthly-report",
  isAuthenticated,
  checkPermission("getMontly", "attendence"),
  catchAsync(displayMonthlyInOutReport)
);
router.post(
  "/monthly-in-out/:employeeId",
  isAuthenticated,
  checkPermission("getMontly", "attendence"),
  catchAsync(displayMonthlyInOutReportByEmpId)
);
router.get(
  "/get-15-days-attendance/:employeeId",
  isAuthenticated,
  checkPermission("get15DaysAttendance", "attendence"),
  catchAsync(get15DaysAttendance)
);
router.get(
  "/daily-report",
  isAuthenticated,
  checkPermission("get", "attendance"),
  catchAsync(sendDailyAttInMail)
);
router.post(
  "/monthly-report/:employeeId",
  isAuthenticated,
  checkPermission("get", "attendance"),
  catchAsync(sendMonthlyAttInMail)
);
router.get(
  "/late-report/:departmentId/:employeeId?",
  isAuthenticated,
  checkPermission("get", "attendance"),
  catchAsync(sendLateReportInMail)
);
router.get(
  "/overTime-report/:employeeId",
  isAuthenticated,
  checkPermission("get", "attendance"),
  catchAsync(sendOverTimeAttInMail)
);
router.get(
  "/monthly-in-out-report/:date/:employeeId?",
  isAuthenticated,
  checkPermission("get", "attendance"),
  catchAsync(sendMonthlyInOutInMail)
);

router.post(
  "/get-own-attendance-specific-date",
  catchAsync(isAuthenticatedEmployee),
  catchAsync(displayOwnAttendanceOfSpecificDate)
);

export default router;
