import { customErrorHandler } from "../utils/customErrorHandler.js";
import prisma from "../models/index.js";
import { Prisma } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
import archiver from 'archiver';
import { fileURLToPath } from 'url';
import { dirname, join, resolve, basename } from 'path';
import fs from 'fs';
import { sendRiskUserDetails } from "../lib/mail.js";
import { updateCompanyEmployeeCount, updateTeamEmployeeCount } from "../services/updateCompanyCount .js";

// export const addRiskUser = async (req: any, res: any, next: any) => {
//   const companyId = (req as any).user.companyId;
//   const { employeeId } = req.params;

//   const employee = await prisma.employee.findUnique({
//     where: { employeeId },
//   });

//   if (!employee) {
//     return next(customErrorHandler(res, "Employee not found.", 404));
//   }

//   const existingRiskUser = await prisma.riskUser.findFirst({
//     where: {
//       employeeId,
//       companyId,
//     },
//   });

//   if (existingRiskUser) {
//     return next(
//       customErrorHandler(res, "Employee already exists in Risk user List.", 404)
//     );
//   }

//   const newRiskUser = await prisma.riskUser.create({
//     data: {
//       employeeId,
//       employeeName: employee.employeeName,
//       departmentId: employee.departmentId,
//       companyId,
//       isSafe: false, 
//     },
//   });

//   return res
//     .status(201)
//     .json({ message: "Employee added to Risk User.", riskUser: newRiskUser });
// };

export const addRiskUser = async (req: any, res: any, next: any) => {
  const companyId = (req as any).user.companyId;
  const { employeeId } = req.params;

  const employee = await prisma.employee.findUnique({
    where: { employeeId },
  });

  if (!employee) {
    return next(customErrorHandler(res, "Employee not found.", 404));
  }

  const existingRiskUser = await prisma.riskUser.findFirst({
    where: {
      employeeId,
      companyId,
    },
  });

  if (existingRiskUser) {
    return next(
      customErrorHandler(res, "Employee already exists in Risk user List.", 409)
    );
  }

  const newRiskUser = await prisma.riskUser.create({
    data: {
      employeeId,
      employeeName: employee.employeeName,
      departmentId: employee.departmentId,
      companyId,
      isSafe: false,
    },
  })

  // const [newRiskUser, updatedEmployee] = await prisma.$transaction([
  //   prisma.riskUser.create({
  //     data: {
  //       employeeId,
  //       employeeName: employee.employeeName,
  //       departmentId: employee.departmentId,
  //       companyId,
  //       isSafe: false,
  //     },
  //   }),
  //   prisma.employee.update({
  //     where: { employeeId },
  //     data: { isProductiveEmployee: false },
  //   }),
  // ]);

  return res.status(201).json({
    message: "Employee added to Risk User.",
    riskUser: newRiskUser,
    // updatedEmployee: {
    //   employeeId: updatedEmployee.employeeId,
    //   isProductiveEmployee: updatedEmployee.isProductiveEmployee,
    // },
  });
};


export const getRiskUser = async (req:Request, res: Response, next:NextFunction) => {
  const companyId = (req as any).user.companyId;
  console.log("companyId", companyId)

  
  const getUser = await prisma.riskUser.findMany({
    where:{
      companyId
    },
     include: {
      employee:{
        select: {
          employeeId: true,
          employeeName: true,
          employeeAddress: true,
          phoneNumber: true,
          position: {
            include: {
              role: {
                select:{
                  roleName: true
                }
              }
            },
          },
          email: true,
          teamId: true,
          createdAt: true,
          team:{
            select: {
              teamName: true
            }
          }
        },
      },
      department:{
        select: {
          departmentName: true
        }
      },
    }
  })
  return res.json({message: "employee details", riskUser:getUser })   
}

export const getRiskUserDetails = async (req: any, res: any, next: any) => {
  const companyId = req.user.company;
  const { employeeId } = req.params;
  const getuser = await prisma.riskUser.findMany({
    where: {
       companyId, employeeId
    },
    include: {
      employee:{
        select: {
          employeeId: true,
          employeeName: true,
          employeeAddress: true,
          phoneNumber: true,
          position: {
            include:{
              role: {
                select:{
                  roleName: true
                }
              }
            }
          },
          email: true,
          teamId: true,
          createdAt: true,
          team:{
            select: {
              teamName: true
            }
          }
        },
      },
      department:{
        select: {
          departmentName: true
        }
      },
    }
  })
  return res.json({message: "employee details", riskUser:getuser })
}





