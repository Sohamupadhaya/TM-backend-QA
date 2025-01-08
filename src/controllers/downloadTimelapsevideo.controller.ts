import {
    NextFunction,
    Request,
    Response
} from "express";

import { customErrorHandler } from "../utils/customErrorHandler.js";
import prisma from "../models/index.js";
import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";


export const addWatermarkToTimelapse = async (req: Request, res: Response, next: NextFunction) => {
    const { timelapseId } = req.params;
    const companyId = (req as any).user.companyId;

    try {
        // Retrieve the timelapse video
        const timelapse = await prisma.timeLapseVideo.findFirst({
            where: {
                companyId: companyId,
                timeLapseVideoId: timelapseId
            }
        });

        console.log(timelapseId, "id");

        if (!timelapse) {
            return customErrorHandler(res, "Video not found", 404);
        }

        // Construct file paths
        const originalVideoPath = path.join(process.cwd(), timelapse.videoLink.split('/').pop() ?? '');
        const watermarkPath = path.join(process.cwd(), 'uploads', 'watermark', 'watermark.png');
        const outputFolderPath = path.join(process.cwd(), 'output');

        // Ensure output directory exists
        if (!fs.existsSync(outputFolderPath)) {
            fs.mkdirSync(outputFolderPath, { recursive: true });
        }

        const outputFilename = `timelapse-${Date.now()}.mp4`;
        const outputPath = path.join(outputFolderPath, outputFilename);

        console.log("originalVideoPath", originalVideoPath)
        // Check if the original video exists
        if (!fs.existsSync(originalVideoPath)) {
            return customErrorHandler(res, "Original video not found", 404);
        }

        // Check if the watermark exists
        if (!fs.existsSync(watermarkPath)) {
            return customErrorHandler(res, "Watermark not found", 404);
        }

        // Apply the watermark to the video
        ffmpeg(originalVideoPath)
            .input(watermarkPath)
            .complexFilter([
                // '[1:v]scale=iw/5:-1[wm];[0:v][wm]overlay=W-w-10:H-h-10'
                '[1:v]scale=iw:-1[wm];[0:v][wm]overlay=W-w-10:H-h-10'
            ])
            .on('end', async () => {
                console.log('Watermarked video created successfully');

                // Send the watermarked video as a response
                res.download(outputPath, async (err) => {
                    if (err) {
                        console.error(err);
                        return customErrorHandler(res, "Error downloading watermarked video", 500);
                    }
                    
                    // Schedule deletion of the temporary file after 5 minutes
                    setTimeout(async () => {
                        try {
                            await fs.promises.unlink(outputPath);
                            console.log('Temporary file deleted after 5 minutes:', outputPath);
                        } catch (deleteErr) {
                            console.error('Error deleting temporary file:', deleteErr);
                        }
                    }, 5 * 60 * 1000); // 5 minutes in milliseconds
                });
            })
            .on('error', (err) => {
                console.error('Error processing video:', err.message || err);
                return customErrorHandler(res, "Error processing video", 500);
            })
            .save(outputPath);

    } catch (err) {
        console.error(err);
        return customErrorHandler(res, "Error processing request", 500);
    }
};