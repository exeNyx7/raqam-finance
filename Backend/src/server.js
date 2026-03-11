require('dotenv').config()
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const { connectToDatabase } = require('./config/db')

const authRoutes = require('./routes/auth')
const transactionRoutes = require('./routes/transactions')
const analyticsRoutes = require('./routes/analytics')
const recurringRoutes = require('./routes/recurrings')
const budgetRoutes = require('./routes/budgets')
const ledgerRoutes = require('./routes/ledgers')
const peopleRoutes = require('./routes/people')
const goalRoutes = require('./routes/goals')
const billRoutes = require('./routes/bills')
const settingsRoutes = require('./routes/settings')
const notificationsRoutes = require('./routes/notifications')
const devRoutes = require('./routes/dev')
const usersRoutes = require('./routes/users')

const app = express()

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'], credentials: true }))
app.use(express.json())
app.use(cookieParser())
app.use('/uploads', express.static('uploads'))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/budgets', budgetRoutes)
app.use('/api/recurrings', recurringRoutes)
app.use('/api/ledgers', ledgerRoutes)
app.use('/api/people', peopleRoutes)
app.use('/api/goals', goalRoutes)
app.use('/api/bills', billRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/notifications', notificationsRoutes)
app.use('/api/dev', devRoutes)

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ success: true, timestamp: new Date().toISOString(), data: { status: 'ok' } })
})

// Global error handler
// Global error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
    console.error(err.stack || err.message || err)
    // Mongoose validation error — sanitize to field: message pairs only
    if (err.name === 'ValidationError') {
        const errors = Object.fromEntries(
            Object.entries(err.errors || {}).map(([k, v]) => [k, v.message])
        )
        return res.status(400).json({ success: false, message: 'Validation Error', errors, timestamp: new Date().toISOString() })
    }
    // Invalid ObjectId / cast error
    if (err.name === 'CastError') {
        return res.status(400).json({ success: false, message: 'Invalid ID format', timestamp: new Date().toISOString() })
    }
    // Duplicate key error
    if (err.code === 11000) {
        return res.status(409).json({ success: false, message: 'Duplicate entry found', timestamp: new Date().toISOString() })
    }
    // JWT Authentication error
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({ success: false, message: 'Invalid token', timestamp: new Date().toISOString() })
    }

    const status = err.status || 500
    const message = status === 500 ? 'Internal Server Error' : (err.message || 'Error processing request')
    res.status(status).json({ success: false, message, timestamp: new Date().toISOString() })
})

const initCronJobs = require('./cron')

const PORT = process.env.PORT || 5000

connectToDatabase()
    .then(() => {
        // Initialize scheduled tasks
        initCronJobs()

        app.listen(PORT, () => {
            console.log(`Backend server listening on http://localhost:${PORT}`)
        })
    })
    .catch((error) => {
        console.error('Failed to start server:', error)
        process.exit(1)
    })
