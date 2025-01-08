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
import { order } from "paypal-rest-sdk";
import { log } from "console";

export const employeeAttendanceClockIn = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  console.log("Clocked  In");
  const currentDateAndTime = new Date();
  const employee = (req as any).user;

  console.log("Employee Data");
  console.log(employee);

  if (!employee?.employeeId || !employee?.companyId) {
    return next(new Error("Invalid employee data"));
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

  const companyTimeZone = companyAttendance?.timeZone || "UTC";
  console.log(companyAttendance, "COMPANY TIMEZONE");

  const actualDate = moment
    .tz(currentDateAndTime, companyTimeZone)
    .format("YYYY-MM-DD");
  console.log("Clocked In 222");

  const employeeLoginTimeZone = moment
    .tz(currentDateAndTime, companyTimeZone)
    .format();
  const employeeLoginTime = moment(currentDateAndTime)
    .tz(companyTimeZone)
    .format("HH:mm");

  if (
    !companyAttendance?.actualLoginTime ||
    !companyAttendance?.actualLogoutTime
  ) {
    return next(
      customErrorHandler(res, "Company Attendance Record Not Found", 404)
    );
  }

  console.log("Clocked In 2313");

  const attendanceRecordCheck = await prisma.attendance.findMany({
    where: {
      employeeId: employee.employeeId,
      actualDate,
    },
    orderBy: { updatedAt: "desc" },
  });

  console.log("Clocked In 45444");

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
            employeeLoginTime: employeeLoginTimeZone,
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
            originalTimezone: companyTimeZone,
            loginTime: employeeLoginTimeZone,
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
        .json({ message: "Employee attendance recorded", status: "success" });
    }

    if (
      attendanceRecordCheck[0]?.employeeLoginTime &&
      !attendanceRecordCheck[0]?.employeeLogoutTime
    ) {
      return next(customErrorHandler(res, "You have already Clocked in", 400));
    }
  }


  const actualEmployeeLoginTime = moment
    .tz(companyAttendance.actualLoginTime, "HH:mm", companyTimeZone)
    .format("HH:mm");

  console.log("Company expected login time:", actualEmployeeLoginTime);
  console.log("Employee actual login time:", employeeLoginTimeZone);



  const lateness = calculateLateTime(
    actualEmployeeLoginTime,
    employeeLoginTime,
    companyTimeZone
  );
  let isLate = lateness !== null;

  const lateClockIn = isLate
    ? `${lateness!.lateHours} hrs, ${lateness!.lateMinutes} mins, ${lateness!.lateSeconds
    } sec late`
    : "On time";

  await prisma.$transaction(async (tx) => {
    const newAttendance = await tx.attendance.create({
      data: {
        actualDate,
        employeeLoginTime: employeeLoginTimeZone,
        lateClockIn,
        employeeId: employee.employeeId,
        companyId: employee.companyId,
        departmentId: employee.departmentId || undefined,
        teamId: employee.teamId || undefined,
      },
    });

    //Create metadata separately for the newly created attendance record
    await tx.attendanceMetadata.create({
      data: {
        attendanceId: newAttendance.id,
        originalTimezone: companyTimeZone,
        loginTime: employeeLoginTimeZone,
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
    .json({ message: "Employee attendance recorded", status: "success" });
};

// employee clock in attendance
// export const employeeAttendanceClockIns = async (req: Request, res: Response, next: NextFunction) => {
//   const currentDateAndTime = new Date();
//   const actualDate = currentDateAndTime.toISOString().split('T')[0];

//   const employee = (req as any).user;
//       // Fetch company attendance time (9:00 AM company time)
//       const companyAttendance = await prisma.actualTimeOfCompany.findFirst({
//         where: {
//           companyId: employee.companyId,
//         },
//         orderBy: {
//           actualLoginTime: 'desc',
//         },
//       });

//       if (!companyAttendance) {
//         return next(customErrorHandler(res, "Company attendance record not found", 404));
//       }

//       const attendanceRecords = await prisma.attendance.findUnique({
//         where: {
//           employeeId_actualDate: {
//             employeeId: employee.employeeId,
//             actualDate,
//           },
//         },
//       });

//       if (attendanceRecords?.employeeLoginTime) {
//         return next(customErrorHandler(res, "You have already Clocked in", 400));
//       }

//       const team = await prisma.team.findFirst({
//         where: {
//           teamId: employee.teamId,
//           companyId: employee.companyId
//         },
//       });

//       if (!team || !team.teamLoginTime) {
//         return next(customErrorHandler(res, "Team login time not found", 404));
//       }

//       // Convert team login time from 12-hour to 24-hour format
//       const [teamTime, period] = team.teamLoginTime.split(' ');
//       const [teamHour, teamMinutes] = teamTime.split(':').map(Number);
//       let teamLoginHour = teamHour;
//       if (period === 'PM' && teamHour !== 12) {
//         teamLoginHour += 12;
//       } else if (period === 'AM' && teamHour === 12) {
//         teamLoginHour = 0;
//       }

//       const employeeLoginTime = currentDateAndTime;
//       const employeeLoginHour = employeeLoginTime.getHours();
//       const employeeLoginMinute = employeeLoginTime.getMinutes();

//       console.log('Team Login Time (24hr):', `${teamLoginHour}:${teamMinutes}`);
//       console.log('Employee Login Time:', `${employeeLoginHour}:${employeeLoginMinute}`);

//       let lateClockIn = '';
//       let isLate = false;

//       if (
//         employeeLoginHour > teamLoginHour ||
//         (employeeLoginHour === teamLoginHour && employeeLoginMinute > teamMinutes)
//       ) {
//         const lateTotalMinutes = (employeeLoginHour - teamLoginHour) * 60 + (employeeLoginMinute - teamMinutes);
//         const lateHours = Math.floor(lateTotalMinutes / 60);
//         const lateMinutes = lateTotalMinutes % 60;

//         console.log('Late by:', `${lateHours} hours and ${lateMinutes} minutes`);
//         lateClockIn = `${lateHours} hrs, ${lateMinutes} mins late`;
//         isLate = true;
//       } else {
//         console.log('Employee arrived on time');
//         lateClockIn = 'On time';
//       }

//   const localDateTime = new Date(currentDateAndTime.getTime() - (currentDateAndTime.getTimezoneOffset() * 60000));

//   const attendanceRecord = await prisma.attendance.create({
//     data: {
//       actualDate,
//       employeeLoginTime: localDateTime,
//       lateClockIn: lateClockIn,
//       employeeId: employee.employeeId,
//       departmentId: employee.departmentId,
//       teamId: employee.teamId,
//       companyId: employee.companyId,
//     },
//   });

//   console.log('Stored Login Time:', localDateTime.toLocaleString());
//   // Check late occurrences for notifications
//   if (isLate) {
//     // Count late occurrences for the employee in the past 30 days
//     const lateCountRecord = await prisma.attendance.count({
//       where: {
//         employeeId: employee.employeeId,
//         lateClockIn: {
//           not: 'On time', // Count only late clock-ins
//         },
//         actualDate: {
//           gte: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(), // Last 30 days
//         },
//       },
//     });

//       // Send notification if the employee is late 3 times
//       if (lateCountRecord === 3) {
//           const lateCountMessage = `You have clocked in late 3 times. Please ensure to clock in on time.`;
//           console.log(`Notification sent to employee ${employee.employeeId}`);
//           await sendNotificationFromCompanyToEmployee(employee.companyId, employee.employeeId, lateCountMessage);

//           // Notify admin about the employee's lateness
//           const adminMessage = `Employee ${employee.employeeName} (ID: ${employee.employeeId}) has clocked in late ${lateCountRecord} times. Please take necessary action.`;
//           await sendNotificationToAdminAboutLateEmployee(employee.companyId, employee.email, lateCountRecord);
//           console.log(`Notification sent to company ${employee.companyId}`);

//           // Update the attendance records as having had notifications sent
//           await prisma.attendance.updateMany({
//               where: {
//                   employeeId: employee.employeeId,
//                   companyId: employee.companyId,
//                   lateClockIn: {
//                       not: null,
//                   },
//               },
//               data: {
//                   notificationSent: true, // Mark notifications as sent
//               },
//           });
//       }

//       // If the employee reaches 7 late clock-ins, add to riskUser table
//       if (lateCountRecord === 7) {
//           const existingRiskUser = await prisma.riskUser.findFirst({
//               where: {
//                   employeeId: employee.employeeId,
//               },
//           });

//           if (!existingRiskUser) {
//               // Insert into RiskUser table
//               await prisma.riskUser.create({
//                   data: {
//                       employeeId: employee.employeeId,
//                       employeeName: employee.employeeName, // Assuming this is available
//                       departmentId: employee.departmentId,
//                       companyId: employee.companyId,
//                       isSafe: false, // Default to unsafe since they're at risk
//                   },
//               });

//               // Notify the employee about becoming a risk user
//               const riskUserMessage = `You have been classified as a risk user due to frequent late clock-ins. Please improve your punctuality.`;
//               await sendNotificationFromCompanyToEmployee(employee.companyId, employee.employeeId, riskUserMessage);

//               // Send notification about the risk added user
//               await sendNotificationToAdminAboutRiskUser(employee.companyId, employee.employeeName, employee.employeeId);
//               console.log(`Notification sent about risk user to company ${employee.companyId}`);
//           }
//       }
//   }

//   return res.status(200).json({ message: 'Employee attendance recorded', attendanceRecord });
// };

// export const employeeAttendanceClockOut = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const currentDateAndTime = new Date();
//     const employee = (req as any).user;

//     // Fetch company logout time and employee attendance record in parallel
//     const companyAttendance = await prisma.actualTimeOfCompany.findFirst({
//       where: {
//         companyId: employee.companyId,
//         teamId: employee.teamId || undefined,
//       },
//       orderBy: { actualLoginTime: "desc" },
//       select: {
//         actualLoginTime: true,
//         actualLogoutTime: true,
//         timeZone: true,
//       },
//     });

//     const attendanceRecords = await prisma.attendance.findUnique({
//       where: {
//         employeeId_actualDate: {
//           employeeId: employee.employeeId,
//           actualDate: moment(currentDateAndTime).format("YYYY-MM-DD"),
//         },
//       },
//     });

//     const companyTimeZone = companyAttendance?.timeZone || "UTC";
//     const actualDate = moment
//       .tz(currentDateAndTime, companyTimeZone)
//       .format("YYYY-MM-DD");

//     if (!companyAttendance || !companyAttendance.actualLogoutTime) {
//       return next(customErrorHandler(res, "Clockout time not found", 404));
//     }
//     if (attendanceRecords?.employeeLogoutTime) {
//       return next(customErrorHandler(res, "You have already Clocked Out", 400));
//     }

//     const actualEmployeeLogoutTime = moment
//       .tz(companyAttendance.actualLogoutTime, "HH:mm", companyTimeZone)
//       .format("HH:mm");
//     const employeeLogoutTime = moment(currentDateAndTime)
//       .tz(companyTimeZone)
//       .format("HH:mm");
//     const employeeLogoutTimeZone = moment
//       .tz(currentDateAndTime, companyTimeZone)
//       .format();

//     console.log("Company expected logout time:", actualEmployeeLogoutTime);
//     console.log("Employee actual logout time:", employeeLogoutTime);

//     const timeDifference = calculateTimeDifference(
//       actualEmployeeLogoutTime,
//       employeeLogoutTime,
//       companyTimeZone
//     );

//     const isOvertime = timeDifference.includes("overtime");

//     // Update attendance record with either overtime or early clock-out
//     const updatedAttendance = await prisma.attendance.update({
//       where: {
//         employeeId_actualDate: { employeeId: employee.employeeId, actualDate },
//       },
//       data: {
//         overTime: isOvertime ? timeDifference : null,
//         earlyClockOut: !isOvertime ? timeDifference : null,
//         employeeLogoutTime: currentDateAndTime,
//         metadata: {
//           update: {
//             logoutTime: employeeLogoutTimeZone,
//           },
//         },
//       },
//     });
//     await prisma.employee.update({
//       where: { employeeId: employee.employeeId },
//       data: {
//         currentEmployeeStatus: "INACTIVE",
//       },
//     });

//     return res.status(200).json({
//       message: "Employee clocked out successfully",
//       updatedAttendance,
//     });
//   } catch (error) {
//     console.error("Error clocking out employee:", error);
//     return res
//       .status(500)
//       .json({ message: "An error occurred while clocking out." });
//   }
// };

export const employeeAttendanceClockOut = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
        customErrorHandler(res, "Company attendance record not found", 404)
      );
    }

    const companyTimeZone = companyAttendance?.timeZone || "UTC";
    const actualDate = moment
      .tz(currentDateAndTime, companyTimeZone)
      .format("YYYY-MM-DD");

    // Fetch attendance records for the current date
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        employeeId: employee.employeeId,
        actualDate: actualDate,
      },
      orderBy: { employeeLoginTime: "desc" }, // Get the most recent clock-in record
    });

    // Case 1: If the employee hasn't clocked in yet (no attendance record)
    if (attendanceRecords.length === 0) {
      return next(
        customErrorHandler(res, "No clock-in record found for today", 400)
      );
    }

    const actualEmployeeLogoutTime = moment
      .tz(companyAttendance.actualLogoutTime, "HH:mm", companyTimeZone)
      .format("HH:mm");

    const employeeLogoutTime = moment(currentDateAndTime)
      .tz(companyTimeZone)
      .format("HH:mm");

    const employeeLogoutTimeZone = moment
      .tz(currentDateAndTime, companyTimeZone)
      .format();

    // Case 2: If there is exactly one attendance record and it's the first clock-out attempt
    if (
      attendanceRecords.length === 1 &&
      !attendanceRecords[0]?.employeeLogoutTime
    ) {
      const latestAttendance = attendanceRecords[0]; // First attendance record (clock-in)

      // Calculate the time difference for the first-time clock-out
      const timeDifference = calculateTimeDifference(
        actualEmployeeLogoutTime,
        employeeLogoutTime,
        companyTimeZone
      );

      const isOvertime = timeDifference.includes("overtime");

      // Update only the most recent attendance record (attendanceRecords[0]) with either overtime or early clock-out
      // const updatedAttendance = await prisma.attendance.update({
      //   where: {
      //       employeeId: employee.employeeId,
      //       actualDate,
      //     employeeLoginTime: latestAttendance.employeeLoginTime,
      //     createdAt: latestAttendance?.createdAt
      //   },
      //   data: {
      //     overTime: isOvertime ? timeDifference : null,
      //     earlyClockOut: !isOvertime ? timeDifference : null,
      //     employeeLogoutTime: currentDateAndTime,
      //     metadata: {
      //       update: {
      //         logoutTime: employeeLogoutTimeZone,
      //       },
      //     },
      //   },
      // });

      const updatedAttendance = await prisma.attendance.update({
        where: {
          employeeId: employee.employeeId,
          actualDate,
          id: latestAttendance.id,
        },
        data: {
          overTime: isOvertime ? timeDifference : null,
          earlyClockOut: !isOvertime ? timeDifference : null,
          employeeLogoutTime: currentDateAndTime,
          metadata: {
            update: {
              logoutTime: employeeLogoutTimeZone,
            },
          },
        },
      });

      // Updating employee status to "INACTIVE" (indicating the employee has clocked out)
      await prisma.employee.update({
        where: { employeeId: employee.employeeId },
        data: {
          currentEmployeeStatus: "INACTIVE",
        },
      });

      return res.status(200).json({
        message: "Employee clocked out successfully",
        updatedAttendance,
      });
    }

    // Case 3: If the employee has clocked in more than once (attendance.length > 1), update the latest clock-in attendance record
    if (attendanceRecords.length > 1) {
      const latestAttendance = attendanceRecords[0]; // Most recent attendance record (latest clock-in)

      // Update the most recent attendance record with the logout time
      const updatedAttendance = await prisma.attendance.update({
        where: {
          // employeeId_actualDate_updatedAt: {
          //   employeeId: employee.employeeId,
          //   actualDate,
          //   updatedAt: latestAttendance.updatedAt, // Use the actual composite key
          // },
          // employeeLoginTime: latestAttendance.employeeLoginTime,

          employeeId: employee.employeeId,
          actualDate,
          id: latestAttendance.id,
        },
        data: {
          employeeLogoutTime: currentDateAndTime,
          metadata: {
            update: {
              logoutTime: employeeLogoutTimeZone,
            },
          },
        },
      });

      // Update employee status to "INACTIVE"
      await prisma.employee.update({
        where: { employeeId: employee.employeeId },
        data: {
          currentEmployeeStatus: "INACTIVE",
        },
      });

      return res.status(200).json({
        message: "Employee clocked out successfully",
        updatedAttendance,
      });
    }

    // Case 4: If the Employee has already clocked out, returns an error
    return res.status(400).json({
      message: "You have already clocked out today",
      status: "error",
    });
  } catch (error) {
    console.error("Error clocking out employee:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while clocking out." });
  }
};

