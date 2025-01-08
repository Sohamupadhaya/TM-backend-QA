import { NextFunction, Request, Response } from "express";
import { customErrorHandler } from "../utils/customErrorHandler.js";
import bcrypt from "bcrypt";
import crypto from "crypto"
import { createToken } from "../utils/createToken.js";
import prisma from "../models/index.js";
import { otpVerification, forgetPwOTP } from "../lib/mail.js";


// export const totalTeamsDepartmentsAndEmployeeOfCompany = async (req: Request, res: Response, next: NextFunction) => {
//     const companyId = (req as any).user.companyId;
//     const currentDateAndTime = new Date();
//     const currentDate = currentDateAndTime.toISOString().split("T")[0];

//     // To fetch total number of team
//     const noOfTeams = await prisma.team.count({
//         where: { companyId }
//     });

//     // To fetch total number of department
//     const noOfDepartments = await prisma.department.count({
//         where: { companyId }
//     });

//     // To fetch the number of employees
//     const noOfEmployees = await prisma.employee.count({
//         where: { companyId }
//     });

//     // Fetch all teams and departments
//     const allTeams = await prisma.team.findMany({ where: { companyId } });
//     const allDepartments = await prisma.department.findMany({ where: { companyId } });

//     // To fetch the number of present employees
//     const presentEmployeeToday = await prisma.attendance.findMany({
//         where: {
//             actualDate: currentDate,
//             companyId
//         }
//     });

//     // To fetch all employees
//     const allEmployees = await prisma.employee.findMany({
//         where: { companyId },
//         select: {
//             employeeId: true,
//             employeeName: true,
//             employeeCode:true
//         }
//     });

//     // Calculate present and absent employees
//     const presentEmployeeIds = presentEmployeeToday.map((attendance) => attendance.employeeId);
//     const absentEmployees = allEmployees.filter(employee => !presentEmployeeIds.includes(employee.employeeId));

//     const absentEmployeeCount = absentEmployees.length;

//     // Get unique employee IDs from the attendance table
//     const uniqueAttendanceEmployees = await prisma.attendance.findMany({
//         where: { companyId },
//         distinct: ['employeeId'],
//         select: { employeeId: true }
//     });

//     const uniqueEmployeeCount = uniqueAttendanceEmployees.length;
//     const appNotUsed = noOfEmployees - uniqueEmployeeCount;

//     // Fetch active and on break employees
//     const activeEmployees = await prisma.employee.findMany({
//         where: { currentEmployeeStatus: "WORKING", companyId },
//         select: { employeeId: true, employeeName: true,employeeCode:true }
//     });

//     const employeesOnBreak = await prisma.employee.findMany({
//         where: { currentEmployeeStatus: "ONBREAK", companyId },
//         select: { employeeId: true, employeeName: true,employeeCode:true }
//     });

//     const presentEmployeeNames = allEmployees.filter(employee => presentEmployeeIds.includes(employee.employeeId));
//     const appNotUsedEmployees = allEmployees.filter(employee => !uniqueAttendanceEmployees.some(attendance => attendance.employeeId === employee.employeeId));

//     return res.json({
//         noOfTeams,
//         noOfDepartments,
//         noOfEmployees,
//         appNotUsed,
//         presentEmployeeCount: presentEmployeeToday.length,
//         absentEmployeeCount,
//         activeEmployeeCount: activeEmployees.length,
//         employeeOnBreakCount: employeesOnBreak.length,
//         presentEmployeeNames: presentEmployeeNames.map(e => ({  employeeId: e.employeeId, employeeName: e.employeeName,employeeCode:e.employeeCode})),
//         absentEmployeeNames: absentEmployees.map(e => ({  employeeId: e.employeeId, employeeName: e.employeeName,employeeCode:e.employeeCode })),
//         activeEmployeeNames: activeEmployees.map(e => ({  employeeId: e.employeeId, employeeName: e.employeeName,employeeCode:e.employeeCode })),
//         employeeOnBreakNames: employeesOnBreak.map(e => ({  employeeId: e.employeeId, employeeName: e.employeeName,employeeCode:e.employeeCode })),
//         appNotUsedEmployeeNames: appNotUsedEmployees.map(e => ({  employeeId: e.employeeId, employeeName: e.employeeName,employeeCode:e.employeeCode })),
//         allDepartments,
//         allEmployees,
//         allTeams,
//     });
// }



