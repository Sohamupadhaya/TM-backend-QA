import express from "express"
const router = express.Router()
import { isAuthenticatedEmployee } from "../middlewares/isAuthenticatedEmployee.js"
import { catchAsync } from "../utils/catchAsync.js"
import { addIdleTime, todayIdleTime } from "../controllers/idle.controller.js"
import { isAuthenticatedCompany } from "../middlewares/isAuthenticatedCompany.js"

// changeWorkingStatus

router.post("/add-idle-time", catchAsync(isAuthenticatedEmployee), catchAsync(addIdleTime))
// router.post("/add-idle-time", catchAsync(isAuthenticatedEmployee), catchAsync(addIdleStartTime))
// router.patch("/change-working-status", catchAsync(isAuthenticatedEmployee), catchAsync(changeWorkingStatus))
router.get("/display-today-idle-tiime", catchAsync(isAuthenticatedCompany), catchAsync(todayIdleTime))

export default router