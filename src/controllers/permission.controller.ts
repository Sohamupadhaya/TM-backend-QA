import { customErrorHandler } from "../utils/customErrorHandler.js";
import prisma from "../models/index.js";
import { NextFunction, Request, Response } from "express";

export const addPermissionToRole = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const companyId = (req as any).user.companyId;
  const { roleId, permissions } = req.body;

  if (!roleId || !permissions || !Array.isArray(permissions)) {
    return next(customErrorHandler(res, "Please provide all Information", 400));
  }

  try {
    const existingPermissions = await prisma.rolePermission.findMany({
      where: { companyId, roleId },
    });

    const existingActions = new Set(existingPermissions.map(perm => `${perm.action}:${perm.resource}`));
    const addedPermissions = [];

    for (const permission of permissions) {
      const { action, resource } = permission;

      if (!action || !resource) {
        throw new Error("Action and resource must be provided for each permission.");
      }

      const permissionKey = `${action}:${resource}`;

      if (!existingActions.has(permissionKey)) {
        const newPermission = await prisma.rolePermission.create({
          data: {
            companyId,
            roleId,
            action,
            resource,
          },
        });
        addedPermissions.push(newPermission);
      }
    }

    return res.json({ message: "Permissions updated", permissions: addedPermissions });
  } catch (error) {
    console.error(error);
    return next(customErrorHandler(res, "Error updating permissions", 500));
  }
};



export const deleteRolePermission = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const companyId = (req as any).user.companyId;
  const { roleId } = req.params;
  console.log("🚀 ~ roleId:", roleId)
  const { action, resource } = req.body;

  if (!action || !resource) {
    return res.status(400).json({ message: "Action and resource are required." });
  }

  try {
    const deletedPermission = await prisma.rolePermission.deleteMany({
      where: {
        companyId: companyId,
        roleId: roleId,
        action: action,
        resource: resource,
      },
    });

    if (deletedPermission.count === 0) {
      return res.status(404).json({ message: "Permission not found." });
    }

    return res.status(200).json({ message: "Permission deleted successfully." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "An error occurred while deleting the permission." });
  }
};



export const editRolePermision = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const companyId = (req as any).user.companyId;
  const { id } = req.params;
  const { roleId, permissions } = req.body;
  if (!permissions || !Array.isArray(permissions)) {
    return res.status(400).json({ message: "Invalid permissions array." });
  }
  try {
    await prisma.rolePermission.deleteMany({
      where: {
        companyId: companyId,
        roleId: roleId,
      },
    });
    const permissionPromises = permissions.map((permission) =>
      prisma.rolePermission.create({
        data: {
          roleId,
          companyId,
          action: permission.action,
          resource: permission.resource,
        },
      }),
    );
    await Promise.all(permissionPromises);
    return res
      .status(200)
      .json({ message: "Role permissions updated successfully." });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "An error occurred while updating role permissions." });
  }
};
export const getPermissionsForRole = async (
  roleId: string,
  companyId: string,
) => {
  const permissions = await prisma.rolePermission.findMany({
    where: {
      roleId: roleId,
      companyId: companyId,
    },
  });
  return permissions;
};


export const getPermissionsOfRole = async (
  req: Request, res: Response
) => {

  const roleId = req.params.id
  const companyId = (req as any).user.companyId
  const permissions = await prisma.rolePermission.findMany({
    where: {
      roleId: roleId,
      companyId: companyId,
    },
  });
  return res.json({ permissions });
};