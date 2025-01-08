// import { NextFunction, Request, Response } from "express";
// import { isAuthenticatedCompany } from "./isAuthenticatedCompany.js";
// import { isAuthenticatedEmployee } from "./isAuthenticatedEmployee.js";
// import { customErrorHandler } from "../utils/customErrorHandler.js";

// export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     await new Promise((resolve, reject) => {
//       isAuthenticatedCompany(req, res, (err: any) => {
//         if (!err) {
//           resolve(true);
//         } else {
//           reject(err);
//         }
//       });
//     });

//     if ((req as any).user) {
//       return next();
//     }

//     await new Promise((resolve, reject) => {
//       isAuthenticatedEmployee(req, res, (err: any) => {
//         if (!err) {
//           resolve(true);
//         } else {
//           reject(err);
//         }
//       });
//     });

//     if ((req as any).user) {
//       return next();
//     }

//     return next(customErrorHandler(res, "Not Authenticated", 401));
//   } catch (error) {
//     return next(customErrorHandler(res, "Not Authenticated", 401));
//   }
// };

import { NextFunction, Request, Response } from "express";
import { isAuthenticatedCompany } from "./isAuthenticatedCompany.js";
import { isAuthenticatedEmployee } from "./isAuthenticatedEmployee.js";
import { customErrorHandler } from "../utils/customErrorHandler.js";

// A helper function to check if the user has the required permission
const hasPermission = (
  permissions: any[],
  requiredPermission: string
): boolean => {
  return permissions.some(
    (permission) => permission.permission === requiredPermission
  );
};

export const isAuthenticated = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Step 1: Authenticate the company (if any)
    await new Promise((resolve, reject) => {
      isAuthenticatedCompany(req, res, (err: any) => {
        if (!err) {
          resolve(true);
        } else {
          reject(err);
        }
      });
    });

    // Step 2: If the user is a company, no need to check permissions, just proceed
    if ((req as any).user) {
      return next(); // Company authenticated, no permission check
    }

    // Step 3: Authenticate the employee (if any)
    await new Promise((resolve, reject) => {
      isAuthenticatedEmployee(req, res, (err: any) => {
        if (!err) {
          resolve(true);
        } else {
          reject(err);
        }
      });
    });

    // Step 4: If the user is an employee, perform the permission check
    if ((req as any).user) {
      const employeePermissions = (req as any).user.rolePermissions; // Assuming employee has rolePermissions attached to user object
      const requiredEmployeePermission = "employee_permission"; // Example permission needed for an employee

      // Check if employee has the required permission
      if (!hasPermission(employeePermissions, requiredEmployeePermission)) {
        return next(
          customErrorHandler(
            res,
            "You don't have the required employee permission",
            403
          )
        );
      }

      return next(); // Proceed if permission is valid
    }

    // Step 5: If no user is authenticated (either company or employee)
    return next(customErrorHandler(res, "Not Authenticated", 401));
  } catch (error) {
    return next(customErrorHandler(res, "Not Authenticated", 401));
  }
};
