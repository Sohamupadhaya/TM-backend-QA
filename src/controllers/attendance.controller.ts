import { NextFunction, Request, Response } from "express";
import { customErrorHandler } from "../utils/customErrorHandler.js";
import prisma from "../models/index.js";
import { calculateLateTime } from "../services/calculateLateTime.js";
import { calculateTimeDifference } from "../services/calculateTimeDifference.js";
import {
  sendNotificationFromCompanyToEmployee,
  sendNotificationToAdminAboutLateEmployee,
  sendNotificationToAdminAboutRiskUser,
} from "./notification.controller.js";
import moment from "moment-timezone";
import { handleLateEmployeeNotifications } from "../services/handleLateEmployeeNotifications.js";
import { generateDailyAttPDF } from "../utils/generatePdf/dailyAttendancePdf.js";
import { attendancePdf, monthlyInOutPdf } from "../lib/mail.js";
import { generateMonthlyAttPDF } from "../utils/generatePdf/monthlyAttPdf.js";
import { generateLateAttPDF } from "../utils/generatePdf/latePdf.js";
import { generateOverTimePDF } from "../utils/generatePdf/overTimePdf.js";
import { generateMonthlyInOutPDF } from "../utils/generatePdf/monthyInOutPfd.js";
import { log } from "console";

export const employeeAttendanceClockIn = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const currentDateAndTime = new Date();
    console.log("Clocked In");
    const employee = (req as any).user;

    console.log(`The Current Date and Time with new Date()`);
    console.log(currentDateAndTime);

    if (!employee?.employeeId || !employee?.companyId) {
      customErrorHandler(res, "Invalid employee data", 400);
    }

    const companyAttendance = await prisma.actualTimeOfCompany.findFirst({
      where: {
        companyId: employee.companyId,
        teamId: employee.teamId || undefined,
      },

      orderBy: { actualLoginTime: "desc" },
      select: {
        actualLoginTime: true,
        actualLogoutTime: true,
        timeZone: true,
      },
    });

    if (!companyAttendance) {
      return next(
        customErrorHandler(res, "Company Attendance Record Not Found", 400)
      );
    }

    // console.log("Company Attendance");
    const companyTimeZone = companyAttendance?.timeZone || "UTC";
    // console.log(companyAttendance);

    // Convert the current date and time to the system's local time zone
    const systemTimeZone = moment.tz.guess();
    const currentDateTimeInSystemZone =
      moment(currentDateAndTime).tz(systemTimeZone);
    const actualDate = currentDateTimeInSystemZone.format("YYYY-MM-DD");
    const employeeLoginTime = currentDateTimeInSystemZone.format("HH:mm");

    // console.log(
    //   `Actual Date after using the moment library and the system time zone ${systemTimeZone}`
    // );
    // console.log("Actual Date:", actualDate);
    // console.log("Employee login time:", employeeLoginTime);

    if (
      !companyAttendance?.actualLoginTime ||
      !companyAttendance?.actualLogoutTime
    ) {
      return next(
        customErrorHandler(res, "Company Attendance Record Not Found", 404)
      );
    }

    const attendanceRecordCheck = await prisma.attendance.findMany({
      where: {
        employeeId: employee.employeeId,
        actualDate,
      },
      orderBy: { updatedAt: "desc" },
    });

    // console.log("Clocked In 45444");

    if (attendanceRecordCheck?.length >= 1) {
      if (
        attendanceRecordCheck[0]?.employeeLoginTime &&
        attendanceRecordCheck[0]?.employeeLogoutTime
      ) {
        // Create New Attendance for the same Day
        await prisma.$transaction(async (tx) => {
          const newAttendance = await tx.attendance.create({
            data: {
              actualDate,
              employeeLoginTime: currentDateTimeInSystemZone.toDate(),
              employeeId: employee.employeeId,
              companyId: employee.companyId,
              departmentId: employee.departmentId || undefined,
              teamId: employee.teamId || undefined,
            },
          });

          // Now create the metadata associated with the newly created attendance record
          await tx.attendanceMetadata.create({
            data: {
              attendanceId: newAttendance.id, // Link metadata to attendance
              originalTimezone: systemTimeZone,
              loginTime: employeeLoginTime, // Store loginTime as string
              employeeId: employee.employeeId,
              actualDate: actualDate,
            },
          });

          await tx.employee.update({
            where: { employeeId: employee.employeeId },
            data: { currentEmployeeStatus: "WORKING" },
          });
        });

        return res
          .status(200)
          .json({ status: "200", message: "Employee clocked in successfully" });
      }

      if (
        attendanceRecordCheck[0]?.employeeLoginTime &&
        !attendanceRecordCheck[0]?.employeeLogoutTime
      ) {
        return next(
          customErrorHandler(res, "You have already Clocked in", 400)
        );
      }
    }

    const lateness = calculateLateTime(
      companyAttendance.actualLoginTime,
      employeeLoginTime,
      companyTimeZone
    );
    let isLate = lateness !== null;

    const lateClockIn = isLate
      ? `${lateness!.lateHours} hrs, ${lateness!.lateMinutes} mins, ${
          lateness!.lateSeconds
        } sec late`
      : "On time";

    await prisma.$transaction(async (tx) => {
      const newAttendance = await tx.attendance.create({
        data: {
          actualDate,
          employeeLoginTime: currentDateTimeInSystemZone.toDate(),
          lateClockIn,
          employeeId: employee.employeeId,
          companyId: employee.companyId,
          departmentId: employee.departmentId || undefined,
          teamId: employee.teamId || undefined,
        },
      });

      // Create metadata separately for the newly created attendance record
      await tx.attendanceMetadata.create({
        data: {
          attendanceId: newAttendance.id,
          originalTimezone: systemTimeZone,
          loginTime: employeeLoginTime, // Store loginTime as string
          employeeId: employee.employeeId,
          actualDate: actualDate,
        },
      });

      await tx.employee.update({
        where: { employeeId: employee.employeeId },
        data: { currentEmployeeStatus: "WORKING" },
      });

      if (isLate) {
        const thirtyDaysAgo = moment
          .tz(companyTimeZone)
          .subtract(30, "days")
          .startOf("day")
          .utc()
          .toDate();

        const lateCountRecord = await tx.attendance.count({
          where: {
            employeeId: employee.employeeId,
            lateClockIn: { not: "On time" },
            actualDate: { gte: moment(thirtyDaysAgo).format("YYYY-MM-DD") },
          },
        });

        await handleLateEmployeeNotifications(tx, employee, lateCountRecord);
      }
    });

    return res
      .status(200)
      .json({ status: 200, message: "Employee clocked in successfully"});
  } catch (error: any) {
    return next(customErrorHandler(res, `server Error ${error.message}`, 500));
  }
};