export const totalTeamsDepartmentsAndEmployeeOfCompany = async (req: Request, res: Response, next: NextFunction) => {
    const companyId = (req as any).user.companyId;
    const currentDateAndTime = new Date();
    const currentDate = currentDateAndTime.toISOString().split("T")[0];

    // To fetch total number of team
    const noOfTeams = await prisma.team.count({
        where: { companyId }
    });

    // To fetch total number of department
    const noOfDepartments = await prisma.department.count({
        where: { companyId }
    });

    // To fetch the number of employees
    const noOfEmployees = await prisma.employee.count({
        where: { companyId }
    });

    // Fetch all teams and departments
    const allTeams = await prisma.team.findMany({ where: { companyId } });
    const allDepartments = await prisma.department.findMany({ where: { companyId } });

    // To fetch the number of present employees
    const presentEmployeeToday = await prisma.attendance.findMany({
        where: {
            actualDate: currentDate,
            companyId
        }
    });

    // To fetch all employees with profile creation date
    const allEmployees = await prisma.employee.findMany({
        where: { companyId },
        select: {
            employeeId: true,
            employeeName: true,
            employeeCode: true,
            createdAt: true // Assuming this field exists
        }
    });

    // Calculate present and absent employees
    const presentEmployeeIds = presentEmployeeToday.map((attendance) => attendance.employeeId);
    const absentEmployees = allEmployees.filter(employee => !presentEmployeeIds.includes(employee.employeeId));

    const absentEmployeeCount = absentEmployees.length;

    // Get unique employee IDs from the attendance table
    const uniqueAttendanceEmployees = await prisma.attendance.findMany({
        where: { companyId },
        distinct: ['employeeId'],
        select: { employeeId: true }
    });

    const uniqueEmployeeCount = uniqueAttendanceEmployees.length;
    const appNotUsed = noOfEmployees - uniqueEmployeeCount;

    // Fetch active and on break employees
    const activeEmployees = await prisma.employee.findMany({
        where: { currentEmployeeStatus: "WORKING", companyId },
        select: { employeeId: true, employeeName: true, employeeCode: true }
    });

    const employeesOnBreak = await prisma.employee.findMany({
        where: { currentEmployeeStatus: "ONBREAK", companyId },
        select: { employeeId: true, employeeName: true, employeeCode: true }
    });

    const presentEmployeeNames = allEmployees.filter(employee => presentEmployeeIds.includes(employee.employeeId));
    const appNotUsedEmployees = allEmployees.filter(employee => !uniqueAttendanceEmployees.some(attendance => attendance.employeeId === employee.employeeId));

    // Calculate the number of days the app hasn't been used for each employee
    const appNotUsedDays = await Promise.all(appNotUsedEmployees.map(async (employee) => {
        const profileCreatedDate = new Date(employee.createdAt);
        const daysDifference = Math.floor((currentDateAndTime.getTime() - profileCreatedDate.getTime()) / (1000 * 3600 * 24));

        // Get attendance records for the employee
        const attendanceRecords = await prisma.attendance.findMany({
            where: {
                employeeId: employee.employeeId,
                companyId
            }
        });

        // Calculate the number of days the employee hasn't used the app
        const usedDays = attendanceRecords.length;
        const notUsedDays = daysDifference - usedDays;

        return {
            employeeId: employee.employeeId,
            employeeName: employee.employeeName,
            employeeCode: employee.employeeCode,
            notUsedDays
        };
    }));


    return res.json({
        noOfTeams,
        noOfDepartments,
        noOfEmployees,
        appNotUsed,
        presentEmployeeCount: presentEmployeeToday.length,
        absentEmployeeCount,
        activeEmployeeCount: activeEmployees.length,
        employeeOnBreakCount: employeesOnBreak.length,
        presentEmployeeNames: presentEmployeeNames.map(e => ({ employeeId: e.employeeId, employeeName: e.employeeName, employeeCode: e.employeeCode })),
        absentEmployeeNames: absentEmployees.map(e => ({ employeeId: e.employeeId, employeeName: e.employeeName, employeeCode: e.employeeCode })),
        activeEmployeeNames: activeEmployees.map(e => ({ employeeId: e.employeeId, employeeName: e.employeeName, employeeCode: e.employeeCode })),
        employeeOnBreakNames: employeesOnBreak.map(e => ({ employeeId: e.employeeId, employeeName: e.employeeName, employeeCode: e.employeeCode })),
        appNotUsedEmployeeNames: appNotUsedEmployees.map(e => ({ employeeId: e.employeeId, employeeName: e.employeeName, employeeCode: e.employeeCode, notUsedDays: appNotUsedDays.find(a => a.employeeId === e.employeeId)?.notUsedDays })),
        allDepartments,
        allEmployees,
        allTeams,
    });
}


