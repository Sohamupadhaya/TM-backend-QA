import { NextFunction, Request, Response } from "express";
import { customErrorHandler } from "../utils/customErrorHandler.js";
import bcrypt from "bcrypt";
import { createToken } from "../utils/createToken.js";
import prisma from "../models/index.js";
import {
  updateCompanyEmployeeCount,
  updateTeamEmployeeCount,
} from "../services/updateCompanyCount .js";
import { message } from "../lib/multer.js";
import { generateDeletedEmpPDF } from "../utils/generatePdf/deletedEmpPdf.js";
import { attendancePdf, deletedEmpPdf } from "../lib/mail.js";
import { forgetPasswordEmployee } from "../lib/mail.js";

export const registerEmployee = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {
    employeeName,
    email,
    phoneNumber,
    password,
    employeeAddress,
    position,
    roleId,
  } = req.body;

  //validation if user have given each and every field or not

  if (!employeeName) {
    return next(
      customErrorHandler(res, "employee name field is not provided", 400)
    );
  }

  if (!email) {
    return next(customErrorHandler(res, "email field is not provided", 400));
  }

  if (!phoneNumber) {
    return next(
      customErrorHandler(res, "phone number field is not provided", 400)
    );
  }

  if (!password) {
    return next(customErrorHandler(res, "password field is not provided", 400));
  }

  if (!employeeAddress) {
    return next(
      customErrorHandler(res, "employee address field is not provided", 400)
    );
  }

  if (!roleId) {
    return next(customErrorHandler(res, "role id field is not provided", 400));
  }

  // Validate email format
  if (/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email) === false) {
    return next(customErrorHandler(res, "email must be a valid email", 400));
  }

  // Validate password format
  if (/^(?=(.*[a-z]))(?=(.*[A-Z]))(?=(.*\W)).{8,}$/.test(password) === false) {
    return next(
      customErrorHandler(
        res,
        "password must be a valid with A minimum length of 8 characters At least one uppercase letter At least one lowercase letter At least one special character",
        400
      )
    );
  }

  // Validate phone number format
  if (!/^\+?[1-9]\d{1,14}$/.test(phoneNumber)) {
    return next(
      customErrorHandler(
        res,
        "Company phone number must be a valid number",
        400
      )
    );
  }

  const CompanyEmailCheck = await prisma.company.findFirst({
    where: { companyEmail: email },
  });

  if (CompanyEmailCheck) {
    return next(
      customErrorHandler(
        res,
        "Company email cannot be same as employee email",
        400
      )
    );
  }

  //checking weather roleId is matched or not
  const role = await prisma.roles.findFirst({ where: { roleId } });

  if (!role) {
    return next(customErrorHandler(res, "This roleId is invalid", 400));
  }

  const companyId = (req as any).user.companyId;

  // Check for existing employee by email and phone number
  const existingEmployee = await prisma.employee.findFirst({
    where: { email },
  });
  if (existingEmployee)
    return next(
      customErrorHandler(res, "Employee with this email already exists!", 400)
    );

  const existingPhone = await prisma.employee.findFirst({
    where: { phoneNumber },
  });
  if (existingPhone)
    return next(customErrorHandler(res, "Phone number already in use!", 400));

  const hashedPassword = await bcrypt.hash(password, 10);
  const company = await prisma.company.findFirst({ where: { companyId } });
  const companyCode = company?.companyCode;

  // Generate unique employee code
  const employeeCount = await prisma.employee.count({ where: { companyId } });
  const employeeCode = `${companyCode}-emp-${employeeCount + 1}`;

  // Create new employee with correct position structure
  const newEmployee = await prisma.employee.create({
    data: {
      employeeName,
      email,
      employeeAddress,
      phoneNumber,
      companyId,
      password: hashedPassword!,
      isActive: true!,
      employeeCode,
      position:
        position && position.length > 0
          ? { connect: position.map((roleId: string) => ({ id: roleId })) }
          : undefined,
    },
  });

  await prisma.userRole.create({
    data: { employeeId: newEmployee.employeeId, roleId },
  });

  // Initialize department and team codes during employee creation
  if (newEmployee.departmentId) {
    const departmentEmployeeCount = await prisma.employee.count({
      where: { departmentId: newEmployee.departmentId },
    });
    const employeeDepartmentCode = `${companyCode}-dep-${departmentEmployeeCount}`;
    await prisma.employee.update({
      where: { employeeId: newEmployee.employeeId },
      data: { employeeDepartmentCode },
    });
  }

  if (newEmployee.teamId) {
    const teamEmployeeCount = await prisma.employee.count({
      where: { teamId: newEmployee.teamId },
    });
    const employeeTeamCode = `${companyCode}-team-${teamEmployeeCount}`;
    await prisma.employee.update({
      where: { employeeId: newEmployee.employeeId },
      data: { employeeTeamCode },
    });
  }

  // Update company employee count
  await updateCompanyEmployeeCount(companyId);
  const { password: _, ...employeeData } = newEmployee;

  return res.json({ message: "Employee Created", employee: employeeData });
};

