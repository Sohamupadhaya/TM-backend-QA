import express from "express";
const router = express.Router();

import { catchAsync } from "../utils/catchAsync.js";
import {
  calculateProductiveRatio,
  addProductiveWorkRate,
  getOwnProductiveRatio,
  getOwnProductiveRatioWeekly,
  getNumberOfProductiveEmployee,
  getNumberOfUnproductiveEmployee,
  getEmployeesDailyProductivityRatioById,
  getProductiveAndUnproductiveEmployee,
  getEmployeeWeelyProductivityRatioById,
} from "../controllers/productivity.controller.js";
import { isAuthenticated } from "../middlewares/isAuthenticatedUser.js";
import { checkPermission } from "../middlewares/rolePermission.js";

router.post("/add-productivity-ratio", isAuthenticated, catchAsync(addProductiveWorkRate),);
router.get("/get-productivity-ratio", isAuthenticated, catchAsync(getOwnProductiveRatio),);
router.get("/get-weekly-productivity-ratio", isAuthenticated, catchAsync(getOwnProductiveRatioWeekly),);

//company
router.get("/calculate-productivity-ratio", isAuthenticated, checkPermission("get", "productivity"), catchAsync(calculateProductiveRatio),);
router.get("/get-productive-employee", isAuthenticated, checkPermission("get", "productivity"), catchAsync(getProductiveAndUnproductiveEmployee),);
router.get("/get-NumberOf-productive-employee", isAuthenticated, checkPermission("get", "productivity"), catchAsync(getNumberOfProductiveEmployee),);
router.get("/get-NumberOf-unproductive-employee", isAuthenticated, checkPermission("get", "productivity"), catchAsync(getNumberOfUnproductiveEmployee),);
router.get("/get-employee-productivity-ratio", isAuthenticated, checkPermission("get", "productivity"), catchAsync(getEmployeesDailyProductivityRatioById),);
router.get("/get-employee-weekly-productivity-ratio", isAuthenticated, checkPermission("get", "productivity"), catchAsync(getEmployeeWeelyProductivityRatioById),);

export default router;