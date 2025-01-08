import { customErrorHandler } from "../utils/customErrorHandler.js";
import prisma from '../models/index.js'
import { NextFunction,Request,Response } from "express";
import schedule from 'node-schedule'
export const addCompanyFreeTrail = async(req:Request,res:Response,next:NextFunction)=>{
    const companyId = req.params.id
    console.log("🚀 ~ addCompanyFreeTrail ~ companyId:", companyId)
    const getCompanyStartDate=await prisma.company.findUnique({
        where:{
            companyId
        },select:{
            createdAt:true
        }
    })

    if(!getCompanyStartDate){
        return next(customErrorHandler(res,'Please provide all the information.',401))
    }
    const startDate = new Date(getCompanyStartDate?.createdAt);
    console.log("🚀 ~ addCompanyFreeTrail ~ startDate:", startDate)
    const endDate=new Date(startDate);
    // endDate.setDate(startDate.getDate()+15 )
    endDate.setSeconds(startDate.getSeconds()+15 )
    console.log("🚀 ~ addCompanyFreeTrail ~ endDate:", endDate)

    const startFreeTrail=await prisma.freeTrail.create({
        data:{
            companyId,
            startDate,
            endDate,
            isExpired:false
        }
    });
    const endDate1 = new Date(Date.now() + 15 * 1000); // Schedule for 15 seconds later
    console.log("🚀 ~ addCompanyFreeTrail ~ endDate1:", endDate1)

    schedule.scheduleJob(endDate,async()=>{
        await prisma.freeTrail.update({
            where:{
                companyId
            },data:{
                isExpired:true
            }
        })
    })
    return res.status(201).json(startFreeTrail)
}