export const breakTakenEmployees = async (req: Request, res: Response, next: NextFunction) => {
    const companyId = (req as any).user.companyId;

    try {
        // Check if the company exists
        const company = await prisma.company.findUnique({
            where: { companyId },
        });

        if (!company) {
            return next(customErrorHandler(res, "Invalid Company", 401));
        }

        // Get break session data grouped by employee ID
        const breakSessions = await prisma.breakSession.groupBy({
            by: ['employeeId'],
            where: {
                attendance: {
                    companyId,
                },
            },
            _count: {
                employeeId: true,
            },
            orderBy: {
                _count: {
                    employeeId: 'desc', // Order by the count of breaks
                },
            },
        });

        // Map employee IDs to their details
        const employeeIds = breakSessions.map(session => session.employeeId);
        const employeeDetails = await prisma.employee.findMany({
            where: { employeeId: { in: employeeIds } },
            include: {
                team: true,
                department: true,
            },
        });

        // Get break times and total break duration for each employee
        const response = await Promise.all(breakSessions.map(async session => {
            const employee = employeeDetails.find(emp => emp.employeeId === session.employeeId);

            // Fetch break times for this employee
            const breakTimesData = await prisma.breakSession.findMany({
                where: { employeeId: session.employeeId },
                select: {
                    breakIn: true,
                    breakOut: true,
                },
            });

            // Calculate total break duration
            const totalBreakDuration = breakTimesData.reduce((total, breakSession) => {
                if (breakSession.breakOut) {
                    const breakDuration = new Date(breakSession.breakOut).getTime() - new Date(breakSession.breakIn).getTime();
                    return total + breakDuration;
                }
                return total;
            }, 0);

            return {
                employeeId: session.employeeId,
                breakCount: session._count.employeeId,
                employeeName: employee ? employee.employeeName : '-',
                teamName: employee?.team ? employee.team.teamName : '-',
                departmentName: employee?.department ? employee.department.departmentName : '-',
                totalBreakDuration: totalBreakDuration / 60000, // Convert milliseconds to minutes
            };
        }));

        return res.status(200).json({
            message: "Employees with the most breaks retrieved successfully",
            data: response,
        });
    } catch (error) {
        console.error("Error retrieving break data:", error);
        return next(customErrorHandler(res, "Error retrieving break data", 500));
    }
};






// most break  taken employee list
// export const breakTakenEmployees = async (req: Request, res: Response, next: NextFunction) => {
//     const companyId = (req as any).user.companyId;

//     // Check if the company exists
//     const company = await prisma.company.findUnique({
//         where: {
//             companyId
//         },
//     });

//     if (!company) {
//         return next(customErrorHandler(res, "Invalid Company", 401));
//     }

//     // Get attendance data grouped by employee ID
//     const companyAttendance = await prisma.attendance.groupBy({
//         by: ['employeeId'],
//         where: {
//             companyId: companyId,
//             breakIn: {
//                 not: null
//             }
//         },
//         _count: {
//             breakIn: true,
//         },
//         orderBy: {
//             _count: {
//                 breakIn: 'desc' // Order by the count of breaks
//             }
//         }
//     });

//     // Map employee IDs to their details
//     const employeeIds = companyAttendance.map(att => att.employeeId);
//     const employeeDetails = await prisma.employee.findMany({
//         where: {
//             employeeId: {
//                 in: employeeIds
//             }
//         }
//     });

//     // Fetch team and department information
//     const teamIds = employeeDetails.map(emp => emp.teamId).filter((id): id is string => id !== null);
//     const departmentIds = employeeDetails.map(emp => emp.departmentId).filter((id): id is string => id !== null);

//     const teams = await prisma.team.findMany({
//         where: {
//             teamId: {
//                 in: teamIds
//             }
//         }
//     });

//     const departments = await prisma.department.findMany({
//         where: {
//             departmentId: {
//                 in: departmentIds
//             }
//         }
//     });

