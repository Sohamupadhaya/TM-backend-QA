import { NextFunction, Request, Response } from "express";
import { customErrorHandler } from "../utils/customErrorHandler.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { createToken } from "../utils/createToken.js";
import prisma from "../models/index.js";
import { otpVerification, forgetPwOTP } from "../lib/mail.js";
import jwt from "jsonwebtoken";
import { validatePassword } from "../utils/validatePassword.js";
import { jwtDecode } from "jwt-decode";
import { message } from "../lib/multer.js";
import * as useragent from "useragent";
import { json } from "stream/consumers";
import { id } from "date-fns/locale";

// Register company
export const registerCompany = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const {
    companyEmail,
    companyName,
    country,
    state,
    city,
    postalCodeNo,
    companyPhoneNumber,
    companyWebsite,
    password,
    confirmPassword,
    // workingDays,
  } = req.body;

  // const validDays = [
  //   "monday",
  //   "tuesday",
  //   "wednesday",
  //   "thursday",
  //   "friday",
  //   "saturday",
  //   "sunday",
  // ];

  const fields = [
    { key: "companyEmail", Label: "Company Email" },
    { key: "companyName", Label: "Company Name" },
    { key: "country", Label: "Country" },
    { key: "state", Label: "State" },
    { key: "city", Label: "City" },
    { key: "postalCodeNo", Label: "Postal Code No" },
    { key: "companyPhoneNumber", Label: "Company Phone Number" },
    { key: "companyWebsite", Label: "Company Website" },
    { key: "password", Label: "Password" },
    { key: "confirmPassword", Label: "Confirm Password" },
    // { key: "workingDays", Label: "Working Days" },
  ];

  // Validate required fields
  for (const field of fields) {
    if (!req.body[field.key]) {
      return next(customErrorHandler(res, `${field.Label} is required`, 400));
    }
  }

  // validate working days
  // if (
  //   !Array.isArray(workingDays) ||
  //   !workingDays.every((day: string) => validDays.includes(day.toLowerCase()))
  // )
  if (/^(?=(.*[a-z]))(?=(.*[A-Z]))(?=(.*\W)).{8,}$/.test(password) === false) {
    // Validate password format
    return next(
      customErrorHandler(
        res,
        "password must be a valid with A minimum length of 8 characters At least one uppercase letter At least one lowercase letter At least one special character",
        400
      )
    );
  }

  // Validate email format
  if (
    /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(companyEmail) ===
    false
  ) {
    return next(
      customErrorHandler(res, "Company email must be a valid email", 400)
    );
  }

  // Validate phone number format
  if (!/^\+?[1-9]\d{1,14}$/.test(companyPhoneNumber)) {
    return next(
      customErrorHandler(
        res,
        "Company phone number must be a valid number",
        400
      )
    );
  }

  // Checking for password and confirm password
  if (password !== confirmPassword) {
    return next(
      customErrorHandler(res, "password and confirm password didnot match", 400)
    );
  }

  // Check for existing company email or phone number
  const company = await prisma.company.findFirst({
    where: {
      OR: [
        { companyEmail },
        { companyPhoneNumber },
        { companyName: companyName.trim().toLowerCase() },
        { companyWebsite },
      ],
    },
  });
  if (company) {
    if (company.companyEmail === companyEmail) {
      return next(
        customErrorHandler(res, "Company with this email already exists", 400)
      );
    }
    if (
      company.companyName.trim().toLowerCase() ===
      companyName.trim().toLowerCase()
    ) {
      return next(
        customErrorHandler(res, "Company with this name already exists", 400)
      );
    }
    if (company.companyPhoneNumber === companyPhoneNumber) {
      return next(
        customErrorHandler(
          res,
          "Company with this phone number already exists",
          400
        )
      );
    }
    if (company.companyWebsite === companyWebsite) {
      return next(
        customErrorHandler(
          res,
          "Company website with this name already exists",
          400
        )
      );
    }
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);
  //generate the company code from the first three words of the email
  const emailPrefix = companyEmail.split("@")[0];
  const randomNumberCode = Math.floor(Math.random() * (1000 - 1 + 1)) + 1;
  const companyCode =
    emailPrefix.slice(0, 3).toLowerCase() + randomNumberCode.toString();
  console.log(companyCode);

  // Create a new company record
  await prisma.company.create({
    data: {
      companyEmail,
      companyName: companyName.trim().toLowerCase(),
      country,
      state,
      city,
      postalCodeNo,
      companyPhoneNumber,
      companyWebsite,
      password: hashedPassword,
      companyCode,
      // workingDays,
    },
  });

  // Function to generate a random OTP
  const generateOTP = () => {
    const randomNum = Math.random() * 900000;
    return Math.floor(100000 + randomNum);
  };

  const otp = generateOTP();
  // Send OTP verification email
  await otpVerification({
    email: companyEmail,
    subject: "Verify your OTP",
    companyName,
    otp,
  });
  // Store the OTP in the database
  await prisma.companyRegistrationOTP.create({
    data: {
      otp: otp.toString(),
      companyEmail,
    },
  });
  return res.json({
    message: `OTP has been sent to your email: ${companyEmail}`,
  });
};