// export const employeeAttendanceClockOuts = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const currentDateAndTime = new Date();
//     // Convert to local time
//     const localDateTime = new Date(currentDateAndTime.getTime() - (currentDateAndTime.getTimezoneOffset() * 60000));
//     const actualDate = localDateTime.toISOString().split('T')[0];
//     const employee = (req as any).user;

//     const team = await prisma.team.findFirst({
//       where: {
//         teamId: employee.teamId,
//         companyId: employee.companyId
//       },
//     });

//     if (!team || !team.teamLogoutTime) {
//       return next(customErrorHandler(res, "Team logout time not found", 404));
//     }

//     const [teamTime, period] = team.teamLogoutTime.split(' ');
//     const [teamHour, teamMinutes] = teamTime.split(':').map(Number);
//     let teamLogoutHour = teamHour;
//     if (period === 'PM' && teamHour !== 12) {
//       teamLogoutHour += 12;
//     } else if (period === 'AM' && teamHour === 12) {
//       teamLogoutHour = 0;
//     }

//     const employeeLogoutHour = localDateTime.getHours();
//     const employeeLogoutMinute = localDateTime.getMinutes();

//     let timeDifference = '';
//     if (employeeLogoutHour > teamLogoutHour ||
//        (employeeLogoutHour === teamLogoutHour && employeeLogoutMinute > teamMinutes)) {
//       const overtimeMinutes = (employeeLogoutHour - teamLogoutHour) * 60 + (employeeLogoutMinute - teamMinutes);
//       timeDifference = `${Math.floor(overtimeMinutes / 60)} hrs, ${overtimeMinutes % 60} mins overtime`;
//     } else {
//       const earlyMinutes = (teamLogoutHour - employeeLogoutHour) * 60 + (teamMinutes - employeeLogoutMinute);
//       timeDifference = `${Math.floor(earlyMinutes / 60)} hrs, ${earlyMinutes % 60} mins early`;
//     }

