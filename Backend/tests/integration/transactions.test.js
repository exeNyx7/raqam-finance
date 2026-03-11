const request = require('supertest')
const express = require('express')
const mongoose = require('mongoose')
const { createUser, generateToken } = require('../fixtures')
const fs = require('fs')
// We need to import the app or create a new instance with same routes
// Ideally we export app from server.js, but server.js listens immediately.
// I will create a test app wrapper here reusing the routes.

const authRoutes = require('../../src/routes/auth')
const ledgerRoutes = require('../../src/routes/ledgers')
const transactionRoutes = require('../../src/routes/transactions')
const cookieParser = require('cookie-parser')

const app = express()
app.use(express.json())
app.use(cookieParser())

app.use((req, res, next) => {
    // console.log(`Test Request: ${req.method} ${req.url}`)
    next()
})

// Mock middleware to populate req.userId from header for testing ease, 
// OR use the actual auth middleware if accessible. 
// Let's use the actual middleware pattern but we need to supply the token.
// The routes likely use the auth middleware internally. 
// I'll assume they do.

app.use('/api/auth', authRoutes)
app.use('/api/ledgers', ledgerRoutes)
app.use('/api/transactions', transactionRoutes)

// Global error handler for test app
app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ message: err.message })
})

describe('Integration Tests: Transactions', () => {
    let user1, token1
    let user2, token2
    let ledgerId

    beforeEach(async () => {
        user1 = await createUser({ name: 'Alice', email: 'alice@test.com' })
        token1 = generateToken(user1._id)

        user2 = await createUser({ name: 'Bob', email: 'bob@test.com' })
        token2 = generateToken(user2._id)
    })

    test('GET /api/auth/me should return 200', async () => {
        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${token1}`)

        if (res.status !== 200) {
            console.error('Auth Me Failed:', res.body)
        }
        expect(res.status).toBe(200)
    })

    test('Full Flow: Create Ledger -> Add Transaction -> Verify', async () => {
        // 1. Create Ledger
        const ledgerRes = await request(app)
            .post('/api/ledgers')
            .set('Authorization', `Bearer ${token1}`) // Assuming Bearer auth or Cookie
            .set('Cookie', [`token=${token1}`]) // Try Cookie as well since we saw cookieParser
            .send({
                name: 'Integration Ledger',
                members: [{ userId: user2._id.toString() }]
            })

        if (ledgerRes.status !== 201) {
            console.error('Create Ledger Failed:', ledgerRes.body)
        }
        expect(ledgerRes.status).toBe(201)
        ledgerId = ledgerRes.body.data.id

        // 2. Add Transaction
        const txRes = await request(app)
            .post(`/api/ledgers/${ledgerId}/transactions`)
            .set('Cookie', [`token=${token1}`])
            .send({
                description: 'Lunch',
                totalAmount: 100,
                category: 'Food',
                type: 'expense',
                date: new Date(),
                paidBy: user1._id.toString(),
                participants: [
                    { userId: user1._id.toString(), amount: 50 },
                    { userId: user2._id.toString(), amount: 50 }
                ]
            })

        fs.writeFileSync('debug_tx_response.json', JSON.stringify(txRes.body, null, 2))

        if (txRes.status !== 201) {
            console.error('Add Tx Failed:', txRes.body)
        }
        expect(txRes.status).toBe(201)
        expect(txRes.body.data.totalAmount).toBe(100)

        // 3. Verify Transaction Listing
        const listRes = await request(app)
            .get(`/api/ledgers/${ledgerId}/transactions`)
            .set('Cookie', [`token=${token1}`])

        expect(listRes.status).toBe(200)
        expect(listRes.body.data).toHaveLength(1)
        expect(listRes.body.data[0].description).toBe('Lunch')
    })
})
