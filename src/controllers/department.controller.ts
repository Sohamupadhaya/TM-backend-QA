import { NextFunction, Request, Response } from "express";
import { customErrorHandler } from "../utils/customErrorHandler.js";
import prisma from "../models/index.js";
import { updateCompanyDepartmentsCount } from "../services/updateCompanyCount .js";

export const createDepartment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { departmentName }: { departmentName: string } = req.body;
  const companyId = (req as any).user.companyId;

  try {
    // Check if the department already exists for this company
    const existingDepartment = await prisma.department.findFirst({
      where: {
        departmentName,
        companyId,
      },
    });

    if (existingDepartment) {
      return next(
        customErrorHandler(
          res,
          "This Department already exists for this company",
          400
        )
      );
    }

    // Retrieve the company details
    const company = await prisma.company.findUnique({
      where: {
        companyId,
      },
    });

    if (!company) {
      return next(
        customErrorHandler(
          res,
          "Company not found",
          404
        )
      );
    }

    const companyCode = company.companyCode;

    // Get the current department count for the company
    let departmentCount = await prisma.department.count({
      where: {
        companyId,
      },
    });

    // If the department count is 0, set it to 1
    // if (departmentCount === 0) {
    //   departmentCount = 1;
    // }

    // Generate unique department code
    const departmentCode = `${companyCode}-dep-${departmentCount}`;

    // Create the new department
    const newDepartment = await prisma.department.create({
      data: {
        departmentName,
        departmentCode,
        companyId,
      },
    });

    // Update the company's department count
    await updateCompanyDepartmentsCount(companyId);

    return res.json({ message: "Department Created", department: newDepartment });
  } catch (error) {
    console.error("Error creating department:", error);
  }
};

// update Department
export const updateDepartment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { departmentId } = req.params;
  const {
    departmentName,
    departmentHead,
  }: { departmentName: string; noOfTeams: number; departmentHead: any } =
    req.body;
  const companyId = (req as any).user.companyId;
  const department = await prisma.department.findFirst({
    where: {
      departmentId,
      companyId,
    },
  });

  if (!department)
    return next(customErrorHandler(req, "Department does not exist", 404));

  const updatedDepartment = await prisma.department.update({
    where: {
      departmentId: department.departmentId,
      companyId,
    },
    data: {
      departmentName,
      departmentHead,
    },
  });

  return res.json({ message: "Department Updated!", updatedDepartment });
};

// Get all department of company
export const getAllDepartment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const companyId = (req as any).user.companyId;
  const departments = await prisma.department.findMany({
    where: {
      companyId,
    },
  });
  return res.json({ departments });
};

// department
export const getDepartment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { departmentId } = req.params;
  const companyId = (req as any).user.companyId;
  const company=await prisma.company.findFirst({
    where:{
      companyId
    }
  })
  const department = await prisma.department.findFirst({
    where: {
      companyId,
      departmentId,
    },
    include:{
      company:{
        select:{
          companyCode:true
        }
      }
    }
  });
  return res.json({ department });
};

// Delete department
// export const deleteDepartment = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   const { departmentId } = req.params;
//   const companyId = (req as any).user.companyId;
//   const deletedDepartment = await prisma.department.delete({
//     where: {
//       departmentId,
//       companyId,
//     },
//   });
//   await updateCompanyDepartmentsCount(companyId);

//   if (deletedDepartment) {
//     res.status(200).json({ message: "Department Deleted", deletedDepartment });
//   } else {
//     res.status(404).json({ message: "Department not found" });
//   }
// };


export const deleteDepartment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { departmentId } = req.params;
    const companyId = (req as any).user.companyId;

    // Get all employees in the department and its teams
    const employeesInDepartment = await prisma.employee.findMany({
      where: { 
        OR: [
          { departmentId },
          { team: { departmentId } }
        ]
      }
    });

    // Begin a transaction to handle all related deletions
    const deletedDepartment = await prisma.$transaction(async (prisma) => {
      // 1. Delete UserRoles for all affected employees
      for (const employee of employeesInDepartment) {
        await prisma.userRole.deleteMany({
          where: { employeeId: employee.employeeId }
        });
      }

      // 2. Update employees to remove department and team associations
      await prisma.employee.updateMany({
        where: { 
          OR: [
            { departmentId },
            { team: { departmentId } }
          ]
        },
        data: {
          departmentId: null,
          teamId: null,
          currentEmployeeStatus: 'INACTIVE'
        }
      });

      // 3. Delete all teams in the department
      await prisma.team.deleteMany({
        where: { departmentId }
      });

      // 4. Finally delete the department
      const deletedDepartment = await prisma.department.delete({
        where: {
          departmentId,
          companyId,
        },
      });

      return deletedDepartment;
    });

    await updateCompanyDepartmentsCount(companyId);

    res.status(200).json({ 
      message: "Department and related data deleted successfully", 
      deletedDepartment 
    });
  } catch (error) {
    next(error);
  }
};


export const getAllDepartmentEmployee = async(req:Request,res:Response,next:NextFunction)=>{
  const companyId = (req as any).user.companyId;
  const { departmentId } = req.params;
  const employees = await prisma.employee.findMany({
    where:{
      companyId,
      departmentId
    },
   select:{
    employeeId:true,
    employeeName:true,
    email:true,
    team: {
      select: {
        teamId: true, 
        teamName: true,
      },
    },
   }
  })
  res.json(employees);
}