export const safeUser = async (req: any, res: any, next: any) => {
  const { riskUserId } = req.params;
  const companyId = req.user.companyId; 

  const riskUser = await prisma.riskUser.findUnique({
    where: {
      riskUserId,
      companyId,
    },
  });

  if (!riskUser) {
    return next(customErrorHandler(res, "Risk user not found.", 404));
  }

  if (riskUser.companyId !== companyId) {
    return next(
      customErrorHandler(
        res,
        "Unauthorized access to delete this Risk user.",
        403
      )
    );
  }

  const [deletedRiskUser, updatedEmployee] = await prisma.$transaction([
    prisma.riskUser.delete({
      where: { riskUserId },
    }),
    prisma.employee.update({
      where: { employeeId: riskUser.employeeId },
      data: { isProductiveEmployee: true },
    }),
  ]);

  return res.status(200).json({ 
    message: "Risk user is successfully saved.",
    updatedEmployee: {
      employeeId: updatedEmployee.employeeId,
      isProductiveEmployee: updatedEmployee.isProductiveEmployee,
    }
  });
};

export const addToInactive = async (req: any, res: any, next: any) => {
  const companyId = (req as any).user.companyId;
  const riskUserId = req.body.riskUserId;
  const { employeeId } = req.params;

  if (!employeeId || !companyId || !riskUserId) {
    return next(
      customErrorHandler(
        res,
        "Please provide all the necessary information",
        401
      )
    );
  }

  const employee = await prisma.employee.findUnique({
    where: { employeeId },
    include: {
      department: true,
      team: true,
    },
  });

  const riskUser = await prisma.riskUser.findUnique({
    where: {
      riskUserId,
      companyId,
      employeeId
    },
  });

  if (!employee) {
    return next(customErrorHandler(res, "Employee not found", 404));
  }

  // Save employee details to DeletedEmployee table
  const inactiveUser = await prisma.employee.update({
    where: {
      employeeId,
      companyId,
    },
    data: {
      isActive: false,
    },
  });

  await updateCompanyEmployeeCount(companyId)

  if(inactiveUser.teamId){
    await updateTeamEmployeeCount(inactiveUser.teamId?.toString())
  }

  if (riskUser) {
    await prisma.riskUser.delete({
      where: { riskUserId }, // Use riskUserId here
    });
  };

  return res.json({
    message: `Employee ${employee.employeeName} account has been deactivated.`,
    employee: inactiveUser,
  });
};

export const getAllInactiveUser = async (req: any, res: any, next: any) => {
  const companyId = (req as any).user.companyId;

  const allInactiveUser = await prisma.deletedEmployee.findMany({
    where: {
      companyId
    }
  });
  return res.json({ allInactiveUser });
};


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const sendScreenshotInMail = async (req:Request, res:Response, next:NextFunction) => {
  const companyId = (req as any).user.companyId;
  const { employeeId } = req.params;

  const company = await prisma.company.findUnique({ where: { companyId } });

  if (!company) {
    return next(customErrorHandler(res, "Company not found", 404));
  }

  const employee = await prisma.employee.findUnique({ where: { employeeId } });

  if (!employee) {
    return next(customErrorHandler(res, "Employee not found", 404));
  }

  const getScreenshots = await prisma.screenshot.findMany({
    where: { companyId, employeeId }
  });

  const getTimelapseVideo = await prisma.timeLapseVideo.findMany({
    where: { companyId, employeeId }
  })

  if (!getScreenshots.length) {
    return next(customErrorHandler(res, "No screenshots found", 404));
  }

  if ( !getTimelapseVideo.length ) {
    return next(customErrorHandler(res, "No timelapse video found", 404));
  }

  const zipFilename = `screenshots_${employee.employeeId}.zip`;
  const zipPath = join(__dirname, zipFilename); // Use join to construct the path
  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  output.on('close', async () => {
    await sendRiskUserDetails({
      email: company.companyEmail,
      subject: `Screenshots of ${employee.employeeName}`,
      companyName: company.companyName,
      employeeName: employee.employeeName,
      attachments: [{ filename: zipFilename, path: zipPath }]
    });

    fs.unlinkSync(zipPath);
    res.status(200).json({ message: 'Email sent successfully' });
  });

  archive.on('error', (err:any) => next(err));
  archive.pipe(output);

  getScreenshots.forEach(screenshot => {
    const filePath = resolve(screenshot.imageLink);
    archive.file(filePath, { name: basename(filePath) });
  });

  archive.finalize();
};