//     // Get break times and total break duration for each employee
//     const response = await Promise.all(companyAttendance.map(async att => {
//         const employee = employeeDetails.find(emp => emp.employeeId === att.employeeId);
//         const team = teams.find(t => t.teamId === employee?.teamId);
//         const department = departments.find(d => d.departmentId === employee?.departmentId);

//         // Fetch break times for this employee
//         const breakTimesData = await prisma.attendance.findMany({
//             where: {
//                 employeeId: att.employeeId,
//                 breakIn: {
//                     not: null
//                 }
//             },
//             select: {
//                 breakInMinutes: true,
//                 breakOut: true,
//             }
//         });

//         return {
//             employeeId: att.employeeId,
//             breakCount: att._count.breakIn,
//             employeeName: employee ? employee.employeeName : '-',
//             teamName: team ? team.teamName : '-',
//             departmentName: department ? department.departmentName : '-',
//         };
//     }));

//     return res.status(200).json({
//         message: "Employees with the most breaks retrieved successfully",
//         data: response,
//     });
// };




// BreakTakenEmployeesOnDate Controller


// export const breakTakenEmployeesOnDate = async (req: Request, res: Response, next: NextFunction) => {
//     const companyId = (req as any).user.companyId;
//     const { date } = req.query;

//     if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
//         return next({ message: "Date parameter is required and should be in YYYY-MM-DD format", status: 400 });
//     }

//     // Check if the company exists
//     const company = await prisma.company.findUnique({
//         where: {
//             companyId
//         },
//     });

//     if (!company) {
//         return next({ message: "Invalid Company", status: 401 });
//     }

//     // Get attendance data for the specified date, grouped by employeeId
//     const companyAttendance = await prisma.attendance.groupBy({
//         by: ['employeeId'],
//         where: {
//             companyId: companyId,
//             breakIn: {
//                 not: null
//             },
//             actualDate: date, // Filter by the specific date
//         },
//         _count: {
//             breakIn: true,
//         },
//         orderBy: {
//             _count: {
//                 breakIn: 'desc'
//             }
//         }
//     });

//     // Map employee IDs to their details
//     const employeeIds = companyAttendance.map(att => att.employeeId);
//     const employeeDetails = await prisma.employee.findMany({
//         where: {
//             employeeId: {
//                 in: employeeIds
//             }
//         }
//     });

//     // Fetch team and department information
//     const teamIds = employeeDetails.map(emp => emp.teamId).filter(id => id !== null);
//     const departmentIds = employeeDetails.map(emp => emp.departmentId).filter(id => id !== null);

//     const teams = await prisma.team.findMany({
//         where: {
//             teamId: {
//                 in: teamIds
//             }
//         }
//     });

//     const departments = await prisma.department.findMany({
//         where: {
//             departmentId: {
//                 in: departmentIds
//             }
//         }
//     });

//     // Get break times for each employee
//     const response = await Promise.all(companyAttendance.map(async att => {
//         const employee = employeeDetails.find(emp => emp.employeeId === att.employeeId);
//         const team = teams.find(t => t.teamId === employee?.teamId);
//         const department = departments.find(d => d.departmentId === employee?.departmentId);

//         return {
//             employeeId: att.employeeId,
//             breakCount: att._count.breakIn,
//             employeeName: employee ? employee.employeeName : '-',
//             teamName: team ? team.teamName : '-',
//             departmentName: department ? department.departmentName : '-',
//         };
//     }));

//     return res.status(200).json({
//         message: "Employees with the most breaks on the selected date retrieved successfully",
//         data: response,
//     });
// };


