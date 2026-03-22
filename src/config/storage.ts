import { S3Client } from '@aws-sdk/client-s3'
import dotenv from 'dotenv'

dotenv.config()

export const s3Client = new S3Client({
  region: process.env.BACKBLAZE_REGION!,
  endpoint: process.env.BACKBLAZE_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.BACKBLAZE_KEY_ID!,
    secretAccessKey: process.env.BACKBLAZE_APPLICATION_KEY!,
  },
  forcePathStyle: true, // Backblaze B2 ke liye important
})