// company otp verification
export const verifyCompanyRegistrationOTP = async (
  req: any,
  res: any,
  next: any
) => {
  const { otp, companyEmail, timeZone } = req.body;
  // checking all fields
  if (!otp) {
    return next(customErrorHandler(res, "otp is required", 400));
  }

  if (!companyEmail) {
    return next(customErrorHandler(res, "company email is required", 400));
  }

  if (!timeZone) {
    return next(customErrorHandler(res, "timeZone is required", 400));
  }

  const companyOTP = await prisma.companyRegistrationOTP.findFirst({
    where: {
      companyEmail,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!companyOTP) {
    return next(
      customErrorHandler(res, "No user is register with this email", 400)
    );
  }

  if (otp === companyOTP?.otp) {
    const company = await prisma.company.findFirst({
      where: {
        companyEmail,
      },
    });
    if (!company)
      return next(customErrorHandler(res, "Company not found", 404));

    if (company.isVerified) {
      return next(customErrorHandler(res, "User is already verified", 400));
    }

    const updatedCompany = await prisma.company.update({
      where: {
        companyEmail,
      },
      data: {
        isVerified: true,
      },
    });

    const timeOfCompany = await prisma.actualTimeOfCompany.findFirst({
      where: {
        companyId: company?.companyId,
      },
    });

    if (timeOfCompany)
      return next(
        customErrorHandler(
          res,
          "Already set Login and logout time please update existing time.",
          400
        )
      );
    await prisma.actualTimeOfCompany.create({
      data: {
        actualLoginTime: "9:00",
        actualLogoutTime: "18:00",
        companyId: company?.companyId,
        timeZone,
      },
    });

    return res.json({ status: 200, message: "Successfully verified" });
  }
  return next(customErrorHandler(res, "Wrong OTP.", 400));
};

// Login Company
export const loginCompany = async (req: any, res: any, next: any) => {
  try {
    // data comming from body
    const { companyEmail, password } = req.body;

    let compId: string;
    let empId: string;
    let devType: string;

    //checking weather body data is empty or not
    if (!companyEmail) {
      return next(customErrorHandler(res, "email field is not provided", 400));
    }

    if (!password) {
      return next(
        customErrorHandler(res, "password field is not provided", 400)
      );
    }

    //checking weather email is given email is register or not in DB
    const company = await prisma.company.findFirst({
      where: {
        companyEmail,
      },
    });

    // console.log(company);
    if (!company) {
      const employee = await prisma.employee.findFirst({
        where: {
          email: companyEmail,
        },
      });
      if (!employee) {
        return next(customErrorHandler(res, "No user found", 400));
      }

      //Validating employee is there or not
      if (employee) {
        compId = employee.companyId;
        empId = employee.employeeId;
        const roleOfUser = await prisma.userRole.findFirst({
          where: {
            employeeId: employee.employeeId,
          },
        });
        if (!roleOfUser) {
          return next(customErrorHandler(res, "No role found", 400));
        }
        if (roleOfUser) {
          const roleOfUsers = await prisma.roles.findFirst({
            where: {
              roleId: roleOfUser.roleId,
            },
          });
          if (!roleOfUsers) {
            return next(customErrorHandler(res, "No role found", 400));
          }
          if (roleOfUsers.roleName.toLowerCase() !== "admin") {
            return next(customErrorHandler(res, "the user is not admin", 400));
          } else {
            const isMatch = await bcrypt.compareSync(
              password,
              employee.password
            );
            if (!isMatch) {
              return next(customErrorHandler(res, "Invalid Credentials", 400));
            }
            const token = createToken(
              { companyEmail, companyId: employee.companyId },
              process.env.JWT_LOGIN_SECRET,
              process.env.JWT_EXPIRY_TIME
            );
            //generating current utc time.

            function getCurrentUtcTime(): string {
              const currentUtcTime = new Date().toISOString();
              return currentUtcTime;
            }

            const FindCompanyOwner = await prisma.company.findFirst({
              where: {
                companyId: employee.companyId,
              },
            });

            if (!FindCompanyOwner) {
              return next(
                customErrorHandler(res, "Company user notrr found", 400)
              );
            }

            // excluding password so it couldnot be display in response
            const { password: _, ...employeeData } = employee;
            const { password: __, ...companyData } = FindCompanyOwner;
            // console.log(new Date());

            interface DeviceInfo {
              os: string;
              device: string;
            }
            function getDeviceInfo(userAgentString: string): DeviceInfo {
              const agent = useragent.parse(userAgentString);
              const os = agent.os.toString(); // Operating System
              const device = agent.device.toString(); // Device
              return {
                os,
                device,
              };
            }
            const userAgentString = req.headers["user-agent"];

            const deviceInfo = getDeviceInfo(userAgentString);

            const loginUserHistory = await prisma.companyLoginHistory.create({
              data: {
                companyId: compId,
                employeeId: empId,
                loginTime: new Date().toISOString(),
                deviceType: deviceInfo.os,
              },
            });
            if (!loginUserHistory) {
              return next(
                customErrorHandler(
                  res,
                  "Something went wrong while creating loginCompanyHistory",
                  400
                )
              );
            }
            return res.status(200).json({
              message: "Login Successfully",
              token,
              company: companyData,
              employee: employeeData,
            });
          }
        }
      }
    }

    //if company is directly login in .
    if (company) {
      //checking password matches or not
      const isMatch = await bcrypt.compareSync(password, company.password);

      //validation if password didnot match
      if (!isMatch)
        return next(customErrorHandler(res, "Invalid Credentials", 400));

      //generating Token
      const token = createToken(
        { companyEmail, companyId: company.companyId },
        process.env.JWT_LOGIN_SECRET,
        process.env.JWT_EXPIRY_TIME
      );

      //if company verify status is false
      if (!company.isVerified)
        return next(
          customErrorHandler(
            res,
            "Your OTP verification is not completed.",
            400
          )
        );

      //generating current utc time.
      function getCurrentUtcTime(): string {
        const currentUtcTime = new Date().toISOString();
        return currentUtcTime;
      }

      //checking which device is sending request
      interface DeviceInfo {
        os: string;
        device: string;
      }
      function getDeviceInfo(userAgentString: string): DeviceInfo {
        const agent = useragent.parse(userAgentString);
        const os = agent.os.toString(); // Operating System
        const device = agent.device.toString(); // Device
        return {
          os,
          device,
        };
      }

      //checking request header and graving user-agent from header.
      const userAgentString = req.headers["user-agent"];

      const deviceInfo = getDeviceInfo(userAgentString);

      //storing data in login-history-database
      const loginUserHistory = await prisma.companyLoginHistory.create({
        data: {
          companyId: company.companyId,
          employeeId: null,
          loginTime: new Date().toISOString(),
          deviceType: deviceInfo.os,
        },
      });

      //validation if
      if (!loginUserHistory) {
        return next(
          customErrorHandler(
            res,
            "Something went wrong while creating loginCompanyHistory",
            400
          )
        );
      }

      // console.log(getCurrentUtcTime());

      //update the login time in DB
      const loginTimeofUser = await prisma.company.update({
        where: { companyEmail: companyEmail }, // Specify the company to update by id
        data: {
          loginTime: getCurrentUtcTime(), // Only updating loginTime field
        },
      });

      //if any thing went wrong while updating it will send an error message
      if (!loginTimeofUser) {
        customErrorHandler(res, "problem while inserting login time.", 400);
      }

      // excluding password so it couldnot be display in response
      const { password: _, ...companyData } = loginTimeofUser;

      return res
        .status(200)
        .json({ message: "Login Successfully", token, company: companyData });
    }
  } catch (error: any) {
    return next(customErrorHandler(res, `server Error ${error.message}`, 500));
  }
};

//  actual login time of the company
export const actualTimeOfCompany = async (req: any, res: any, next: any) => {
  const companyId = req.user?.companyId;
  const { actualLoginTime, actualLogoutTime } = req.body;
  const timeOfCompany = await prisma.actualTimeOfCompany.findFirst({
    where: {
      companyId,
    },
  });
  if (timeOfCompany)
    return next(
      customErrorHandler(
        res,
        "Already set Login and logout time please update existing time.",
        400
      )
    );
  const newTimeOfCompany = await prisma.actualTimeOfCompany.create({
    data: {
      actualLoginTime,
      actualLogoutTime,
      companyId,
    },
  });
  return res.json({ companyTime: newTimeOfCompany });
};

// actual company time
export const getActualTimeOfCompany = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const companyId = (req as any).user.companyId;
  const actualCompanyTime = await prisma.actualTimeOfCompany.findFirst({
    where: {
      companyId,
    },
  });
  return res.json({
    actualCompanyTime,
  });
};

// update company time
export const updateActualCompanyTime = async (
  req: any,
  res: any,
  next: any
) => {
  const companyId = req.user?.companyId;
  const { actualTimeId } = req.params;
  const { actualLoginTime, actualLogoutTime } = req.body;
  const timeOfCompany = await prisma.actualTimeOfCompany.findFirst({
    where: {
      companyId,
    },
  });
  if (!timeOfCompany)
    return next(
      customErrorHandler(res, "Actual Time of company not found.", 400)
    );
  const updatedCompanyTime = await prisma.actualTimeOfCompany.update({
    where: {
      companyId,
      actualTimeId,
    },
    data: {
      actualLoginTime,
      actualLogoutTime,
    },
  });
  return res.json({ message: "Update Company Time", updatedCompanyTime });
};

// get all employee of company
export const getAllEmployeeOfCompany = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const companyId = req.user?.companyId;
  console.log("company id", companyId);

  const employees = await prisma.employee.findMany({
    where: {
      companyId,
    },
    include: {
      position: {
        include: {
          role: true,
        },
      },
      department: true, // Include department directly
      team: true, // Include team directly
    },
  });

  // Format the output to include role names, department name, and team name
  const formattedEmployees = employees.map((employee) => ({
    employeeId: employee.employeeId,
    employeeName: employee.employeeName,
    email: employee.email,
    phoneNumber: employee.phoneNumber,
    employeeAddress: employee.employeeAddress,
    employeeCode: employee.employeeCode,
    isActive: employee.isActive,
    currentEmployeeStatus: employee.currentEmployeeStatus,
    departmentId: employee?.departmentId,
    teamId: employee?.teamId,
    roleId: employee.position.map((userRole) => userRole.role.roleId),
    roles: employee.position.map((userRole) => userRole.role.roleName),
    departmentName: employee.department?.departmentName || null,
    teamName: employee.team?.teamName || null,
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt,
  }));

  console.log("emp", formattedEmployees);
  return res.json({
    employees: formattedEmployees,
  });
};

