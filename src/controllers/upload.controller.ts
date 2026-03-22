import { Request, Response } from 'express'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { s3Client } from '../config/storage'
import { supabase } from '../config/supabase'
import { v4 as uuidv4 } from 'uuid'

export const uploadProfilePic = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' })
  }

  try {
    // Generate unique filename
    const fileExt = req.file.originalname.split('.').pop()
    const fileName = `profile-pics/${req.user!.id}-${uuidv4()}.${fileExt}`

    // Upload to Backblaze B2
    const command = new PutObjectCommand({
      Bucket: process.env.BACKBLAZE_BUCKET!,
      Key: fileName,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      ACL: 'public-read', // file public ho jayegi
    })

    await s3Client.send(command)

    // Construct public URL
    const publicUrl = `${process.env.BACKBLAZE_ENDPOINT}/${process.env.BACKBLAZE_BUCKET}/${fileName}`

    // Update user profile in Supabase
    const { error: updateError } = await supabase
      .from('users')
      .update({ profile_pic_url: publicUrl })
      .eq('id', req.user!.id)

    if (updateError) {
      throw updateError
    }

    res.json({
      message: 'Profile picture uploaded successfully',
      url: publicUrl,
    })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ message: 'Failed to upload profile picture' })
  }
}