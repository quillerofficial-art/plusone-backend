import fs from 'fs';
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}
import express from 'express'
import dotenv from 'dotenv'
import './types'
import { validateEnv } from './config/validateEnv'
import helmet from 'helmet'
import cors from 'cors'
import { apiRateLimiter } from './middlewares/rateLimit.middleware';
import { requestIdMiddleware } from './middlewares/requestId.middleware'
import { errorHandler } from './middlewares/error.middleware'
import { verifyPayment } from './controllers/payment.controller'

dotenv.config()


// Import routes
import healthRoutes from './routes/health.routes'
import authRoutes from './routes/auth.routes'
import userRoutes from './routes/user.routes'
import treeRoutes from './routes/tree.routes'
import adminRoutes from './routes/admin.routes'
import paymentRoutes from './routes/payment.routes'
import postRoutes from './routes/post.routes'
import planRoutes from './routes/plan.routes'
import productRoutes from './routes/product.routes'

validateEnv()

const app = express()
app.use(helmet())
app.use(apiRateLimiter);
app.set('trust proxy', 1) // Trust first proxy (Render)
const PORT = process.env.PORT || 8000

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));


app.post(
  '/razorpay-webhook',
  express.raw({ type: 'application/json' }),
  verifyPayment
)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(requestIdMiddleware)

// Routes
app.use('/api', healthRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/tree', treeRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/payment', paymentRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/plans', planRoutes)
app.use('/api/products', productRoutes)

// Error handling middleware (should be last)
app.use(errorHandler)

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})