export const employeeAttendanceClockOut = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const currentDateAndTime = new Date();
    const employee = (req as any).user;

    // Fetch company logout time and employee attendance record
    const companyAttendance = await prisma.actualTimeOfCompany.findFirst({
      where: {
        companyId: employee.companyId,
        teamId: employee.teamId || undefined,
      },
      orderBy: { actualLoginTime: "desc" },
      select: {
        actualLoginTime: true,
        actualLogoutTime: true,
        timeZone: true,
      },
    });

    if (!companyAttendance) {
      return next(
        customErrorHandler(res, "Company Attendance Record Not Found", 404)
      );
    }

    const companyTimeZone = companyAttendance?.timeZone || "UTC";
    const actualDate = moment(currentDateAndTime)
      .tz(companyTimeZone)
      .format("YYYY-MM-DD");

    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        employeeId: employee.employeeId,
        actualDate,
      },
      orderBy: { updatedAt: "desc" },
    });

    if (attendanceRecords.length === 0) {
      return next(
        customErrorHandler(res, "No clock-in record found for today", 400)
      );
    }

    const latestAttendance = attendanceRecords[0];

    if (latestAttendance.employeeLogoutTime) {
      return next(customErrorHandler(res, "You have already Clocked Out", 400));
    }

    // Convert the current date and time to the system's local time zone
    const systemTimeZone = moment.tz.guess();
    const currentDateTimeInSystemZone =
      moment(currentDateAndTime).tz(systemTimeZone);
    const employeeLogoutTime = currentDateTimeInSystemZone.format("HH:mm:ss");

    console.log(
      `Actual Date after using the moment library and the system time zone ${systemTimeZone}`
    );
    console.log("Actual Date:", actualDate);
    console.log("Employee logout time:", employeeLogoutTime);

    const actualEmployeeLogoutTime = moment
      .tz(
        `${actualDate} ${companyAttendance.actualLogoutTime}`,
        "YYYY-MM-DD HH:mm:ss",
        companyTimeZone
      )
      .format("HH:mm:ss");

    console.log("Company expected logout time:", actualEmployeeLogoutTime);
    console.log("Employee actual logout time:", employeeLogoutTime);

    // Calculate the total working hours duration
    const actualLoginTime = moment.tz(
      `${actualDate} ${companyAttendance.actualLoginTime}`,
      "YYYY-MM-DD HH:mm:ss",
      companyTimeZone
    );
    const actualLogoutTime = moment.tz(
      `${actualDate} ${companyAttendance.actualLogoutTime}`,
      "YYYY-MM-DD HH:mm:ss",
      companyTimeZone
    );
    const workingHoursDuration = actualLogoutTime.diff(
      actualLoginTime,
      "seconds"
    );

    // Calculate the employee's total working time
    const employeeLoginTime = moment.tz(
      latestAttendance.employeeLoginTime,
      systemTimeZone
    );
    const employeeWorkingTime = currentDateTimeInSystemZone.diff(
      employeeLoginTime,
      "seconds"
    );

    const timeDifference = calculateTimeDifference(
      workingHoursDuration,
      employeeWorkingTime
    );

    const isOvertime = timeDifference.includes("overtime");

    // Update attendance record with either overtime or early clock-out
    const updatedAttendance = await prisma.attendance.update({
      where: {
        id: latestAttendance.id,
      },
      data: {
        overTime: isOvertime ? timeDifference : null,
        earlyClockOut: !isOvertime ? timeDifference : null,
        employeeLogoutTime: currentDateTimeInSystemZone.toDate(),
        metadata: {
          update: {
            logoutTime: employeeLogoutTime, // Store logoutTime as string
          },
        },
      },
    });

    await prisma.employee.update({
      where: { employeeId: employee.employeeId },
      data: {
        currentEmployeeStatus: "INACTIVE",
      },
    });

    return res.status(200).json({
      message: "Employee clocked out successfully",
      data: updatedAttendance,
    });
  } catch (error) {
    console.error("Error clocking out employee:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while clocking out." });
  }
};

