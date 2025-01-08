import { NextFunction, Request, Response } from "express";
import { customErrorHandler } from "../utils/customErrorHandler.js";
import jwt from "jsonwebtoken";
import prisma from "../models/index.js";
// const util = require("util");
// const promisify = util.promisify;

export const authentication = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // const token = req.cookies.token;
  const { authorization } = req.headers;
  if (!authorization || !authorization.startsWith("Bearer "))
    return next(
      customErrorHandler(res, "Not Authenticated Company, Please Login", 401)
    );

  const token = authorization.split(" ")[1];

  if (!token)
    return next(
      customErrorHandler(res, "Not Authenticated Company, Please Login", 401)
    );

  try {
    const decoded: any = await Promise.resolve().then(() =>
      jwt.verify(token, process.env.JWT_LOGIN_SECRET || "default_secret")
    );

    if (decoded.employeeId) {
      return next(
        customErrorHandler(
          res,
          "unauthorize Only company email and password are valid",
          401
        )
      );
    }

    const loggedUser = await prisma.company.findUnique({
        where: {
          companyId: decoded.companyId,
        },
      });

    // if(!loggedUser?.isApproved) return next(customErrorHandler(res,"Your company is Not active",401))

    if (!loggedUser) {
      return next(
        customErrorHandler(
          res,
          "token is verified but user doesn't exist on our database. Please try again by logout.",
          502
        )
      );
    } else {
      const loggedUserDetails = {
        companyId: loggedUser.companyId,
        companyEmail: loggedUser.companyEmail,
        companyName: loggedUser.companyName,
        companyPhoneNumber: loggedUser.companyPhoneNumber,
        noOfDepartments: loggedUser.noOfDepartments,
      };

    // Add the logged user object to req object
    (req as any).user = loggedUserDetails;
    next();
    }
  } catch (error: any) {
    if (error.name == "TokenExpiredError") {
      return next(customErrorHandler(res, "Token expired!!", 502));
    } else if (error.name === "JsonWebTokenError") {
      return next(customErrorHandler(res, "Invalid token!", 502));
    } else {
      next(error);
    }
  }
};
