import express, { NextFunction, Request, Response } from 'express'
import { createSubscription, verifyPayment } from '../controllers/payment.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { validate, createSubscriptionSchema } from '../validators/payment.validator'

const router = express.Router()

const verifyWebhookSecret = (req: Request, res: Response, next: NextFunction) => {
  const webhookSecret = req.headers['x-razorpay-signature']?.toString()
  if (!webhookSecret || webhookSecret !== process.env.RAZORPAY_WEBHOOK_SECRET) {
    return res.status(401).json({ message: 'Unauthorized' })
  }
  next()
}

router.post('/create-subscription', authMiddleware, validate(createSubscriptionSchema), createSubscription)
router.post('/verify', verifyWebhookSecret as any, verifyPayment)

export default router