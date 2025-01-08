import express from "express";
const router = express.Router();
import {
  createDepartment,
  deleteDepartment,
  getAllDepartment,
  getAllDepartmentEmployee,
  getDepartment,
  updateDepartment,
} from "../controllers/department.controller.js";
import { catchAsync } from "../utils/catchAsync.js";
import { isAuthenticatedCompany } from "../middlewares/isAuthenticatedCompany.js";
import { isAuthenticated } from "../middlewares/isAuthenticatedUser.js";
import { checkPermission } from "../middlewares/rolePermission.js";

router.post(
  "/create-department",
  isAuthenticated,
  checkPermission("create", "department"),
  catchAsync(createDepartment)
);
router.patch(
  "/update-department/:departmentId",
  isAuthenticated,
  checkPermission("edit", "department"),
  catchAsync(updateDepartment)
);
router.get(
  "/get-all-department",
  isAuthenticated,
  checkPermission("getAll", "department"),
  catchAsync(getAllDepartment)
);
router.get(
  "/get-department/:departmentId",
  isAuthenticated,
  checkPermission("getById", "department"),
  catchAsync(getDepartment)
);
router.delete(
  "/delete-department/:departmentId",
  isAuthenticated,
  checkPermission("delete", "department"),
  catchAsync(deleteDepartment)
);
router.get(
  "/get-department-employees/:departmentId",
  isAuthenticated,
  checkPermission("getEmployeesOfDepartment", "department"),
  catchAsync(getAllDepartmentEmployee)
);

export default router;
