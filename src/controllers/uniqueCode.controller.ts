import { customErrorHandler } from "../utils/customErrorHandler.js";
import prisma from "../models/index.js";
import { NextFunction, Request, Response } from "express";

export const setCompanyCode = async (req: Request, res: Response, next: NextFunction) => {
  const companyId = (req as any).user.companyId;
  console.log("🚀 ~ setCompanyCode ~ companyId:", companyId);
  const { uniqueCode } = req.body;

  try {
    // Check if the company exists
    const company = await prisma.company.findUnique({
      where: { companyId },
      include: {
        employee: true,
        departments: true,
        teams:true
      },
    });

    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    // Update the company code
    const updatedCompany = await prisma.company.update({
      where: { companyId },
      data: {
        companyCode: uniqueCode,
      },
    });

    // Update all department codes under the company
    for (const department of company.departments) {
      let newDepartmentCode = null;
      if (department.departmentCode) {
        const parts = department.departmentCode.split("-");
        parts[0] = uniqueCode; // Replace the prefix with the new company code
        newDepartmentCode = parts.join("-");
      }

      await prisma.department.update({
        where: { departmentId: department.departmentId },
        data: {
          departmentCode: newDepartmentCode,
        },
      });
    }
    for(const team of company.teams){
      let newTeamCode= null;
      if(team.teamCode){
        const parts = team.teamCode.split("-");
        parts[0]=uniqueCode;
        newTeamCode=parts.join("-");
      }
      await prisma.team.update({
        where:{teamId:team.teamId},
        data:{
          teamCode:newTeamCode
        },
      });
    }
    // Update each employee's department and team codes independently (original logic)
    for (const employee of company.employee) {
      // Update employeeDepartmentCode if it exists
      let newEmployeeDepartmentCode = null;
      if (employee.employeeDepartmentCode) {
        const parts = employee.employeeDepartmentCode.split("-");
        parts[0] = uniqueCode; // Replace the prefix with the new company code
        newEmployeeDepartmentCode = parts.join("-");
      }

      // Update employeeTeamCode if it exists
      let newEmployeeTeamCode = null;
      if (employee.employeeTeamCode) {
        const parts = employee.employeeTeamCode.split("-");
        parts[0] = uniqueCode; // Replace the prefix with the new company code
        newEmployeeTeamCode = parts.join("-");
      }

      let newEmployeeCode = null;
      if (employee.employeeCode) {
        const parts = employee.employeeCode.split("-");
        parts[0] = uniqueCode; // Replace the prefix with the new company code
        newEmployeeCode = parts.join("-");
      }

      await prisma.employee.update({
        where: { employeeId: employee.employeeId },
        data: {
          employeeDepartmentCode: newEmployeeDepartmentCode,
          employeeTeamCode: newEmployeeTeamCode,
          employeeCode: newEmployeeCode!,
        },
      });
    }

    return res.status(200).json(updatedCompany);

  } catch (error) {
    console.log("🚀 ~ setCompanyCode ~ error:", error);
    // return next(customErrorHandler(error, "Failed to update company code"));
  }
};
export const getUniqueCode=async(req:Request,res:Response)=>{
  try{
    const companyId = (req as any).user.companyId;
    console.log("🚀 ~ getUniqueCode ~ companyId:", companyId)
    const fetchUniquecode = await prisma.company.findUnique({
      where: {
        companyId: companyId, // Use companyId as a field inside an object
      },
      select: {
        companyCode: true,
      },
    });
    
    console.log("🚀 ~ getUniqueCode ~ fetchUniquecode:", fetchUniquecode)
    return res.status(200).json(fetchUniquecode);
  }catch(error){
    console.log("🚀 ~ getUniqueCode ~ error:", error)
    
  }
 


}