// get all employee of department
export const getAllEmployeeOfDepartment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const companyId = (req as any).user.companyId;
  const { departmentId } = req.params;

  const employees = await prisma.employee.findMany({
    where: {
      companyId,
      departmentId,
    },
  });
  return res.json({ employees });
};

// get all employee of teams
export const getAllEmployeeOfTeams = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const companyId = (req as any).user.companyId;
  const { teamId } = req.params;

  const allEmployees = await prisma.employee.findMany({
    where: {
      companyId,
      teamId,
    },
    include: {
      position: {
        include: {
          role: true,
        },
      },
    },
  });

  const employees = allEmployees.map((employee) => ({
    employeeId: employee.employeeId,
    employeeName: employee.employeeName,
    employeeCode: employee.employeeCode,
    email: employee.email,
    phoneNumber: employee.phoneNumber,
    employeeAddress: employee.employeeAddress,
    isActive: employee.isActive,
    currentEmployeeStatus: employee.currentEmployeeStatus,
    roles: employee.position.map((userRole) => userRole.role.roleName),
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt,
  }));

  return res.json({ employees });
};

export const forgetPassword = async (req: any, res: any, next: any) => {
  const { companyEmail, companyName } = req.body;

  //validation for email
  if (!companyName) {
    return next(
      customErrorHandler(res, "Company name field is not provided.", 400)
    );
  }

  //validation for email
  if (!companyEmail) {
    return next(customErrorHandler(res, "Email field is not provided.", 400));
  }

  // Validate email format
  if (
    /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(companyEmail) ===
    false
  ) {
    return next(customErrorHandler(res, "Email must be a valid email", 400));
  }

  // Find the company by email
  const company = await prisma.company.findFirst({
    where: {
      companyEmail,
    },
  });
  // If the company does not exist, return an error
  if (!company) {
    return next(customErrorHandler(res, "Email is not register with us.", 400));
  }
  // If the company does not exist, return an error
  if (company.companyName.toLowerCase() !== companyName.trim().toLowerCase()) {
    return next(customErrorHandler(res, "Company Name is incorrect", 400));
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
  await forgetPwOTP({
    email: companyEmail,
    subject: "Verify your OTP",
    companyName: company.companyName,
    otp: otp,
  });

  //check alreadyEmail is not
  const checkOtpAndUpdate = await await prisma.forgetPwOTPStore.findFirst({
    where: {
      companyEmail: companyEmail,
    },
  });

  // update otp
  if (checkOtpAndUpdate) {
    await prisma.forgetPwOTPStore.update({
      where: {
        // Condition to find the record (e.g., unique identifier)
        forgetPwId: checkOtpAndUpdate.forgetPwId, // example ID
      },
      data: {
        // Data to update
        otp: otp.toString(),
        status: null,
      },
    });
  }

  if (!checkOtpAndUpdate) {
    // Create entry in the database
    await prisma.forgetPwOTPStore.create({
      data: {
        otp: otp.toString(),
        companyEmail,
      },
    });
  }
  // Respond with a success message
  return res.json({
    message: `OTP has been sent to your email: ${companyEmail}`,
  });
};

export const verifyForgetPwOTP = async (req: any, res: any, next: any) => {
  const { otp, companyEmail } = req.body;

  if (!otp) {
    return next(customErrorHandler(res, "otp is required", 400));
  }

  if (!companyEmail) {
    return next(customErrorHandler(res, "company email is required", 400));
  }

  // Find the most recent OTP entry for the given email
  const PwOTP = await prisma.forgetPwOTPStore.findFirst({
    where: {
      companyEmail,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  // Check if an OTP was found and if it matches the provided OTP
  if (PwOTP && otp === PwOTP.otp) {
    const removeOtp = await prisma.forgetPwOTPStore.update({
      where: {
        forgetPwId: PwOTP.forgetPwId,
      },
      data: {
        // List the fields you want to update
        status: true,
        otp: null,
        // You can include multiple fields to update at once
      },
    });

    if (!removeOtp) {
      return next(
        customErrorHandler(
          res,
          "something went wrong while updating otp status",
          400
        )
      );
    }
    // OTP is verified; you might want to proceed with password reset or other actions
    const company = await prisma.company.findFirst({
      where: {
        companyEmail,
      },
    });
    return res.json({ message: "Forget Password OTP is verified." });
  }

  // If OTP is incorrect or no OTP was found
  return next(customErrorHandler(res, "Wrong OTP or email.", 400));
};

export const resetPw = async (req: any, res: any, next: any) => {
  const { companyEmail, newPassword, confirmPassword } = req.body;

  if (!companyEmail) {
    return next(customErrorHandler(res, "Email field is required", 400));
  }
  if (!newPassword) {
    return next(customErrorHandler(res, "New-password field is required", 400));
  }
  if (!confirmPassword) {
    return next(
      customErrorHandler(res, "Confirm-password field is required", 400)
    );
  }

  const otpStatusChecker = await prisma.forgetPwOTPStore.findFirst({
    where: {
      companyEmail,
    },
  });

  if (newPassword !== confirmPassword) {
    return res
      .status(400)
      .json({ message: "Confirm-Password and Passwords did not match" });
  }

  if (otpStatusChecker?.status !== true && otpStatusChecker?.otp === null) {
    customErrorHandler(res, "you have already changed password", 400);
  }

  if (otpStatusChecker?.status !== true) {
    customErrorHandler(res, "otp is not verified", 400);
  }

  if (
    /^(?=(.*[a-z]))(?=(.*[A-Z]))(?=(.*\W)).{8,}$/.test(newPassword) === false
  ) {
    // Validate password format
    return next(
      customErrorHandler(
        res,
        "password must be a valid with A minimum length of 8 characters At least one uppercase letter At least one lowercase letter At least one special character",
        400
      )
    );
  }

  // Find the company or user based on the decoded email
  const company = await prisma.company.findUnique({
    where: { companyEmail },
  });
  if (!company) {
    return res
      .status(400)
      .json({ message: "This email is not register with us" });
  }
  // Hash the new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update the password in the database
  const updatingPassword = await prisma.company.update({
    where: { companyEmail },
    data: { password: hashedPassword },
  });

  if (otpStatusChecker?.status === true && otpStatusChecker?.otp === null) {
    const removeOtp = await prisma.forgetPwOTPStore.update({
      where: {
        forgetPwId: otpStatusChecker!.forgetPwId,
      },
      data: {
        // List the fields you want to update
        status: null,
        otp: null,
        // You can include multiple fields to update at once
      },
    });

    if (!removeOtp) {
      return next(
        customErrorHandler(
          res,
          "something went wrong while updating otp status",
          400
        )
      );
    }
  }

  if (!updatingPassword) {
    return res
      .status(400)
      .json({ message: "Something went wrong while updating password" });
  }
  return res.status(200).json({ message: "Password reset successfully" });
};

// export const changePassword = async (req: any, res:any, next:any) => {
//   const { currentPassword, newPassword, confirmPassword } = req.body;
//   const companyId =  (req as any).user.companyId;

//   const company = await prisma.company.findUnique({
//     where: {
//       companyId
//     }
//   })

//   if(!company){
//     return res.status(404).json({ message: "Company not found" });
//   }

//   if(newPassword !== confirmPassword){
//     return res.status(404).json({ message: "Password doesn't match. " });
//   }else if(currentPassword !== company.password){
//     return res.status(404).json({ message: "Old Password doesn't match. " });
//   }

//   const updatePassword = await prisma.company.update({
//     where:{
//       companyId
//     },
//     data:{
//       password: newPassword
//     }
//   })

// }

export const changePassword = async (req: any, res: any, next: any) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword) {
    return res
      .status(400)
      .json({ message: "Current-password field sholuld be provided" });
  }
  if (!newPassword) {
    return res
      .status(400)
      .json({ message: "New-Password field sholuld be provided" });
  }
  if (!confirmPassword) {
    return res
      .status(400)
      .json({ message: "Confirm-Password field sholuld be provided" });
  }

  const companyId = (req as any).user.companyId;

  // Fetch the company by companyId
  const company = await prisma.company.findUnique({
    where: {
      companyId,
    },
  });

  if (!company) {
    return res.status(404).json({ message: "Company not found" });
  }

  if (
    /^(?=(.*[a-z]))(?=(.*[A-Z]))(?=(.*\W)).{8,}$/.test(newPassword) === false
  ) {
    // Validate password format
    return next(
      customErrorHandler(
        res,
        "password must be a valid with A minimum length of 8 characters At least one uppercase letter At least one lowercase letter At least one special character",
        400
      )
    );
  }

  // Compare the provided currentPassword with the stored hashed password
  const isCurrentPasswordValid = await bcrypt.compare(
    currentPassword,
    company.password
  );

  if (!isCurrentPasswordValid) {
    return res.status(400).json({ message: "Old password is incorrect." });
  }

  // Check if the new passwords match
  if (newPassword !== confirmPassword) {
    return res
      .status(400)
      .json({ message: "New-Passwords do not match Confirm-Password." });
  }

  // Hash the new password
  const hashedNewPassword = await bcrypt.hash(newPassword, 10);

  // Update the password in the database
  await prisma.company.update({
    where: {
      companyId,
    },
    data: {
      password: hashedNewPassword,
    },
  });

  // Respond with success message
  return res.json({ message: "Password changed successfully." });
};

export const companyProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const companyId = (req as any).user.companyId;
  const profile = await prisma.company.findFirst({
    where: {
      companyId,
    },
  });
  return res.json({
    profile,
  });
};

export const getEmployeeProfileDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { employeeId } = req.params;
  const profile = await prisma.employee.findFirst({
    where: {
      employeeId,
    },
  });

  return res.json({
    profile,
  });
};