//     const updatedAttendance = await prisma.attendance.update({
//       where: { employeeId_actualDate: { employeeId: employee.employeeId, actualDate } },
//       data: {
//         overTime: employeeLogoutHour >= teamLogoutHour ? timeDifference : null,
//         earlyClockOut: employeeLogoutHour < teamLogoutHour ? timeDifference : null,
//         employeeLogoutTime: localDateTime,
//       }
//     });

//     await prisma.employee.update({
//       where: { employeeId: employee.employeeId },
//       data: { currentEmployeeStatus: "INACTIVE" }
//     });

//     return res.status(200).json({ message: 'Employee clocked out successfully', updatedAttendance });
//   } catch (error) {
//     console.error('Error clocking out employee:', error);
//     return res.status(500).json({ message: 'An error occurred while clocking out.' });
//   }
// };

// employee break in

// export const takeBreak = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   const { employeeId, companyId } = (req as any).user;

//   try {
//     const currentDateAndTime = new Date();
//     const actualDate = currentDateAndTime.toISOString().split("T")[0];

//     const attendance = await prisma.attendance.findFirst({
//       where: {
//         employeeId,
//         actualDate,
//       },
//       orderBy: { updatedAt: "desc" },
//     });

//     if (!attendance) {
//       return next(customErrorHandler(res, "Attendance record not found", 404));
//     }

