import { customErrorHandler } from "../utils/customErrorHandler.js";
import prisma from "../models/index.js";
import { NextFunction,Request,Response } from "express";
import { getReceiverSocketId, io } from "../socket/socket.js";
import { endOfMonth, startOfMonth } from "date-fns";
import { endOfDay } from "date-fns/fp";
import { generateAppHistoryPDF } from "../utils/generatePdf/AppHistoryPdf.js";
import { appHistortPdf } from "../lib/mail.js";

export const addUsedApp = async (req: any, res: any, next: any) => {
    const { appName, appUsedDuration } = req.body;
    const companyId = (req as any).user.companyId;
    const departmentId = (req as any).user?.departmentId;
    const employeeId = (req as any).user?.employeeId;
    const teamId = (req as any).user?.teamId;
    const currentDateAndTime = new Date();
    const day = currentDateAndTime.toISOString().split('T')[0]

    if (!req.file)
        return customErrorHandler(res, "App icon is required", 400);
        const filename = req.file.filename;

    // Check if required fields are provided
    if (!appName ) {
        return next(customErrorHandler(res, "Please provide all the information.", 401));
    }

    // If it's an employee request, validate appUsedDuration
    if (!companyId && !appUsedDuration) {
        return next(customErrorHandler(res, "appUsedDuration is required for employees.", 401));
    }

    // Check if the app already exists
    const usedApp = await prisma.app.findFirst({
        where: {
            appName,
            companyId
        }
    });

    if (usedApp) {
        return next(customErrorHandler(res, "App already exists.", 401));
    }

    let appReview = await prisma.appReview.findFirst({
        where:{
            appName,companyId
        }
    })

    if(!appReview){
        appReview = await prisma.appReview.create({
            data:{
                appName,
                appLogo:`uploads/appLogo/${filename}`,
                appReview: "NEUTRAL",
                companyId
            }
        })
    }
    // Create a new app entry
    const newUsedApp = await prisma.app.create({
        data: {
            appName,
            appLogo:`uploads/appLogo/${filename}`,
            appUsedDuration: appUsedDuration, 
            appType: appReview.appReview ,
            companyId,
            departmentId,
            teamId,
            employeeId,
            day
        }
    });

    return res.json({ message: "New used app added.", app: newUsedApp });
};
 


export const usedDesktopApp = async (req: Request, res: Response, next: NextFunction) => {
    const { appDurations } = req.body;
    console.log("🚀 ~ usedDesktopApp ~ appDurations:", appDurations)
    const companyId = (req as any).user.companyId;
    const departmentId = (req as any).user?.departmentId;
    const employeeId = (req as any).user?.employeeId;
    const teamId = (req as any).user?.teamId;
    const currentDateAndTime = new Date();
    const day = currentDateAndTime.toISOString().split('T')[0];

    if (!appDurations) {
        return next(customErrorHandler(res, "App durations are required", 401));
    }

    try {
        for (const [appName, appUsedDuration] of Object.entries(appDurations) as [string, number][]) {
            const filename = `${appName}.png`; 

            let appReview = await prisma.appReview.findFirst({
                where: {
                    appName,
                    companyId
                }
            });

            if (!appReview) {
                appReview = await prisma.appReview.create({
                    data: {
                        appName,
                        appLogo: `uploads/appLogo/${filename}`,
                        appReview: "NEUTRAL",
                        companyId
                    }
                });
            }

            const existingApp = await prisma.app.findFirst({
                where: {
                    appName,
                    day,
                    employeeId
                }
            });
            
            if (existingApp) {
                await prisma.app.update({
                       where: { appId: existingApp.appId },
                       data: {
                           appUsedDuration: (parseInt(existingApp?.appUsedDuration!) + appUsedDuration).toString()
                       }
                     });
                 
   
               } else {
               await prisma.app.create({
                       data: {
                           appName,
                           appLogo: `uploads/appLogo/${filename}`,
                           appUsedDuration: appUsedDuration.toString(),
                           appType: appReview.appReview,
                           companyId,
                           departmentId,
                           teamId,
                           employeeId,
                           day
                       }
                   });
                 }

                 const app = await prisma.app.findMany({
                    where:{
                        companyId
                    }
                 })
                 const receiver = getReceiverSocketId(companyId);
                 io.to(receiver).emit("get-used-apps", app);
        }

        res.status(201).json({ message: "App durations saved successfully" });
    } catch (error) {
        console.error("Error saving app durations:", error);
        next(customErrorHandler(res, "Failed to save app durations", 500));
    }
};


