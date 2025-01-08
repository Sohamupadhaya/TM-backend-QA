import { NextFunction, Request, Response } from "express";
import { customErrorHandler } from '../utils/customErrorHandler.js';
import prisma from '../models/index.js';
import { Jimp } from 'jimp';
import fs from 'fs';
import path from 'path';


export const addWatermarkToScreenshot = async (req: Request, res: Response, next: NextFunction) => {
    const { screenshotId } = req.params;
    const companyId = (req as any).user.companyId;
    console.log("company Id", companyId)

    try {
        console.log("Current Working Directory:", process.cwd());

        const screenshot = await prisma.screenshot.findFirst({
            where: {
                companyId,
                screenshotId
            }
        });

        if (!screenshot) {
            return customErrorHandler(res, "Screenshot not found", 401);
        }

        const originalImagePath = path.join(process.cwd(), 'uploads', 'screenshot', screenshot?.imageLink?.split('/').pop() ?? '');
        const watermarkPath = path.join(process.cwd(), 'uploads', 'watermark', 'watermark.png');
        const outputFolderPath = path.join(process.cwd(), 'output');

        console.log(`Checking Original Image Path: ${originalImagePath}`);
        console.log(`Checking Watermark Path: ${watermarkPath}`);

        if (!fs.existsSync(originalImagePath)) {
            return customErrorHandler(res, "Original image not found", 404);
        }

        if (!fs.existsSync(watermarkPath)) {
            return customErrorHandler(res, "Watermark image not found", 404);
        }

        const originalImage = await Jimp.read(originalImagePath);
        const watermarkImage = await Jimp.read(watermarkPath);

        watermarkImage.scale(1.5); 

        const xMargin = 5;
        const yMargin = 5;
        const X = originalImage.bitmap.width - watermarkImage.bitmap.width - xMargin;
        const Y = originalImage.bitmap.height - watermarkImage.bitmap.height - yMargin;

        originalImage.composite(watermarkImage, X, Y);

        const outputFilename = `watermarked-${screenshotId}-${Date.now()}.jpg` as `${string}.jpg`;
        const outputFilePath = path.join(outputFolderPath, outputFilename) as `${string}.${string}`;
        
        await originalImage.write(outputFilePath);
        
        const fileBuffer = fs.readFileSync(outputFilePath);
        
        res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}"`);
        res.setHeader('Content-Type', 'image/jpeg');
        res.send(fileBuffer);

        // Delete the file asynchronously, but ensure it doesn't interfere with the response.
        setTimeout(() => {
            try {
                fs.unlinkSync(outputFilePath);
            } catch (err) {
                console.error("Error deleting file:", err);
            }
        }, 1000); // Wait for 1 second before deleting

    } catch (error) {
        console.error("Error details:", error);
        if (!res.headersSent) {
            next(error);  // Make sure headers haven't been sent
        } else {
            console.error("Response already sent, cannot forward error");
        }
    }
};