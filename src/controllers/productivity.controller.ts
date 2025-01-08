import { AppType, TaskStatusType } from "@prisma/client";
import prisma from "../models/index.js";
import { Request, Response } from "express";
import { io } from "../socket/socket.js";
import schedule from "node-schedule";

// export const addProductiveWorkRate = async (req: Request, res: Response) => {
//   const companyId = (req as any).user.companyId;
//   const {
//     dailyRatio,
//     weeklyRatio,
//     pointsPerMinuteLateClockin,
//     pointsPerMinuteAppUsed,
//     pointsPerIncompleteTask,
//   } = req.body;
//   const findCompanyProductivityRatio =
//     await prisma.companyProductivityratio.findFirst({
//       where: {
//         companyId: companyId,
//       },
//     });
//   if (!findCompanyProductivityRatio) {
//     await prisma.companyProductivityratio.create({
//       data: {
//         companyId: companyId,
//         dailyRatio: dailyRatio,
//         weeklyRatio: weeklyRatio,
//         pointsPerMinuteLateClockin: pointsPerMinuteLateClockin,
//         pointsPerMinuteAppUsed: pointsPerMinuteAppUsed,
//         pointsPerIncompleteTask: pointsPerIncompleteTask,
//       },
//     });
//   } else {
//     await prisma.companyProductivityratio.update({
//       where: { id: findCompanyProductivityRatio.id },
//       data: {
//         companyId: companyId,
//         dailyRatio: dailyRatio,
//         weeklyRatio: weeklyRatio,
//         pointsPerMinuteLateClockin: pointsPerMinuteLateClockin,
//         pointsPerMinuteAppUsed: pointsPerMinuteAppUsed,
//         pointsPerIncompleteTask: pointsPerIncompleteTask,
//       },
//     });
//   }

//   return res.json({ message: "Productive ratio is added" });
// };


export const addProductiveWorkRate = async (req: Request, res: Response) => {
  const companyId = (req as any).user.companyId;
  const {
    workingDays,
    dailyRatio,
    pointsPerMinuteLateClockin,
    pointsPerMinuteAppUsed,
    pointsPerIncompleteTask,
  } = req.body;
  const weeklyRatio = dailyRatio * workingDays
  const findCompanyProductivityRatio =
    await prisma.companyProductivityratio.findFirst({
      where: {
        companyId: companyId,
      },
    });
  if (!findCompanyProductivityRatio) {
    await prisma.companyProductivityratio.create({
      data: {
        companyId: companyId,
        workingDays: workingDays,
        dailyRatio: dailyRatio,
        weeklyRatio: weeklyRatio,
        pointsPerMinuteLateClockin: pointsPerMinuteLateClockin,
        pointsPerMinuteAppUsed: pointsPerMinuteAppUsed,
        pointsPerIncompleteTask: pointsPerIncompleteTask,
      },
    });
  } else {
    await prisma.companyProductivityratio.update({
      where: { id: findCompanyProductivityRatio.id },
      data: {
        companyId: companyId,
        workingDays: workingDays,
        dailyRatio: dailyRatio,
        weeklyRatio: weeklyRatio,
        pointsPerMinuteLateClockin: pointsPerMinuteLateClockin,
        pointsPerMinuteAppUsed: pointsPerMinuteAppUsed,
        pointsPerIncompleteTask: pointsPerIncompleteTask,
      },
    });
  }

  return res.json({ message: "Productive ratio is added" });
};


