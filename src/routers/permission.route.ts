import express from "express";
const router = express.Router();
import { catchAsync } from "../utils/catchAsync.js";
import { isAuthenticatedCompany } from "../middlewares/isAuthenticatedCompany.js";
import {
  addPermissionToRole,
  deleteRolePermission,
  editRolePermision,
  getPermissionsForRole,
  getPermissionsOfRole,
} from "../controllers/permission.controller.js";
import { isAuthenticated } from "../middlewares/isAuthenticatedUser.js";
import { checkPermission } from "../middlewares/rolePermission.js";




router.post("/add-permission", isAuthenticated, checkPermission('add', 'permission'), catchAsync(addPermissionToRole));
router.get("/get-permission-for-role/:id", isAuthenticated, checkPermission('get', 'permission'), catchAsync(getPermissionsOfRole),);
router.delete("/delete-permission/:id", isAuthenticated, checkPermission('delete', 'permission'), catchAsync(deleteRolePermission),);
router.patch("/edit-role-permission", isAuthenticated, checkPermission('patch', 'permission'), catchAsync(editRolePermision),);
router.get("/get-permission-for-role", isAuthenticated, checkPermission('get', 'permission'), catchAsync(getPermissionsForRole));


export default router;