export const googleLoginCompany = async (req: any, res: any, next: any) => {
  const googleId = req.body.googleId;
  // console.log('🚀 ~ googleLoginCompany ~ googleId:', googleId);
  const companyDetails: any = jwtDecode(googleId);
  // console.log('🚀 ~ googleLoginCompany ~ companyDetails:', companyDetails);
  const companyEmail = companyDetails?.email;
  const companyName = companyDetails.given_name;
  const password = companyDetails?.sub;
  const hashedPassword = await bcrypt.hash(password, 10);
  // const password = companyDetails?.
  // console.log('🚀 ~ googleLoginCompany ~ companyDetails:', companyDetails);
  const Exists = await prisma.company.findFirst({
    where: {
      companyEmail,
    },
  });
  // console.log('🚀 ~ googleLoginCompany ~ Exists:', Exists);

  if (!Exists) {
    const createCompany = await prisma.company.create({
      data: {
        companyEmail,
        companyName,
        password: hashedPassword,
      },
    });

    const token = createToken(
      { companyEmail, companyId: createCompany.companyId },
      process.env.JWT_LOGIN_SECRET,
      process.env.JWT_EXPIRY_TIME
    );

    return res
      .status(200)
      .json({ message: "Login Success", token, company: Exists });
  } else {
    const isMatch = bcrypt.compareSync(password, Exists?.password);
    console.log("🚀 ~ googleLoginCompany ~ isMatch:", isMatch);
    if (!isMatch) {
      return next(customErrorHandler(res, "Invalid Credentials", 401));
    }
    const token = createToken(
      { companyEmail, companyId: Exists.companyId },
      process.env.JWT_LOGIN_SECRET,
      process.env.JWT_EXPIRY_TIME
    );
    return res
      .status(200)
      .json({ message: "Login Success", token, company: Exists });
  }
};

