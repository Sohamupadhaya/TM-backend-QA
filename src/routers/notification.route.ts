import express from "express"
const router = express.Router()
import { catchAsync } from "../utils/catchAsync.js"
import { isAuthenticatedEmployee } from "../middlewares/isAuthenticatedEmployee.js"
import { screenshot } from "../lib/multer.js"
import { isAuthenticatedCompany } from "../middlewares/isAuthenticatedCompany.js";
import { isAuthenticated } from "../middlewares/isAuthenticatedUser.js";
import { checkPermission } from "../middlewares/rolePermission.js";
import { getUnreadNotificationsCountOfCompany, getUnreadNotificationsCountOfEmployee, getUnreadNotificationsOfCompany, getUnreadNotificationsOfEmployee, markAsReadNotification } from "../controllers/notification.controller.js"


router.get("/employee-unread",catchAsync(isAuthenticatedEmployee), catchAsync(getUnreadNotificationsOfEmployee))
router.get("/count-employee-unread",catchAsync(isAuthenticatedEmployee), catchAsync(getUnreadNotificationsCountOfEmployee))
router.patch("/marked-as-read-employee/:notificationId",catchAsync(isAuthenticatedEmployee), catchAsync(markAsReadNotification))


router.get("/company-unread", isAuthenticated, checkPermission('get','notification'), catchAsync(getUnreadNotificationsOfCompany))
router.get("/count-company-unread", isAuthenticated, checkPermission('get','notification'), catchAsync(getUnreadNotificationsCountOfCompany))
router.patch("/marked-as-read/:notificationId", isAuthenticated, checkPermission('markAsRead','notification'), catchAsync(markAsReadNotification))
export default router