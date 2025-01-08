import { customErrorHandler } from "../utils/customErrorHandler.js";
import prisma from "../models/index.js";
import { NextFunction, Request, Response } from "express";
// add roles
export const addRole = async (req: Request , res: Response, next: NextFunction) => {
    const companyId = (req as any).user.companyId;
    const { roleName, description } = req.body;
    if (!roleName || !description) {
        return next(customErrorHandler(res, "Please provide the role.", 401))
    }
    const company = await prisma.company.findUnique({
        where: {
            companyId
        }
    })
    if (!company){
        return next(customErrorHandler(res, "Company not found.", 402))
    }
    const existingRole = await prisma.roles.findFirst({
        where: {
            roleName, companyId
        }
    }) 
    if(existingRole){
        return next(customErrorHandler(res, "Role already exists.", 403))
    }
    const createNewRole = await prisma.roles.create({
        data: {
            roleName,
            description,
            companyId: companyId
        }
    })
    return res.json({message: `${roleName} successfully added.`, roles: createNewRole})
}

// get all roles of the company
export const getAllRoleOfCompany = async (req: Request, res:Response, next: NextFunction) => {
    const companyId = (req as any).user.companyId;
    const allRoles = await prisma.roles.findMany({
        where: {
            companyId: companyId
        }
    })
    return res.json({message: 'All roles of the company', roles: allRoles})
}

//edit role by id
export const editRoleById = async (req: Request, res: Response, next: NextFunction) => {
    const companyId = (req as any).user.companyId;
    const { roleId } = req.params;
    const { roleName , description} = req.body;
    if( !roleName && !description) {
        return next(customErrorHandler(res, "Provide all the information", 401))
    }
    const company = await prisma.company.findFirst({
        where: {
            companyId
        }
    })
    if (!company) {
        return next(customErrorHandler(res, "Company not found", 404))
    }
    const checkRole = await prisma.roles.findFirst({
        where: {
            roleId: roleId
            }
    })
    if (!checkRole){
        return next(customErrorHandler(res, "Role not found", 404))
    }
    const updateRole = await prisma.roles.update({
        where: {
            roleId: roleId
        },
        data:{
            roleName: roleName,
            description: description
        }
    })
    return res.json({message: 'Role updated successfully', roles: updateRole})
}

// delete role by id
// export const deleteRoleById = async (req: Request, res: Response, next: NextFunction) => {
//     const companyId = (req as any).user?.companyId;
//     // Check if companyId is defined
//     if (!companyId) {
//         return next(customErrorHandler(res, "User not authenticated", 401));
//     }
//     const { roleId } = req.params;
//     const company = await prisma.company.findFirst({
//         where: {
//             companyId
//         }
//     });
//     if (!company) {
//         return next(customErrorHandler(res, "Company not found", 404));
//     }
//     const checkRole = await prisma.roles.findFirst({
//         where: {
//             roleId: roleId
//         }
//     });
//     if (!checkRole) {
//         return next(customErrorHandler(res, "Role not found", 404));
//     }
//     const deleteRole = await prisma.roles.delete({
//         where: {
//             roleId: roleId,
//             companyId: companyId
//         }
//     });
//     return res.json({ message: 'Role deleted', role: deleteRole });
// }



export const deleteRoleById = async (req: Request, res: Response, next: NextFunction) => {
    const companyId = (req as any).user?.companyId;
    if (!companyId) {
        return next(customErrorHandler(res, "User  not authenticated", 401));
    }
    const { roleId } = req.params;
    const company = await prisma.company.findFirst({
        where: {
            companyId
        }
    });
    if (!company) {
        return next(customErrorHandler(res, "Company not found", 404));
    }
    const checkRole = await prisma.roles.findFirst({
        where: {
            roleId: roleId
        }
    });
    if (!checkRole) {
        return next(customErrorHandler(res, "Role not found", 404));
    }

    // Delete related UserRole and RolePermission records
    await prisma.userRole.deleteMany({
        where: {
            roleId: roleId
        }
    });

    await prisma.rolePermission.deleteMany({
        where: {
            roleId: roleId
        }
    });

    // Now delete the role
    const deleteRole = await prisma.roles.delete({
        where: {
            roleId: roleId,
            companyId: companyId
        }
    });

    return res.json({ message: 'Role deleted', role: deleteRole });
}