export const uploadCompanyPhoto = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { companyId } = req.params;
  const {
    companyName,
    companyEmail,
    companyPhoneNumber,
    companyWebsite,
    country,
    state,
    city,
    postalCodeNo,
  } = req.body; // Get the profile fields
  let companyPhotoUrl;

  try {
    // If there is a file (company photo), handle the upload
    if (req.file) {
      companyPhotoUrl = `/uploads/CompanyPhoto/${req.file.filename}`;
      console.log(
        ":rocket: ~ uploadCompanyPhoto ~ companyPhotoUrl:",
        companyPhotoUrl
      );
    }

    // Update the company's profile
    const updatedCompany = await prisma.company.update({
      where: { companyId },
      data: {
        companyName,
        companyEmail,
        companyPhoneNumber,
        companyWebsite,
        country,
        state,
        city,
        postalCodeNo,
        ...(companyPhotoUrl && { companyPhoto: companyPhotoUrl }),
      },
    });

    return res.json({
      message: "Company profile updated successfully",
      company: updatedCompany, // Send the updated company data
    });
  } catch (error) {
    next(error);
  }
};

export const removeCompanyPhoto = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const companyId = (req as any).user.companyId;

  const removePhoto = await prisma.company.update({
    where: { companyId },
    data: {
      companyPhoto: null,
    },
  });

  return res.json({
    message: "Company photo has been removed.",
    company: removePhoto,
  });
};

