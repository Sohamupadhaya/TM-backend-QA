import { Server } from "socket.io";
import http from "http";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { checkDeadline } from "../controllers/task.controller.js";
import prisma from "../models/index.js";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "https://overview-discretion-arabia-billy.trycloudflare.com",
      "http://192.168.1.91:3000",
      "http://localhost:5173",
      "http://localhost:5000",
      "*",
    ],
    methods: ["GET", "POST"],
  },
});

const userSocketMap: { [key: string]: string } = {};
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getReceiverSocketId = (receiverId: string) => {
  console.log(receiverId, "SUS");
  return userSocketMap[receiverId];
};

console.log(userSocketMap, "SUSf");

io.on("connection", (socket) => {
  console.log("a user connected", socket.id);

  const userId = socket.handshake.query.userId as string;
  userSocketMap[userId] = socket.id;
  socket.join(userId);

  socket.on("start-stream", (data) => {
    console.log("Streming started for: ", data);
    socket.broadcast.emit("stream", data);
  });

  socket.on("send-task-id", async ({ task_id }) => {
    try {
      await checkDeadline(userId, task_id);
    } catch (error) {
      console.error("Error in send-task-id:", error);
    }
  });

  socket.on("apps", async (app: Record<string, number>, employeeId: string) => {
    console.log("Received app data:", app);

    const employee = await prisma.employee.findFirst({
      where: { employeeId },
    });

    if (!employee) {
      console.error("Employee not found");
      return;
    }

    const { companyId, departmentId, teamId } = employee;
    const currentDateAndTime = new Date();
    const day = currentDateAndTime.toISOString().split("T")[0];

    try {
      for (const [appName, appUsedDuration] of Object.entries(app) as [
        string,
        number
      ][]) {
        const filename = `${appName}.png`;

        let appReview = await prisma.appReview.findFirst({
          where: {
            appName,
            companyId,
          },
        });

        if (!appReview) {
          appReview = await prisma.appReview.create({
            data: {
              appName,
              appLogo: `uploads/appLogo/${filename}`,
              appReview: "NEUTRAL",
              companyId,
            },
          });
        }

        const existingApp = await prisma.app.findFirst({
          where: {
            appName,
            day,
            employeeId,
          },
        });
        if (existingApp) {
          await prisma.app.update({
            where: { appId: existingApp.appId },
            data: {
              appUsedDuration: (
                parseInt(existingApp?.appUsedDuration!) + appUsedDuration
              ).toString(),
            },
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
              day,
            },
          });
        }
      }

      const apps = await prisma.app.findMany({
        where: {
          companyId,
        },
      });
      const receiver = getReceiverSocketId(companyId);
      io.to(receiver).emit("get-used-apps", apps);

      console.log(
        "App durations saved or updated successfully and emitted to receiver"
      );
    } catch (error) {
      console.error("Error processing app durations:", error);
    }
  });

  io.on("sentUserSocket", async ({ userId }) => {
    const socketId = getReceiverSocketId(userId);
    io.emit("userSocket", {
      socketId,
    });
  });

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("screen-offer", (offer) => {
    io.to(userId).emit("screen-offer", offer);
  });

  socket.on("screen-answer", (answer) => {
    io.to(userId).emit("screen-answer", answer);
  });

  socket.on("ice-candidate", (candidate, targetSocketId) => {
    console.log("Received ICE candidate for target socket", targetSocketId);
    io.to(targetSocketId).emit("ice-candidate", candidate);
  });

  // socket.on("ice-candidate", (candidate) => { console.log("Received ICE candidate:", candidate); socket.broadcast.emit("ice-candidate", candidate); // Broadcast ICE candidates });

  let fileStream: any;
  let filePath: any;

  // socket.on("video-data", ({userId,chunk}) => {
  //   console.log("VIDEO CONNECTION CONNECTED");

  //   if (!fileStream) {
  //     filePath = path.join(__dirname, `video-${Date.now()}.webm`);
  //     fileStream = fs.createWriteStream(filePath, { flags: "a" });
  //     console.log(`Recording started, saving to: ${filePath}`);
  //   }

  //   // Check if the stream is still writable before writing
  //   if (fileStream && !fileStream.closed) {
  //     fileStream.write(Buffer.from(new Uint8Array(chunk)));
  //   } else {
  //     console.error("Attempted to write after stream ended.");
  //   }
  // });

  // socket.on("end-recording", () => {
  //   console.log("Recording ended");

  //   if (fileStream && !fileStream.closed) {
  //     fileStream.end();
  //     console.log(`Video saved at: ${filePath}`);
  //   }
  // });

  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    if (fileStream && !fileStream.closed) {
      fileStream.end();
    }
  });
});

export { app, io, server };
