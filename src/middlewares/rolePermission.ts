import { Request, Response, NextFunction } from "express";
import { getRolesForEmployee } from "../controllers/role.controller.js";
import { getPermissionsForRole } from "../controllers/permission.controller.js";
import { RolePermission } from "@prisma/client";
import jwt from "jsonwebtoken";

import prisma from "../models/index.js";
export const checkPermission = (
  requiredAction: string,
  requiredResource: string
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { authorization } = req.headers;
    if (!authorization || !authorization.startsWith("Bearer ")) return;

    const token = authorization.split(" ")[1];
    if (!token) return;

    const decoded: any = await Promise.resolve().then(() =>
      jwt.verify(token, process.env.JWT_LOGIN_SECRET || "default_secret")
    );
    if (decoded.companyId) {
      return next();
    } else {
      const employeeId = req.user?.employeeId;
      const employee = await prisma.employee.findFirst({
        where: {
          employeeId: employeeId,
        },
      });
      if (!employee) {
        return res.json({ message: "You are not authorized" });
      }
      const companyId = employee?.companyId;
      if (!companyId) {
        return res.json({ message: "No company found" });
      }
      const userRoles = await getRolesForEmployee(employeeId!, companyId);
      let hasPermission = false;
      for (const userRole of userRoles) {
        if (userRole.roleId) {
          const permissions: RolePermission[] = await getPermissionsForRole(
            userRole.roleId,
            companyId
          );
          // const permissions: RolePermission[] = await getPermissionsForRole(
          //   userRole.roleId,
          //   companyId,
          // );
          if (
            permissions.some(
              (permission: RolePermission) =>
                permission.action === requiredAction &&
                permission.resource === requiredResource &&
                permission.companyId === companyId
            )
          ) {
            hasPermission = true;
            break;
          }
        } else {
          return res
            .status(403)
            .json({ message: "No role associated with the user" });
        }
      }
      if (!hasPermission) {
        return res.status(403).json({ message: "Access denied" });
      }
      next();
    }
  };
};