export const breakTakenEmployeesOnDate = async (req: Request, res: Response, next: NextFunction) => {
    const companyId = (req as any).user.companyId;
    const { date } = req.query;

    if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return next({ message: "Date parameter is required and should be in YYYY-MM-DD format", status: 400 });
    }

    try {
        // Check if the company exists
        const company = await prisma.company.findUnique({
            where: { companyId },
        });

        if (!company) {
            return next({ message: "Invalid Company", status: 401 });
        }

        // Get break session data for the specified date, grouped by employeeId
        const breakSessions = await prisma.breakSession.groupBy({
            by: ['employeeId'],
            where: {
                attendance: {
                    companyId,
                    actualDate: date, // Filter by the specific date
                },
            },
            _count: {
                employeeId: true,
            },
            orderBy: {
                _count: {
                    employeeId: 'desc', // Order by the count of breaks
                },
            },
        });

        // Map employee IDs to their details
        const employeeIds = breakSessions.map(session => session.employeeId);
        const employeeDetails = await prisma.employee.findMany({
            where: { employeeId: { in: employeeIds } },
            include: {
                team: true,
                department: true,
            },
        });

        // Get break times and total break duration for each employee
        const response = await Promise.all(breakSessions.map(async session => {
            const employee = employeeDetails.find(emp => emp.employeeId === session.employeeId);

            // Fetch break times for this employee
            const breakTimesData = await prisma.breakSession.findMany({
                where: { employeeId: session.employeeId, attendance: { actualDate: date } },
                select: {
                    breakIn: true,
                    breakOut: true,
                },
            });

            // Calculate total break duration
            const totalBreakDuration = breakTimesData.reduce((total, breakSession) => {
                if (breakSession.breakOut) {
                    const breakDuration = new Date(breakSession.breakOut).getTime() - new Date(breakSession.breakIn).getTime();
                    return total + breakDuration;
                }
                return total;
            }, 0);

            return {
                employeeId: session.employeeId,
                breakCount: session._count.employeeId,
                employeeName: employee ? employee.employeeName : '-',
                teamName: employee?.team ? employee.team.teamName : '-',
                departmentName: employee?.department ? employee.department.departmentName : '-',
                totalBreakDuration: totalBreakDuration / 60000, // Convert milliseconds to minutes
            };
        }));

        return res.status(200).json({
            message: "Employees with the most breaks on the selected date retrieved successfully",
            data: response,
        });
    } catch (error) {
        console.error("Error retrieving break data:", error);
        return next({ message: "Error retrieving break data", status: 500 });
    }
};




// export const breakTakenEmployeesInMonth = async (req: Request, res: Response, next: NextFunction) => {
//     const companyId = (req as any).user.companyId;
//     const { month } = req.query;

//     if (!month || typeof month !== 'string' || !/^\d{4}-\d{2}$/.test(month)) {
//         return next({ message: "Month parameter is required and should be in YYYY-MM format", status: 400 });
//     }

//     const [year, monthNumber] = month.split('-').map(Number);

//     // Check if the company exists
//     const company = await prisma.company.findUnique({
//         where: {
//             companyId
//         },
//     });

//     if (!company) {
//         return next({ message: "Invalid Company", status: 401 });
//     }

//     // Get the start and end of the selected month
//     const startOfMonth = new Date(year, monthNumber - 1, 1); // First day of the month
//     const endOfMonth = new Date(year, monthNumber, 0, 23, 59, 59, 999); // Last day of the month

//     // Get attendance data for the selected month, grouped by employeeId
//     const companyAttendance = await prisma.attendance.groupBy({
//         by: ['employeeId'],
//         where: {
//             companyId: companyId,
//             breakIn: {
//                 not: null
//             },
//             createdAt: {
//                 gte: startOfMonth,
//                 lt: endOfMonth,
//             }
//         },
//         _count: {
//             breakIn: true,
//         },
//         orderBy: {
//             _count: {
//                 breakIn: 'desc'
//             }
//         }
//     });

//     // Map employee IDs to their details
//     const employeeIds = companyAttendance.map(att => att.employeeId);
//     const employeeDetails = await prisma.employee.findMany({
//         where: {
//             employeeId: {
//                 in: employeeIds
//             }
//         }
//     });

//     // Fetch team and department information
//     const teamIds = employeeDetails.map(emp => emp.teamId).filter(id => id !== null);
//     const departmentIds = employeeDetails.map(emp => emp.departmentId).filter(id => id !== null);

//     const teams = await prisma.team.findMany({
//         where: {
//             teamId: {
//                 in: teamIds
//             }
//         }
//     });

//     const departments = await prisma.department.findMany({
//         where: {
//             departmentId: {
//                 in: departmentIds
//             }
//         }
//     });

//     // Get break times for each employee
//     const response = await Promise.all(companyAttendance.map(async att => {
//         const employee = employeeDetails.find(emp => emp.employeeId === att.employeeId);
//         const team = teams.find(t => t.teamId === employee?.teamId);
//         const department = departments.find(d => d.departmentId === employee?.departmentId);

//         return {
//             employeeId: att.employeeId,
//             breakCount: att._count.breakIn,
//             employeeName: employee ? employee.employeeName : '-',
//             teamName: team ? team.teamName : '-',
//             departmentName: department ? department.departmentName : '-',
//         };
//     }));

