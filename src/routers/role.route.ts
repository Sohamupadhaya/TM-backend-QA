import express from "express";
const router = express.Router();
import { catchAsync } from "../utils/catchAsync.js";
import { isAuthenticatedCompany } from "../middlewares/isAuthenticatedCompany.js";
import { addRole, deleteRoleById, editRoleById, getAllRoleOfCompany, assignRoleToEmployee, updateRole } from '../controllers/role.controller.js';
import { isAuthenticated } from "../middlewares/isAuthenticatedUser.js";
import { checkPermission } from "../middlewares/rolePermission.js";

router.post("/add-roles", isAuthenticated, checkPermission("add","role"), catchAsync(addRole));
router.get("/get-all-role-of-company", isAuthenticated, checkPermission("getAll","role"), catchAsync(getAllRoleOfCompany));
router.patch("/edit-role-name-and-desc/:roleId", isAuthenticated, checkPermission("patch","role"), catchAsync(editRoleById));
router.delete("/delete-role-by-id/:roleId", isAuthenticated, checkPermission("delete","role"), catchAsync(deleteRoleById));
router.post('/assign-role', isAuthenticated, checkPermission("assign","role"), catchAsync(assignRoleToEmployee));
router.get('/company-roles', isAuthenticated, checkPermission("getAll","role"), catchAsync(getAllRoleOfCompany))
router.patch('/update-role', isAuthenticated, checkPermission("patch","role"), catchAsync(updateRole))

export default router