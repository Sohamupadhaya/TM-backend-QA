import { customErrorHandler } from "../utils/customErrorHandler.js";
import prisma from "../models/index.js";
import { sendNotificationFromCompanyToEmployee, sendNotificationFromEmployeeToCompany } from "./notification.controller.js";
import { NextFunction,Request,Response } from "express";
import puppeteer from 'puppeteer';
import { leaveSummaryPdf } from "../lib/mail.js";
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { generateLeavePDF } from "../utils/generatePdf/leavePdf.js";


// Apply for Leave
export const applyLeave = async (req: Request, res: Response, next: NextFunction) => {
    const employeeId = (req as any).user.employeeId;
    const companyId = (req as any).user.companyId;
    const departmentId = (req as any).user?.departmentId;
    const currentDate = new Date();
    const teamId = (req as any).user?.teamId;
    const { 
        leaveType, 
        reason, 
        noOfDays, 
        leaveSession, 
        leaveFrom, 
        leaveTo,
        halfDayType, 
        fromTime,     
        toTime       
    } = req.body;
    console.log(currentDate, "date")

    if (!leaveFrom || !leaveTo || !leaveSession || !noOfDays || !reason || !leaveType || !employeeId || !companyId) {
        return next(customErrorHandler(res, "Please provide all the information.", 401));
    }

    // Additional validation for half day and hourly leave
    if (leaveSession === 'HALFDAY' && !halfDayType) {
        return next(customErrorHandler(res, "Please specify half day type.", 401));
    }

    if (leaveSession === 'HOURLYLEAVE' && (!fromTime || !toTime)) {
        return next(customErrorHandler(res, "Please specify time range for hourly leave.", 401));
    }

    if (leaveFrom < currentDate){
        return next(customErrorHandler(res, "Insert valid date.", 401));
    }

    if (leaveTo < currentDate){
        return next(customErrorHandler(res, "Insert valid date.", 401));
    }

    if (leaveFrom > leaveTo){
        return next(customErrorHandler(res, "Insert valid leave taking date.", 401));
    }

    const checkExistingLeave = await prisma.leave.findFirst({
        where:{
            employeeId:employeeId,
            leaveFrom:leaveFrom,
            companyId: companyId
        }
    })

    if (checkExistingLeave){
        return next(customErrorHandler(res, "Leave already taken on this time period.", 401))
    }

    const employee: any = await prisma.employee.findUnique({
        where: {
            employeeId,
            companyId
        }
    });

    if (!employee) {
        return next(customErrorHandler(res, "Invalid User", 401));
    }

    const newLeave = await prisma.leave.create({
        data: {
            leaveType,
            reason,
            noOfDays,
            leaveSession,
            leaveFrom: new Date(leaveFrom),
            leaveTo: new Date(leaveTo),
            halfDayType: leaveSession === 'HALFDAY' ? halfDayType : null,
            fromTime: leaveSession === 'HOURLYLEAVE' ? fromTime : null,
            toTime: leaveSession === 'HOURLYLEAVE' ? toTime : null,
            employeeId,
            companyId,
            departmentId,
            teamId
        }
    });

    sendNotificationFromEmployeeToCompany(employeeId, companyId, reason, `/leave-request/${newLeave.leaveId}`);

    return res.json({ message: "Leave requested successfully.", leave: newLeave });
};

// display leave request of employee
export const displayLeaveRequestOfEmployee = async( req: Request, res: Response, next: NextFunction)=>{
    const companyId = (req as any ).user.companyId;
    const { leaveId } = req.params;

    const leave = await prisma.leave.findFirst({
        where:{
            leaveId,
            companyId
        },
        include:{
            employee:{
                select:{
                    employeeName:true,
                    email:true,
                    phoneNumber:true,
                    employeeAddress:true,
                    position:true,
                }
            },
            department:{
                select:{
                    departmentName:true
                }
            },
            team:{
                select:{
                    teamName:true
                }
            }
        }
    })
    if (!leave) {
       return next(customErrorHandler(res,"Leave not found",404))
    }

    return res.json(leave)

}

//Delete Applyed Leave befor being approve or reject
export const deleteleave = async (req:any, res:any, next:any ) => {

    // const { employeeId} = req.body;
    const employeeId = (req as any).user.employeeId;
    const {leaveId} = req.params;
    const companyId = (req as any).user.companyId;

    const leave = await prisma.leave.findFirst({
        where:{
            leaveId
        }
    })
    if(leave?.leaveStatus == "PENDING" ){
        const deleteLeave = await prisma.leave.delete({
            where:{
                employeeId, leaveId, companyId
            },
        });
        if (deleteLeave) {
            return res.status(200).json({message: "Leave Deleted", deleteLeave});
        }
    }
    return next(customErrorHandler(res,"Can not Delete Leave 😔", 400))

}

enum LeaveStatus {
    PENDING = 'PENDING',
    APPROVE = 'APPROVE',
    DECLINED = 'DECLINED',
}

