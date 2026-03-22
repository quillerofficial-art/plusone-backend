import express from 'express'
import { createPost, updatePost, deletePost, getAllPosts } from '../controllers/post.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { adminMiddleware } from '../middlewares/admin.middleware'
import { uploadSingle } from '../middlewares/upload.middleware'

const router = express.Router()

// Public route (any authenticated user)
router.get('/', authMiddleware, getAllPosts)

// Admin routes
router.post('/', authMiddleware, adminMiddleware, uploadSingle, createPost)
router.put('/:id', authMiddleware, adminMiddleware, uploadSingle, updatePost)
router.delete('/:id', authMiddleware, adminMiddleware, deletePost)

export default router