export const takeBreak = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { employeeId } = (req as any).user; // Extract employeeId from the authenticated user

  try {
    // Get current date and time
    const currentDateAndTime = new Date();
    const actualDate = currentDateAndTime.toISOString().split("T")[0]; // Extract date in YYYY-MM-DD format

    // Find  the latest matching attendance record for the employee on the current date
    const attendance = await prisma.attendance.findFirst({
      where: { employeeId, actualDate },
      orderBy: { createdAt: "desc" }, // Get the most recent attendance record
    });

    const timer = await prisma.timer.findFirst({
      where: { employeeId },
      orderBy: { createdAt: "desc"}
    })

    if (!attendance) {
      return next(
        customErrorHandler(
          res,
          "Attendance record not found for the given employee and date",
          404
        )
      );
    }

    if (!timer) {
      return next(
        customErrorHandler(
          res,
          "Timer not found",
          404
        )
      );
    }

    if (!attendance.employeeLoginTime) {
      return next(customErrorHandler(res, "You have not Clocked In", 400));
    }

    if (attendance.employeeLogoutTime) {
      return next(customErrorHandler(res, "You have already Clocked Out", 400));
    }

    const lastBreakSession = await prisma.breakSession.findFirst({
      where: { employeeId, actualDate },
      orderBy: { updatedAt: "desc" },
    });
    log("Working......");

    // If there is an ongoing break (no breakOut), return an error
    if (lastBreakSession && !lastBreakSession.breakOut) {
      return next(customErrorHandler(res, "You are already on a break", 400));
    }

    // Create a new break session
    const newBreakSession = await prisma.breakSession.create({
      data: {
        employeeId,
        actualDate,
        attendanceId: attendance!.id, // Link to the attendance record
        updatedAt: attendance!.updatedAt, // Use Attendance's updatedAt
        breakIn: currentDateAndTime, // Set the break-in time
      },
    });

    // Update the employee status to "ONBREAK"
    await prisma.employee.update({
      where: { employeeId },
      data: { currentEmployeeStatus: "ONBREAK" },
    });

    await prisma.timer.update({
      where: { 
        id: timer.id 
      },
      data:{
        isOnBreak: true,
      }
    })

    // Return the new break session details in the response
    return res.status(200).json({ status: 200, data: newBreakSession });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const breakOut = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { employeeId, companyId } = (req as any).user; // Extract user details
  const currentDateAndTime = new Date();
  const actualDate = currentDateAndTime.toISOString().split("T")[0]; // Format the date

  try {
    // Step 1: Fetch the latest attendance record for the employee
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

    const timer = await prisma.timer.findFirst({ 
      where: { 
        employeeId: employeeId
      } 
    });

    if (!attendanceRecord) {
      return next(customErrorHandler(res, "Attendance Record not Found", 400));
    }

    if (!timer) {
      return next(
        customErrorHandler(
          res,
          "Timer not found",
          404
        )
      );
    }

    // Step 2: Validate if attendance and break sessions exist
    if (attendanceRecord.breakSessions.length === 0) {
      return next(customErrorHandler(res, "You haven't taken a break", 400));
    }

    // Step 3: Get the latest break session
    const currentBreakSession = attendanceRecord.breakSessions[0];

    if (!currentBreakSession.breakIn) {
      return next(customErrorHandler(res, "You haven't taken a break", 400));
    }

    if (currentBreakSession.breakOut) {
      return next(
        customErrorHandler(res, "You have already ended your break", 400)
      );
    }

    // Step 4: Calculate the break duration
    const breakInDate = new Date(currentBreakSession.breakIn);
    const breakOutDate = currentDateAndTime;

    const differenceInMilliseconds =
      breakOutDate.getTime() - breakInDate.getTime();
    const breakInMinutes = Math.floor(differenceInMilliseconds / (1000 * 60));

    // Step 5: Update the BreakSession with the breakOut time
    const updatedBreakSession = await prisma.breakSession.update({
      where: {
        id: currentBreakSession.id,
      },
      data: {
        breakOut: breakOutDate,
      },
    });

    const breakDuration = Math.floor((new Date().getTime() - currentBreakSession.breakIn!.getTime()) / 1000); // break duration in seconds
    await prisma.timer.update({
      where: { id: timer.id },
      data: {
        isOnBreak: false,
        totalTime: timer.totalTime + breakDuration,
        activeTime: timer.activeTime + breakDuration,
      },
    });


    // Step 6: Update the attendance record's `breakInMinutes`
    // Fetch the existing break duration, if any, and sum it up
    const existingBreakInMinutes = attendanceRecord.breakInMinutes
      ? parseInt(attendanceRecord.breakInMinutes.split(" ")[0], 10)
      : 0;

    const updatedBreakInMinutes = existingBreakInMinutes + breakInMinutes;

    // Update the most recent attendance record (no composite key, just the most recent based on `updatedAt`)
    await prisma.attendance.update({
      where: {
        id: attendanceRecord.id, // Use the ID of the latest attendance record
      },
      data: {
        breakInMinutes: `${updatedBreakInMinutes} minutes`, // Update the total break duration
      },
    });

    // Step 7: Update the employee's status to "WORKING"
    await prisma.employee.update({
      where: { employeeId },
      data: {
        currentEmployeeStatus: "WORKING",
      },
    });

    // Step 8: Return the response
    return res.status(200).json({
      data: {
        breakInMinutes: `${breakInMinutes} minutes`, // Minutes for this break session
        totalBreakInMinutes: `${updatedBreakInMinutes} minutes`, // Updated total break duration
      },
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// Display User clock in
export const displayUserAttendanceOfMonths = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { employeeId } = req.body;
  const companyId = (req as any).user.companyId;
  const currentDateAndTime = new Date();
  const year = currentDateAndTime.getFullYear();
  const month = currentDateAndTime.getMonth() + 1;

  const startDate = new Date(year, month - 1, 1); // Month is 0-indexed in JavaScript Date constructor
  const endDate = new Date(year, month, 0); // Last day of the month

  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      employeeId: employeeId,
      companyId,
      actualDate: {
        gte: startDate.toISOString(),
        lte: endDate.toISOString(),
      },
    },
    include: {
      employee: true,
      department: true,
      company: true,
      team: true,
    },
  });
  return res.json({ attendanceRecords });
};

