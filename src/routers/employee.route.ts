import express from "express"
const router = express.Router()
import { registerEmployee, loginEmployee, updateEmployeeDepartmentAndTeam, loginEmployeeInAdmin, getEmployeeProfile, uploadProfilePicture, getEmployeeByID, getEmployeeDetails, sendDeletedEmpReport } from "../controllers/employee.controller.js"
import { catchAsync } from "../utils/catchAsync.js"
import { isAuthenticatedCompany } from "../middlewares/isAuthenticatedCompany.js"
import { isAuthenticatedEmployee } from "../middlewares/isAuthenticatedEmployee.js"
import { isAuthenticated } from "../middlewares/isAuthenticatedUser.js"
import { checkPermission } from "../middlewares/rolePermission.js"
import { userPhoto } from "../lib/multer.js"

router.post("/login", catchAsync(loginEmployee))
router.post("/loginInAdmin", catchAsync(loginEmployeeInAdmin))
router.get("/profile", catchAsync(isAuthenticatedEmployee), catchAsync(getEmployeeProfile))
router.patch("/upload/:employeeId", catchAsync(isAuthenticatedEmployee), userPhoto.single('profilePicture'), catchAsync(uploadProfilePicture))

router.post("/register", isAuthenticated, checkPermission('create', 'employee'), catchAsync(registerEmployee))
router.patch("/update/:employeeId", isAuthenticated, checkPermission('edit', 'employee'), catchAsync(updateEmployeeDepartmentAndTeam))
router.get("/employe-by-Id/:employeeId", isAuthenticated, checkPermission('get', 'employee'), catchAsync(getEmployeeByID))
router.get("/employee-details/:employeeId", isAuthenticated, checkPermission('get', 'employee'), catchAsync(getEmployeeDetails))
router.get("/deleted-emp-report", isAuthenticated, catchAsync(sendDeletedEmpReport))



export default router