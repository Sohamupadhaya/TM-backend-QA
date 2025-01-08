import path from 'path';
import fs from 'fs'
import { Request,Response,NextFunction } from 'express';


// Storage for video files
let fileStream:any = null;
let filePath:any = null;

export const uploadChunkVideo = (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
      }
  
      const videoChunk = req.file.buffer; // Access the uploaded video chunk from multer
  
      // If fileStream is not open, create a new file for the video
      if (!fileStream) {
        filePath = path.join(__dirname, `video-${Date.now()}.webm`);
        fileStream = fs.createWriteStream(filePath, { flags: 'a' });
        console.log(`Recording started, saving to: ${filePath}`);
      }
  
      // Check if the stream is still writable before writing
      if (fileStream && !fileStream.closed) {
        fileStream.write(Buffer.from(new Uint8Array(videoChunk)), (err:any) => {
          if (err) {
            console.error('Error writing chunk:', err);
            return res.status(500).json({ message: 'Error writing video chunk.' });
          }
          console.log('Video chunk written to file.');
          res.status(200).json({ message: 'Chunk received and written.' });
        });
      } else {
        console.error('Attempted to write after stream ended.');
        return res.status(500).json({ message: 'Stream is closed.' });
      }
    } catch (error) {
      console.error('Error writing video chunk:', error);
      return res.status(500).json({ message: 'Error writing video chunk.' });
    }
  };


export const endRecording = (req:Request, res:Response, next:NextFunction)=>{
    try {
        console.log('Recording ended');
    
        if (fileStream && !fileStream.closed) {
          fileStream.end();
          console.log(`Video saved at: ${filePath}`);
          res.status(200).json({ message: `Recording saved at ${filePath}` });
        } else {
          res.status(400).json({ message: 'No active recording.' });
        }
    } catch (error) {
    console.error('Error stopping recording:', error);
    res.status(500).json({ message: 'Error stopping recording.' });
    }
}


// Route to upload video chunks
// app.post('/upload-video', upload.single('video'), (req:any, res:any) => {
//     try {
//       const videoChunk = req.file.buffer; // Access the uploaded video chunk from multer
  
//       // If fileStream is not open, create a new file for the video
//       if (!fileStream) {
//         filePath = path.join(__dirname, `video-${Date.now()}.webm`);
//         fileStream = fs.createWriteStream(filePath, { flags: 'a' });
//         console.log(`Recording started, saving to: ${filePath}`);
//       }
  
//       // Check if the stream is still writable before writing
//       if (fileStream && !fileStream.closed) {
//         fileStream.write(Buffer.from(new Uint8Array(videoChunk)));
//         console.log('Video chunk written to file.');
//         res.status(200).json({ message: 'Chunk received and written.' });
//       } else {
//         console.error('Attempted to write after stream ended.');
//         res.status(500).json({ message: 'Stream is closed.' });
//       }
//     } catch (error) {
//       console.error('Error writing video chunk:', error);
//       res.status(500).json({ message: 'Error writing video chunk.' });
//     }
//   });
  
//   // Route to stop recording and close the file stream
//   app.post('/end-recording', (req, res) => {
//     try {
//       console.log('Recording ended');
  
//       if (fileStream && !fileStream.closed) {
//         fileStream.end();
//         console.log(`Video saved at: ${filePath}`);
//         res.status(200).json({ message: `Recording saved at ${filePath}` });
//       } else {
//         res.status(400).json({ message: 'No active recording.' });
//       }
//     } catch (error) {
//       console.error('Error stopping recording:', error);
//       res.status(500).json({ message: 'Error stopping recording.' });
//     }
//   });