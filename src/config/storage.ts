import { S3Client } from '@aws-sdk/client-s3'
import dotenv from 'dotenv'

dotenv.config()

export const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

console.log("CHECK CREDS:");
console.log("ACCESS:", process.env.R2_ACCESS_KEY_ID);
console.log("SECRET:", process.env.R2_SECRET_ACCESS_KEY);
console.log("ENDPOINT:", process.env.R2_ENDPOINT);
console.log("BUCKET:", process.env.R2_BUCKET_NAME);