//     if (attendance?.breakIn && !attendance?.breakOut) {
//       return next(customErrorHandler(res, "You are already in a break", 400));
//     }

//     if (attendance?.breakIn && attendance?.breakOut) {
//       const updatedAttendance = await prisma.attendance.update({
//         where: {
//           employeeId_actualDate: {
//             employeeId,
//             actualDate,
//           },
//         },
//         data: {
//           breakIn: currentDateAndTime,
//         },
//       });
//       await prisma.employee.update({
//         where: { employeeId },
//         data: {
//           currentEmployeeStatus: "ONBREAK",
//         },
//       });

//       return res.json({ updatedAttendance });
//     }
//   } catch (error) {
//     next(error);
//   }
// };

// export const takeBreak = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   const { employeeId, companyId } = (req as any).user;

//   try {
//     // Get the current date in ISO format (yyyy-mm-dd)
//     const currentDateAndTime = new Date();
//     const actualDate = currentDateAndTime.toISOString().split("T")[0];

//     // Find the most recent attendance record for the employee on the given date
//     const attendance = await prisma.attendance.findFirst({
//       where: {
//         employeeId,
//         actualDate,
//       },
//       orderBy: { createdAt: "desc" },
//     });

//     if (!attendance) {
//       return next(customErrorHandler(res, "Attendance record not found", 404));
//     }

