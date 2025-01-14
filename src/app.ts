import express from "express";
import cors from "cors";
import { errorMiddleware } from "./middlewares/error.js";
import morgan from "morgan";
import dotenv from "dotenv";
import { app, server } from "./socket/socket.js";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import fs from "fs";
import { isAuthenticatedEmployee } from "./middlewares/isAuthenticatedEmployee.js";
import prisma from "./models/index.js";
import multerS3 from "multer-s3";
import { s3Client } from "./services/s3Credentials.js";
import schedule from "node-schedule";
// import { startProducer } from "./services/kafka/producer.js";
// import { startConsumer } from "./services/kafka/consumer.js";

dotenv.config({ path: "./.env" });
app.use("/uploads", express.static("uploads"));

export const envMode = process.env.NODE_ENV?.trim() || "DEVELOPMENT";
const port = process.env.PORT || 8000;

// const app = express();
// const allowedOrigins = ["https://kit-pottery-include-continent.trycloudflare.com","http://localhost:5173","http://192.168.1.75:5173","http://localhost:50960"]

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(cors({ origin: "*", credentials: true }));

// Start Kafka producer and consumer
// startProducer();
// startConsumer();

const allowedOrigins = ["https://pf-league-defence-stability.trycloudflare.com", "http://localhost:3000", "http://localhost:3001", "http://localhost:5000", "http://localhost:5173", "*"]

app.use(cors({
  origin: function (origin: any, callback) {
    // console.log(origin)
    // Allow requests with no origin (Flutter apps, Postman) or from allowed origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true); // Allow these origins
    } else {
      app.use(cors({ origin: "*", credentials: true }));
      // callback(new Error("Not allowed by CORS"), false); // Block other origins
    }
  },
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
})
);
app.use(morgan("dev"));
// app.use(express.static('setupfile'));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define a folder to store video chunks
// const VIDEO_DIR = path.join(__dirname, 'videos');
// // Ensure the directory exists
// if (!fs.existsSync(VIDEO_DIR)) {
//   fs.mkdirSync(VIDEO_DIR);
// }

// Configure multer to use S3 for storing uploaded files
// const upload = multer({
//   storage: multerS3({
//     s3: s3Client,
//     bucket: process.env.AWS_S3_BUCKET!,
//     contentType: multerS3.AUTO_CONTENT_TYPE,
//     key: (req, file, cb) => {
//       const chunkFilename = `timelapsevideo/video-chunk-${Date.now()}.webm`;
//       cb(null, chunkFilename);
//     }
//   })
// });

// Use diskStorage to store files directly on disk
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Set the destination for video chunks
    cb(null, "uploads/timelapsevideo");
  },
  filename: (req, file, cb) => {
    // Set the filename for each uploaded chunk
    const chunkFilename = `video-chunk-${Date.now()}.webm`;
    cb(null, chunkFilename);
  },
});

const VIDEO_DIR = "uploads/timelapsevideo";
if (!fs.existsSync(VIDEO_DIR)) {
  fs.mkdirSync(VIDEO_DIR, { recursive: true });
}

const upload = multer({ storage });
// Middleware to parse multipart/form-data
// const storage = multer.memoryStorage(); // Store the video chunks in memory first
// const upload = multer({ storage });

// Storage for video files
let fileStream: any = null;
let filePath: any = null;

// app.use("/download",express.static('setupfile'));

app.use("/setupfile", express.static(path.join(__dirname, "setupfile")));

// app.get('/download-exe', (req, res) => {
//  try {
//   console.log("Downloading file...");
//   const filePath = path.join(__dirname, 'setupfile', 'TeamMonitor.exe');
//   console.log("File path:", filePath);
//   res.download(filePath, 'TeamMonitor.exe', (err) => {
//     if (err) {
//       console.error("Error downloading file:", err);
//       res.status(500).send('Error downloading file');
//     }
//   });
//  } catch (error) {
//   console.log(error)
//  }
// });

