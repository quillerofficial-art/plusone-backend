import { PutObjectCommand } from '@aws-sdk/client-s3'
import { s3Client } from '../config/storage'
import { v4 as uuidv4 } from 'uuid'

export const uploadToBackblaze = async (
  file: Express.Multer.File,
  folder: string
): Promise<string> => {
  const fileExt = file.originalname.split('.').pop()
  const fileName = `${folder}/${uuidv4()}.${fileExt}`

  const command = new PutObjectCommand({
    Bucket: process.env.BACKBLAZE_BUCKET!,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
  })

  await s3Client.send(command)

  return `${process.env.BACKBLAZE_ENDPOINT}/${process.env.BACKBLAZE_BUCKET}/${fileName}`
}