//     console.log("Data Is Coming");
//     // Check if the employee is already on break
//     const lastBreakSession = await prisma.breakSession.findFirst({
//       where: {
//         employeeId, // Link the break session to the employee
//         actualDate, // Use actualDate to link the break session
//       },
//       orderBy: { updatedAt: "desc" }, // Get the most recent break session
//     });

//     // If there is an ongoing break (breakOut is null)
//     if (lastBreakSession && !lastBreakSession.breakOut) {
//       return next(customErrorHandler(res, "You are already on a break", 400));
//     }

//     // If no break session exists or the previous break is completed, create a new break session
//     // const newBreakSession = await prisma.breakSession.create({
//     //   data: {
//     //     employeeId, // Employee ID
//     //     actualDate, // The actual date for attendance
//     //     createdAt: new Date(),
//     //     breakIn: currentDateAndTime, // Set the current time as breakIn
//     //   },
//     // });

//     const newBreakSession = await prisma.breakSession.create({
//       data: {
//         employeeId,
//         actualDate,
//         createdAt: attendance.createdAt, // Match the exact Attendance createdAt
//         breakIn: new Date(),
//       },
//     });

//     // Update the employee status to 'ONBREAK'
//     await prisma.employee.update({
//       where: { employeeId },
//       data: {
//         currentEmployeeStatus: "ONBREAK",
//       },
//     });