export const getLoginAllUserHistory = async (req: any, res: any, next: any) => {
  try {
    let employeeIds: string[] = [];
    let companyData: string[] = [];
    const user = req.user.companyId;

    const data = await prisma.companyLoginHistory.findMany({
      where: {
        companyId: user,
      },
    });

    if (!data) {
      return next(customErrorHandler(res, "company  is not login yet.", 400));
    }

    const formattedData = data.map((loginHistory: any) => {
      if (loginHistory.employeeId) {
        employeeIds.push(loginHistory.employeeId);
      } else {
        companyData.push(loginHistory);
      }
    });

    const employees = await prisma.employee.findMany({
      where: {
        employeeId: {
          in: employeeIds, // Match employeeId in the provided list
        },
      },
    });

    if (!employees) {
      return next(customErrorHandler(res, "No Employee data found", 400));
    }

    const mergedData = data
      .map((history, index) => {
        // Find the employee data for the current login history
        const employee = employees.find(
          (emp) => emp.employeeId === history.employeeId
        );

        // If employee is found, merge the data, otherwise return null or an error message
        if (employee) {
          // console.log(index);
          return {
            id: history.id,
            companyId: history.companyId,
            employeeId: history.employeeId,
            loginTime: history.loginTime,
            deviceType: history.deviceType,
            createdAt: history.createdAt,
            updatedAt: history.updatedAt,
            employeeName: employee.employeeName,
            employeeEmail: employee.email,
            // employeePosition: employee.position,
            // You can add more fields here as per your requirements
          };
        } else {
          return null; // Handle case where no employee is found (if necessary)
        }
      })
      .filter((item) => item !== null); // Remove any null entries (if there were any unmatched employees)

    // Step 4: Return the merged data
    return res
      .status(200)
      .json({ data: mergedData, companyLogin: companyData });
  } catch (error) {
    return next(customErrorHandler(res, "Server error", 500));
  }
};

