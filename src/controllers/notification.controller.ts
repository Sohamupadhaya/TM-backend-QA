import { NextFunction, Request, Response } from "express";
import { customErrorHandler } from "../utils/customErrorHandler.js";
import prisma from "../models/index.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

export const sendNotificationFromCompanyToEmployee = async (
  from: string,
  to: string,
  message: string,
  links?: string
) => {
  console.log(`Sending notification to ${to}:`, message);

  try {
    const data = await prisma.notification.create({
      data: {
        message,
        senderCompanyId: from,
        receiverEmployeeId: to,
        links,
      },
    });
    const receiverSocketId = getReceiverSocketId(to);
    console.log(
      "🚀 ~ sendNotificationFromCompanyToEmployee ~ receiverSocketId:",
      receiverSocketId
    );
    if (receiverSocketId) {
      console.log(`Emitting notification to socket ${receiverSocketId}`);
      io.to(receiverSocketId).emit("send-notification", { data });
      console.log(`Notification emitted successfully`);
    }
  } catch (error) {
    console.log(error);
  }
};

// send notification
export const sendNotificationFromEmployeeToCompany = async (
  from: string,
  to: string,
  message: string,
  links?: string
) => {
  try {
    const data = await prisma.notification.create({
      data: {
        message,
        senderEmployeeId: from,
        receiverCompanyId: to,
        links,
      },
    });
    const receiverSocketId = getReceiverSocketId("company_" + to);
    console.log(receiverSocketId, "RECEIVER SOCKET ID");
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("send-notification", {
        data,
      });
    }
  } catch (error) {
    console.log(error);
  }
};

// Get unread notification
export const getUnreadNotificationsOfCompany = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const companyId = (req as any).user.companyId;
  try {
    const unReadNotifications = await prisma.notification.findMany({
      where: {
        receiverCompanyId: companyId,
        isRead: false,
      },
      include: {
        senderEmployee: {
          select: {
            employeeName: true,
            position: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return res.json({
      unReadNotifications,
    });
  } catch (error) {
    console.log(error);
  }
};

export const getUnreadNotificationsCountOfCompany = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const companyId = (req as any).user.companyId;
  try {
    const unReadNotifications = await prisma.notification.count({
      where: {
        receiverCompanyId: companyId,
        isRead: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return res.json({
      unReadNotifications,
    });
  } catch (error) {
    console.log(error);
  }
};

export const getUnreadNotificationsOfEmployee = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const employeeId = (req as any).user.employeeId;
  try {
    const unReadNotifications = await prisma.notification.findMany({
      where: {
        receiverEmployeeId: employeeId,
        isRead: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return res.json({
      unReadNotifications,
    });
  } catch (error) {
    console.log(error);
  }
};

// notification count employee
export const getUnreadNotificationsCountOfEmployee = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const employeeId = (req as any).user.employeeId;
  try {
    const unReadNotifications = await prisma.notification.count({
      where: {
        receiverEmployeeId: employeeId,
        isRead: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return res.json({
      unReadNotifications,
    });
  } catch (error) {
    console.log(error);
  }
};

// mark as read notification
export const markAsReadNotification = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { notificationId } = req.params;
  try {
    const notification = await prisma.notification.update({
      where: {
        notificationId,
      },
      data: {
        isRead: true,
      },
    });
    return res.json({ message: "Notification marked as read", notification });
  } catch (error) {
    console.log(error);
  }
};

// export const sendNotificationToAdminAndEmployees = async (adminId: string, employeeIds: string[], message: string, links?: string) => {
//     try {
//         // Send notification to the admin
//         const adminNotification = await prisma.notification.create({
//             data: {
//                 message,
//                 senderEmployeeId: adminId, // Assuming the admin is considered as the sender
//                 receiverCompanyId: "admin", // or whatever identifier is used for admins
//                 links,
//             },
//         });

//         // Get the socket ID of the admin to send the notification in real-time
//         const adminSocketId = getReceiverSocketId("admin_" + adminId);
//         if (adminSocketId) {
//             io.to(adminSocketId).emit("send-notification", {
//                 data: adminNotification,
//             });
//         }

//         // Send notifications to targeted employees
//         for (const employeeId of employeeIds) {
//             const employeeNotification = await prisma.notification.create({
//                 data: {
//                     message,
//                     senderEmployeeId: adminId, // Again assuming the admin is the sender
//                     receiverEmployeeId: employeeId,
//                     links,
//                 },
//             });

//             // Get the socket ID of the employee to send the notification in real-time
//             const employeeSocketId = getReceiverSocketId(employeeId);
//             if (employeeSocketId) {
//                 io.to(employeeSocketId).emit("send-notification", {
//                     data: employeeNotification,
//                 });
//             }
//         }
//     } catch (error) {
//         console.error('Error sending notifications:', error);
//     }
// }

// Send notification from system/company to admin
export const sendNotificationToAdminAboutLateEmployee = async (
  companyId: string,
  employeeEmail: string,
  count: number
) => {
  try {
    const data = await prisma.notification.create({
      data: {
        message: `Employee ${employeeEmail} has been late ${count} times.`,
        senderCompanyId: companyId,
        receiverCompanyId: companyId,
        senderName: "Team Monitor",
      },
    });

    const receiverSocketId = getReceiverSocketId("company_" + companyId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("send-notification", { data });
    }
  } catch (error) {
    console.log("Error sending notification to admin:", error);
  }
};

export const sendNotificationToAdminAboutRiskUser = async (
  companyId: string,
  employeeName: string,
  employeeId: string
) => {
  try {
    const data = await prisma.notification.create({
      data: {
        message: `Employee ${employeeName} (ID: ${employeeId}) has been added to the risk user list.`,
        senderCompanyId: companyId,
        receiverCompanyId: companyId,
        senderName: "Risk Management System",
      },
    });

    const receiverSocketId = getReceiverSocketId("company_" + companyId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("send-notification", { data });
    }
  } catch (error) {
    console.log("Error sending notification about risk user:", error);
  }
};