//     const updatedAttendance = await prisma.attendance.findFirst({
//       where: {
//         employeeId,
//         actualDate,
//       },
//       orderBy: { updatedAt: "desc" },
//     });

//     return res.json({ updatedAttendance });
//   } catch (error) {
//     console.log(error);
//     next(error);
//   }
// };

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

    // Find matching attendance record for the employee on the current date
    const attendance = await prisma.attendance.findFirst({
      where: { employeeId, actualDate },
      orderBy: { createdAt: "desc" }, // Get the most recent attendance record
    });

    if (!attendance) {
      return next(
        customErrorHandler(
          res,
          "Attendance record not found for the given employee and date",
          404
        )
      );
    }

    // Check if there is an ongoing break session for the employee
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
        attendanceId: attendance.id, // Link to the attendance record
        updatedAt: attendance.updatedAt, // Use Attendance's updatedAt
        breakIn: currentDateAndTime, // Set the break-in time
      },
    });

    // Update the employee status to "ONBREAK"
    await prisma.employee.update({
      where: { employeeId },
      data: { currentEmployeeStatus: "ONBREAK" },
    });

    // Return the new break session details in the response
    return res.json({ newBreakSession });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

// employee breakout
// export const breakOut = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   const { employeeId, companyId } = (req as any).user;
//   const currentDateAndTime = new Date();
//   const actualDate = currentDateAndTime.toISOString().split("T")[0];

//   const attendanceRecord = await prisma.attendance.findFirst({
//     where: {
//       employeeId,
//       actualDate,
//     },
//     orderBy: { updatedAt: "desc" },
//   });

//   if (!attendanceRecord) {
//     return next(customErrorHandler(res, "Attendance record not found", 404));
//   }

//   if (!attendanceRecord.breakSessions.breakIn)
//     return next(customErrorHandler(res, "You haven't take break", 404));
//   const breakInDate = new Date(attendanceRecord.breakIn);
//   const breakOutDate = new Date(currentDateAndTime);

//   // calculating difference in millisecond
//   const differenceInMilliseconds =
//     breakOutDate.getTime() - breakInDate.getTime();

//   // cnverting millisecond to minutes
//   const breakInMinutes = Math.floor(differenceInMilliseconds / (1000 * 60));