enum AppType{
    PRODUCTIVE = "PRODUCTIVE",
    UNPRODUCTIVE = "UNPRODUCTIVE",
    NEUTRAL = "NEUTRAL"
}

// add product and unproductive app by company
export const appProductAndUnproductiveAppByCompany = async (req: Request, res: Response, next: NextFunction) => {
    const {appName,appLogo, appReview, appWebsite}= req.body;
    const companyId = (req as any).user.companyId;

    const apps = await prisma.appReview.findFirst({
        where:{
            appName,
            companyId
        }
    })

    if(apps) return next(customErrorHandler(res,"Apps already in Reviewed section", 401))

    const productiveApps = await prisma.appReview.create({
        data:{
            appName,
            appLogo:appWebsite,
            companyId,
            appReview
        }
    })

    return res.json({
        productiveApps
    })

}


// update employee appType
export const updateAppType = async (req: any, res: any, next: any) => {
    const {  appType } = req.body; 
    const companyId = (req as any).user.companyId;
    const { appId } = req.params;

    const company = await prisma.app.findUnique({
        where: {
            companyId,
            appId
        },
    });

    if(!company) return next(customErrorHandler(res,"Cannot find app type",404))
    
    const updatedAppType = await prisma.app.update({
        where:{
            companyId,
            appId
        },
        data:{
            appType
        }
    })

    if(updatedAppType) {
        await prisma.appReview.update({
            where:{
                appName_companyId: {
                    appName: updatedAppType.appName,
                    companyId,
                },
            },
            data:{
                appReview:updatedAppType.appType
            }
        })
    } 

    return res.json({ message: `Successfully defined as ${updatedAppType.appType}`, app: updatedAppType });
};

// get Company App
export const getCompanyApp = async(req:any, res:any, next:any) => {
    const { companyId} =  (req as any).user;
    const allapp = await prisma.appReview.findMany({
        where:{
            companyId
        }
    })
    return res.json({allapp})
}

export const getAllAppHistory = async (req: Request, res: Response, next: NextFunction) => {
    const { companyId } = (req as any).user;
    const { employeeId } = req.params;

    const enployeeUsedApp = await prisma.app.findMany({
        where: {
            companyId,
            employeeId
        }
    })

    return res.json({enployeeUsedApp})
}

// get Employee used app in a day
export const getEmployeeUsedAppInADay = async (req: Request, res: Response, next: NextFunction) => {
    const { companyId } = (req as any).user;
    const { employeeId } = req.params;
    const { date } = req.query;

    // Ensure the date is a string
    
    const enployeeUsedApp = await prisma.app.findMany({
        where: {
            day: date?.toLocaleString(),
            companyId,
            employeeId
        }
    });

    return res.json({
        enployeeUsedApp
    });
};

// get Employee used app in a day
export const getEmployeeUsedAppInAMonth = async (req: Request, res: Response, next: NextFunction) => {
    const { companyId } = (req as any).user;
    const { employeeId } = req.params;
    const { month } = req.query;

    if (!month || typeof month !== 'string' || !/^\d{4}-\d{2}$/.test(month)) {
        return next({ message: "Month parameter is required and should be in YYYY-MM format", status: 400 });
    }

    const [year, monthNumber] = month.split('-').map(Number);

    // Get the start and end of the selected month
    const startOfMonth = new Date(year, monthNumber - 1, 1);
    const endOfMonth = new Date(year, monthNumber, 0, 23, 59, 59, 999);

    const employeeUsedAppsOfMonth = await prisma.app.findMany({
        where: {
            companyId,
            employeeId,
            createdAt: {
                gte: startOfMonth,
                lt: endOfMonth
            }
        }
    });

    return res.json({
        employeeUsedAppsOfMonth
    });
};


// update app review
export const updateAppReview =  async(req:Request, res:Response, next:NextFunction) => {
    const {companyId} =  (req as any).user;
    const {appName,appReview} = req.body
    const updatedReview = await prisma.appReview.update({
        where:{
            appName_companyId: {
                appName,
                companyId,
            },
        },
        data:{
            appReview
        }
    })
    return res.json({
        message:"App review Updated"
    })
}


