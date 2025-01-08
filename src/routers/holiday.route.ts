
import express from "express"
const router = express.Router()
import { addHoliday, editHoliday,deleteHoliday, getallHoliday, getholidaybyId, displayHolidayOfCompany, getUpcomingHolidays } from "../controllers/holiday.controller.js" 
import { catchAsync } from "../utils/catchAsync.js"
import { isAuthenticatedCompany } from "../middlewares/isAuthenticatedCompany.js"
import { isAuthenticatedEmployee } from "../middlewares/isAuthenticatedEmployee.js"
import { isAuthenticated } from "../middlewares/isAuthenticatedUser.js"
import { checkPermission } from "../middlewares/rolePermission.js"


router.get("/get-all-holiday-employee", catchAsync(isAuthenticatedEmployee), catchAsync(getallHoliday))
router.get("/display-holiday", catchAsync(isAuthenticatedEmployee), catchAsync(displayHolidayOfCompany))

router.post("/create-holiday", isAuthenticated, checkPermission('create','holiday'), catchAsync(addHoliday))
router.patch("/edit-holiday/:holidayId", isAuthenticated,checkPermission('edit','holiday'), catchAsync(editHoliday))
router.delete("/delete-holiday/:holidayId",isAuthenticated,checkPermission('delete','holiday'), catchAsync(deleteHoliday))
router.get("/get-all-holiday", isAuthenticated,checkPermission('getAll','holiday'), catchAsync(getallHoliday))
router.get("/get-holiday/:holidayId", isAuthenticated,  catchAsync(getholidaybyId))
router.get("/get-upcomming-holiday", isAuthenticated, catchAsync(getUpcomingHolidays))

export default router