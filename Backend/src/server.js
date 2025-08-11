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
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'], credentials: false }))
app.use(express.json())
app.use(cookieParser())

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
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
    console.error(err)
    const status = err.status || 500
    res.status(status).json({ success: false, message: err.message || 'Internal Server Error', timestamp: new Date().toISOString() })
})

const PORT = process.env.PORT || 3001

connectToDatabase()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Backend server listening on http://localhost:${PORT}`)
        })
    })
    .catch((error) => {
        console.error('Failed to start server:', error)
        process.exit(1)
    })