// Reviewed apps fo company
export const reviewedAppsForCompany = async(req:Request,res:Response,next:NextFunction)=>{
    const {companyId} = (req as any).user;
    const reviewedApps = await prisma.appReview.findMany({
        where:{
            companyId,
            appReview: { not: "NEUTRAL" }
        }
    })
    return res.json({reviewedApps})
}


// productive apps used in a day
export const productiveAppsForUser = async(req:Request,res:Response,next:NextFunction)=>{
    console.log("Heating")
    const {companyId, employeeId} = (req as any).user;
    const currentDateAndTime = new Date();
    const day = currentDateAndTime.toISOString().split('T')[0]
    console.log("Query Parameters: ", { companyId, employeeId, day });

    const productiveAppsForCompany = await prisma.appReview.findMany({
        where:{
            companyId
        }
    })

    console.log("Productive Apps for Company: ", productiveAppsForCompany);

    const appsUsedByEmployee = await prisma.app.findMany({
        where: {
            employeeId,
            companyId,
            day
        }
    });


    const productiveAppIds = new Set(
        productiveAppsForCompany
            .filter(app => app.appReview == "PRODUCTIVE")
            .map(app => app.appName)
    );

    // Calculate the total number of apps used by the employee
    const totalAppsUsed = appsUsedByEmployee.length;

    // Calculate the number of productive apps used by the employee
    const productiveAppsUsed = appsUsedByEmployee.filter(app => productiveAppIds.has(app.appName)).length;

    // Calculate the percentage of productive apps used
    const productiveAppsPercentage = totalAppsUsed > 0 ? (productiveAppsUsed / totalAppsUsed) * 100 : 0;

    // Respond with the result
    res.json({
        productiveAppsPercentage,
        totalAppsUsed,
        productiveAppsUsed
    });

}

// export const getEmployeeAppUsgeOfSpecificDate = async (req: Request, res: Response, next: NextFunction) => {
//     try {
//         // Retrieve companyId from the authenticated user
//         const { companyId } = (req as any).user; 
//         const { date } = req.params; // Retrieve date from params
//         const { employeeId } = req.query; // Get employeeId from request body

//         console.log(date, "date");
//         console.log(employeeId, "employeeId");
//         console.log(companyId, "companyId");

//         // Check if date is a string and is not empty
//         if (typeof date !== 'string' || !date) {
//             return res.status(400).json({ error: 'Invalid date parameter' });
//         }

//         const parsedDate = new Date(date); // Parse the date

//         // Check if the parsed date is valid
//         if (isNaN(parsedDate.getTime())) {
//             return res.status(400).json({ error: 'Invalid date format' });
//         }

//         // Set the start and end of the day for the query
//         const startOfDay = new Date(parsedDate);
//         startOfDay.setUTCHours(0, 0, 0, 0); // Start of the day
//         const endOfDay = new Date(parsedDate);
//         endOfDay.setUTCHours(23, 59, 59, 999); // End of the day

//         // Query the database for the specific employee's app usage on the specified date
//         const appUsage = await prisma.app.findMany({
//             where: {
//                 employeeId: employeeId, // Ensure you're filtering by the correct employee
//                 createdAt: {
//                     gte: startOfDay,
//                     lte: endOfDay,
//                 },
//                 companyId: companyId // Ensure the records are for the correct company
//             },
//             include: {
//                 employee: {
//                     select: {
//                         employeeName: true
//                     }
//                 },
//             }
//         });

//         // Return the retrieved app usage data
//         res.json(appUsage);
//     } catch (error) {
//         next(error); // Pass errors to the next middleware
//     }
// };