//   const updateAttendance = await prisma.attendance.update({
//     where: {
//       employeeId_actualDate: {
//         employeeId,
//         actualDate,
//       },
//     },
//     data: {
//       breakOut: currentDateAndTime,
//       breakInMinutes: `${breakInMinutes.toString()} minutes`,
//     },
//   });
//   await prisma.employee.update({
//     where: { employeeId },
//     data: {
//       currentEmployeeStatus: "WORKING",
//     },
//   });

//   return res.json({
//     updateAttendance,
//   });
// };

// export const breakOut = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   const { employeeId, companyId } = (req as any).user; // Extract user details
//   const currentDateAndTime = new Date();
//   const actualDate = currentDateAndTime.toISOString().split("T")[0]; // Format the date

//   try {
//     // Step 1: Fetch the latest attendance record for the employee
//     const attendanceRecord = await prisma.attendance.findFirst({
//       where: {
//         employeeId,
//         actualDate,
//       },
//       orderBy: {
//         createdAt: "desc", // Ensure the latest record is fetched
//       },
//       include: {
//         breakSessions: {
//           // where: {
//           //   breakOut: null, // Only fetch sessions without a `breakOut`
//           // },
//           orderBy: {
//             createdAt: "desc", // Get the latest session without breakOut
//           },
//           take: 1,
//         },
//       },
//     });

//     if (!attendanceRecord) {
//       return next(customErrorHandler(res, "Attendance Record not Found", 400));
//     }

//     // Step 2: Validate if attendance and break sessions exist
//     if (attendanceRecord.breakSessions.length === 0) {
//       return next(customErrorHandler(res, "You haven't taken a break", 400));
//     }

//     // Step 3: Get the latest break session
//     const currentBreakSession = attendanceRecord.breakSessions[0];

//     // Step 4: Calculate the break duration
//     const breakInDate = new Date(currentBreakSession.breakIn);
//     const breakOutDate = currentDateAndTime;

//     const differenceInMilliseconds =
//       breakOutDate.getTime() - breakInDate.getTime();
//     const breakInMinutes = Math.floor(differenceInMilliseconds / (1000 * 60));

//     // Step 5: Update the BreakSession with the breakOut time
//     const updatedBreakSession = await prisma.breakSession.update({
//       where: {
//         id: currentBreakSession.id,
//       },
//       data: {
//         breakOut: breakOutDate,
//       },
//     });

//     // Step 6: Update the attendance record's `breakInMinutes`
//     // Fetch the existing break duration, if any, and sum it up
//     const existingBreakInMinutes = attendanceRecord.breakInMinutes
//       ? parseInt(attendanceRecord.breakInMinutes.split(" ")[0], 10)
//       : 0;

//     const updatedBreakInMinutes = existingBreakInMinutes + breakInMinutes;

//     await prisma.attendance.update({
//       where: {
//         employeeId_actualDate_updatedAt: {
//           employeeId: attendanceRecord.employeeId,
//           actualDate: attendanceRecord.actualDate,
//           updatedAt: attendanceRecord.updatedAt,
//         },
//       },
//       data: {
//         breakInMinutes: `${updatedBreakInMinutes} minutes`, // Update the total break duration
//       },
//     });

//     // Step 7: Update the employee's status to "WORKING"
//     await prisma.employee.update({
//       where: { employeeId },
//       data: {
//         currentEmployeeStatus: "WORKING",
//       },
//     });

