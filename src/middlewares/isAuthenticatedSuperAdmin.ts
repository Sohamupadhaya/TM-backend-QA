import { NextFunction, Request, Response } from "express";
import { customErrorHandler } from "../utils/customErrorHandler.js";
import jwt from "jsonwebtoken"
import prisma from "../models/index.js";

export const isAuthenticatedSuperAdmin = async (req:Request, res:Response, next:NextFunction) => {
  // const token = req.cookies.token;
  const { authorization } = req.headers;
  if (!authorization || !authorization.startsWith("Bearer "))
    return next(
      customErrorHandler(res, "Not Authenticated SuperAdmin, Please Login", 406)
    );

  const token = authorization.split(" ")[1];

  if (!token)
    return next(
      customErrorHandler(res, "Not Authenticated SuperAdmin, Please Login", 406)
    );

  try {
    
    const decoded :any  = await Promise.resolve().then(() => jwt.verify(token, process.env.JWT_LOGIN_SECRET || 'default_secret'));


    const loggedUser = await prisma.superAdmin.findUnique({
        where: {
          id: decoded.superAdminId,
        },
      });

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
        id: loggedUser.id,
        name: loggedUser.name,
        
        email: loggedUser.email,
      };

      // Add the logged user object to req object
      
      (req as any).user = loggedUserDetails;
      next();
    }
  } catch (error:any) {
    if (error.name == "TokenExpiredError") {
      return next(customErrorHandler(res, "Token expired!!", 502));
    } else if (error.name === "JsonWebTokenError") {
      return next(customErrorHandler(res, "Invalid token!", 502));
    } else {
      next(error);
    }
  }
};
