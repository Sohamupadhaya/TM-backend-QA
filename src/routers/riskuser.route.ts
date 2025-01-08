import express from "express"
const router = express.Router()
import { addRiskUser, safeUser, addToInactive, getAllInactiveUser, getRiskUser, getRiskUserDetails, sendScreenshotInMail, sendTimelapseInMail } from "../controllers/riskuser.controller.js"
import { isAuthenticatedCompany } from "../middlewares/isAuthenticatedCompany.js"
import { catchAsync } from "../utils/catchAsync.js"
import { isAuthenticated } from "../middlewares/isAuthenticatedUser.js"
import { checkPermission } from "../middlewares/rolePermission.js"
// , , deleteEmployee
router.post("/add-to-riskUser/:employeeId", isAuthenticated, checkPermission('add','riskUser'), catchAsync(addRiskUser))
router.delete("/safe-from-riskUser/:riskUserId", isAuthenticated,checkPermission('delete','riskUser'), catchAsync(safeUser))
router.put("/add-to-inactive/:employeeId",  isAuthenticated,checkPermission('addIntoInactive','riskUser'), catchAsync(addToInactive))
router.get("/get-all-deleatedEmployee", isAuthenticated,checkPermission('getDeletedEmployee','riskUser'), catchAsync(getAllInactiveUser))
router.get("/getRiskUser",  isAuthenticated, checkPermission('getRiskUser','riskUser'), catchAsync(getRiskUser))
router.get("/getRiskUserDetail/:employeeId", isAuthenticated,checkPermission('getRiskUser','riskUser'),  catchAsync(getRiskUserDetails))
router.get("/sent-riskUser-ss-in-mail/:employeeId", isAuthenticated, checkPermission('screenshotInMail', 'riskUser'), catchAsync(sendScreenshotInMail));
// router.get("/sent-riskuser-timelapseViedeo-in-mail/:employeeId", isAuthenticated, checkPermission('videoInMai', 'riskUser'), catchAsync(sendTimelapseInMail))

export default router