export const workingDays = async (req: any, res: any, next: any) => {
  try {
    const workingDays = req.body.workingDays;
    const company = req.user.companyId;

    if (!workingDays) {
      return next(customErrorHandler(res, "workingDays is required", 400));
    }

    const validDays = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];

    // Make sure workingDays is an array, even if it's a single string.
    let daysArray: string[] = [];

    if (typeof workingDays === "string") {
      daysArray = [workingDays.trim().toLowerCase()];
    } else if (Array.isArray(workingDays)) {
      daysArray = workingDays.map((day: string) => day.trim().toLowerCase());
    }

    // Validate the workingDays
    for (const day of daysArray) {
      if (!validDays.includes(day)) {
        return next(
          customErrorHandler(res, "workingDays contains invalid days", 400)
        );
      }
    }

    // Now update the company with the workingDays array
    const data = await prisma.company.update({
      where: {
        companyId: company,
      },
      data: {
        workingDays: daysArray, // This should now be an array of strings
      },
    });

    if (!data) {
      return next(
        customErrorHandler(
          res,
          "something went wrong while updating workingDays",
          400
        )
      );
    }

    // excluding password so it couldnot be display in response
    const { password: _, ...companyData } = data;

    return res.status(200).json({
      status: 200,
      message: "Working days updated",
      data: companyData,
    });
  } catch (error: any) {
    return next(customErrorHandler(res, `server Error ${error.message}`, 500));
  }
};
