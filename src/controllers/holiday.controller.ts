import { customErrorHandler } from "../utils/customErrorHandler.js";
import prisma from "../models/index.js";
import { NextFunction, Request, Response } from "express";

export const addHoliday = async (req: any, res: any, next: any) => {
    const companyId = (req as any).user.companyId;
    const { holidayTitle, holidayType, fromDate, toDate, holidaySession, fromTime, toTime, halfSelection } = req.body; 

    // Validate required fields
    if (!holidayTitle || !fromDate || !toDate || !holidaySession || !companyId) {
        return next(customErrorHandler(res, "Please provide all the information.", 401));
    }

    // Validate halfSelection for half-day leaves
    if (holidaySession === 'HALF' && !halfSelection) {
        return next(customErrorHandler(res, "Please provide half selection (FIRST or SECOND).", 401));
    }
    
    // Check that halfSelection is valid
    if (holidaySession === 'HALF' && !['FIRST', 'SECOND'].includes(halfSelection)) {
        return next(customErrorHandler(res, "Half selection must be either 'FIRST' or 'SECOND'.", 400));
    }

    // Check for hourly leave requirements
    if (holidaySession === 'HOURLY' && (!fromTime || !toTime)) {
        return next(customErrorHandler(res, "Please provide fromTime and toTime for hourly leaves", 401));
    }

    const company: any = await prisma.company.findUnique({
        where: { companyId },
    });

    if (!company) {
        return next(customErrorHandler(res, "Invalid Company", 401));
    }

    // Validate time range for hourly sessions
    if (holidaySession === 'HOURLY') {
        const [fromHour, fromMinute] = fromTime.split(':').map(Number);
        const [toHour, toMinute] = toTime.split(':').map(Number);
        
        const fromMinutes = fromHour * 60 + fromMinute;
        const toMinutes = toHour * 60 + toMinute;
        
        if (toMinutes <= fromMinutes) {
            return next(customErrorHandler(res, "End time must be greater than start time.", 400));
        }
    } else {
        // Validate date range for non-hourly sessions
        if (new Date(toDate) < new Date(fromDate)) {
            return next(customErrorHandler(res, "To date must be greater than from date.", 400));
        }
    }

    // Check for existing holidays
    const existingHoliday = await prisma.holiday.findFirst({
        where: {
            OR: [
                { holidayTitle, fromDate, toDate },
            ],
        },
    });

    if (existingHoliday) {
        return next(customErrorHandler(res, "Holiday Title and date range already exist.", 401));
    }

    // Create new holiday record
    const newHoliday: any = await prisma.holiday.create({
        data: {
            holidayTitle,
            holidayType,
            holidaySession,
            halfSelection, 
            fromDate: new Date(fromDate),
            toDate: new Date(toDate),
            fromTime: holidaySession === 'HOURLY' ? fromTime : null,
            toTime: holidaySession === 'HOURLY' ? toTime : null,     
            companyId
        },
    });

    return res.json({ message: "Holiday successfully added ✨", holiday: newHoliday });
}


