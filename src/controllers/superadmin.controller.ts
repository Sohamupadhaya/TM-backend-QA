// import { NextFunction, Request, Response } from "express";
// import { customErrorHandler } from "../utils/customErrorHandler.js";
// import bcrypt from "bcrypt";
// import { createToken } from "../utils/createToken.js";
// import prisma from "../models/index.js";

// export const loginSuperAdmin = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   const { email, password } = req.body;
//   const superAdmin = await prisma.superAdmin.findFirst({
//     where: {
//       email,
//     },
//   });
//   if (!superAdmin)
//     return next(customErrorHandler(res, "Invalid Credentials", 401));
//   const isMatch = await bcrypt.compareSync(password, superAdmin.password);
//   if (!isMatch)
//     return next(customErrorHandler(res, "Invalid Credentials", 401));
//   const token = createToken(
//     { email, superAdminId: superAdmin.id },
//     process.env.JWT_LOGIN_SECRET,
//     process.env.JWT_EXPIRY_TIME
//   );
//   return res.status(200).json({ message: "Login Success", token });
// };

// // Approve or Deny company by super admin
// export const approveOrDenyCompany = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   const { companyId, approveStatus } = req.body;
//   const company = await prisma.company.findFirst({
//     where: {
//       companyId,
//     },
//   });
//   if (!company) return next(customErrorHandler(req, "Company Not found", 404));

//   const updatedCompany = await prisma.company.update({
//     where: {
//       companyId: companyId,
//     },
//     data: {
//       isApproved: approveStatus,
//     },
//   });

//   return res.json({ message: `approve is: ${updatedCompany.isApproved}` });
// };


// // display all companies
// export const displayAllCompanies = async(req:Request,res:Response,next:NextFunction)=>{
//   const allCompanies = await prisma.company.findMany({
//     orderBy:{
//       createdAt:"desc"
//     }
//   })
//   return res.json({
//     allCompanies
//   })
// }

// // display all verified companies
// export const displayAllVerifiedCompanies = async(req:Request,res:Response,next:NextFunction)=>{
//   const allVerifiedCompanies = await prisma.company.findMany({
//     where:{
//       isVerified:true
//     },
//     orderBy:{
//       createdAt:"desc"
//     }
//   })
//   return res.json({
//     allVerifiedCompanies
//   })
// }

// // display all verified and not approved companies
// export const displayAllVerifiedNotApprovedCompanies = async(req:Request,res:Response,next:NextFunction)=>{
//   const allVerifiedNotApprovedCompanies = await prisma.company.findMany({
//     where:{
//       isVerified:true,
//       isApproved:false
//     },
//     orderBy:{
//       createdAt:"desc"
//     }
//   })
//   return res.json({
//     allVerifiedNotApprovedCompanies
//   })
// }

// // display all verified and approved companies 
// export const displayAllVerifiedAndApprovedCompanies = async(req:Request,res:Response,next:NextFunction)=>{
//   const allVerifiedAndApprovedCompanies = await prisma.company.findMany({
//     where:{
//       isApproved:true, isVerified:true
//     },
//     orderBy:{
//       createdAt:"desc"
//     }
//   })

//   return res.json({
//     allVerifiedAndApprovedCompanies
//   })
// }