import express from "express";
const router = express.Router();
import { catchAsync } from "../utils/catchAsync.js";
import { isAuthenticatedEmployee } from "../middlewares/isAuthenticatedEmployee.js";
import { timelapse } from "../lib/multer.js";
import {
  createTimelapseVideo,
  getAllTimeLapseVideoOfOwn,
  getAllTimeLapseVideoOfUser,
  getAllVideoOfDay,
  getOneTimeLapseVideo,
  get15DaysVideo,
  getVideoofSpecificDate,
} from "../controllers/timelapsevideo.controller.js";
import { isAuthenticatedCompany } from "../middlewares/isAuthenticatedCompany.js";
import { isAuthenticated } from "../middlewares/isAuthenticatedUser.js";
import { checkPermission } from "../middlewares/rolePermission.js";
import { addWatermarkToTimelapse } from "../controllers/downloadTimelapsevideo.controller.js";

router.post(
  "/",
  catchAsync(isAuthenticatedEmployee),
  timelapse.single("timelapsevideo"),
  catchAsync(createTimelapseVideo)
);
router.get(
  "/get-timelapse-own",
  catchAsync(isAuthenticatedEmployee),
  catchAsync(getAllTimeLapseVideoOfOwn)
);
router.get(
  "/get-timelapse/:employeeId",
  isAuthenticated,
  checkPermission("get", "timelapse"),
  catchAsync(getAllTimeLapseVideoOfUser)
);
router.get(
  "/get-one-timelapse/:timelapseId",
  isAuthenticated,
  checkPermission("get", "timelapse"),
  catchAsync(getOneTimeLapseVideo)
);
router.get(
  "/getallvideoofDay",
  isAuthenticated,
  checkPermission("get", "timelapse"),
  catchAsync(getAllVideoOfDay)
);
router.get(
  "/get-15-days-video/:employeeId",
  isAuthenticated,
  checkPermission("get", "timelapse"),
  catchAsync(get15DaysVideo)
);
router.post(
  "/timelapse/:timelapseId",
  isAuthenticated,
  checkPermission("downloadVideo", "timelapse"),
  catchAsync(addWatermarkToTimelapse)
);
router.get(
  "/get-video-of-specific-day/:date",
  catchAsync(isAuthenticatedCompany),
  catchAsync(getVideoofSpecificDate)
);

export default router;
