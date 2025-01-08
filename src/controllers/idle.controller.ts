import { Request, Response, NextFunction } from "express";
import { message } from "../lib/multer.js";
import prisma from "../models/index.js";

enum CurrentEmployeeStatus {
  WORKING = 'WORKING',
  ONBREAK = 'ONBREAK',
  INACTIVE = 'INACTIVE',
  IDLE = 'IDLE'
}

// Add user IDLE time
export const addIdleTime = async (req: Request, res: Response, next: NextFunction) => {
  const { companyId, employeeId } = (req as any).user;
  const currentDateAndTime = new Date();
  const currentDate = currentDateAndTime.toISOString().split('T')[0]; // Get current date in 'YYYY-MM-DD' format

  // Destructure incoming data from the request body
  const { startTime, endTime, idleTimeDuration } = req.body;

  // If only startTime is received, create a new record
  if (startTime && !endTime && !idleTimeDuration) {
    try {
      const idleStart = await prisma.idleTimeOfEmployee.create({
        data: {
          companyId,
          employeeId,
          date: currentDate,
          startTime: startTime,
          endTime: '0', 
          idleTimeDuration: '0'
        }
      });

      await prisma.employee.update({
        where:{
            employeeId,
            companyId
        },
        data: {
          currentEmployeeStatus : "IDLE"
        }
      })
    return res.json({ message: 'Idle start time added', idleStart });

    } catch (error) {
      console.error('Error creating idle start time:', error);
      return res.status(500).json({ message: 'Error adding idle start time' });
    }
  }

  // Find the most recent idle record for the employee
  const latestIdle = await prisma.idleTimeOfEmployee.findFirst({
    where: {
      companyId,
      employeeId
    },
    orderBy: {
      createdAt: 'desc' 
    },
    select: {
      id: true 
    }
  });

  if (!latestIdle) {
    return res.status(404).json({ message: 'No idle record found to update' });
  }
  // If endTime and idleTimeDuration are received, update the existing idle record
  if (endTime && idleTimeDuration) {
    try {
      // Update the latest idle record with endTime and idleTimeDuration
      const updatedIdle = await prisma.idleTimeOfEmployee.update({
        where: {
          id: latestIdle.id
        },
        data: {
          endTime: endTime,
          idleTimeDuration: idleTimeDuration
        }
      });

      // changing working status to "WORKING" as idletime end
      await prisma.employee.update({
        where:{
          employeeId,
          companyId
        },
        data: {
          currentEmployeeStatus: "WORKING"
        }
      })

      return res.json({ message: 'Idle time updated', updatedIdle });
    } catch (error) {
      console.error('Error updating idle time:', error);
      return res.status(500).json({ message: 'Error updating idle time' });
    }
  }

  // If neither start time nor end time + idle duration is provided, return an error
  return res.status(400).json({ message: 'Invalid request. Either startTime or endTime and idleTimeDuration must be provided.' });
};



export const todayIdleTime = async(req:Request,res:Response,next:NextFunction)=>{
    const {companyId} = (req as any).user;
    const currentDateAndTime = new Date();
    const  currentDate = currentDateAndTime.toISOString().split("T")[0]
    
    const totalTime = await prisma.idleTimeOfEmployee.findMany({
        where:{
            companyId,
            date: currentDate,
        },
        include:{
            employee:{
                select:{
                    employeeName:true
                }
            }
        },
        orderBy:{
            idleTimeDuration: 'desc'
        }
    })
    return  res.json({totalTime})
}