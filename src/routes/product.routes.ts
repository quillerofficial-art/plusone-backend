import express from 'express';
import {
  getProductsByCategory,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/product.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { adminMiddleware } from '../middlewares/admin.middleware';
import { uploadSingle } from '../middlewares/upload.middleware';

const router = express.Router();

// Public routes (authenticated users can view products)
router.get('/category/:category', authMiddleware, getProductsByCategory);

// Admin routes
router.post('/', authMiddleware, adminMiddleware, uploadSingle, createProduct);
router.put('/:id', authMiddleware, adminMiddleware, uploadSingle, updateProduct);
router.delete('/:id', authMiddleware, adminMiddleware, deleteProduct);

export default router;