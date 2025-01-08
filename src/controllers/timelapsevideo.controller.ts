// import { Request, Response, NextFunction } from "express";
// import ffmpeg from "fluent-ffmpeg";
// import path from "path";
// import fs from "fs";
// import { customErrorHandler } from "../utils/customErrorHandler.js";
// import prisma from "../models/index.js";
// import ffprobeInstaller from '@ffprobe-installer/ffprobe';
// import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

// ffmpeg.setFfmpegPath(ffmpegInstaller.path);
// ffmpeg.setFfprobePath(ffprobeInstaller.path);



// const getVideoMetadata = (inputPath: string): Promise<any> => {
//   return new Promise((resolve, reject) => {
//     ffmpeg.ffprobe(inputPath, (err, metadata) => {
//       if (err) {
//         reject(err);
//       } else {
//         resolve(metadata);
//       }
//     });
//   });
// };

// export const createTimelapseVideo = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   const nowInUTC = new Date().toISOString();
//   const employee = (req as any).user;

//   if (!req.file) {
//     return customErrorHandler(res, "Timelapse video is required", 400);
//   }

//   const filename = req.file.filename;
//   const inputPath = req.file.path;
//   const inputExtension = path.extname(filename).toLowerCase();
//   const outputExtension = inputExtension === ".webm" ? "webm" : "mp4";
//   const outputPath = `uploads/timelapsevideo/compressed_${Date.now()}.${outputExtension}`;
//   const compressionQuality = 70; // Lower value for faster compression
//   const frameRate = 2; // Configurable frame rate
//   const bitrate = "500k"; // Configurable bitrate

//   try {
//     const metadata = await getVideoMetadata(inputPath);
//     const totalDuration = metadata.duration;

//     const videoOptions = outputExtension === "webm"
//       ? [
//         "-preset ultrafast", // Use a faster preset
//         `-crf ${compressionQuality}`,
//         "-vf scale=1280:-2",
//         `-r ${frameRate}`,
//         `-b:v ${bitrate}`,
//         "-an",
//         "-c:v libvpx", // Use libvpx for WebM
//       ]
//       : [
//         "-preset ultrafast", // Use a faster preset
//         `-crf ${compressionQuality}`,
//         "-vf scale=1280:-2",
//         `-r ${frameRate}`,
//         `-b:v ${bitrate}`,
//         "-an",
//         "-c:v h264_nvenc", // Use NVENC for MP4
//       ];

//     await new Promise((resolve, reject) => {
//       ffmpeg(inputPath)
//         .output(outputPath)
//         .outputOptions(videoOptions)
//         .on("start", (commandLine) => {
//           console.log("Started processing the video:", commandLine);
//         })
//         .on("progress", (progress) => {
//           console.log(progress);
//         })
//         .on("end", async () => {
//           console.log("Video compression finished");

//           try {
//             const timelapseVideo = await prisma.timeLapseVideo.create({
//               data: {
//                 employeeId: employee.employeeId,
//                 departmentId: employee.departmentId || undefined,
//                 teamId: employee.teamId || undefined,
//                 companyId: employee.companyId,
//                 time: nowInUTC,
//                 videoLink: outputPath,
//               },
//             });

//             if (!timelapseVideo) {
//               return customErrorHandler(res, "Could not create the timelapse video", 500);
//             }

//             fs.unlinkSync(inputPath); // Clean up the original file

//             return res.status(201).json({
//               message: "Timelapse video uploaded and compressed successfully!",
//               videoLink: outputPath,
//             });
//           } catch (dbError) {
//             reject(dbError);
//           }
//         })
//         .on("error", (err) => {
//           console.error("Error processing video:", err);
//           reject(err);
//         })
//         .run();
//     });
//   } catch (error) {
//     next(error);
//   }
// };


import { Request, Response, NextFunction } from "express";
import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";
import { customErrorHandler } from "../utils/customErrorHandler.js";
import prisma from "../models/index.js";
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

const getVideoMetadata = (inputPath: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        resolve(metadata);
      }
    });
  });
};

