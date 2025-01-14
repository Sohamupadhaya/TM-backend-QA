import { NextFunction, Request, Response } from "express";
import { customErrorHandler } from "../utils/customErrorHandler.js";

import prisma from "../models/index.js";


export const startTimer = async ( req: Request, res: Response, next: NextFunction ) => {
    const {employeeId, companyId} = (req as any).user
    const newTimer = await prisma.timer.create({
        data:{
            startTime: new Date(),
            isOnBreak: false,
            activeTime: 0,
            totalTime: 0,
            employeeId: employeeId
        }
    })
    res.json({message: "Timer started successfully", timerId: newTimer.id})
}

export const endTimer = async (req: Request, res: Response, next: NextFunction) => {
    const {employeeId} = (req as any).user
    const { timerId } = req.params;

    // checking timer existance
    const existingTimer = await prisma.timer.findFirst({
        where:{
            id: timerId,
            employeeId: employeeId
        }
    })

    if(!existingTimer)
        return customErrorHandler(res, "Timer not found", 404)

    const updateEndTime = await prisma.timer.update({
        where:{
            id: timerId
        },
        data:{
            isOnBreak: false,
            totalTime: Math.floor((new Date().getTime() - existingTimer.startTime.getTime()) / 1000), // in seconds
        }
    })

    res.json({ message: 'Timer stopped', updateEndTime})
}

export const getTimeStats = async (req: Request, res: Response, next: NextFunction) => {
    const {employeeId} = (req as any).user
    const { timerId } = req.params;
    const currentDateAndTime = new Date();
    const actualDate = currentDateAndTime.toISOString().split("T")[0];

    const attendanceRecord = await prisma.attendance.findFirst({
        where: {
          employeeId,
          actualDate,
        },
        orderBy: {
          updatedAt: "desc", // Ensure the latest record is fetched
        },
        include: {
          breakSessions: {
            orderBy: {
              createdAt: "desc", // Get the latest session without breakOut
            },
            take: 1,
          },
        },
    });

    if (!attendanceRecord) {
        return next(customErrorHandler(res, "Attendance Record not Found", 400));
    }

    const currentBreakSession = attendanceRecord.breakSessions[0];

    // checking timer existance
    const existingTimer = await prisma.timer.findFirst({
        where:{
            id: timerId,
            employeeId: employeeId
        }
    })

    if(!existingTimer)
        return customErrorHandler(res, "Timer not found", 404)

    const currentTime = new Date();
    const totalElapsed = Math.floor((currentTime.getTime() - existingTimer.startTime.getTime()) / 1000);

    const activeElapsed = existingTimer.isOnBreak
        ? existingTimer.activeTime
        : existingTimer.activeTime + Math.floor((currentTime.getTime() - (currentBreakSession.breakIn!.getTime() || existingTimer.startTime.getTime())) / 1000);

    res.json({
        totalTime: totalElapsed,
        activeTime: activeElapsed,
    });
}

// export const breakIn = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const timer = await prisma.timer.findFirst({ where: { isOnBreak: false } });
  
//       if (timer) {
//         await prisma.timer.update({
//           where: { id: timer.id },
//           data: {
//             breakStart: new Date(),
//             isOnBreak: true,
//           },
//         });
//         res.json({ message: 'Break-In started' });
//       } else {
//         res.status(400).send('Cannot start break');
//       }
//     } catch (error) {
//       next(error);
//     }
//   };
  
//   export const breakOut = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const timer = await prisma.timer.findFirst({ where: { isOnBreak: true } });
  
//       if (timer) {
//         const breakDuration = Math.floor((new Date().getTime() - timer.breakStart!.getTime()) / 1000); // break duration in seconds
//         await prisma.timer.update({
//           where: { id: timer.id },
//           data: {
//             breakStart: null,
//             isOnBreak: false,
//             totalTime: timer.totalTime + breakDuration,
//             activeTime: timer.activeTime + breakDuration,
//           },
//         });
//         res.json({ message: 'Break-Out ended' });
//       } else {
//         res.status(400).send('No active break');
//       }
//     } catch (error) {
//       next(error);
//     }
//   };
  
//   export const getTimeStats = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const timer = await prisma.timer.findFirst({ where: { isOnBreak: false } });
  
//       if (timer) {
//         const currentTime = new Date();
//         const totalElapsed = Math.floor((currentTime.getTime() - timer.startTime.getTime()) / 1000);
  
//         const activeElapsed = timer.isOnBreak
//           ? timer.activeTime
//           : timer.activeTime + Math.floor((currentTime.getTime() - (timer.breakStart?.getTime() || timer.startTime.getTime())) / 1000);
  
//         res.json({
//           totalTime: totalElapsed,
//           activeTime: activeElapsed,
//         });
//       } else {
//         res.status(400).send('No active timer');
//       }
//     } catch (error) {
//       next(error);
//     }
//   };