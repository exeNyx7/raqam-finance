const mongoose = require('mongoose')
const { createUser, createLedger } = require('../fixtures')
const Ledger = require('../../src/models/Ledger')
const User = require('../../src/models/User')
// We need to mock the response object
const mockResponse = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

// We are testing controller logic by importing it directly, 
// but typically integration tests are better for Express. 
// However, let's try a hybrid approach or just test the model/logic.
// Actually, for controllers, it's often easier to use supertest (Integration).
// But the user asked for Unit Tests for ledgerController. 
// I will write this as a "Controller Unit Test" mocking req/res.

const ledgerController = require('../../src/controllers/ledgerController')

describe('Ledger Controller Unit Tests', () => {
    let user1, user2

    beforeEach(async () => {
        user1 = await createUser({ name: 'User 1', email: 'u1@test.com' })
        user2 = await createUser({ name: 'User 2', email: 'u2@test.com' })
    })

    test('create: should create a new ledger with members', async () => {
        const req = {
            userId: user1._id.toString(),
            body: {
                name: 'Trip to Paris',
                members: [{ userId: user2._id.toString() }]
            }
        }
        const res = mockResponse()
        // Mock next function
        const next = jest.fn((err) => console.error('Next called with:', err))

        await ledgerController.create(req, res, next)

        if (next.mock.calls.length > 0) {
            throw new Error('Controller called next() with error')
        }

        expect(res.status).toHaveBeenCalledWith(201)
        expect(res.json).toHaveBeenCalled()
        const data = res.json.mock.calls[0][0].data
        expect(data.name).toBe('Trip to Paris')
        // members includes owner + added member
        expect(data.members).toHaveLength(2)
    })

    test('addTransaction: should deny access if user is not a member', async () => {
        // Create ledger with only user1
        const ledger = await createLedger(user1._id, [])

        // User 2 tries to add transaction
        const req = {
            userId: user2._id.toString(),
            params: { id: ledger._id.toString() },
            body: {
                description: 'Unauthorized Lunch',
                totalAmount: 50,
                category: 'Food',
                date: new Date(),
                participants: []
            }
        }
        const res = mockResponse()
        const next = jest.fn((err) => console.error('Next called with:', err))

        await ledgerController.addTransaction(req, res, next)

        if (next.mock.calls.length > 0) {
            // If next is called, it might be an error we didn't expect, 
            // OR it might be the way global error handler works. 
            // But here we expect 404 from res.status
            // If it called next, it means it crashed or threw.
            console.log('Next calls:', next.mock.calls)
        }

        expect(res.status).toHaveBeenCalledWith(404) // Or 403, controller returns 404 for "not found or denied"
        expect(res.json.mock.calls[0][0].message).toMatch(/not found or permission denied/i)
    })
})