// Update Leave status of employees
export const leaveStatusUpadate = async (req:any, res:any, next:any) => {
    const {leaveId} = req.params;
    const {leaveStatus, actionReason, employeeId} = req.body;
    const companyId = (req as any).user.companyId;
    
    if(!leaveStatus ) {
        return next(customErrorHandler(res, "Please provide all the required details.", 401))
    }

   
    let statusText = LeaveStatus.PENDING;

    if (leaveStatus === "APPROVE") {
        statusText = LeaveStatus.APPROVE
        sendNotificationFromCompanyToEmployee(companyId,employeeId,"Your Leave has been approved")
    }
    else if (leaveStatus === "DECLINED"){
        statusText = LeaveStatus.DECLINED
        sendNotificationFromCompanyToEmployee(companyId,employeeId,"Your Leave has been declined")

    }
    else{
        statusText = LeaveStatus.PENDING
        sendNotificationFromCompanyToEmployee(companyId,employeeId,"Your Leave is on pending")

    }

    const statusUpdate = await prisma.leave.update({
        where: {
            employeeId, companyId, leaveId
        },
        data: {
            leaveStatus : statusText,
            actionReason : actionReason,
        }
    })

    return res.json({message:"Leave requested successfully.", leave:statusUpdate});
}

export const getallleave = async (req: any, res: any, next: any) => {
    const companyId = (req as any).user.companyId;

    // Get the start and end dates for the current month and the previous month
    const currentDate = new Date();
    const startDateCurrentMonth = startOfMonth(currentDate);
    const endDateCurrentMonth = endOfMonth(currentDate);
    const startDateLastMonth = startOfMonth(subMonths(currentDate, 1));
    const endDateLastMonth = endOfMonth(subMonths(currentDate, 1));

    const allLeave = await prisma.leave.findMany({
        where: {
            companyId,
            OR: [
                {
                    leaveFrom: {
                        gte: startDateCurrentMonth,
                        lte: endDateCurrentMonth,
                    },
                },
                {
                    leaveFrom: {
                        gte: startDateLastMonth,
                        lte: endDateLastMonth,
                    },
                },
            ],
        },
        include: {
            employee: {
                select: {
                    employeeCode: true,
                    employeeName: true,
                    position: {
                        include: {
                            role: {
                                select: {
                                    roleName: true,
                                },
                            },
                        },
                    },
                },
            },
            department: {
                select: {
                    departmentName: true,
                },
            },
        },
    });

    return res.json({ allLeave });
};

// display leave status of employee
export const displayLeaveStatusOfEmployee = async (req:any, res:any, next:any) => {
    const {companyId, employeeId} = (req as any).user;

    const leavestatus = await prisma.leave.findMany({
        where:{
            companyId,
            employeeId
        },
        orderBy:{
            createdAt:"desc"
        }

    })
    return res.json({leavestatus})
}

export const getEmployeAllLeave = async (req:any, res:any, next:any) => {
    const companyId = (req as any).user.companyId;
    const employeeId = req.params.employeeId;
    const allLeave = await prisma.leave.findMany({
        where:{
            companyId, employeeId
        },
        include: {
            employee:{
              select: {
                employeeName: true,
                position: {
                    include: {
                        role: {
                            select:{
                                roleName: true
                            }
                        },
                    },
                },
              }
            },
            department:{
                select: {
                    departmentName: true
                }
            },
            team: {
                select:{
                    teamName: true
                }
            }
        }
    });
    return res.json({allLeave});
}

export const reconsiderLeave = async (req: Request, res: Response, next: NextFunction) => {
    const companyId = (req as any).user.companyId;
    const leaveId = req.params.leaveId;
    const { reconsiderationReason } = req.body;

    const checkLeave = await prisma.leave.findFirst({
        where:{
            companyId, leaveId
        }
    })

    if (!checkLeave) {
        return res.status(404).json({message: "Leave not found"});
    }

    const employeeId = checkLeave.employeeId;
    console.log(employeeId, "emp")

    let statusText = LeaveStatus.PENDING;

    const applyAgain = await prisma.leave.update({
        where:{
            leaveId, companyId, employeeId
        },
        data: {
            leaveStatus : statusText,
            reconsiderationReason : reconsiderationReason,
        }
    })

    sendNotificationFromEmployeeToCompany(employeeId, companyId, reconsiderationReason, `/leave-request/${applyAgain.leaveId}`);

    return res.json({applyAgain});
}

export const sendLeavePDF = async (req: Request, res: Response, next: NextFunction): Promise<Response> => {
    const companyId = (req as any).user.companyId;
    const companyName = (req as any).user.companyName;
    const companyEmail = (req as any).user.companyEmail;
    const { employeeId } = req.params;

    // Fetching leave data based on the employeeId and companyId
    const leaveData = employeeId 
        ? await prisma.leave.findMany({
            where: { companyId, employeeId },
            take: 100,
            include: {
                employee: {
                    select: {
                        employeeCode: true,
                        employeeName: true
                    }
                }
            }
        })
        : await prisma.leave.findMany({
            where: { companyId },
            take: 100,
            include: {
                employee: {
                    select: {
                        employeeCode: true,
                        employeeName: true
                    }
                }
            }
        });
        
    if (!leaveData.length) {
        return res.status(404).send('No leave data found.');
    }

    // Define custom styles
    const customStyles = `
        h1 { color: #4CAF50; }
        table { border: 2px solid #4CAF50; }
        th { background-color: #4CAF50; color: white; }
        td { color: #333; }
    `;

    // Determine if employee ID exists for the PDF generation
    const hasEmployeeId = !!employeeId;

    // Generate PDF from leave data with custom styles
    const pdfBuffer = await generateLeavePDF(leaveData, customStyles, hasEmployeeId);

    await leaveSummaryPdf({
        email: companyEmail,
        companyName: companyName,
        subject: "Leave Report",
        attachment: pdfBuffer,
    });

    return res.status(200).send(leaveData);
};