import express from 'express'
import { createSubscription, verifyPayment } from '../controllers/payment.controller'
import { authMiddleware } from '../middlewares/auth.middleware'

const router = express.Router()

router.post('/create-subscription', authMiddleware, createSubscription)
router.post('/verify', verifyPayment) // webhook (no auth required)

export default router