// display users attendance of the current date
export const displayUserAttendanceOfCurrentDate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const companyId = (req as any).user.companyId;
  const currentDateAndTime = new Date();
  const currentDate = currentDateAndTime.toISOString().split("T")[0];
  const attendanceRecord = await prisma.attendance.findMany({
    where: {
      actualDate: currentDate,
      companyId,
    },
    include: {
      employee: {
        select: {
          employeeName: true,
          employeeCode: true,
          currentEmployeeStatus: true,
          team: {
            select: {
              teamName: true,
            },
          },
        },
      },
      department: {
        select: {
          departmentName: true,
        },
      },
      metadata: {
        select: {
          loginTime: true,
          logoutTime: true,
          originalTimezone: true,
        },
      },
    },
  });
  return res.json({ message: attendanceRecord });
};

// display use attendance of specific date
export const displayUserAttendanceOfSpecificDate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const companyId = (req as any).user.companyId;
  const { date } = req.body;
  const specificDate = date.toISOString().split("T")[0];
  const attendanceRecord = await prisma.attendance.findMany({
    where: {
      actualDate: specificDate,
      companyId,
    },
    include: {
      employee: {
        select: {
          employeeName: true,
        },
      },
      department: {
        select: {
          departmentName: true,
        },
      },
      metadata: {
        select: {
          loginTime: true,
          logoutTime: true,
          originalTimezone: true,
        },
      },
    },
  });
  return res.json({ message: attendanceRecord });
};

