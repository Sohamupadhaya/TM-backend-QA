import { NextFunction, Request, Response } from "express";
import { customErrorHandler } from "../utils/customErrorHandler.js";
import prisma from "../models/index.js";
import {
  updateCompanyTeamsCount,
  updateDeartmentTeamsCount,
} from "../services/updateCompanyCount .js";
import { actualTimeOfCompany } from "./company.controller.js";

// create Teams
// export const createTeam = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   const { teamName, departmentId } = req.body;
//   const companyId = (req as any).user.companyId;
//   const team = await prisma.team.findFirst({
//     where: {
//       teamName,
//       departmentId,
//       companyId,
//     },
//   });

//   if (team)
//     return next(
//       customErrorHandler(
//         res,
//         "Team already exist for the this department of company",
//         402
//       )
//     );
//   const newTeam = await prisma.team.create({
//     data: {
//       teamName,
//       departmentId,
//       companyId,
//     },
//   });

//   await prisma.department.update({
//     where: {
//       departmentId,
//       companyId,
//     },
//     data: {
//       noOfTeams: {
//         increment: 1,
//       },
//     },
//   });

//   await prisma.company.update({
//     where: {
//       companyId,
//     },
//     data: {
//       noOfTeams: {
//         increment: 1,
//       },
//     },
//   });

//   return res.json({ message: "Team Created", team: newTeam });
// };

// export const createTeam = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   const { teamName, departmentId, teamLoginTime, teamLogoutTime } = req.body;
//   const companyId = (req as any).user.companyId;

//   // Check if the team already exists
//   const existingTeam = await prisma.team.findFirst({
//     where: {
//       teamName,
//       companyId,
//     },
//   });

//   if (existingTeam) {
//     return next(
//       customErrorHandler(
//         res,
//         `Team  with ${teamName} already exist.`,
//         402
//       )
//     );
//   }
//   console.log({ teamLoginTime, teamLogoutTime });

//   if( teamLoginTime === teamLogoutTime){
//     return next(customErrorHandler(res, 'Login and logout time must  be different', 405 ));
//   }

//   const company=await prisma.company.findFirst({
//     where:{
//       companyId
//     }
//   })
//   const companyCode=company?.companyCode
//   const teamCount=await prisma.team.count({
//     where:{
//       companyId
//     }
//   })
//   const teamCode=`${companyCode}-team-${teamCount}`

//   // Create a new team with login and logout times
//   const newTeam = await prisma.team.create({
//     data: {
//       teamName,
//       teamCode,
//       departmentId,
//       companyId,
//     }as any,
//   });

//   await prisma.actualTimeOfCompany.create({
//     data:{
//       actualLoginTime:teamLoginTime,
//       actualLogoutTime:teamLogoutTime,
//       companyId,
//       teamId:newTeam.teamId
//     }
//   })

//   await updateDeartmentTeamsCount(departmentId)
//   await updateCompanyTeamsCount(companyId)

//   return res.json({ message: "Team Created", team: newTeam });
// };

export const createTeam = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { teamName, departmentId, teamLoginTime, teamLogoutTime } = req.body;
  const companyId = (req as any).user.companyId;

  // Check if the team already exists
  const existingTeam = await prisma.team.findFirst({
    where: {
      teamName,
      companyId,
    },
  });

  if (existingTeam) {
    return next(
      customErrorHandler(res, `Team with ${teamName} already exists.`, 402)
    );
  }

  console.log({ teamLoginTime, teamLogoutTime });

  if (teamLoginTime === teamLogoutTime) {
    return next(
      customErrorHandler(res, "Login and logout time must be different", 405)
    );
  }

  const company = await prisma.company.findFirst({
    where: {
      companyId,
    },
  });

  const companyCode = company?.companyCode;
  const teamCount = await prisma.team.count({
    where: {
      companyId,
    },
  });

  // Generate a unique team code
  let teamCode;
  let isUnique = false;
  let attempt = 1;

  while (!isUnique && attempt <= 100) {
    teamCode = `${companyCode}-team-${teamCount + attempt}`;

    const existingTeamCode = await prisma.team.findFirst({
      where: {
        teamCode,
        companyId,
      },
    });

    if (!existingTeamCode) {
      isUnique = true;
    } else {
      attempt++;
    }
  }

  if (!isUnique) {
    return next(
      customErrorHandler(res, "Unable to generate a unique team code", 500)
    );
  }

  // Create a new team with login and logout times
  const newTeam = await prisma.team.create({
    data: {
      teamName,
      teamCode,
      departmentId,
      companyId,
    } as any,
  });

  await prisma.actualTimeOfCompany.create({
    data: {
      actualLoginTime: teamLoginTime,
      actualLogoutTime: teamLogoutTime,
      companyId,
      teamId: newTeam.teamId,
    },
  });

  await updateDeartmentTeamsCount(departmentId);
  await updateCompanyTeamsCount(companyId);

  return res.json({ message: "Team Created", team: newTeam });
};

//get all team of the company
export const getAllTeamOfTheCompany = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const companyId = (req as any).user.companyId;
  const teams = await prisma.team.findMany({
    where: {
      companyId,
    },
    include: {
      actualTimeOfCompany: {
        select: {
          actualLoginTime: true,
          actualLogoutTime: true,
          timeZone: true,
          actualTimeId: true,
        },
      },
    },
  });
  return res.json({ teams });
};

//get all team of the department of company
export const getAllTeamOfTheDepartment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { departmentId } = req.params;
  const companyId = (req as any).user.companyId;
  const teams = await prisma.team.findMany({
    where: {
      companyId,
      departmentId,
    },
    include: {
      actualTimeOfCompany: {
        select: {
          actualLoginTime: true,
          actualLogoutTime: true,
          timeZone: true,
          actualTimeId: true,
        },
      },
    },
  });
  return res.json({ teams });
};

