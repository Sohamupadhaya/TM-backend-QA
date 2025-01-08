import express from "express";
const router = express.Router();
import { catchAsync } from "../utils/catchAsync.js";
import { endRecording, uploadChunkVideo,} from "../controllers/chunkVideo.js";
import { isAuthenticatedEmployee } from "../middlewares/isAuthenticatedEmployee.js";
import { chunkVideoUpload } from "../lib/multer.js";

router.post(
  "/upload-chunk-video",
  chunkVideoUpload.single("video"),
  catchAsync(uploadChunkVideo),
);

router.post("/end-recording", catchAsync(endRecording));
export default router;