export const employeeTodayClockInAndClockOutData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const employeeId = (req as any).user.employeeId;
  const companyId = (req as any).user.companyId;
  const currentDateAndTime = new Date();
  const currentDate = currentDateAndTime.toISOString().split("T")[0];

  const attendacneRecord = await prisma.attendance.findFirst({
    where: {
      actualDate: currentDate,
      companyId,
      employeeId,
    },
  });

  const totalWorkedDaysCount = await prisma.attendance.count({
    where: {
      companyId,
      employeeId,
    },
  });

  return res.json({ attendacneRecord, totalWorkedDaysCount });
};

// get attendance of all the employee in the company
export const allEmployeeAttendanceInCompany = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const companyId = (req as any).user.companyId;
  const allAttendanceRecord = await prisma.attendance.findMany({
    where: {
      companyId,
    },
  });
  return res.json({ allAttendanceRecord });
};

export const ownAttendance = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const companyId = (req as any).user.companyId;
  const employeeId = (req as any).user.employeeId;
  const attendacneRecord = await prisma.attendance.findMany({
    where: {
      companyId,
      employeeId,
    },
  });
  return res.json({ attendacneRecord });
};

export const displayOwnAttendanceOfSpecificDate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const companyId = (req as any).user.companyId;
  const employeeId = (req as any).user.employeeId;
  const { date } = req.body;
  if (!date || !/^\d{4}-\d{2}$/.test(date)) {
    return res
      .status(400)
      .json({ error: "Invalid date format. Expected 'YYYY-MM'." });
  }

  const year = parseInt(date.split("-")[0]);
  const month = parseInt(date.split("-")[1]);

  const startDate = new Date(year, month - 1, 1).toISOString().split("T")[0]; // Start of the month
  const endDate = new Date(year, month, 0).toISOString().split("T")[0]; // End of the month
  const attendanceRecord = await prisma.attendance.findMany({
    where: {
      actualDate: {
        gte: startDate,
        lte: endDate,
      },
      companyId,
      employeeId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return res.json({ attendanceRecord });
};

export const employeeAllAttendance = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const companyId = (req as any).user.companyId;
  const employeeId = req.params.employeeId;
  const attendacneRecord = await prisma.attendance.findMany({
    where: {
      companyId,
      employeeId,
    },
    include: {
      employee: {
        select: {
          employeeCode: true,
          employeeName: true,
        },
      },
    },
  });
  return res.json({ attendacneRecord });
};

export const employeeAllAttendanceByDept = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const companyId = (req as any).user.companyId;
  const departmentId = req.params.employeeId;
  const attendacneRecord = await prisma.attendance.findMany({
    where: {
      companyId,
      departmentId,
    },
    include: {
      employee: {
        select: {
          employeeCode: true,
          employeeName: true,
        },
      },
    },
  });
  return res.json({ attendacneRecord });
};

export const get15DaysAttendance = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const companyId = (req as any).user.companyId;
  const { employeeId } = req.params;

  const today = new Date();
  const pastDate = new Date();
  pastDate.setDate(today.getDate() - 15); // Get the date 15 days ago

  try {
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        companyId,
        employeeId,
        createdAt: {
          gte: pastDate, // Filter for records greater than or equal to 15 days ago
          lte: today, // Up to today
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res
      .status(200)
      .json({ message: "15 days attendance record", attendanceRecords });
  } catch (error) {
    next(error); // Pass any errors to the next middleware
  }
};

