import  { GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import  { s3Client } from "./s3Credentials.js"
import multer from "multer";
import multerS3 from 'multer-s3';


// const upload = multer({
//     storage: multerS3({
//       s3: s3Client,
//       bucket: process.env.AWS_S3_BUCKET!,
//       contentType: multerS3.AUTO_CONTENT_TYPE,
//       key: (req, file, cb) => {
//         const chunkFilename = `screenshot/video-chunk-${Date.now()}.webm`;
//         cb(null, chunkFilename);
//       }
//     })
//   });

  const storageScreenShot = multerS3({
    s3: s3Client, 
    bucket: process.env.AWS_S3_BUCKET!,
    contentType: multerS3.AUTO_CONTENT_TYPE, 
    key: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const filename = file.originalname.split(".")[0];
      const fileExtension = file.originalname.split(".").pop();
      const s3Key = `screenshots/${filename}-${uniqueSuffix}.${fileExtension}`;
      
      cb(null, s3Key);
    }
  });
  
  // Then use this storage configuration with multer
  export const screenshotS3Multer = multer({ storage: storageScreenShot });

export const getObject = async(key:any) =>{
    try{
        const params = {
            Bucket:process.env.AWS_S3_BUCKET,
            Key:key
        }
        const command = new GetObjectCommand(params);
        const data = await s3Client.send(command);
        console.log(data);
        
    }catch(err){
        console.error(err);
    }
}


export const putObject = async(file:any,fileName:any) =>{
    try{
        const params = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: `${fileName}`,
            Body: file,
            ContentType: "image/jpg,jpeg,png",
        }

        const command = new PutObjectCommand(params);
        const data = await s3Client.send(command);

        if(data.$metadata.httpStatusCode !== 200){
            return;
        }
        let url = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${params.Key}`
        console.log(url);
        return {url,key:params.Key};
    }catch(err){
        console.error(err);
    }
}


export const deleteObject = async(key:any) =>{
    try{
        const params = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key:key
        }
        const command = new DeleteObjectCommand(params);
        const data = await s3Client.send(command);

        if(data.$metadata.httpStatusCode !== 204){
            return {status:400,data}
        }
        return {status:204};
    }catch(err){
        console.error(err);
    }
}