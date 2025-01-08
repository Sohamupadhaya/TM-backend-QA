import express from 'express';
import multer from 'multer';
import { sendVideoChunk,startProducer, disconnectProducer } from '../services/kafka/producer.js';
import fs from 'fs';
import path from 'path';
import { isAuthenticatedEmployee } from '../middlewares/isAuthenticatedEmployee.js';

const router = express.Router();
const VIDEO_DIR = 'uploads/timelapsevideo';

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, VIDEO_DIR);
  },
  filename: (req, file, cb) => {
    const chunkFilename = `video-chunk-${Date.now()}.webm`;
    cb(null, chunkFilename);
  },
});

const upload = multer({ storage });

// Ensure video directory exists
if (!fs.existsSync(VIDEO_DIR)) {
  fs.mkdirSync(VIDEO_DIR, { recursive: true });
}

// Route to handle video chunk uploads
router.post('/upload-video', upload.single('video'), isAuthenticatedEmployee, async (req: any, res) => {
  try {
    const employee = req.user; // Get authenticated employee (handled by middleware)
    const employeeId = employee.employeeId;
    const videoChunkPath = req.file.path;

    // Read the video chunk from temp storage
    const chunkData = fs.readFileSync(videoChunkPath);

    // Send the chunk to Kafka
    await sendVideoChunk(employeeId, chunkData);

    // Optionally remove the temporary file
    fs.unlinkSync(videoChunkPath);

    res.status(200).json({ message: 'Chunk received and sent to Kafka.' });
  } catch (error) {
    console.error('Error sending video chunk to Kafka:', error);
    res.status(500).json({ message: 'Error processing video chunk.' });
  }
});

export default router;
