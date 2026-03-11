const request = require('supertest')
const express = require('express')
const mongoose = require('mongoose')

const app = express()
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }))

describe('Health Check Integration', () => {
    test('GET /health should return 200', async () => {
        const res = await request(app).get('/health')
        expect(res.status).toBe(200)
        expect(res.body.status).toBe('ok')
    })

    test('DB should be connected', () => {
        expect(mongoose.connection.readyState).toBe(1) // 1 = connected
    })
})
