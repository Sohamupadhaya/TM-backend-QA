import { NextFunction, Response } from "express";
import { customErrorHandler } from "./customErrorHandler.js";

export const validatePassword = (password: string,res:Response,next:NextFunction) => {
    const messages: string[] = [];

    // Check for at least one lowercase letter
    if (!/(?=.*[a-z])/.test(password)) {
      messages.push("Password must contain at least one lowercase letter.");
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      messages.push("Password must contain at least one uppercase letter.");
    }

    // Check for at least one digit
    if (!/(?=.*\d)/.test(password)) {
      messages.push("Password must contain at least one number.");
    }

    // Check for at least one special character
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      messages.push("Password must contain at least one special character (@$!%*?&).");
    }

    // Check for minimum length of 8 characters
    if (password.length < 8) {
      messages.push("Password must be at least 8 characters long.");
    }

    // If there are messages, return them
    if (messages.length > 0) {
      return next(
        customErrorHandler(
          res,
          messages.join(" "), 
          401
        )
      );
    }

    // If no messages, password is valid
    return true;
  };