export const addDailyProductiveratio = async (employeeId: string) => {
  const employee = await prisma.employee.findFirst({
    where: {
      employeeId: employeeId
    }
  })
  if (!employee) {
    return { message: "Employee not found" };
  }
  const company = await prisma.company.findFirst({
    where: {
      companyId: employee.companyId
    }
  })
  if (!company) {
    return { message: "company not found" };
  }
  const companyProductivity = await prisma.companyProductivityratio.findFirst({
    where: {
      companyId: company.companyId
    }
  })
  if (!companyProductivity) {
    return { message: "Your company doesnot enrolled productivity yet" }
  }
  const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
  const endOfDay = new Date(new Date().setHours(23, 59, 59, 999));
  const productivity = await prisma.productivity.findFirst({
    where: {
      employeeId: employeeId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 1,
  });
  if (!productivity) {
    return
  }
  await prisma.productivity.create({
    data: {
      dateFrom: startOfDay,
      dateTo: endOfDay,
      dailyProductiveRatio: companyProductivity.dailyRatio,
      weeklyProductiveRatio: productivity.weeklyProductiveRatio,
      employeeId: employeeId,
      companyId: employee.companyId
    }
  })
}


export const addWeeklyProductiveratio = async (employeeId: string) => {
  const employee = await prisma.employee.findFirst({
    where: {
      employeeId: employeeId
    }
  })
  if (!employee) {
    return { message: "Employee not found" };
  }
  const company = await prisma.company.findFirst({
    where: {
      companyId: employee.companyId
    }
  })
  if (!company) {
    return { message: "company not found" };
  }
  const companyProductivity = await prisma.companyProductivityratio.findFirst({
    where: {
      companyId: company.companyId
    }
  })
  if (!companyProductivity) {
    return { message: "Your company doesnot enrolled productivity yet" }
  }
  const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));

  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(startOfDay.getDate() + (7 - startOfDay.getDay()));
  endOfDay.setHours(23, 59, 59, 999);

  await prisma.productivity.create({
    data: {
      dateFrom: startOfDay,
      dateTo: endOfDay,
      dailyProductiveRatio: companyProductivity.dailyRatio,
      weeklyProductiveRatio: companyProductivity.weeklyRatio,
      employeeId: employeeId,
      companyId: employee.companyId
    }
  })
}
export const calculateProductiveRatio = async (employeeId: string) => {
  const employee = await prisma.employee.findFirst({
    where: { employeeId: employeeId },
  });
  if (!employee) {
    return { message: "Employee not found" };
  }

  const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
  const endOfDay = new Date(new Date().setHours(23, 59, 59, 999));

  const appUsageData = await prisma.app.findMany({
    where: {
      employeeId,
      createdAt: { gte: startOfDay, lt: endOfDay },
      appType: "UNPRODUCTIVE",
    },
    select: { appUsedDuration: true },
  });
  console.log("🚀 ~ //schedule.scheduleJob ~ appUsageData:", appUsageData);

  const totalAppUsageDuration = appUsageData.reduce(
    (acc, app) => acc + (Number(app.appUsedDuration) || 0),
    0,
  );

  const productivity = await prisma.productivity.findFirst({
    where: {
      employeeId: employeeId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 1,
  });


  const companyProductivity = await prisma.companyProductivityratio.findFirst(
    {
      where: { companyId: employee.companyId },
    },
  );

  if (!companyProductivity) {
    return { message: "Productive ratio not added yet" };
  }
  if (!productivity) {
    return { message: "No productivity found of the employee" }
  }

  const unproductiveDurationInMinutes = totalAppUsageDuration / 60;

  const attendance = await prisma.attendance.findFirst({
    where: { employeeId, createdAt: { gte: startOfDay, lt: endOfDay } },
    select: { lateClockIn: true },
  });

  const lateClockInMinutes = parseTimeStringToMinutes(
    attendance?.lateClockIn || "0 mins",
  );
  const expiredTasks = await prisma.task.count({
    where: {
      taskReceiver: employeeId,
      createdAt: { gte: startOfDay, lt: endOfDay },
      statusType: TaskStatusType.EXPIRED,
    },
  });
  console.log("🚀 ~ //schedule.scheduleJob ~ expiredTasks:", expiredTasks);
  const companyPointsForIncompleteTask = companyProductivity.pointsPerIncompleteTask
  const penaltyForExpiredTasks = expiredTasks * companyPointsForIncompleteTask;
  console.log("Expired Tasks Penalty:", penaltyForExpiredTasks);

  const totalPenalty =
    unproductiveDurationInMinutes +
    lateClockInMinutes +
    penaltyForExpiredTasks;
  const dailyFinalRatio = productivity.dailyProductiveRatio - totalPenalty;
  const weeklyFinalRatio = productivity.weeklyProductiveRatio - totalPenalty;

  console.log("Daily Final Ratio:", dailyFinalRatio);
  console.log("Weekly Final Ratio:", weeklyFinalRatio);
const leastProduyctiveRatio = weeklyFinalRatio/2
  if (weeklyFinalRatio <= leastProduyctiveRatio) {
    const existingRiskUser = await prisma.riskUser.findFirst({
      where: { employeeId },
    });

    const lateClockInMinutes = parseTimeStringToMinutes(
      attendance?.lateClockIn || "0 mins",
    );
    const expiredTasks = await prisma.task.count({
      where: {
        taskReceiver: employeeId,
        createdAt: { gte: startOfDay, lt: endOfDay },
        statusType: TaskStatusType.EXPIRED,
      },
    });
    console.log("🚀 ~ //schedule.scheduleJob ~ expiredTasks:", expiredTasks);
const companyPointsForIncompleteTask = companyProductivity.pointsPerIncompleteTask
    const penaltyForExpiredTasks = expiredTasks * companyPointsForIncompleteTask;
    console.log("Expired Tasks Penalty:", penaltyForExpiredTasks);

    const totalPenalty =
      unproductiveDurationInMinutes +
      lateClockInMinutes +
      penaltyForExpiredTasks;
    const dailyFinalRatio = productivity.dailyProductiveRatio - totalPenalty;
    const weeklyFinalRatio = productivity.weeklyProductiveRatio - totalPenalty;

    console.log("Daily Final Ratio:", dailyFinalRatio);
    console.log("Weekly Final Ratio:", weeklyFinalRatio);

    const leastProduyctiveRatio = weeklyFinalRatio/2
    if (weeklyFinalRatio <= leastProduyctiveRatio) {
      const existingRiskUser = await prisma.riskUser.findFirst({
        where: { employeeId },
      });
    }

    if (productivity.isProductive) {
      await prisma.productivity.update({
        where: { id: productivity.id },
        data: { isProductive: false },
      });
    }
  }

  const updatedProductivity = await prisma.productivity.update({
    where: { id: productivity.id, employeeId: employeeId },
    data: {
      dailyProductiveRatio: dailyFinalRatio,
      weeklyProductiveRatio: weeklyFinalRatio,
    },
  });

  return { message: "Productivity ratio updated", updatedProductivity };
};



function parseTimeStringToMinutes(timeString: string): number {
  const hoursMatch = timeString.match(/(\d+)\s*hrs?/);
  const minutesMatch = timeString.match(/(\d+)\s*mins?/);
  const secondsMatch = timeString.match(/(\d+)\s*sec/);

  const hours = hoursMatch ? parseInt(hoursMatch[1], 10) : 0;
  const minutes = minutesMatch ? parseInt(minutesMatch[1], 10) : 0;
  const seconds = secondsMatch ? parseInt(secondsMatch[1], 10) : 0;

  return hours * 60 + minutes + seconds / 60;
}

export const getOwnProductiveRatio = async (req: Request, res: Response) => {
  const employeeId = (req as any).user.employeeId;
  const companyId = (req as any).user.companyId;

  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  console.log("🚀 ~ getOwnProductiveRatio ~ startOfDay:", startOfDay)
  const endOfDay = new Date();
  console.log("🚀 ~ getOwnProductiveRatio ~ endOfDay:", endOfDay)
  endOfDay.setHours(23, 59, 59, 999);

  const findProductivity = await prisma.productivity.findFirst({
    where: {
      employeeId: employeeId,
      createdAt: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
  });
  const companyProductivity = await prisma.companyProductivityratio.findFirst({
    where: { companyId: companyId },
  });
  if (!companyProductivity) {
    return;
  }
  const ratio = Number(findProductivity?.dailyProductiveRatio);
  console.log("🚀 ~ getOwnProductiveRatio ~ ratio:", ratio);
  const companyDailyRatio = Number(companyProductivity.dailyRatio);
  console.log(
    "🚀 ~ getOwnProductiveRatio ~ companyDailyRatio:",
    companyDailyRatio,
  );
  const percentage = ((ratio! / companyDailyRatio) * 100).toFixed(2);
  console.log("🚀 ~ getOwnProductiveRatio ~ percentage:", percentage);
  io.to(employeeId).emit("get-productivity", { percentage });
  res.json({ percentage });
};

export const getOwnProductiveRatioWeekly = async (
  req: Request,
  res: Response,
) => {
  const employeeId = (req as any).user.employeeId;
  const companyId = (req as any).user.companyId;

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const startOfDay = new Date(oneWeekAgo.setHours(0, 0, 0, 0));
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const findProductivity = await prisma.productivity.findFirst({
    where: {
      employeeId: employeeId,
      createdAt: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
  });
  const companyProductivity = await prisma.companyProductivityratio.findFirst({
    where: { companyId: companyId },
  });
  if (!companyProductivity) {
    return;
  }
  console.log(findProductivity?.weeklyProductiveRatio);
  const ratio = findProductivity?.weeklyProductiveRatio;
  console.log(companyProductivity?.weeklyRatio);
  const percentage = ratio
    ? ((ratio / companyProductivity?.weeklyRatio) * 100).toFixed(2)
    : "0%";
  console.log("🚀 ~ getOwnProductiveRatio ~ percentage:", percentage);
  io.to(employeeId).emit("get-weeklyproductivity", { percentage });
  res.json({ percentage });
};


export const getEmployeesDailyProductivityRatioById = async (
  req: Request,
  res: Response,
) => {
  const companyId = (req as any).user.companyId;
  const employeeId = Array.isArray(req.query.employeeId) ? req.query.employeeId[0] : req.query.employeeId;


  console.log('Incoming request to get daily productivity ratio');
  console.log('Company ID:', companyId);
  console.log('Employee ID:', employeeId);

  if (!employeeId) {
    return res.status(400).json({ message: "Employee ID is missing" });
  }
  if (!companyId) {
    return res.status(403).json({ message: "You are not authorized" });
  }

  const employee = await prisma.employee.findMany({
    where: {
      employeeId: employeeId,
      companyId: companyId,
    },
  });

  console.log('Employee search result:', employee);

  if (employee.length === 0) {
    return res.status(404).json({ message: `No employee found with ID: ${employeeId}` });
  }

  const startOfDay = new Date(new Date().setHours(0, 0, 0, 0));
  const endOfDay = new Date(new Date().setHours(23, 59, 59, 999));

  const employeeProductiveRatio = await prisma.productivity.findFirst({
    where: {
      employeeId: employeeId,
      createdAt: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
  });

  console.log('Employee productivity ratio result:', employeeProductiveRatio);

  if (!employeeProductiveRatio) {
    return res.json({ message: "No employee productive ratio found" });
  }

  return res.json({ employeeProductiveRatio });
};

export const getEmployeeWeelyProductivityRatioById = async (
  req: Request,
  res: Response,
) => {
  const companyId = (req as any).user.companyId;
  const employeeId = Array.isArray(req.query.employeeId) ? req.query.employeeId[0] : req.query.employeeId;


  console.log('Incoming request to get weekly productivity ratio');
  console.log('Company ID:', companyId);
  console.log('Employee ID:', employeeId);

  if (!employeeId) {
    return res.status(400).json({ message: "Employee ID is missing" });
  }
  if (!companyId) {
    return res.status(403).json({ message: "You are not authorized" });
  }

  const employee = await prisma.employee.findMany({
    where: {
      employeeId: employeeId,
      companyId: companyId,
    },
  });


  console.log('Employee search result:', employee);

  if (employee.length === 0) {
    return res.status(404).json({ message: `No employee found with ID: ${employeeId}` });
  }

  const DateFrom = new Date(Date.now());
  const weeklyDateTo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const employeeProductiveRatio = await prisma.productivity.findFirst({
    where: {
      employeeId: employeeId,
      createdAt: {
        gte: weeklyDateTo,
        lt: DateFrom,
      },
    },
  });


  console.log('Employee productivity ratio result:', employeeProductiveRatio);

  if (!employeeProductiveRatio) {
    return res.json({ message: "No employee productive ratio found" });
  }

  return res.json({ employeeProductiveRatio });
};

export const getProductiveAndUnproductiveEmployee = async (
  req: Request,
  res: Response,
) => {
  const companyId = (req as any).user.companyId;
  const employee = await prisma.employee.findMany({
    where: {
      companyId: companyId,
    }, include: { productivity: true }
  });

  if (!employee) {
    return res.json({ message: "Employee not found" });
  }
  // const productiveEmployee = await prisma.productivity.findFirst({
  //   where: {
  //     employeeId: employee.employeeId,
  //   },
  // });
  // const isProductiveEmployee = productiveEmployee?.isProductive
  //   ? "Productive"
  //   : "Unproductive";
  return res.json({ employee });
};



// export const getNumberOfProductiveEmployee = async (
//   req: Request,
//   res: Response,
// ) => {
//   const companyId = (req as any).user.companyId;

//   const currentDate = new Date();
//   const currentMonth = currentDate.getMonth();
//   const currentYear = currentDate.getFullYear();

//   try {
//     const productivityCounts = await prisma.productivity.groupBy({
//       by: ['employeeId'],
//       _count: {
//         isProductive: true,
//       },
//       where: {
//         companyId: companyId,
//         createdAt: {
//           gte: new Date(currentYear, currentMonth, 1),
//           lt: new Date(currentYear, currentMonth + 1, 1),
//         },
//         isProductive: true,
//       },
//     });

//     const employeesToUpdate = productivityCounts
//       .filter((entry) => entry._count.isProductive > 20)
//       .map((entry) => entry.employeeId);

//     if (employeesToUpdate.length > 0) {
//       await prisma.employee.updateMany({
//         where: {
//           employeeId: { in: employeesToUpdate },
//         },
//         data: {
//           isProductiveEmployee: false,
//         },
//       });
//     }
//     const productiveEmployee = await prisma.employee.findMany({
//       where: {
//         companyId,
//         isProductiveEmployee: true
//       }
//     })
//     const noOfProductiveEmployee = productiveEmployee.length
//     return res.json({ productiveEmployee, noOfProductiveEmployee });
//   } catch (error) {
//     console.error("Error updating unproductive employees:", error);
//     return res.status(500).json({ message: "Internal Server Error" });
//   }
// };


export const getNumberOfProductiveEmployee = async (
  req: Request,
  res: Response,
) => {
  const companyId = (req as any).user.companyId;

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth(); 
  const currentYear = currentDate.getFullYear();

  try {
    // Get the list of employees who are marked as productive in the current month
    const productivityCounts = await prisma.productivity.groupBy({
      by: ['employeeId'],
      _count: {
        isProductive: true, 
      },
      where: {
        companyId: companyId,
        createdAt: {
          gte: new Date(currentYear, currentMonth, 1), 
          lt: new Date(currentYear, currentMonth + 1, 1), 
        },
        isProductive: true, 
      },
    });

    // Filter employees who have been productive more than 20 times
    const employeesToUpdate = productivityCounts
      .filter((entry) => entry._count.isProductive > 20) 
      .map((entry) => entry.employeeId);

    if (employeesToUpdate.length > 0) {
      // Update employees who are productive more than 20 times
      await prisma.employee.updateMany({
        where: {
          employeeId: { in: employeesToUpdate },
        },
        data: {
          isProductiveEmployee: false, 
        },
      });
    }
    
    // Fetch the list of employee IDs from the RiskUser table
    const riskUsers = await prisma.riskUser.findMany({
      where: {
        companyId,
      },
    });

    const riskUserIds = riskUsers.map(user => user.employeeId);
    
    // Fetch productive employees excluding those who are in the RiskUser table
    const productiveEmployee = await prisma.employee.findMany({
      where: {
        companyId,
        isProductiveEmployee: true,
        employeeId: { notIn: riskUserIds }, // Exclude RiskUser employees
      },
      include: {
        department: {
          select: {
            departmentName: true
          }
        },
        team: {
          select: {
            teamName: true
          }
        },
         position: {
          select: {
            role:{
select:{
  roleName:true
}
            }
           
          }
        },
        
      }
    });
    
    const noOfProductiveEmployee = productiveEmployee.length;
    
    return res.json({ productiveEmployee, noOfProductiveEmployee });

  } catch (error) {
    console.error("Error updating unproductive employees:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};



export const getNumberOfUnproductiveEmployee = async (
  req: Request,
  res: Response,
) => {
  const companyId = (req as any).user.companyId;

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  try {
    const productivityCounts = await prisma.productivity.groupBy({
      by: ['employeeId'],
      _count: {
        isProductive: true,
      },
      where: {
        companyId: companyId,
        createdAt: {
          gte: new Date(currentYear, currentMonth, 1),
          lt: new Date(currentYear, currentMonth + 1, 1),
        },
        isProductive: false,
      },
    });

    const employeesToUpdate = productivityCounts
      .filter((entry) => entry._count.isProductive > 20)
      .map((entry) => entry.employeeId);

    if (employeesToUpdate.length > 0) {
      await prisma.employee.updateMany({
        where: {
          employeeId: { in: employeesToUpdate },
        },
        data: {
          isProductiveEmployee: false,
        },
      });
    }
    const unProductive = await prisma.employee.findMany({
      where: {
        companyId,
        isProductiveEmployee: false
      }
    })
    const noOfUnproductiveEmployee = unProductive.length
    return res.json({ noOfUnproductiveEmployee, unProductive });
  } catch (error) {
    console.error("Error updating unproductive employees:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


export const getAllActivityOfEmployee = async (
  req: Request,
  res: Response,
) => {
  const employeeId = (req as any).user.employeeId
  const unProductive = await prisma.productivity.findMany({
    where: {
      employeeId: employeeId,
      isProductive: false,
    },
  });
  if (!unProductive)
    return res.json({ message: "No productive employee found" });
  const noOfUnproductiveEmployee = unProductive.length;
  return res.json({ unProductive, noOfUnproductiveEmployee });
};