export const getEmployeeAppUsageOfSpecificDate = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { companyId } = (req as any).user; // Retrieve companyId from the authenticated user
        const { date } = req.params; // Retrieve date from params
        let { employeeId } = req.query; // Get employeeId from query params

        // Ensure employeeId is a string if it's provided
        if (Array.isArray(employeeId)) {
            employeeId = employeeId[0]; // If it's an array, use the first element
        }

        if (typeof employeeId !== 'string') {
            return res.status(400).json({ error: 'Invalid employeeId parameter' });
        }

        console.log(date, "date");
        console.log(employeeId, "employeeId");
        console.log(companyId, "companyId");

        // Check if date is a string and is not empty
        if (typeof date !== 'string' || !date) {
            return res.status(400).json({ error: 'Invalid date parameter' });
        }

        const parsedDate = new Date(date); // Parse the date

        // Check if the parsed date is valid
        if (isNaN(parsedDate.getTime())) {
            return res.status(400).json({ error: 'Invalid date format' });
        }

        // Set the start and end of the day for the query
        const startOfDay = new Date(parsedDate);
        startOfDay.setUTCHours(0, 0, 0, 0); // Start of the day
        const endOfDay = new Date(parsedDate);
        endOfDay.setUTCHours(23, 59, 59, 999); // End of the day

          // Handle cases where employeeId could be an array or undefined
        if (Array.isArray(employeeId)) {
            return res.status(400).json({ error: 'Multiple employeeIds not supported' });
        }
        if (typeof employeeId !== 'string') {
            return res.status(400).json({ error: 'Invalid employeeId parameter' });
        }

        // Query the database for the specific employee's app usage on the specified date
        const appUsage = await prisma.app.findMany({
            where: {
                employeeId: employeeId,
                createdAt: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
                companyId: companyId // Ensure the records are for the correct company
            },
            include: {
                employee: {
                    select: {
                        employeeName: true
                    }
                },
            }
        });

        // Return the retrieved app usage data
        res.json(appUsage);
    } catch (error) {
        next(error); // Pass errors to the next middleware
    }
};


export const sendAppInMail = async (req: Request, res: Response, next: NextFunction) => {
    const companyId = (req as any).user.companyId;
    const { employeeId } = req.params;
    const { date, month } = req.body; 

    // Validate month parameter
    if (month && (typeof month !== 'string' || !/^\d{4}-\d{2}$/.test(month))) {
        return next({ message: "Month parameter should be in YYYY-MM format", status: 400 });
    }

    let startOfMonth: Date | undefined;
    let endOfMonth: Date | undefined;

    if (month) {
        const [year, monthNumber] = month.split('-').map(Number);
        // Get the start and end of the selected month
        startOfMonth = new Date(year, monthNumber - 1, 1);
        endOfMonth = new Date(year, monthNumber, 0, 23, 59, 59, 999);
    }

    let employeeUsedApp;

    try {
        if (date && date.trim() !== '') { 
            // Condition 1: By Date
            employeeUsedApp = await prisma.app.findMany({
                where: {
                    day: date,
                    companyId,
                    employeeId
                },
                include: {
                    employee: {
                        select: {
                            employeeName: true,
                            employeeCode: true
                        }
                    }
                }
            });
        } else if (month) {
            // Condition 2: By Month
            employeeUsedApp = await prisma.app.findMany({
                where: {
                    companyId,
                    employeeId,
                    createdAt: {
                        gte: startOfMonth,
                        lt: endOfMonth
                    }
                },
                include: {
                    employee: {
                        select: {
                            employeeCode: true,
                            employeeName: true
                        }
                    }
                }
            });
        } else {
            // Condition 3: All Data
            employeeUsedApp = await prisma.app.findMany({
                where: {
                    companyId,
                    employeeId
                },
                include: {
                    employee: {
                        select: {
                            employeeCode: true,
                            employeeName: true
                        }
                    }
                }
            });
        }
    } catch (error) {
        return next({ message: "Error fetching app usage data", status: 500 });
    }

    // Check if employeeUsedApp is valid
    if (!Array.isArray(employeeUsedApp) || employeeUsedApp.length === 0) {
        return next({ message: "No app usage data found", status: 404 });
    }

    let pdfBuffer;

    try {
        // Ensure date and month are strings before passing them to the PDF generator
        pdfBuffer = await generateAppHistoryPDF(employeeUsedApp, date as string | undefined, month as string | undefined);
    } catch (error) {
        console.error("PDF Generation Error:", error);
        return next({ message: "Error generating PDF", status: 500 });
    }

    // Send email with PDF attachment
    try {
        await appHistortPdf({
            email: (req as any).user.companyEmail,
            companyName: (req as any).user.companyName,
            subject: "App history",
            attachment: pdfBuffer,
        });
        res.status(200).json({ message: "Email sent successfully" });
    } catch (error) {
        return next({ message: "Error sending email", status: 500 });
    }
};