// assign a role to an employee
export const assignRoleToEmployee = async (req: Request, res: Response, next: NextFunction) => {
    const companyId = (req as any).user.companyId;
    const { employeeId, roleId } = req.body;
    if( !roleId || !employeeId){
        return next(customErrorHandler(res, "Please provide all the information", 400));
    }
    const company = await prisma.company.findFirst({
        where: {
            companyId
        }
    })
    if ( !company ){
        return next(customErrorHandler(res, "Company not found", 404));
    }
    const assignRole = await prisma.userRole.create({
        data:{
            employeeId,
            roleId
        }
    })
    return res.json({ message: 'Role Assigned', assignedRole: assignRole});
}

// export const updateRole = async (req: Request, res: Response, next: NextFunction) => {
//     const companyId = (req as any).user.companyId;
//     const { employeeId, roleId } = req.body;

//     if (!roleId || !employeeId) {
//         return next(customErrorHandler(res, "Please provide all the information", 400));
//     }

//     const company = await prisma.company.findFirst({
//         where: { companyId },
//     });

//     if (!company) {
//         return next(customErrorHandler(res, "Company not found", 404));
//     }

//     try {
//         // Find the existing UserRole by employeeId
//         const existingRole = await prisma.userRole.findFirst({
//             where: { employeeId },
//         });

//         if (!existingRole) {
//             const assignRole = await prisma.userRole.create({
//                 data: {
//                     employeeId,
//                     roleId
//                 }
//             })
//         } else {
//             // Update the roleId for the found UserRole
//             const assignRole = await prisma.userRole.update({
//                 where: { id: existingRole.id },
//                 data: { roleId },
//             });
//         }
//         return res.json({ message: 'Role Assigned' });
//     } catch (error) {
//         return next(customErrorHandler(res, "Failed to assign role", 500));
//     }
// };



export const updateRole = async (req: Request, res: Response, next: NextFunction) => {
    const companyId = (req as any).user.companyId;
    const { employeeId, roleId } = req.body;

    // Validate input
    if (!roleId || !employeeId) {
        return next(customErrorHandler(res, "Please provide all the information", 400));
    }

    // Ensure `roleId` is the first element if it's an array
    const roleIdValue = Array.isArray(roleId) ? roleId[0] : roleId;

    // Check if the company exists
    const company = await prisma.company.findFirst({ where: { companyId } });
    if (!company) {
        return next(customErrorHandler(res, "Company not found", 404));
    }

    // Check if the role exists
    const role = await prisma.roles.findFirst({ where: { roleId: roleIdValue } });
    if (!role) {
        return next(customErrorHandler(res, "Role not found", 404));
    }

    try {
        // Find existing UserRole by `employeeId`
        const existingRole = await prisma.userRole.findFirst({ where: { employeeId } });

        let assignedRole;
        if (!existingRole) {
            // Create a new user role if one doesn't exist
            assignedRole = await prisma.userRole.create({
                data: { employeeId, roleId: roleIdValue },
            });
        } else {
            // Update the role if one already exists for the employee
            assignedRole = await prisma.userRole.update({
                where: { id: existingRole.id },
                data: { roleId: roleIdValue },
            });
        }

        return res.json({ message: 'Role Assigned', assignedRole });
    } catch (error) {
        if (error instanceof Error) {
            console.error("Error assigning role:", error.message, error.stack);
        } else {
            console.error("Unknown error assigning role:", error);
        }
        return next(customErrorHandler(res, "Failed to assign role", 500));
    }
};




export const getRolesForEmployee = async (employeeId: string, companyId:string) => {
    const roles = await prisma.userRole.findMany({
        where: {
            employeeId: employeeId,
            role: {
                companyId: companyId
            }
        },
    include: {
            role: true
        }
    });
    return roles; 
};