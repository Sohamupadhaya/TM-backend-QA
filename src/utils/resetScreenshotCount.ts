import cron from 'node-cron'
import prisma from '../models/index.js'
export const resetDailyScreenshotCount=()=>{
    cron.schedule('0 0 * * *',async()=>{
        await prisma.company.updateMany({
            data:{
                dailyScreenshotCount:0,
                lastScreenshotReset:new Date()
            }
        })
    })
}