//get One team of the department

export const getTeam = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { teamId, departmentId } = req.query;

  // Ensure teamId and departmentId are strings
  if (typeof teamId !== "string" || typeof departmentId !== "string") {
    return next(
      customErrorHandler(res, "DepartmentId and TeamId cannot be empty", 400)
    );
  }

  const companyId = (req as any).user.companyId;

  try {
    const team = await prisma.team.findFirst({
      where: {
        companyId,
        teamId,
        departmentId,
      },
      include: {
        actualTimeOfCompany: {
          select: {
            actualTimeId: true,
            actualLoginTime: true,
            actualLogoutTime: true,
            timeZone: true,
          },
        },
      },
    });

    return res.json({ team });
  } catch (error) {
    return next(customErrorHandler(res, "Error fetching team", 500));
  }
};

// export const updateTeam = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   const { teamId, departmentId, teamName, teamHead, actualTimeId, teamLoginTime, teamLogoutTime } = req.body;
//   const companyId = (req as any).user.companyId;

//   // Find the team based on teamId and companyId
//   const team = await prisma.team.findFirst({
//     where: {
//       companyId,
//       teamId,
//     },
//   });

//   // Check if the team exists
//   if (!team) return next(customErrorHandler(res, "Team not found", 404));

//   // Update the team, including the new fields
//   const updatedTeam = await prisma.team.update({
//     where: {
//       teamId: team.teamId,
//       companyId,
//     },
//     data: {
//       teamName,
//       teamHead,
//       departmentId,
//     },
//   });

//   if( teamLoginTime === teamLogoutTime){
//     return next(customErrorHandler(res, 'Login and logout time must  be different', 405 ));
//   }

//   const updateTeamTime = await prisma.actualTimeOfCompany.update({
//     where: {
//       teamId: team.teamId,
//       actualTimeId,
//       companyId
//     },
//     data: {
//       actualLoginTime: teamLoginTime,
//       actualLogoutTime: teamLogoutTime
//     }
//   });

//   // Return the updated team information
//   return res.json({ message: "Team Updated", updatedTeam, updateTeamTime });
// };

export const updateTeam = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {
    teamId,
    departmentId,
    teamName,
    teamHead,
    actualTimeId,
    teamLoginTime,
    teamLogoutTime,
  } = req.body;
  const companyId = (req as any).user.companyId;

  // Ensure actualTimeId is provided (or can be handled appropriately)
  if (!actualTimeId) {
    return next(
      customErrorHandler(
        res,
        "Actual time ID is required for updating time",
        400
      )
    );
  }

  // Find the team based on teamId and companyId
  const team = await prisma.team.findFirst({
    where: {
      companyId,
      teamId,
    },
  });

  // Check if the team exists
  if (!team) return next(customErrorHandler(res, "Team not found", 404));

  // Update the team, including the new fields
  const updatedTeam = await prisma.team.update({
    where: {
      teamId: team.teamId,
      companyId,
    },
    data: {
      teamName,
      teamHead,
      departmentId,
    },
  });

  // Check if login and logout times are different
  if (teamLoginTime === teamLogoutTime) {
    return next(
      customErrorHandler(res, "Login and logout time must be different", 405)
    );
  }

  if (teamLoginTime > teamLogoutTime) {
    return next(
      customErrorHandler(res, "Assign the login and logout time properly.", 408)
    );
  }

  // Update the team's actual time if actualTimeId is present
  const updateTeamTime = await prisma.actualTimeOfCompany.update({
    where: {
      teamId: team.teamId,
      actualTimeId, // ensure this value is not undefined
      companyId,
    },
    data: {
      actualLoginTime: teamLoginTime,
      actualLogoutTime: teamLogoutTime,
    },
  });

  // Return the updated team and actual time information
  return res.json({ message: "Team Updated", updatedTeam, updateTeamTime });
};

// delete Team
// export const deleteTeam = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   const { teamId, departmentId } = req.params;
//   const companyId = (req as any).user.companyId;

//   const deletedTeam = await prisma.team.delete({
//     where: { teamId, companyId },
//   });

//   await updateDeartmentTeamsCount(departmentId)

//   await updateCompanyTeamsCount(companyId)

//   if (deletedTeam) {
//     res.status(200).json({ message: "Team Deleted!", deletedTeam });
//   } else {
//     res.status(404).json({ message: "Team not found" });
//   }
// };

export const deleteTeam = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { teamId, departmentId } = req.params;
    const companyId = (req as any).user.companyId;

    // First, get all employees in the team
    const employeesInTeam = await prisma.employee.findMany({
      where: { teamId },
    });

    // Begin a transaction to handle all related deletions
    const deletedTeam = await prisma.$transaction(async (prisma) => {
      // 1. Delete UserRoles for all employees in the team
      for (const employee of employeesInTeam) {
        await prisma.userRole.deleteMany({
          where: { employeeId: employee.employeeId },
        });
      }

      // 2. Update employees to remove team association
      await prisma.employee.updateMany({
        where: { teamId },
        data: {
          teamId: null,
          currentEmployeeStatus: "INACTIVE",
        },
      });

      // 3. Now delete the team
      const deletedTeam = await prisma.team.delete({
        where: { teamId, companyId },
      });

      return deletedTeam;
    });

    // Update department and company team counts
    await updateDeartmentTeamsCount(departmentId);
    await updateCompanyTeamsCount(companyId);

    res.status(200).json({
      message: "Team and related data deleted successfully!",
      deletedTeam,
    });
  } catch (error) {
    next(error);
  }
};