export const loginEmployee = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email, password } = req.body;

  // Check if email or password is empty
  if (!email) {
    return next(customErrorHandler(res, "Please enter the email", 400));
  }
  if (!password) {
    return next(customErrorHandler(res, "Please enter the password", 400));
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return next(customErrorHandler(res, "Enter a valid email address", 400));
  }

  // console.log("email:", email);

  // Find employee in the database
  const employee = await prisma.employee.findFirst({
    where: {
      email,
    },
    include: {
      position: {
        include: {
          role: {
            include: {
              rolePermission: true,
            },
          },
        },
      },
    },
  });

  if (!employee) {
    return next(customErrorHandler(res, "Invalid Credentials", 401));
  }

  // Compare the provided password with the stored hash
  const isMatch = bcrypt.compareSync(password, employee.password);
  if (!isMatch) {
    return next(customErrorHandler(res, "Incorrect password", 401));
  }

  // Check if the employee is active
  if (!employee.isActive) {
    return next(
      customErrorHandler(
        res,
        "You are currently inactive. Please contact your company.",
        401
      )
    );
  }

  // Safely access the role from the first position
  const role = employee.position[0]?.role;
  if (!role) {
    return next(
      customErrorHandler(res, "Role not found for the employee", 404)
    );
  }

  // Generate a token
  const token = createToken(
    {
      email,
      employeeId: employee.employeeId,
      permission: role.rolePermission,
      companyId: employee.companyId,
    },
    process.env.JWT_LOGIN_SECRET,
    process.env.JWT_EXPIRY_TIME
  );
  const { password: _, ...employeeData } = employee;

  // Respond with a success message and the token
  return res
    .status(200)
    .json({ message: "Login Success", token, data: employeeData });
};

export const loginEmployeeInAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { email, password } = req.body;
  const employee = await prisma.employee.findFirst({
    where: {
      email,
    },
    include: {
      position: {
        include: {
          role: {
            include: {
              rolePermission: true,
            },
          },
        },
      },
    },
  });

  if (!employee)
    return next(customErrorHandler(res, "Invalid Credentials", 401));

  const isMatch = await bcrypt.compareSync(password, employee.password);

  if (!isMatch)
    return next(customErrorHandler(res, "Invalid Credentials", 401));

  if (!employee.isActive)
    return next(
      customErrorHandler(
        res,
        "You are currently inactive please contact to your company.",
        401
      )
    );

  // Safely access the role from the first position in the array
  const role = employee.position[0]?.role;

  if (!role) {
    return next(
      customErrorHandler(res, "Role not found for the employee", 404)
    );
  }

  const checkAdminLogin = await prisma.rolePermission.findFirst({
    where: {
      roleId: role.roleId,
      companyId: employee.companyId,
      action: "login",
      resource: "admin",
    },
  });

  if (!checkAdminLogin)
    return next(customErrorHandler(res, "You are not authorized here.", 403));

  // Instead of sending full permissions, send only the roleId or permissionId
  const token = createToken(
    {
      email,
      employeeId: employee.employeeId,
      roleId: role.roleId,
      companyId: employee.companyId,
    },
    process.env.JWT_LOGIN_SECRET,
    process.env.JWT_EXPIRY_TIME
  );

  return res.status(200).json({ status, message: "Login Success", token });
};