export const sendTimelapseInMail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const companyId = (req as any).user.companyId;
    const { employeeId } = req.params;

    const company = await prisma.company.findUnique({ where: { companyId } });
    if (!company) {
      return next(customErrorHandler(res, "Company not found", 404));
    }

    const employee = await prisma.employee.findUnique({ where: { employeeId } });
    if (!employee) {
      return next(customErrorHandler(res, "Employee not found", 404));
    }

    const getTimelapseVideo = await prisma.timeLapseVideo.findMany({
      where: { companyId, employeeId }
    });

    if (!getTimelapseVideo.length) {
      return next(customErrorHandler(res, "No timelapse video found", 404));
    }

    // Check total size of attachments
    let totalSize = 0;
    getTimelapseVideo.forEach(video => {
      const videoPath = resolve(video.videoLink);
      const stats = fs.statSync(videoPath);
      totalSize += stats.size;
    });

    if (totalSize > 25 * 1024 * 1024) { // Check if total size exceeds 25 MB
      return next(customErrorHandler(res, "Total attachment size exceeds Gmail limits", 413));
    }

    const videoFilename = `timelapse_videos_${employee.employeeId}.zip`;
    const videoZipPath = join(__dirname, videoFilename);
    const output = fs.createWriteStream(videoZipPath);
    const videoArchive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', async () => {
      try {
        await sendRiskUserDetails({
          email: company.companyEmail,
          subject: `Timelapse Videos of ${employee.employeeName}`,
          companyName: company.companyName,
          employeeName: employee.employeeName,
          attachments: [{ filename: videoFilename, path: videoZipPath }]
        });

        fs.unlinkSync(videoZipPath);
        res.status(200).json({ message: 'Timelapse video email sent successfully' });
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        return next(customErrorHandler(res, "Error sending timelapse video email", 500));
      }
    });

    videoArchive.on('error', err => {
      console.error("Archiver error:", err);
      return next(err);
    });

    videoArchive.pipe(output);

    getTimelapseVideo.forEach(video => {
      const videoPath = resolve(video.videoLink);
      videoArchive.file(videoPath, { name: basename(videoPath) });
    });

    await videoArchive.finalize();
  } catch (err) {
    console.error("Error in sendTimelapseInMail:", err);
    next(customErrorHandler(res, "Internal Server Error", 500));
  }
};
export const updateRiskUsersBasedOnLateClockIns = async () => {
  try {
      const companies = await prisma.company.findMany();

      for (const company of companies) {
          const companyId = company.companyId;

          // Find employees who clocked in late more than 3 times
          const lateClockingEmployees = await prisma.attendance.groupBy({
            by: ['employeeId', 'lateClockIn'], // Add 'lateClockIn' here
            where: {
                companyId,
                lateClockIn: {
                    not: null,
                },
            },
            _count: {
                lateClockIn: true,
            },
            having: {
                lateClockIn: {
                    gt: '3',
                },
            },
        });
        

          for (const lateEmployee of lateClockingEmployees) {
              const employeeId = lateEmployee.employeeId;

              // Check if the employee already exists in RiskUser
              const existingRiskUser = await prisma.riskUser.findFirst({
                  where: {
                      employeeId,
                      companyId,
                  },
              });

              // If not, create a new entry
              if (!existingRiskUser) {
                  const employee = await prisma.employee.findUnique({
                      where: { employeeId },
                      select: {
                          employeeName: true,
                          departmentId: true,
                      },
                  });

                  if (employee) {
                      await prisma.riskUser.create({
                          data: {
                              employeeId,
                              employeeName: employee.employeeName,
                              departmentId: employee.departmentId,
                              companyId,
                              isSafe: false,
                          },
                      });
                  }
              }
          }
      }
  } catch (error) {
      console.error('Error updating Risk user based on late clock-ins:', error);
  }
};