//     // Step 8: Return the response
//     return res.json({
//       updatedBreakSession,
//       breakInMinutes: `${breakInMinutes} minutes`, // Minutes for this break session
//       totalBreakInMinutes: `${updatedBreakInMinutes} minutes`, // Updated total break duration
//     });
//   } catch (error) {
//     next(error); // Handle any errors
//   }
// };

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

    if (!attendanceRecord) {
      return next(customErrorHandler(res, "Attendance Record not Found", 400));
    }

    // Step 2: Validate if attendance and break sessions exist
    if (attendanceRecord.breakSessions.length === 0) {
      return next(customErrorHandler(res, "You haven't taken a break", 400));
    }

    // Step 3: Get the latest break session
    const currentBreakSession = attendanceRecord.breakSessions[0];

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
    return res.json({
      updatedBreakSession,
      breakInMinutes: `${breakInMinutes} minutes`, // Minutes for this break session
      totalBreakInMinutes: `${updatedBreakInMinutes} minutes`, // Updated total break duration
    });
  } catch (error) {
    console.error(error);
    next(error); // Handle any errors
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
// export const ownAttendance = async ( req:Request, res:Response, next:NextFunction) => {
//   const companyId = (req as any).user.companyId
//   const employeeId = (req as any).user.employeeId
//   const attendacneRecord = await prisma.attendance.findMany({
//     where:{
//       companyId,employeeId
//     }
//   })
//   return res.json({attendacneRecord})
// }
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

// export const sendMonthlyAttInMail = async (req: Request, res: Response, next: NextFunction) => {
//   const companyId = (req as any).user.companyId;
//   const employeeId = req.params.employeeId;
//   const companyName = (req as any).user.companyName;
//   const companyEmail = (req as any).user.companyEmail;
//   const currentDate = new Date();
//   const currentDateString = currentDate.toISOString().split("T")[0];

//   console.log(employeeId," ")

//   // Extracting month and year from request parameters
//   const { year } = req.body;
//   const month = parseInt(req.body.month, 10) - 1;

//   try {
//     // Fetch employee details to get createdAt date
//     const employeeDetail = await prisma.employee.findUnique({
//         where: {
//             companyId,
//             employeeId
//         },
//         select: {
//             employeeCode: true,
//             employeeName: true,
//             createdAt: true
//         }
//     });
//     const employeeName = employeeDetail?.employeeName || "-";
//     const employeeCode = employeeDetail?.employeeCode || "-";
//     const createdAt = employeeDetail?.createdAt || new Date(); // Default to now if not found
//     // Calculate the start date for attendance records
//     const startDate = new Date(year, month, 1);
//     const endDate = new Date(year, month + 1, 0);
//     // Limit attendance records to current date
//     const attendanceRecords = await prisma.attendance.findMany({
//         where: {
//             companyId,
//             employeeId,
//             actualDate: {
//                 gte: startDate.toISOString().split("T")[0],
//                 lte: currentDateString // Only up to current date
//             }
//         }
//     });
//     // Create a complete attendance record for the month
//     const allDates: AttendanceRecord[] = [];
//     const daysInMonth = new Date(year, month + 1, 0).getDate(); // Get the number of days in the month
//     for (let day = 1; day <= daysInMonth; day++) {
//         const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
//         const date = new Date(dateStr);
//         // Only process dates between createdAt and current date
//         if (date < createdAt || date > currentDate) {
//             continue; // Skip dates outside the range
//         }
//         const attendance = attendanceRecords.find(record => record.actualDate === dateStr);

//         let status: AttendanceRecord;
//         if (attendance) {
//             status = {
//                 actualDate: attendance.actualDate,
//                 employeeLoginTime: attendance.employeeLoginTime ? attendance.employeeLoginTime.toISOString() : "-",
//                 employeeLogoutTime: attendance.employeeLogoutTime ? attendance.employeeLogoutTime.toISOString() : "-",
//                 lateClockIn: attendance.lateClockIn || "-",
//                 earlyClockOut: attendance.earlyClockOut || "-",
//                 overTime: attendance.overTime || "-"
//             };
//         } else {
//             // If no attendance record exists
//             if (date.getDay() === 6) { // Saturday
//                 status = {
//                     actualDate: dateStr,
//                     employeeLoginTime: "-",
//                     employeeLogoutTime: "-",
//                     lateClockIn: "-",
//                     earlyClockOut: "-",
//                     overTime: "Leave" // Mark Saturdays as Leave
//                 };
//             } else {
//                 // Absent on other days
//                 status = {
//                     actualDate: dateStr,
//                     employeeLoginTime: "-",
//                     employeeLogoutTime: "-",
//                     lateClockIn: "-",
//                     earlyClockOut: "-",
//                     overTime: "Absent"
//                 };
//             }
//         }
//         allDates.push(status);
//     }
//     const pdfBuffer = await generateMonthlyAttPDF(allDates, employeeName, employeeCode, year, month);
//     // Uncomment to send email with PDF
//     await attendancePdf({
//         email: companyEmail,
//         companyName: companyName,
//         subject: "Monthly Attendance Report",
//         attachment: pdfBuffer,
//         date: currentDateString
//     });
//     return res.json({ attendanceRecords: allDates });
// } catch (error) {
//     console.error("Error sending monthly attendance email:", error);
//     return res.status(500).json({ error: "Failed to send monthly attendance report." });
// }
// };

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
