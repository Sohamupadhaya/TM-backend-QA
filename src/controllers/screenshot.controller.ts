import { Request, Response, NextFunction } from "express";
import sharp from "sharp";
import path from "path";
import fsPromises from "fs/promises"; // Use the promises API for other fs operations
import { customErrorHandler } from "../utils/customErrorHandler.js";
import prisma from "../models/index.js";

export const addScreenshot = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const employee = (req as any).user;

  // Check if file is uploaded
  if (!req.file) return customErrorHandler(res, "Screenshot is Required", 400);

  const filename = req.file.filename; // Original filename
  const status = req.body.status; // Status from the body (IDLE, WORKING)
  const ssTakenTime = req.body.ssTakenTime; // Screenshot taken time

  // Validate the status
  const validStatuses = ["IDLE", "WORKING"];
  if (!validStatuses.includes(status)) {
    return customErrorHandler(res, "Invalid status", 400);
  }

  const imagePath = req.file.path; // Path of the uploaded file
  const inputExtension = path.extname(filename).toLowerCase();
  const compressedImagePath = `uploads/screenshot/compressed_${filename}`; // Path for compressed file

  try {
    // Compress the image using sharp
    sharp.cache(false);

    let sharpInstance = sharp(imagePath);
    sharpInstance = sharpInstance.resize({ width: 1280 }); // Resize to 1280px width

    switch (inputExtension) {
      case ".jpeg": // Handle both .jpeg and .jpg as .jpg
      case ".jpg":
        sharpInstance = sharpInstance.jpeg({ quality: 50 });
        break;
      case ".png":
        sharpInstance = sharpInstance.png({ quality: 50 });
        break;
      case ".webp":
        sharpInstance = sharpInstance.webp({ quality: 50 });
        break;
      case ".tiff":
        sharpInstance = sharpInstance.tiff({ quality: 50 });
        break;
      default:
        return customErrorHandler(res, "Unsupported image format", 400);
    }

    await sharpInstance.toFile(compressedImagePath);

    try {
      await fsPromises.unlink(imagePath);
    } catch (error) {
      console.log("Something went wrong while deleting the original image");
      console.log(error);
    }

    // Save compressed image info to the database
    const screenshot = await prisma.screenshot.create({
      data: {
        employeeId: employee.employeeId,
        departmentId: employee.departmentId || undefined,
        teamId: employee.teamId || undefined,
        companyId: employee.companyId,
        time: ssTakenTime,
        imageLink: compressedImagePath, // Use compressed image path
        workingStatus: status,
      },
    });

    // Return success response
    return res.status(201).json({
      message: "Screenshot uploaded and compressed successfully.",
      screenshot,
    });
  } catch (err) {
    console.error("Error compressing image:", err);

    // Handle errors and clean up if necessary
    try {
      await fsPromises.access(compressedImagePath);
      await fsPromises.unlink(compressedImagePath);
    } catch (accessErr) {
      console.error("Error accessing or deleting compressed image:", accessErr);
    }

    return customErrorHandler(res, "Error processing image", 500);
  }
};

// Get all screenshot of own
export const getAllScreenshotOfOwn = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const employee = (req as any).user;
  const screenshots = await prisma.screenshot.findMany({
    where: {
      employeeId: employee.employeeId,
      companyId: employee.companyId,
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
  return res.json({ screenshots });
};

// get screenshot of the user
export const getAllScreenshotOfUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { employeeId } = req.params;
  // const employee = (req as any).user;
  const companyId = (req as any).user.companyId;
  const screenshots = await prisma.screenshot.findMany({
    where: {
      employeeId,
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
  return res.json({ screenshots });
};

// Get one screenshot
export const getOneScreenshot = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { screenshotId } = req.params;
  const { companyId } = (req as any).user;

  const screenshot = await prisma.screenshot.findFirst({
    where: {
      companyId,
      screenshotId,
    },
  });
  return res.json({ screenshot });
};

export const getAllScreenshotOfDay = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { companyId } = (req as any).user;
  const currentDate = new Date();
  const startOfToday = currentDate.setHours(0, 0, 0, 0); // Start of today
  const endOfToday = currentDate.setHours(23, 59, 59, 999); // End of today
  const screenshots = await prisma.screenshot.findMany({
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
  return res.json({ screenshots });
};

export const getScreenshotOfSpecificDate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { companyId } = (req as any).user;
    const { date } = req.params;
    console.log(date, "DAT");

    // Check if date is a string and is not empty
    if (typeof date !== "string" || !date) {
      return res.status(400).json({ error: "Invalid date parameter" });
    }

    const parsedDate = new Date(date);

    // Check if the parsed date is valid
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    const screenshots = await prisma.screenshot.findMany({
      where: {
        companyId,
        createdAt: {
          gte: parsedDate,
        },
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

    res.json(screenshots);
  } catch (error) {
    next(error);
  }
};

export const getScreenshotOfEmployeeSpecificDate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { companyId } = (req as any).user;
    const { employeeId } = req.params;
    const { date } = req.query;
    console.log(date, "DAT");

    // Check if date is a string and is not empty
    if (typeof date !== "string" || !date) {
      return res.status(400).json({ error: "Invalid date parameter" });
    }

    const parsedDate = new Date(date);

    // Check if the parsed date is valid
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    const screenshots = await prisma.screenshot.findMany({
      where: {
        companyId,
        employeeId,
        createdAt: {
          gte: parsedDate,
        },
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

    res.json(screenshots);
  } catch (error) {
    next(error);
  }
};

export const get15DaysScreenshot = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const companyId = (req as any).user.companyId;
    const { employeeId } = req.params;
    const currentDate = new Date();
    const fifteenDaysAgo = new Date(currentDate);
    fifteenDaysAgo.setDate(currentDate.getDate() - 14); // Set to 14 days ago to include today

    const screenshots = await prisma.screenshot.findMany({
      where: {
        companyId: companyId,
        employeeId: employeeId,
        createdAt: {
          gte: fifteenDaysAgo,
          lte: currentDate, // Optional: to make it clear you want up to today
        },
      },
    });

    return res.status(200).json(screenshots);
  } catch (error) {
    console.error("Error fetching screenshots:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const latestSsTimeOfEmp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const employee = (req as any).user;

    const lastSSTime = await prisma.screenshot.findFirst({
      where: {
        employeeId: employee.employeeId,
        companyId: employee.companyId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        time: true,
      },
    });
    return res.status(200).json(lastSSTime);
  } catch (error) {
    next(error);
  }
};