export const displayMonthlyInOutReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const companyId = (req as any).user.companyId;
    const { date } = req.body; // Assuming date is in the format "YYYY-MM"

    if (!date || !/^\d{4}-\d{2}$/.test(date)) {
      return res
        .status(400)
        .json({ error: "Invalid date format. Expected 'YYYY-MM'." });
    }

    const year = parseInt(date.split("-")[0]);
    const month = parseInt(date.split("-")[1]);

    // Calculate the first and last day of the month
    const startDate = new Date(year, month - 1, 1).toISOString().split("T")[0]; // Start of the month
    const endDate = new Date(year, month, 0).toISOString().split("T")[0]; // End of the month

    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        actualDate: {
          gte: startDate, // Start of the specified month
          lte: endDate, // End of the specified month
        },
        companyId,
      },
      include: {
        employee: {
          select: {
            employeeId: true,
            employeeCode: true,
            employeeName: true,
          },
        },
        department: {
          select: {
            departmentId: true,
            departmentName: true,
          },
        },
        team: {
          select: {
            teamName: true,
            teamId: true,
          },
        },
        company: {
          select: {
            companyId: true,
            companyEmail: true,
            companyName: true,
          },
        },
        metadata: {
          select: {
            loginTime: true,
            logoutTime: true,
            originalTimezone: true,
          },
        },
      },
    });

    return res.json(attendanceRecords);
  } catch (error) {
    console.error("Error fetching attendance records:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const displayMonthlyInOutReportByEmpId = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const companyId = (req as any).user.companyId;
    const { date } = req.body;
    const { employeeId } = req.params;

    if (!date || !/^\d{4}-\d{2}$/.test(date)) {
      return res
        .status(400)
        .json({ error: "Invalid date format. Expected 'YYYY-MM'." });
    }

    const year = parseInt(date.split("-")[0]);
    const month = parseInt(date.split("-")[1]);

    // Calculate the first and last day of the month
    const startDate = new Date(year, month - 1, 1).toISOString().split("T")[0]; // Start of the month
    const endDate = new Date(year, month, 0).toISOString().split("T")[0]; // End of the month

    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        actualDate: {
          gte: startDate, // Start of the specified month
          lte: endDate, // End of the specified month
        },
        companyId,
        employeeId,
      },
      include: {
        employee: {
          select: {
            employeeId: true,
            employeeCode: true,
            employeeName: true,
          },
        },
        department: {
          select: {
            departmentId: true,
            departmentName: true,
          },
        },
        team: {
          select: {
            teamName: true,
            teamId: true,
          },
        },
        company: {
          select: {
            companyId: true,
            companyEmail: true,
            companyName: true,
          },
        },
        metadata: {
          select: {
            loginTime: true,
            logoutTime: true,
            originalTimezone: true,
          },
        },
      },
    });

    return res.json(attendanceRecords);
  } catch (error) {
    console.error("Error fetching attendance records:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const sendDailyAttInMail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const companyId = (req as any).user.companyId;
  const companyName = (req as any).user.companyName;
  const companyEmail = (req as any).user.companyEmail;
  const currentDate = new Date().toISOString().split("T")[0];

  try {
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        actualDate: currentDate,
        companyId,
      },
      include: {
        employee: {
          select: {
            employeeName: true,
            employeeCode: true,
            currentEmployeeStatus: true,
            team: {
              select: {
                teamName: true,
              },
            },
          },
        },
        department: {
          select: {
            departmentName: true,
          },
        },
        metadata: {
          select: {
            loginTime: true,
            logoutTime: true,
            originalTimezone: true,
          },
        },
      },
    });

    // Extract the original timezone from the first attendance record
    const originalTimezone =
      attendanceRecords.length > 0
        ? attendanceRecords[0].metadata?.originalTimezone
        : "UTC"; // Fallback to 'UTC' if no records

    const pdfBuffer = await generateDailyAttPDF(
      attendanceRecords,
      originalTimezone || "UTC"
    ); // Ensure timezone is a string

    await attendancePdf({
      email: companyEmail,
      companyName: companyName,
      subject: "Daily Attendance Report",
      attachment: pdfBuffer,
      date: currentDate,
    });

    return res.json({ message: attendanceRecords });
  } catch (error) {
    console.error("Error sending daily attendance email:", error);
    return res
      .status(500)
      .json({ error: "Failed to send daily attendance report." });
  }
};

interface AttendanceRecord {
  actualDate: string;
  employeeLoginTime: string | "-";
  employeeLogoutTime: string | "-";
  lateClockIn: string | "-";
  earlyClockOut: string | "-";
  overTime: string | "Leave" | "Absent" | "-";
}

