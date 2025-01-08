import express from "express";
const router = express.Router();
import { catchAsync } from "../utils/catchAsync.js";
import { isAuthenticatedEmployee } from "../middlewares/isAuthenticatedEmployee.js";
import { screenshot } from "../lib/multer.js";
import {
  addScreenshot,
  getAllScreenshotOfOwn,
  getAllScreenshotOfUser,
  getOneScreenshot,
  getAllScreenshotOfDay,
  getScreenshotOfSpecificDate,
  getScreenshotOfEmployeeSpecificDate,
  get15DaysScreenshot,
  latestSsTimeOfEmp,
} from "../controllers/screenshot.controller.js";
import { isAuthenticatedCompany } from "../middlewares/isAuthenticatedCompany.js";
import { screenshotS3Multer } from "../services/s3Upload.js";
import { isAuthenticated } from "../middlewares/isAuthenticatedUser.js";
import { checkPermission } from "../middlewares/rolePermission.js";
import { addWatermarkToScreenshot } from "../controllers/downloadScreenshot.controller.js";

router.post(
  "/",
  catchAsync(isAuthenticatedEmployee),
  screenshot.single("screenshot"),
  catchAsync(addScreenshot)
);
router.get(
  "/get-screenshot-own",
  catchAsync(isAuthenticatedEmployee),
  catchAsync(getAllScreenshotOfOwn)
);
router.get(
  "/get-latest-ss-time",
  catchAsync(isAuthenticatedEmployee),
  catchAsync(latestSsTimeOfEmp)
);

router.get(
  "/get-screenshot/:employeeId",
  isAuthenticated,
  checkPermission("get", "screenshot"),
  catchAsync(getAllScreenshotOfUser)
);
router.get(
  "/get-one-screenshot/:screenshotId",
  isAuthenticated,
  checkPermission("get", "screenshot"),
  catchAsync(getOneScreenshot)
);
router.get(
  "/get-screenshot-of-day",
  isAuthenticated,
  checkPermission("get", "screenshot"),
  catchAsync(getAllScreenshotOfDay)
);
router.get(
  "/get-screenshot-of-specific-date/:date",
  isAuthenticated,
  checkPermission("get", "screenshot"),
  catchAsync(getScreenshotOfSpecificDate)
);
router.get(
  "/get-screenshot-of-employee-specific-date/:employeeId",
  isAuthenticated,
  checkPermission("get", "screenshot"),
  catchAsync(getScreenshotOfEmployeeSpecificDate)
);
router.get(
  "/get-15-days-screenshot/:employeeId",
  isAuthenticated,
  checkPermission("get", "screenshot"),
  catchAsync(get15DaysScreenshot)
);
router.post(
  "/get-WatermarkScreenshot/:screenshotId",
  isAuthenticated,
  checkPermission("downloadSS", "screenshot"),
  catchAsync(addWatermarkToScreenshot)
);

export default router;
