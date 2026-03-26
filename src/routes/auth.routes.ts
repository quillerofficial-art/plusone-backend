import express from 'express'
import { changePassword } from '../controllers/auth.controller'
import { sendOtp, signup, login, forgotPassword } from '../controllers/auth.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { getReferrerInfo } from '../controllers/auth.controller'

const router = express.Router()

router.post('/send-otp', sendOtp);
router.post('/signup', signup)
router.post('/change-password', authMiddleware, changePassword)
router.post('/login', login)
router.get('/referrer-info', getReferrerInfo)
router.post('/forgot-password', forgotPassword)

export default router