//     return res.status(200).json({
//         message: "Employees with the most breaks in the selected month retrieved successfully",
//         data: response,
//     });
// };


export const breakTakenEmployeesInMonth = async (req: Request, res: Response, next: NextFunction) => {
    const companyId = (req as any).user.companyId;
    const { month } = req.query;

    if (!month || typeof month !== 'string' || !/^\d{4}-\d{2}$/.test(month)) {
        return next({ message: "Month parameter is required and should be in YYYY-MM format", status: 400 });
    }

    const [year, monthNumber] = month.split('-').map(Number);

    try {
        // Check if the company exists
        const company = await prisma.company.findUnique({
            where: { companyId },
        });

        if (!company) {
            return next({ message: "Invalid Company", status: 401 });
        }

        // Get the start and end of the selected month
        const startOfMonth = new Date(year, monthNumber - 1, 1); // First day of the month
        const endOfMonth = new Date(year, monthNumber, 0, 23, 59, 59, 999); // Last day of the month

        // Get break session data for the selected month, grouped by employeeId
        const breakSessions = await prisma.breakSession.groupBy({
            by: ['employeeId'],
            where: {
                attendance: {
                    companyId,
                    createdAt: {
                        gte: startOfMonth,
                        lt: endOfMonth,
                    },
                },
            },
            _count: {
                employeeId: true,
            },
            orderBy: {
                _count: {
                    employeeId: 'desc', // Order by the count of breaks
                },
            },
        });

        // Map employee IDs to their details
        const employeeIds = breakSessions.map(session => session.employeeId);
        const employeeDetails = await prisma.employee.findMany({
            where: { employeeId: { in: employeeIds } },
            include: {
                team: true,
                department: true,
            },
        });

        // Get break times and total break duration for each employee
        const response = await Promise.all(breakSessions.map(async session => {
            const employee = employeeDetails.find(emp => emp.employeeId === session.employeeId);

            // Fetch break times for this employee
            const breakTimesData = await prisma.breakSession.findMany({
                where: { employeeId: session.employeeId, attendance: { createdAt: { gte: startOfMonth, lt: endOfMonth } } },
                select: {
                    breakIn: true,
                    breakOut: true,
                },
            });

            // Calculate total break duration
            const totalBreakDuration = breakTimesData.reduce((total, breakSession) => {
                if (breakSession.breakOut) {
                    const breakDuration = new Date(breakSession.breakOut).getTime() - new Date(breakSession.breakIn).getTime();
                    return total + breakDuration;
                }
                return total;
            }, 0);

            return {
                employeeId: session.employeeId,
                breakCount: session._count.employeeId,
                employeeName: employee ? employee.employeeName : '-',
                teamName: employee?.team ? employee.team.teamName : '-',
                departmentName: employee?.department ? employee.department.departmentName : '-',
                totalBreakDuration: totalBreakDuration / 60000, // Convert milliseconds to minutes
            };
        }));

        return res.status(200).json({
            message: "Employees with the most breaks in the selected month retrieved successfully",
            data: response,
        });
    } catch (error) {
        console.error("Error retrieving break data:", error);
        return next({ message: "Error retrieving break data", status: 500 });
    }
};











export const topUsedAppAnalysis = async (req: Request, res: Response, next: NextFunction) => {
    const companyId = (req as any).user.companyId;
    // Check if companyId is null or undefined
    if (!companyId) {
        return res.status(400).json({ error: "Company ID is required" });
    }
    const analysis = await prisma.app.groupBy({
        by: ['appName', 'employeeId'],
        where: {
            employeeId: {
                not: null,
            },
            companyId
        },
    });
    // Count unique employeeId per appName
    const uniqueCounts = analysis.reduce((acc, { appName, employeeId }) => {
        // Ensure both appName and employeeId are strings
        if (appName && employeeId) {
            acc[appName] = (acc[appName] || new Set()).add(employeeId);
        }
        return acc;
    }, {} as Record<string, Set<string>>);
    const cleanData = Object.entries(uniqueCounts).map(([appName, employeeSet]) => ({
        appName,
        noOfEmployee: employeeSet.size // Unique count of employees per app
    })).sort((a, b) => b.noOfEmployee - a.noOfEmployee).slice(0, 7); // Sort by count and limit to top 7
    return res.json(cleanData);
}



