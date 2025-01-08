import express from "express"
const router = express.Router()
import { catchAsync } from "../utils/catchAsync.js"
import { sevenDaysWorkAnalysis, topUsedAppAnalysis, totalTeamsDepartmentsAndEmployeeOfCompany, workAnalysisOfCompany, breakTakenEmployees, breakTakenEmployeesInMonth, breakTakenEmployeesOnDate } from "../controllers/dashboard.controller.js"
import { isAuthenticated } from "../middlewares/isAuthenticatedUser.js"
import { checkPermission } from "../middlewares/rolePermission.js"

router.get("/", isAuthenticated, checkPermission('get', 'dashboard'), catchAsync(totalTeamsDepartmentsAndEmployeeOfCompany))
router.get("/work-analysis", isAuthenticated, checkPermission('getWorkAnalysis', 'dashboard'), catchAsync(workAnalysisOfCompany))
router.get("/used-app-analysis", isAuthenticated, checkPermission('getUsedAppAnalysis', 'dashboard'), catchAsync(topUsedAppAnalysis))
router.get("/seven-days-work-analysis", isAuthenticated, checkPermission('getSevenDaysWorkAnalysis', 'dashboard'), catchAsync(sevenDaysWorkAnalysis))
router.get("/get-most-break-taking-employees", isAuthenticated, checkPermission('getMostBreakTakingEmployees', 'dashboard'), catchAsync(breakTakenEmployees))
router.get('/breaks/month', isAuthenticated, checkPermission('getMostBreakTakingEmployees', 'dashboard'), catchAsync(breakTakenEmployeesInMonth));
router.get('/breaks/date', isAuthenticated, checkPermission('getMostBreakTakingEmployees', 'dashboard'), catchAsync(breakTakenEmployeesOnDate));

export default router;