export const updateEmployeeDepartmentAndTeam = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { departmentId, teamId } = req.body;
  const { employeeId } = req.params;
  const companyId = (req as any).user.companyId;

  // Retrieve employee's previous team
  const employee = await prisma.employee.findUnique({
    where: { employeeId, companyId },
    select: { departmentId: true, teamId: true },
  });
  const previousDepartmentId = employee?.departmentId;
  const previousTeamId = employee?.teamId;

  // Update the employee's department and team
  const updatedEmployee = await prisma.employee.update({
    where: { employeeId, companyId },
    data: { departmentId, teamId },
  });

  // const company = await prisma.company.findUnique({ where: { companyId } });
  // const companyCode = company?.companyCode;

  // // Update employeeDepartmentCode if department changed
  // if (departmentId && departmentId !== previousDepartmentId) {
  //   const departmentEmployeeCount = await prisma.employee.count({ where: { departmentId } });
  //   const employeeDepartmentCode = `${companyCode}-dep-${departmentEmployeeCount}`;
  //   await prisma.employee.update({
  //     where: { employeeId },
  //     data: { employeeDepartmentCode },
  //   });
  // }

  // // Update employeeTeamCode if team changed
  // if (teamId && teamId !== previousTeamId) {
  //   const teamEmployeeCount = await prisma.employee.count({ where: { teamId } });
  //   const employeeTeamCode = `${companyCode}-team-${teamEmployeeCount}`;
  //   await prisma.employee.update({
  //     where: { employeeId },
  //     data: { employeeTeamCode },
  //   });
  // }

  // // Update team employee counts as needed
  // if (previousTeamId && previousTeamId !== teamId) {
  //   await updateTeamEmployeeCount(previousTeamId);
  // }
  await updateTeamEmployeeCount(teamId);
  return res.json({ message: "Employee Updated", updatedEmployee });
};

// export const getEmployeeProfile = async(req:Request,res:Response, next:NextFunction)=>{
//   const employeeId =  (req as any).user.employeeId;
//   const profile = await prisma.employee.findFirst({
//     where:{
//       employeeId
//     },
//     select:{
//       companyId:true,
//       createdAt:true,
//       currentEmployeeStatus:true,
//       departmentId:true,
//       teamId:true,
//       email:true,
//       employeeAddress:true,
//       empllgqoyeeId:true,
//       employeeName:true,
//       isActive:true,
//       phoneNumber:true,
//       profilePicture:true
//     }
//   })

//   return res.json({
//     profile
//   })
// }

export const getEmployeeProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const employeeId = (req as any).user.employeeId;
  const profile = await prisma.employee.findFirst({
    where: {
      employeeId,
    },
    select: {
      companyId: true,
      createdAt: true,
      currentEmployeeStatus: true,
      departmentId: true,
      teamId: true,
      email: true,
      employeeAddress: true,
      employeeId: true,
      employeeName: true,
      isActive: true,
      phoneNumber: true,
      profilePicture: true,
      company: {
        select: {
          companyName: true,
        },
      },
      department: {
        select: {
          departmentName: true,
        },
      },
      team: {
        select: {
          teamName: true,
        },
      },
    },
  });

  return res.json({
    profile,
  });
};

// get all employee of company
export const getAllEmployeeOfCompany = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const companyId = (req as any).user.companyId;
  const employee = await prisma.employee.findMany({
    where: {
      companyId,
    },
  });
  return res.json({
    employee,
  });
};

