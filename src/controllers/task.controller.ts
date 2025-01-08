import { NextFunction, request, Request, response, Response } from "express";
import { customErrorHandler } from "../utils/customErrorHandler.js";
import prisma from "../models/index.js";
import { io, getReceiverSocketId } from "../socket/socket.js";
import schedule from "node-schedule";
import { deadlineEnded, deadLineReminder } from "../lib/mail.js";
import { TaskStatusType } from "@prisma/client";
export const assignTask = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { task_name, deadline } = req.body;
  console.log("🚀 ~ assignTask ~ deadlinmmnmne:", deadline);
  const taskReceiver = req.params.id;
  const taskAssigner = req.user?.companyId;
  if (!taskAssigner) {
    return res.json({ message: "You are not authorized" });
  }
  const localDate = new Date(deadline); // This assumes 'deadline' is in local time
  const utcFormattedDeadline = new Date(
    localDate.getTime() - localDate.getTimezoneOffset() * 60000
  ).toISOString();
  console.log("🚀 ~ utcFormattedDeadline:", utcFormattedDeadline);

  const company = await prisma.company.findFirst({
    where: {
      companyId: taskAssigner,
    },
  });
  const employee = await prisma.employee.findFirst({
    where: {
      employeeId: taskReceiver,
      companyId: taskAssigner,
    },
  });
  if (!employee) {
    return next(customErrorHandler(res, "Employee not found", 404));
  }
  if (!company) return next(customErrorHandler(res, "Company not found", 404));
  if (!task_name || !deadline) {
    return next(customErrorHandler(res, "Insert all the field", 401));
  }
  const addTask = await prisma.task.create({
    data: {
      task_name,
      deadline: utcFormattedDeadline,
      taskReceiver,
      taskAssigner,
    },
  });
  if (addTask) {
    const notify = await prisma.notification.create({
      data: {
        message: ` Hey ${employee.employeeName},New task has been assigned to you`,
        senderCompanyId: taskAssigner,
        receiverEmployeeId: taskReceiver,
        taskId: addTask.task_id,
      },
    });
    const receiverSocketId = getReceiverSocketId(taskReceiver);
    io.to(receiverSocketId).emit("task-notification", { notify });
  }
  return res.json({
    message: `Task assigned to employee ${employee.employeeName}`,
  });
};

export async function checkDeadline(employeeId: string, taskId: string) {
  // console.log('Check deadline initiated');
  const employee = await prisma.employee.findFirst({
    where: {
      employeeId: employeeId,
    },
  });
  if (!employee) {
    console.log("Employee not found");
    return;
  }
  // Outputs the local date and time as shown on your PC

  const tasks = await prisma.task.findFirst({
    where: {
      task_id: taskId,
      taskReceiver: employeeId,
    },
  });

  if (!tasks) {
    console.log("No task found for this employee");
    return;
  }

  const remain_time = tasks.deadline.getTime() - 24 * 60 * 60 * 1000;
  // // console.log("Calculated remain_time:", remain_time);
  // const formattedDeadline = new Date(tasks.deadline).toISOString();
  // console.log("🚀 ~ formattedDeadline:", formattedDeadline)
  if (tasks.deadline.getTime() <= Date.now()) {
    await prisma.task.update({
      where: {
        task_id: taskId,
      },
      data: {
        statusType: TaskStatusType.EXPIRED,
      },
    });
  }

  const company = await prisma.company.findFirst({
    where: {
      companyId: employee.companyId,
    },
  });

  if (tasks.statusType === TaskStatusType.EXPIRED) {
    schedule.scheduleJob(tasks.deadline.getTime(), async () => {
      console.log("Deadline ended");

      const sendNotification = await prisma.notification.create({
        data: {
          message: `Hey ${employee.employeeName}, I noticed that the deadline for ${tasks.task_name} has ended. If you need any support or additional resources to complete it, feel free to reach out!`,
          senderCompanyId: employee.companyId,
          receiverEmployeeId: employeeId,
        },
      });

      const receiverSocketId = getReceiverSocketId(employeeId);
      console.log("Socket ID for notification:", receiverSocketId);

      io.to(receiverSocketId).emit("task-notification", { sendNotification });
      console.log("Notification sent to:", receiverSocketId);

      await deadlineEnded({
        email: employee.email,
        subject: "Task deadline is Ended",
        employeeName: employee.employeeName,
        companyName: company?.companyName,
        task_name: tasks.task_name,
        deadline: tasks.deadline,
      });
    });
  }
  console.log("Scheduling job for:", remain_time);
  schedule.scheduleJob(remain_time, async () => {
    console.log("Scheduled job running");

    const notify = await prisma.notification.create({
      data: {
        message: `Hey ${employee.employeeName}, You just have 24 hours to submit the ${tasks.task_name} task`,
        senderCompanyId: employee.companyId,
        receiverEmployeeId: employeeId,
      },
    });

    const receiverSocketId = getReceiverSocketId(employeeId);
    console.log("Socket ID for notification:", receiverSocketId);

    io.to(receiverSocketId).emit("task-notification", { notify });
    console.log("Notification sent to:", receiverSocketId);

    await deadLineReminder({
      email: employee.email,
      subject: "Task deadline reminder",
      employeeName: employee.employeeName,
      task_name: tasks.task_name,
    });
  });
}

export const completeTask = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const employeeId = req.user?.employeeId;
  const { companyId } = req.params;
  const { taskId } = req.params;
  const company = await prisma.company.findFirst({
    where: {
      companyId: companyId,
    },
  });
  if (!company) {
    return customErrorHandler(res, "Company not found", 404);
  }

  const employee = await prisma.employee.findFirst({
    where: {
      employeeId: employeeId,
      companyId: companyId,
    },
  });

  if (!employee) {
    return customErrorHandler(res, "Employee not found", 404);
  }

  const tasks = await prisma.task.findFirst({
    where: {
      task_id: taskId,
      taskAssigner: companyId,
      taskReceiver: employeeId,
      statusType: "PENDING",
    },
  });

  if (!tasks) return customErrorHandler(res, "task not found", 404);

  await prisma.task.update({
    where: {
      task_id: taskId,
    },
    data: {
      statusType: "COMPLETED",
    },
  });
  const message = ` Hey ${company.companyName}, Employee ${employee.employeeName} completed ${tasks.task_name}`;

  const notify = await prisma.notification.create({
    data: {
      message: message,
      senderEmployeeId: employeeId,
      receiverCompanyId: companyId,
      taskId: taskId,
    },
  });
  const notifications = await prisma.notification.findMany({
    where: {
      receiverCompanyId: companyId,
    },
    include: {
      senderEmployee: true,
    },
  });
  console.log(notifications);
  const receiverSocketId = getReceiverSocketId(companyId);
  io.to(companyId).emit("complete-notification", { notify });
  console.log("emitted", receiverSocketId);
  // sendNotificationFromEmployeeToCompany(employeeId, companyId, message )
  return res.json({
    message: `Task completed by employee ${employee.employeeName}`,
  });
};

export const getUserTask = async (req: Request, res: Response) => {
  try {
    const employeeId = (req as any).user.employeeId;
    const employeeDetails = await prisma.employee.findFirst({
      where: {
        employeeId: employeeId,
      },
      include: {
        Task: true,
      },
    });
    return res.json({ data: employeeDetails });
  } catch (error) {
    console.log("🚀 ~ getUserTask ~ error:", error);
    return;
  }
};
