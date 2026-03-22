import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import './types'

// Import routes
import authRoutes from './routes/auth.routes'
import userRoutes from './routes/user.routes'
import treeRoutes from './routes/tree.routes'
import adminRoutes from './routes/admin.routes'
import paymentRoutes from './routes/payment.routes'
import postRoutes from './routes/post.routes'
import planRoutes from './routes/plan.routes'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 8000

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/tree', treeRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/payment', paymentRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/plans', planRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})