export const createTimelapseVideo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const nowInUTC = new Date().toISOString();
  const employee = (req as any).user;

  if (!req.file) {
    return customErrorHandler(res, "Timelapse video is required", 400);
  }

  const filename = req.file.filename;
  const inputPath = req.file.path;
  const inputExtension = path.extname(filename).toLowerCase();
  const outputExtension = inputExtension === ".webm" ? "webm" : inputExtension === ".mkv" ? "mkv" : "mp4";
  const outputPath = `uploads/timelapsevideo/compressed_${Date.now()}.${outputExtension}`;
  const compressionQuality = 60; // Lower value for faster compression
  const frameRate = 5; // Configurable frame rate
  const bitrate = "500k"; // Configurable bitrate

  try {
    const metadata = await getVideoMetadata(inputPath);
    const totalDuration = metadata.duration;

    const videoOptions = outputExtension === "webm"
      ? [
        "-preset ultrafast", // Use a faster preset
        `-crf ${compressionQuality}`,
        "-vf scale=1280:-2",
        `-r ${frameRate}`,
        `-b:v ${bitrate}`,
        "-an",
        "-c:v libvpx", // Use libvpx for WebM
      ]
      : outputExtension === "mkv"
        ? [
          "-preset ultrafast", // Use a faster preset
          `-crf ${compressionQuality}`,
          "-vf scale=1280:-2",
          `-r ${frameRate}`,
          `-b:v ${bitrate}`,
          "-an",
          "-c:v libx264", // Use libx264 for MKV
        ]
        : [
          "-preset ultrafast", // Use a faster preset
          `-crf ${compressionQuality}`,
          "-vf scale=1280:-2",
          `-r ${frameRate}`,
          `-b:v ${bitrate}`,
          "-an",
          "-c:v h264_nvenc", // Use NVENC for MP4
        ];

    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .output(outputPath)
        .outputOptions(videoOptions)
        .on("start", (commandLine) => {
          console.log("Started processing the video:", commandLine);
        })
        .on("progress", (progress) => {
          console.log(progress);
        })
        .on("end", async () => {
          console.log("Video compression finished");

          try {
            const timelapseVideo = await prisma.timeLapseVideo.create({
              data: {
                employeeId: employee.employeeId,
                departmentId: employee.departmentId || undefined,
                teamId: employee.teamId || undefined,
                companyId: employee.companyId,
                time: nowInUTC,
                videoLink: outputPath,
              },
            });

            if (!timelapseVideo) {
              return customErrorHandler(res, "Could not create the timelapse video", 500);
            }

            fs.unlinkSync(inputPath); // Clean up the original file

            return res.status(201).json({
              message: "Timelapse video uploaded and compressed successfully!",
              videoLink: outputPath,
            });
          } catch (dbError) {
            reject(dbError);
          }
        })
        .on("error", (err) => {
          console.error("Error processing video:", err);
          reject(err);
        })
        .run();
    });
  } catch (error) {
    next(error);
  }
};




// get all timelapse video
export const getAllTimeLapseVideoOfOwn = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const employee = (req as any).user;
  const timeLapseVideo = await prisma.timeLapseVideo.findMany({
    where: {
      employeeId: employee.employeeId,
      companyId: employee.companyId,
    },
  });
  return res.json({ timeLapseVideo });
};



// Get all timlapse video of user
export const getAllTimeLapseVideoOfUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { employeeId } = req.params;
  const employee = (req as any).user;
  const timeLapseVideo = await prisma.timeLapseVideo.findMany({
    where: {
      employeeId,
      companyId: employee.companyId,
    },
  });
  return res.json({ timeLapseVideo });


};

// Get one timelapse video
export const getOneTimeLapseVideo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { timeLapseVideoId } = req.params;
  const { companyId } = (req as any).user;

  const timeLapseVideo = await prisma.timeLapseVideo.findFirst({
    where: {
      companyId,
      timeLapseVideoId,
    },
  });
  return res.json({ timeLapseVideo });
};




export const getVideoofSpecificDate = async (req: any, res: any, next: any) => {
  const { companyId } = (req as any).user;
  const { date } = req.params;
  const specificDate = new Date(date);

  const dateString = specificDate.toISOString().split("T")[0];

  console.log("Date string without time:", dateString);

  try {
    const getVideo = await prisma.timeLapseVideo.findMany({
      where: {
        time: {
          gte: new Date(`${dateString}T00:00:00.000Z`),
          lt: new Date(`${dateString}T23:59:59.999Z`),
        },
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
      },
    });

    return res.json({ getVideo });
  } catch (error) {
    console.error("Error fetching video:", error);
    return res.status(500).json({ message: "Error fetching video data" });
  }
};


export const getAllVideoOfDay = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { companyId } = (req as any).user;
  const currentDate = new Date();
  const startOfToday = currentDate.setHours(0, 0, 0, 0); // Start of today
  const endOfToday = currentDate.setHours(23, 59, 59, 999); // End of today
  const timeLapseVideo = await prisma.timeLapseVideo.findMany({
    where: {
      createdAt: {
        gte: new Date(startOfToday),
        lte: new Date(endOfToday),
      },
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
    },
  });
  return res.json({ timeLapseVideo });
};

export const get15DaysVideo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const companyId = (req as any).user.companyId;
    const { employeeId } = req.params;
    const currentDate = new Date();
    const fifteenDaysAgo = new Date(currentDate);
    fifteenDaysAgo.setDate(currentDate.getDate() - 15);

    const timelapsevideo = await prisma.timeLapseVideo.findMany({
      where: {
        companyId: companyId,
        employeeId: employeeId,
        createdAt: {
          gte: fifteenDaysAgo,
        },
      },
    });

    return res.status(200).json(timelapsevideo);
  } catch (error) {
    console.error("Error fetching time lapse videos:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