export const sendMonthlyAttInMail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const companyId = (req as any).user.companyId;
  const employeeId = req.params.employeeId;
  const companyName = (req as any).user.companyName;
  const companyEmail = (req as any).user.companyEmail;
  const currentDate = new Date();
  const currentDateString = currentDate.toISOString().split("T")[0];

  // Extracting month and year from request parameters
  const { year } = req.body;
  const month = parseInt(req.body.month, 10) - 1;

  try {
    // Fetch employee details to get createdAt date
    const employeeDetail = await prisma.employee.findUnique({
      where: {
        companyId,
        employeeId,
      },
      select: {
        employeeCode: true,
        employeeName: true,
        createdAt: true,
      },
    });

    const employeeName = employeeDetail?.employeeName || "-";
    const employeeCode = employeeDetail?.employeeCode || "-";
    const createdAt = employeeDetail?.createdAt || new Date();

    // Calculate the start and end dates for the month
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    // Determine the attendance start date
    // const attendanceStartDate = createdAt >= startDate ? createdAt : startDate;
    const attendanceStartDate = new Date(
      createdAt > startDate ? createdAt : startDate
    );
    attendanceStartDate.setDate(attendanceStartDate.getDate() - 1);

    // Fetch attendance records for the specified month
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        companyId,
        employeeId,
        actualDate: {
          gte: attendanceStartDate.toISOString().split("T")[0],
          lte: currentDateString, // Only up to current date
        },
      },
    });

    // Create a complete attendance record for the month
    const allDates: AttendanceRecord[] = [];
    const daysInMonth = endDate.getDate(); // Get the number of days in the month

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${(month + 1).toString().padStart(2, "0")}-${day
        .toString()
        .padStart(2, "0")}`;
      const date = new Date(dateStr);

      console.log("date", date);
      console.log("datestr", dateStr);
      console.log("attendanceStartDate", attendanceStartDate);

      // Only process dates between attendanceStartDate and current date
      if (date < attendanceStartDate || date > currentDate) {
        continue; // Skip dates outside the range
      }

      // Find the attendance record for the current date
      const attendance = attendanceRecords.find(
        (record) => record.actualDate === dateStr
      );
      console.log("attendance", attendance);

      let status: AttendanceRecord;
      if (attendance) {
        // If attendance record exists, populate the status
        status = {
          actualDate: attendance.actualDate,
          employeeLoginTime: attendance.employeeLoginTime
            ? attendance.employeeLoginTime.toISOString()
            : "-",
          employeeLogoutTime: attendance.employeeLogoutTime
            ? attendance.employeeLogoutTime.toISOString()
            : "-",
          lateClockIn: attendance.lateClockIn || "-",
          earlyClockOut: attendance.earlyClockOut || "-",
          overTime: attendance.overTime || "-",
        };
      } else {
        // If no attendance record exists, mark as Absent
        status = {
          actualDate: dateStr,
          employeeLoginTime: "-",
          employeeLogoutTime: "-",
          lateClockIn: "-",
          earlyClockOut: "-",
          overTime: "Absent", // Mark as Absent
        };
      }
      allDates.push(status);
    }

    const pdfBuffer = await generateMonthlyAttPDF(
      allDates,
      employeeName,
      employeeCode,
      year,
      month
    );

    await attendancePdf({
      email: companyEmail,
      companyName: companyName,
      subject: "Monthly Attendance Report",
      attachment: pdfBuffer,
      date: currentDateString,
    });

    console.log("allDate", allDates);

    return res.json({ attendanceRecords: allDates });
  } catch (error) {
    console.error("Error sending monthly attendance email:", error);
    return res
      .status(500)
      .json({ error: "Failed to send monthly attendance report." });
  }
};

export const sendLateReportInMail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const companyId = (req as any).user.companyId;
  const employeeId = req.params.employeeId;
  const departmentId = req.params.departmentId;
  const companyName = (req as any).user.companyName;
  const companyEmail = (req as any).user.companyEmail;
  const currentDate = new Date();
  const currentDateString = currentDate.toISOString().split("T")[0];

  let attendanceRecord;
  try {
    if (employeeId) {
      attendanceRecord = await prisma.attendance.findMany({
        where: {
          companyId,
          employeeId,
        },
        include: {
          employee: {
            select: {
              employeeCode: true,
              employeeName: true,
            },
          },
          metadata: {
            select: {
              loginTime: true,
              logoutTime: true,
              originalTimezone: true,
            },
          },
        },
      });
    } else {
      attendanceRecord = await prisma.attendance.findMany({
        where: {
          companyId,
          departmentId,
        },
        include: {
          employee: {
            select: {
              employeeCode: true,
              employeeName: true,
            },
          },
          metadata: {
            select: {
              loginTime: true,
              logoutTime: true,
              originalTimezone: true,
            },
          },
        },
      });
    }
  } catch (error) {
    console.error("Error fetching attendance records:", error);
    return res.status(500).send("Internal Server Error");
  }

  if (!attendanceRecord || attendanceRecord.length === 0) {
    return res.status(404).send("No late clock-in data found.");
  }

  const originalTimezone =
    attendanceRecord[0].metadata?.originalTimezone || "UTC";
  const hasEmployeeId = !!employeeId;

  try {
    const pdfBuffer = await generateLateAttPDF(
      attendanceRecord,
      originalTimezone,
      hasEmployeeId
    );

    await attendancePdf({
      email: companyEmail,
      companyName: companyName,
      subject: "Late Attendance Report",
      attachment: pdfBuffer,
      date: currentDateString, // Use currentDateString for consistency
    });

    return res.json({ attendanceRecord });
  } catch (error) {
    console.error("Error generating PDF or sending email:", error);
    return res.status(500).send("Error generating report or sending email.");
  }
};

export const sendOverTimeAttInMail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const companyId = (req as any).user.companyId;
  const employeeId = req.params.employeeId;
  const departmentId = req.params.departmentId;
  const companyName = (req as any).user.companyName;
  const companyEmail = (req as any).user.companyEmail;
  const currentDate = new Date();
  const currentDateString = currentDate.toISOString().split("T")[0];

  const attendanceRecord = await prisma.attendance.findMany({
    where: {
      companyId,
      employeeId,
    },
    include: {
      employee: {
        select: {
          employeeCode: true,
          employeeName: true,
        },
      },
      metadata: {
        select: {
          loginTime: true,
          logoutTime: true,
          originalTimezone: true,
        },
      },
    },
  });
  if (!attendanceRecord.length) {
    return res.status(404).send("No late clock-in data found.");
  }

  const originalTimezone =
    attendanceRecord.length > 0
      ? attendanceRecord[0].metadata?.originalTimezone
      : "UTC";
  const hasEmployeeId = !!employeeId;

  const pdfBuffer = await generateOverTimePDF(
    attendanceRecord,
    originalTimezone || "UTC"
  );

  await attendancePdf({
    email: companyEmail,
    companyName: companyName,
    subject: "Over Time Attendance Report",
    attachment: pdfBuffer,
    date: currentDateString,
  });

  return res.json({ attendanceRecord });
};

export const sendMonthlyInOutInMail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const companyId = (req as any).user.companyId;
  const { date, employeeId } = req.params;
  const companyName = (req as any).user.companyName;
  const companyEmail = (req as any).user.companyEmail;
  const currentDate = new Date();
  const currentDateString = currentDate.toISOString().split("T")[0];

  // Validate date format
  if (!date || !/^\d{4}-\d{2}$/.test(date)) {
    return res
      .status(400)
      .json({ error: "Invalid date format. Expected 'YYYY-MM'." });
  }

  const year = parseInt(date.split("-")[0]);
  const month = parseInt(date.split("-")[1]);

  // Calculate the first and last day of the month
  const startDate = new Date(year, month - 1, 1).toISOString().split("T")[0]; // Start of the month
  const endDate = new Date(year, month, 0).toISOString().split("T")[0]; // End of the month

  const attendanceRecords = employeeId
    ? await prisma.attendance.findMany({
        where: {
          actualDate: {
            gte: startDate,
            lte: endDate,
          },
          companyId,
          employeeId,
        },
        include: {
          employee: {
            select: {
              employeeId: true,
              employeeCode: true,
              employeeName: true,
            },
          },
          department: {
            select: {
              departmentId: true,
              departmentName: true,
            },
          },
          team: {
            select: {
              teamName: true,
              teamId: true,
            },
          },
          company: {
            select: {
              companyId: true,
              companyEmail: true,
              companyName: true,
            },
          },
          metadata: {
            select: {
              loginTime: true,
              logoutTime: true,
              originalTimezone: true,
            },
          },
        },
      })
    : await prisma.attendance.findMany({
        where: {
          actualDate: {
            gte: startDate,
            lte: endDate,
          },
          companyId,
        },
        include: {
          employee: {
            select: {
              employeeId: true,
              employeeCode: true,
              employeeName: true,
            },
          },
          department: {
            select: {
              departmentId: true,
              departmentName: true,
            },
          },
          team: {
            select: {
              teamName: true,
              teamId: true,
            },
          },
          company: {
            select: {
              companyId: true,
              companyEmail: true,
              companyName: true,
            },
          },
          metadata: {
            select: {
              loginTime: true,
              logoutTime: true,
              originalTimezone: true,
            },
          },
        },
      });

  const originalTimezone =
    attendanceRecords.length > 0
      ? attendanceRecords[0].metadata?.originalTimezone
      : "UTC";
  const hasEmployeeId = !!employeeId;

  const pdfBuffer = await generateMonthlyInOutPDF(
    attendanceRecords,
    originalTimezone || "UTC",
    hasEmployeeId
  );

  await monthlyInOutPdf({
    email: companyEmail,
    companyName: companyName,
    subject: "Monthly In-Out Report",
    attachment: pdfBuffer,
    date: currentDateString,
  });

  return res.json({ attendanceRecords });
};