// work productivity analysis
export const sevenDaysWorkAnalysis = async (req: Request, res: Response, next: NextFunction) => {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const analysis = await prisma.app.groupBy({
        take: 7,
        by: ['appType'],
        where: {
            createdAt: {
                gte: sevenDaysAgo.toISOString(),
                lte: today.toISOString(),
            },
        },
        _count: {
            employeeId: true,
        },
        orderBy: {
            _count: {
                employeeId: 'desc',
            },
        },
    });
    const cleanData = analysis.map(data =>
    ({
        appType: data.appType,
        noOfEmployees: data._count.employeeId,
    })
    )
    return res.json(cleanData);
}

const getLastNDays = (n: number) => {
    const today = new Date();
    const dates = [];
    for (let i = n - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
};









// // work analysis of company
// export const workAnalysisOfCompany = async (req: Request, res: Response, next: NextFunction) => {
//     const companyId = (req as any).user.companyId;
//     const sevenDays = getLastNDays(7);
//     try {
//         // Aggregate counts for each date within the last 7 days
//         const analysis = await prisma.attendance.groupBy({
//             by: ['actualDate'],
//             where: {
//                 actualDate: {
//                     in: sevenDays // Ensure only the last 7 days are considered
//                 },
//                 companyId: companyId
//             },
//             _count: {
//                 overTime: true,
//                 earlyClockOut: true,
//                 breakIn: true
//             },
//             orderBy: {
//                 actualDate: 'desc'
//             }
//         });
//         // Create a map for quick lookup
//         const analysisMap = new Map(analysis.map(item => [item.actualDate, item]));
//         // Fill in missing dates with zero counts
//         const cleanedAnalysis = sevenDays.map(date => {
//             const data = analysisMap.get(date);
//             return {
//                 actualDate: date,
//                 dates_count: data ? (data._count.overTime + data._count.earlyClockOut + data._count.breakIn) : 0,
//                 overUtilized: data ? data._count.overTime : 0,
//                 lessUtilized: data ? data._count.earlyClockOut : 0,
//                 healthy: data ? data._count.breakIn : 0
//             };
//         });
//         // Send the cleaned data in the response
//         return res.json({
//             success: true,
//             data: cleanedAnalysis
//         });
//     } catch (error) {
//         console.error(error); // Log the error for debugging
//         return res.status(500).json({
//             success: false,
//             message: 'An error occurred while processing the data.'
//         });
//     }
// };




// work analysis of company
export const workAnalysisOfCompany = async (req: Request, res: Response, next: NextFunction) => {
    const companyId = (req as any).user.companyId;
    const sevenDays = getLastNDays(7);
    try {
        // Aggregate counts for each date within the last 7 days
        const analysis = await prisma.attendance.groupBy({
            by: ['actualDate'],
            where: {
                actualDate: {
                    in: sevenDays // Ensure only the last 7 days are considered
                },
                companyId: companyId
            },
            _count: {
                overTime: true,
                earlyClockOut: true,
            },
            orderBy: {
                actualDate: 'desc'
            }
        });

        // Get break session data for the last 7 days
        const breakSessions = await prisma.breakSession.groupBy({
            by: ['actualDate'],
            where: {
                actualDate: {
                    in: sevenDays // Ensure only the last 7 days are considered
                },
                attendance: {
                    companyId: companyId
                }
            },
            _count: {
                id: true,
            },
            orderBy: {
                actualDate: 'desc'
            }
        });

        // Create a map for quick lookup
        const analysisMap = new Map(analysis.map(item => [item.actualDate, item]));
        const breakSessionsMap = new Map(breakSessions.map(item => [item.actualDate, item]));

        // Fill in missing dates with zero counts
        const cleanedAnalysis = sevenDays.map(date => {
            const data = analysisMap.get(date);
            const breakData = breakSessionsMap.get(date);
            return {
                actualDate: date,
                dates_count: data ? (data._count.overTime + data._count.earlyClockOut + (breakData ? breakData._count.id : 0)) : 0,
                overUtilized: data ? data._count.overTime : 0,
                lessUtilized: data ? data._count.earlyClockOut : 0,
                healthy: breakData ? breakData._count.id : 0
            };
        });

        return res.json({
            success: true,
            data: cleanedAnalysis
        });
    } catch (error) {
        console.error(error); // Log the error for debugging
        return res.status(500).json({
            success: false,
            message: 'An error occurred while processing the data.'
        });
    }
};