export const uploadProfilePicture = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { employeeId } = req.params;
  const { employeeName, email, phoneNumber, employeeAddress } = req.body; // Get the profile fields
  let profilePictureUrl;

  try {
    // If there is a file (profile picture), handle the upload
    if (req.file) {
      profilePictureUrl = `uploads/UserPhoto/${req.file.filename}`;
    }

    // Update the employee's profile with the new profile picture URL and other fields
    const updatedEmployee = await prisma.employee.update({
      where: { employeeId },
      data: {
        employeeName, // Update the name
        email, // Update the email
        phoneNumber, // Update the phone number
        employeeAddress, // Update the address
        ...(profilePictureUrl && { profilePicture: profilePictureUrl }), // Update the profile picture only if it exists
      },
    });

    return res.json({
      message: "Profile updated successfully",
      employee: updatedEmployee, // Send the updated employee data
    });
  } catch (error) {
    next(error);
  }
};

export const getEmployeeByID = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { employeeId } = req.params;
  const companyId = (req as any).user.companyId;

  const employeeDetails = await prisma.employee.findFirst({
    where: {
      employeeId: employeeId,
      companyId: companyId,
    },
    select: {
      employeeName: true,
      departmentId: true,
      teamId: true,
      department: {
        select: {
          departmentName: true,
          team: {
            select: {
              teamName: true,
            },
          },
        },
      },
    },
  });

  return res.json({ message: "Employee", employeeDetails });
};

export const getEmployeeDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { employeeId } = req.params;
  const companyId = (req as any).user.companyId;

  const getDetails = await prisma.employee.findFirst({
    where: {
      companyId,
      employeeId,
    },
    include: {
      department: {
        select: {
          departmentName: true,
        },
      },
      team: {
        select: {
          teamName: true,
        },
      },
      position: {
        include: {
          role: {
            select: {
              roleName: true,
            },
          },
        },
      },
    },
  });

  return res.json({ message: "employee details", getDetails });
};

export const sendDeletedEmpReport = async (req: any, res: any, next: any) => {
  const companyId = (req as any).user.companyId;
  const companyName = (req as any).user.companyName;
  const companyEmail = (req as any).user.companyEmail;

  const deletedEmp = await prisma.deletedEmployee.findMany({
    where: {
      companyId,
    },
  });

  const pdfBuffer = await generateDeletedEmpPDF(deletedEmp);

  await deletedEmpPdf({
    email: companyEmail,
    companyName: companyName,
    subject: "Deleted Employees Report",
    attachment: pdfBuffer,
  });
  return res.json({ deletedEmp });
};

//Forget password for employee

export const forgetPassword = async (req: any, res: any, next: any) => {
  try {
    //Taking body from front-end.
    const { email, companyName } = req.body;

    //Validation if comming field is empty or not.
    if (!email) {
      return next(
        customErrorHandler(res, `Employee email field cannot be empty`, 400)
      );
    }
    if (!companyName) {
      return next(
        customErrorHandler(res, `Company-Name field cannot be empty`, 400)
      );
    }

    //validating if email is in correct format or not.
    if (
      /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email) === false
    ) {
      return next(
        customErrorHandler(res, "Employee email must be a valid email", 400)
      );
    }

    //Checking if companyName exist in DB or not
    const company = await prisma.company.findMany();

    const matchingCompany = company.find(
      (company) =>
        company.companyName.trim().toLocaleLowerCase() ===
        companyName.trim().toLocaleLowerCase()
    );

    if (!matchingCompany) {
      return next(
        customErrorHandler(
          res,
          "No company is register with this companyName",
          400
        )
      );
    }

    //Checking if email exist in DB or not
    const employeeEmail = await prisma.employee.findFirst({
      where: {
        email: email,
        companyId: matchingCompany.companyId,
      },
    });

    if (!employeeEmail) {
      return next(
        customErrorHandler(
          res,
          "No employee is register with this email in company please enter correct email",
          400
        )
      );
    }

    // Function to generate OTP
    function generateOTPforForgetPw() {
      const randomNum = Math.random() * 900000;
      const otp = Math.floor(100000 + randomNum);
      return otp;
    }

    // Generate OTP
    const otp = generateOTPforForgetPw();

    // Send OTP to email (implementation not shown here)
    await forgetPasswordEmployee({
      email: email,
      subject: "Verify your OTP",
      companyName: matchingCompany.companyId,
      employeeName: employeeEmail.employeeName,
      otp: otp,
    });

    // Update otp in the database
    await prisma.employee.update({
      where: { email: email, companyId: matchingCompany.companyId },
      data: {
        otp: otp.toString(),
      },
    });

    // Respond with a success message
    return res.json({
      message: `OTP has been sent to your email: ${email}`,
    });
  } catch (error: any) {
    return next(
      customErrorHandler(res, `Internal server error || ${error.message}`, 500)
    );
  }
};