app.get("/download-exe", (req, res) => {
  try {
    console.log("Downloading file...");
    const filePath = path.join(__dirname, "setupfile", "TeamMonitor.exe");
    console.log("File path:", filePath);

    // Check if the file exists before trying to download it
    if (fs.existsSync(filePath)) {
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="TeamMonitor.exe"'
      );
      res.setHeader("Content-Type", "application/octet-stream");

      // Stream the file to avoid blocking the server
      const fileStream = fs.createReadStream(filePath);

      fileStream.on("error", (error) => {
        console.error("File stream error:", error);
        res.status(500).send("Error reading file");
      });

      fileStream.pipe(res); // Stream the file to the response
    } else {
      console.error("File does not exist");
      res.status(404).send("File not found");
    }
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).send("Server error");
  }
});

// Store streams and paths for each user (indexed by employee ID)
const userFileStreams: {
  [key: string]: { fileStream: fs.WriteStream; filePath: string };
} = {};

// const userFileStreams: {
//   [key: string]: { filePath: string; chunks: string[]; lastChunkReceived: boolean };
// } = {};

// Route to upload video chunks

// app.post('/upload-videos', upload.single('video'), isAuthenticatedEmployee, async (req: any, res) => {
//   try {
//     const videoChunkPath = req.file.location; // Get the S3 URL of the uploaded chunk
//     const employee = req.user;
//     const employeeId = employee.employeeId;
//     const { isLastChunk } = req.body; // Expecting a flag to determine if this is the last chunk
//     const nowInUTC = new Date().toISOString();

//     // Initialize the S3 path for the employee if not already set
//     if (!userFileStreams[employeeId]) {
//       const filePath = `timelapsevideo/video-${employeeId}-${Date.now()}.webm`;
//       userFileStreams[employeeId] = { filePath, chunks: [], lastChunkReceived: false };
//       console.log(`Recording started for Employee ID: ${employeeId}, saving to: ${filePath}`);
//     }

//     // Get the employee's file path and track chunks
//     const { filePath, chunks } = userFileStreams[employeeId];
//     chunks.push(videoChunkPath);

//     console.log(`Video chunk received from S3 for Employee ID: ${employeeId}, chunk stored.`);

//     // If this is the last chunk, mark it and begin the merging process
//     if (isLastChunk) {
//       userFileStreams[employeeId].lastChunkReceived = true;
//       console.log(`Last chunk received for Employee ID: ${employeeId}. Initiating merge...`);

//       // Call a function to merge chunks from S3 into a single file
//       await mergeChunksInS3(filePath, chunks);

//       // After merging, update the database
//       const existingVideo = await prisma.timeLapseVideo.findFirst({
//         where: {
//           videoLink: filePath,
//           employeeId: employeeId,
//         },
//       });

//       if (!existingVideo) {
//         // Save the final merged video info in the database
//         const savedVideo = await prisma.timeLapseVideo.create({
//           data: {
//             videoLink: filePath, // Save the S3 path of the full merged video
//             employeeId: employeeId,
//             departmentId: employee.departmentId,
//             teamId: employee.teamId,
//             companyId: employee.companyId,
//             time: nowInUTC,
//           },
//         });
//         console.log(`Final video path saved to database for Employee ID: ${employeeId}.`, savedVideo);
//       } else {
//         console.log(`Final video already exists in the database for Employee ID: ${employeeId}, skipping insert.`);
//       }

//       // Clean up chunks from memory
//       delete userFileStreams[employeeId];
//     }

//     res.status(200).json({ message: 'Chunk received and stored in S3.', videoChunkPath });
//   } catch (error) {
//     console.error('Error handling video chunk:', error);
//     res.status(500).json({ message: 'Error processing video chunk.' });
//   }
// });

// Function to merge chunks in S3
const mergeChunksInS3 = async (finalFilePath: string, chunkUrls: string[]) => {
  try {
    // Logic to download all chunks from S3, merge them, and upload the final file to the given finalFilePath
    // This will involve downloading the chunks in sequence, merging them locally or through an S3 process,
    // and re-uploading the final merged video to the `finalFilePath`.

    console.log(`Merging ${chunkUrls.length} chunks into ${finalFilePath}...`);
    // S3 logic for merging goes here...

    console.log(`Chunks merged successfully into ${finalFilePath}.`);
  } catch (error) {
    console.error("Error merging video chunks:", error);
    throw new Error("Merging chunks failed");
  }
};

