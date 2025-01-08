import express from "express"
const router = express.Router()
import { addUsedApp, appProductAndUnproductiveAppByCompany, getCompanyApp, getEmployeeUsedAppInADay, productiveAppsForUser, reviewedAppsForCompany, updateAppReview, updateAppType,usedDesktopApp, getEmployeeAppUsageOfSpecificDate, getEmployeeUsedAppInAMonth, getAllAppHistory, sendAppInMail } from "../controllers/app.controller.js"
import { catchAsync } from "../utils/catchAsync.js"
import { isAuthenticatedCompany } from "../middlewares/isAuthenticatedCompany.js"
import { isAuthenticatedEmployee } from "../middlewares/isAuthenticatedEmployee.js"
import { appLogo, appLogoByCompany } from "../lib/multer.js"
import { isAuthenticated } from "../middlewares/isAuthenticatedUser.js"
import { checkPermission } from "../middlewares/rolePermission.js"

router.post("/add-used-app", catchAsync(isAuthenticatedEmployee), appLogo.single("appicon"), catchAsync(addUsedApp))
router.post("/add-used-desktop-app", catchAsync(isAuthenticatedEmployee), appLogo.single("appicon"), catchAsync(usedDesktopApp))
router.get("/productive-apps", catchAsync(isAuthenticatedEmployee), catchAsync(productiveAppsForUser))
router.get("/reviewed-apps", catchAsync(isAuthenticatedEmployee), catchAsync(reviewedAppsForCompany))

router.post("/add-app-review", isAuthenticated, checkPermission('addForReview','app'), appLogoByCompany.single("appicon"), catchAsync(appProductAndUnproductiveAppByCompany))
router.put("/update-appType/:appId", isAuthenticated,checkPermission('editReview', 'app'), catchAsync(updateAppType))
router.put("/update-appReview", isAuthenticated,checkPermission('editReview','app'), catchAsync(updateAppReview))
router.get("/get-company-app", isAuthenticated,checkPermission('get','app'), catchAsync(getCompanyApp))
router.get("/get-employee-used-app/:employeeId",isAuthenticated,checkPermission('get','app'), catchAsync(getEmployeeUsedAppInADay))
router.get("/get-appusage-of-employee-of-specific-date/:date", isAuthenticated, checkPermission('get','app'), catchAsync(getEmployeeAppUsageOfSpecificDate))
router.get("/get-apphistory-of-month/:employee/month", isAuthenticated, catchAsync(getEmployeeUsedAppInAMonth));
router.get("/get-app-history/:employeeId", isAuthenticated, catchAsync(getAllAppHistory))
router.post("/app-history-in-mail/:employeeId", isAuthenticated, catchAsync(sendAppInMail))

export default router