export const verifyOtp = async (req: any, res: any, next: any) => {
  try {
    const { email, otp } = req.body;
    if (!email) {
      return next(customErrorHandler(res, `email field cannot be empty`, 400));
    }
    if (!otp) {
      return next(customErrorHandler(res, `otp field cannot be empty`, 400));
    }

    const checkEmail = await prisma.employee.findFirst({
      where: {
        email: email,
      },
    });

    if (!checkEmail) {
      return next(
        customErrorHandler(res, `provided email is not register`, 400)
      );
    }
    if (!checkEmail.otp) {
      return next(
        customErrorHandler(res, `otp is already used or not generated`, 400)
      );
    }

    if (checkEmail.otp === otp) {
      await prisma.employee.update({
        where: {
          employeeId: checkEmail!.employeeId,
        },
        data: {
          status: true,
          otp: null,
        },
      });
      return res.status(200).json({
        message: "verified",
      });
    } else {
      customErrorHandler(res, `otp is incorrect`, 400);
    }
  } catch (error: any) {
    return next(
      customErrorHandler(res, `Internal server error || ${error.message}`, 500)
    );
  }
};

export const resetPassword = async (req: any, res: any, next: any) => {
  try {
    const { email, password, confirmPassword } = req.body;
    if (!email) {
      return next(customErrorHandler(res, `email field cannot be empty`, 400));
    }
    if (!password) {
      return next(
        customErrorHandler(res, `password field cannot be empty`, 400)
      );
    }
    if (!confirmPassword) {
      return next(
        customErrorHandler(res, `confirmPassword field cannot be empty`, 400)
      );
    }

    const checkEmail = await prisma.employee.findFirst({
      where: {
        email: email,
      },
    });

    if (!checkEmail) {
      return next(
        customErrorHandler(res, `provided email is not register`, 400)
      );
    }

    if (checkEmail.otp) {
      return next(customErrorHandler(res, `your otp is not verified`, 400));
    }

    // Validate password format
    if (
      /^(?=(.*[a-z]))(?=(.*[A-Z]))(?=(.*\W)).{8,}$/.test(password) === false
    ) {
      return next(
        customErrorHandler(
          res,
          "password must be a valid with A minimum length of 8 characters At least one uppercase letter At least one lowercase letter At least one special character",
          400
        )
      );
    }

    if (password !== confirmPassword) {
      return next(
        customErrorHandler(res, `confirmPassword and password is not same`, 400)
      );
    }

    if (checkEmail.status === null) {
      return next(
        customErrorHandler(res, `please generate otp to reset password`, 400)
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const updatePassword = await prisma.employee.update({
      where: {
        employeeId: checkEmail.employeeId,
      },
      data: {
        password: hashedPassword,
      },
    });

    if (!updatePassword) {
      return next(
        customErrorHandler(
          res,
          `something went wrong while updating employee password`,
          400
        )
      );
    }

    if (updatePassword) {
      await prisma.employee.update({
        where: {
          employeeId: checkEmail.employeeId,
        },
        data: {
          status: null,
        },
      });
      return res
        .status(200)
        .json({
          message: "Employee password changed successfully",
          data: updatePassword,
        });
    }
  } catch (error: any) {
    return next(
      customErrorHandler(res, `Internal server error || ${error.message}`, 500)
    );
  }
};
