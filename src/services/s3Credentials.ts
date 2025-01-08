import { S3Client } from "@aws-sdk/client-s3";

const { AWS_REGION, AWS_ACCESSKEY, AWS_SECRET_ACCESS_KEY } = process.env;

if (!AWS_REGION || !AWS_ACCESSKEY || !AWS_SECRET_ACCESS_KEY) {
  throw new Error("Missing required AWS environment variables");
}

export const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESSKEY,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});