// Route to upload video chunks
app.post(
  "/upload-video",
  upload.single("video"),
  isAuthenticatedEmployee,
  async (req: any, res) => {
    try {
      const videoChunkPath = req.file.path; // Get the path of the uploaded chunk
      const employee = (req as any).user;
      const employeeId = employee.employeeId;
      const nowInUTC = new Date().toISOString();
      console.log(employee, "EMP");

      // Initialize the stream and file path for the employee if not already open
      if (!userFileStreams[employeeId]) {
        const filePath = path.join(
          VIDEO_DIR,
          `video-${employeeId}-${Date.now()}.webm`
        );
        const fileStream = fs.createWriteStream(filePath, { flags: "a" });

        userFileStreams[employeeId] = { fileStream, filePath };
        console.log(
          `Recording started for Employee ID: ${employeeId}, saving to: ${filePath}`
        );
      }

      // Get the employee's file stream and file path
      const { fileStream, filePath } = userFileStreams[employeeId];

      // Read the uploaded chunk and append it to the user's video file
      const chunkData = fs.readFileSync(videoChunkPath);
      if (fileStream && !fileStream.closed) {
        fileStream.write(chunkData);
        console.log(
          `Video chunk written to file for Employee ID: ${employeeId}.`
        );
        res.status(200).json({ message: "Chunk received and written." });
      } else {
        console.error(
          `Attempted to write after stream ended for Employee ID: ${employeeId}.`
        );
        res.status(500).json({ message: "Stream is closed." });
      }

      // Remove the temporary chunk file after writing
      fs.unlinkSync(videoChunkPath);

      // Check if the video path already exists in the database for the user
      const existingVideo = await prisma.timeLapseVideo.findFirst({
        where: {
          videoLink: filePath,
          employeeId: employeeId,
        },
      });

      if (existingVideo) {
        console.log(
          `Video already exists in the database for Employee ID: ${employeeId}, skipping insert.`
        );
      } else {
        // Save the video info in the database if it doesn't exist
        const savedVideo = await prisma.timeLapseVideo.create({
          data: {
            videoLink: filePath, // Save the final video path
            employeeId: employeeId,
            departmentId: employee.departmentId || undefined,
            teamId: employee.teamId || undefined,
            companyId: employee.companyId,
            time: nowInUTC,
          },
        });

        console.log(
          `Video path saved to database for Employee ID: ${employeeId}.`,
          savedVideo
        );
      }
    } catch (error) {
      console.error("Error writing video chunk:", error);
      res.status(500).json({ message: "Error writing video chunk." });
    }
  }
);

// // Route to stop recording and close the file stream
app.post("/end-recording", isAuthenticatedEmployee, (req, res) => {
  try {
    console.log("Recording ended");

    if (fileStream && !fileStream.closed) {
      fileStream.end();
      console.log(`Video saved at: ${filePath}`);
      res.status(200).json({ message: `Recording saved at ${filePath}` });
    } else {
      res.status(400).json({ message: "No active recording." });
    }
  } catch (error) {
    console.error("Error stopping recording:", error);
    res.status(500).json({ message: "Error stopping recording." });
  }
});

app.get("/download", (req, res) => {
  const file = path.join(__dirname, "setupfile", "TeamMonitor.exe"); // change file path
  res.download(file); // This method prompts the client to download the file
});

import companyRoute from "./routers/company.route.js";
// import superAdminRoute from "./routers/superadmin.route.js";
import holidayRoute from "./routers/holiday.route.js";
import employeeRoute from "./routers/employee.route.js";
import departmentRoute from "./routers/department.route.js";
import teamRoute from "./routers/teams.route.js";
import leaveRoute from "./routers/leave.routes.js";
import attendanceRoute from "./routers/attendance.route.js";
import riskUserRoute from "./routers/riskuser.route.js";
import notificationRoute from "./routers/notification.route.js";
import messagesRoute from "./routers/message.route.js";
import screenshotRoute from "./routers/screenshot.route.js";
import timelapseVideoRoute from "./routers/timelapsevideo.route.js";
import dashboardRoute from "./routers/dashboard.route.js";
import appRoute from "./routers/app.route.js";
import chunkVideoRoute from "./routers/chunkvideo.route.js";
import employeeSettingRoute from "./routers/employeesetting.route.js";
import taskRoute from "./routers/task.route.js";
import role from "./routers/role.route.js";
import permission from "./routers/permission.route.js";
import productiveRatio from "./routers/productivity.routes.js";
import {
  addDailyProductiveratio,
  addProductiveWorkRate,
  addWeeklyProductiveratio,
  calculateProductiveRatio,
} from "./controllers/productivity.controller.js";
import subscriptionRoute from "./routers/subscription.route.js";
import freeTrail from "./routers/freeTrail.route.js";
import keywordRoutes from "./routers/keyword.route.js";
import videoRoutes from "./routers/video.routes.js";
import idleTimeRoutes from "./routers/idle.routes.js";
import uniqueCode from "./routers/uniqueCode.route.js";

