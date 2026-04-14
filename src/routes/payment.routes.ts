import express, { NextFunction, Request, Response } from 'express'
import { createSubscription, getPaymentStatus, verifyPayment } from '../controllers/payment.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { validate, createSubscriptionSchema } from '../validators/payment.validator'
import { handleWebhook } from '../controllers/payment.controller'

const router = express.Router()


router.get('/status/:orderId', authMiddleware, getPaymentStatus);
router.post('/create-subscription', authMiddleware, validate(createSubscriptionSchema), createSubscription)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

export default router