export const editHoliday = async (req: any, res: any, next: any) => {
    const companyId = (req as any).user.companyId;
    const { holidayId } = req.params;
    const { holidayTitle, holidayType, holidaySession, fromDate, toDate, fromTime, toTime, halfSelection } = req.body;

    // Validate required fields
    if (!holidayId || !holidayTitle || !holidaySession || !fromDate || !toDate || !companyId) {
        return next(customErrorHandler(res, "Please provide all the information", 401));
    }

    // Validate halfSelection for half-day leaves
    if (holidaySession === 'HALF') {
        if (!halfSelection) {
            return next(customErrorHandler(res, "Please provide half selection (FIRST or SECOND).", 401));
        }
        if (!['FIRST', 'SECOND'].includes(halfSelection)) {
            return next(customErrorHandler(res, "Half selection must be either 'FIRST' or 'SECOND'.", 400));
        }
    }

    // Check for hourly leave requirements
    if (holidaySession === 'HOURLY' && (!fromTime || !toTime)) {
        return next(customErrorHandler(res, "Please provide fromTime and toTime for hourly leaves", 401));
    }

    const company = await prisma.company.findUnique({
        where: { companyId }
    });

    if (!company) {
        return next(customErrorHandler(res, "Invalid User", 401));
    }

    // Date and time validation based on session type
    if (holidaySession === 'HOURLY') {
        // Convert dates to local time to avoid timezone issues
        const fromDateTime = new Date(fromDate);
        const toDateTime = new Date(toDate);

        // Compare dates first
        if (fromDateTime.getTime() !== toDateTime.getTime()) {
            return next(customErrorHandler(res, "For hourly holidays, from date and to date must be the same", 400));
        }

        // Parse and compare times
        const [fromHour, fromMinute] = fromTime.split(':').map(Number);
        const [toHour, toMinute] = toTime.split(':').map(Number);

        const fromTimeInMinutes = (fromHour * 60) + fromMinute;
        const toTimeInMinutes = (toHour * 60) + toMinute;

        if (fromTimeInMinutes >= toTimeInMinutes) {
            return next(customErrorHandler(res, "End time must be greater than start time", 400));
        }
    } else {
        // For non-hourly holidays, just compare dates
        if (new Date(toDate) < new Date(fromDate)) {
            return next(customErrorHandler(res, "To date must be greater than from date.", 400));
        }
    }

    // Check for existing holidays
    const existingHoliday = await prisma.holiday.findFirst({
        where: {
            holidayId: { not: holidayId },
            OR: [{ holidayTitle, fromDate, toDate }],
        },
    });

    if (existingHoliday) {
        return next(customErrorHandler(res, "Holiday Title and date range already exist.", 401));
    }

    // Update holiday
    const updatedHoliday = await prisma.holiday.update({
        where: { holidayId },
        data: {
            holidayTitle,
            holidaySession,
            holidayType,
            halfSelection,
            fromDate: new Date(fromDate),
            toDate: new Date(toDate),
            fromTime: holidaySession === 'HOURLY' ? fromTime : null,
            toTime: holidaySession === 'HOURLY' ? toTime : null,    
        }
    });

    return res.json({ 
        message: "Holiday successfully updated ✨", 
        holiday: updatedHoliday 
    });
};



export const deleteHoliday = async (req: any, res: any, next: any) => {
    const companyId = (req as any).user.companyId;
    const { holidayId } = req.params;

    const holiday = await prisma.holiday.delete({
        where: {
            holidayId,
            companyId
        },
    });

    return res.json({ message: `${holiday.holidayTitle} successfully deleted.` });
}

export const getallHoliday = async (req: any, res: any, next: any) => {
    const companyId = (req as any).user.companyId;
    const allHolidays = await prisma.holiday.findMany({
        where: {
            companyId
        }
    });
    return res.json({ allHolidays });
}

export const getUpcomingHolidays = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const companyId = (req as any).user.companyId; // Consider using a more strongly typed approach if possible

        const upcomingHolidays = await prisma.holiday.findMany({
            where: {
              companyId,
              fromDate: {
                gte: new Date(), // Filter holidays with fromDate greater than or equal to the current date
              },
            },
            orderBy: {
              fromDate: 'asc', // Order by fromDate to get upcoming holidays
            },
        });

        return res.status(200).json({ upcomingHolidays });
    } catch (error) {
        console.error("Error fetching upcoming holidays:", error);
        return res.status(500).json({ message: "An error occurred while fetching upcoming holidays." });
    }
};

export const getholidaybyId = async (req: any, res: any, next: any) => {
    const { holidayId } = req.params;
    const companyId = (req as any).user.companyId;
    const holiday = await prisma.holiday.findUnique({
        where: {
            holidayId,
            companyId
        }
    });

    if (!holiday) {
        return next(customErrorHandler(res, "Holiday not found.", 401));
    }
    return res.json({ holiday });
}

function getStartOfDay(date: Date): Date {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    return startOfDay;
}

export const displayHolidayOfCompany = async (req: Request, res: Response, next: NextFunction) => {
    const { companyId } = (req as any).user;
    const currentDate = getStartOfDay(new Date());
    const fiveDaysLater = getStartOfDay(new Date());
    fiveDaysLater.setDate(currentDate.getDate() + 5);

    const holidaysOfCompany = await prisma.holiday.findMany({
        where: {
            companyId: companyId,
            toDate: {
                gte: currentDate,
                lte: fiveDaysLater
            }
        },
        orderBy: {
            fromDate: "asc"
        }
    });
    return res.json({ holidaysOfCompany });
}