app.use("/api/v1/company", companyRoute);
// app.use("/api/v1/superadmin", superAdminRoute);
app.use("/api/v1/employee", employeeRoute);
app.use("/api/v1/department", departmentRoute);
app.use("/api/v1/team", teamRoute);
app.use("/api/v1/attendance", attendanceRoute);
app.use("/api/v1/leave", leaveRoute);
app.use("/api/v1/holiday", holidayRoute);
app.use("/api/v1/riskuser", riskUserRoute);
app.use("/api/v1/notifications", notificationRoute);
app.use("/api/v1/messages", messagesRoute);
app.use("/api/v1/screenshot", screenshotRoute);
app.use("/api/v1/timelapsevideo", timelapseVideoRoute);
app.use("/api/v1/dashboard", dashboardRoute);
app.use("/api/v1/app", appRoute);
app.use("/api/v1/chunk-video", chunkVideoRoute);
app.use("/api/v1/employee-setting", employeeSettingRoute);
app.use("/api/v1/task", taskRoute);
app.use("/api/v1/role", role);
app.use("/api/v1/permission", permission);
app.use("/api/v1/productiveRatio", productiveRatio);
app.use("/api/v1/subscription", subscriptionRoute);
app.use("/api/v1/freeTrail", freeTrail);
app.use("/api/video", videoRoutes);
app.use("/api/v1/idle-time", idleTimeRoutes);
app.use("/api/v1/keyword", keywordRoutes);
app.use("/api/v1/uniqueCode", uniqueCode);

app.get("/", (req, res) => {
  res.send("Welcome to Team Monitor Backend!");
});

//done
schedule.scheduleJob("0 9 * * *", async () => {
  const companies = await prisma.company.findMany();
  await Promise.all(
    companies.map(async (company) => {
      const allEmployees = await prisma.employee.findMany({
        where: { companyId: company.companyId },
      });
      const employeeIds = allEmployees.map((employee) => employee.employeeId);
      await Promise.all(
        employeeIds.map(async (employeeId) => {
          await calculateProductiveRatio(employeeId);
          console.log("sent");
        })
      );
    })
  );
});

//done
schedule.scheduleJob("0 9 * * *", async () => {
  const companies = await prisma.company.findMany();
  await Promise.all(
    companies.map(async (company) => {
      const allEmployees = await prisma.employee.findMany({
        where: { companyId: company.companyId },
      });
      const employeeIds = allEmployees.map((employee) => employee.employeeId);
      await Promise.all(
        employeeIds.map(async (employeeId) => {
          await addDailyProductiveratio(employeeId);
          console.log("daily");
        })
      );
    })
  );
});

//done

schedule.scheduleJob("0 9 * * 1", async () => {
  const companies = await prisma.company.findMany();
  await Promise.all(
    companies.map(async (company) => {
      const allEmployees = await prisma.employee.findMany({
        where: { companyId: company.companyId },
      });
      const employeeIds = allEmployees.map((employee) => employee.employeeId);
      await Promise.all(
        employeeIds.map(async (employeeId) => {
          await addWeeklyProductiveratio(employeeId);
          console.log("weekly");
        })
      );
    })
  );
});

app.get("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Page not found",
  });
});

app.use(errorMiddleware);

server.listen(port, () =>
  console.log("Server is working on Port:" + port + " in " + envMode + " Mode.")
);
