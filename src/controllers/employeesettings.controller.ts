import { customErrorHandler } from "../utils/customErrorHandler.js";
import prisma from "../models/index.js";
import { NextFunction, Request,Response } from "express";
import { updateTeamEmployeeCount } from "../services/updateCompanyCount .js";

export const deleteEmployee = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = (req as any).user.companyId;
      const { employeeId } = req.params;
      const { reason } = req.body;
  
      // Validate input
      if (!reason) {
        return res.status(400).json({ message: 'Reason for deletion is required.' });
      }
  
      const employee = await prisma.employee.findFirst({
        where: {
          companyId,
          employeeId,
        },
      });
  
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
  
      // Delete related UserRole records (if any)
      await prisma.userRole.deleteMany({
        where: { employeeId },
      });
  
      const teamId = employee.teamId;
  
      // Delete the employee
      await prisma.employee.delete({
        where: {
          employeeId,
        },
      });
  
      // Update team count if employee belongs to a team
      if (teamId) {
        await updateTeamEmployeeCount(teamId); 
      }
  
      // Log the employee deletion
      await prisma.deletedEmployee.create({
        data: {
          employeeId,
          companyId,
          employeeName: employee.employeeName,
          reason,
        },
      });
  
      // Return success response
      return res.json({ message: "Employee deleted successfully." });
  
    } catch (error) {
      console.error('Error deleting employee:', error);
      return res.status(500).json({ message: 'An error occurred while deleting the employee.' });
    }
};