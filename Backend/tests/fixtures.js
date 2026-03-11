const mongoose = require('mongoose')
const User = require('../src/models/User')
const Ledger = require('../src/models/Ledger')
const jwt = require('jsonwebtoken')

const createUser = async (overrides = {}) => {
    // Generate hash for default password
    const passwordHash = await User.hashPassword('password123')

    const user = await User.create({
        name: 'Test User',
        email: `test${Date.now()}@example.com`,
        passwordHash: passwordHash,
        ...overrides
    })
    return user
}

const generateToken = (userId) => {
    return jwt.sign({ sub: userId }, process.env.JWT_SECRET || 'test_secret', { expiresIn: '1h' })
}

const createLedger = async (userId, members = [], overrides = {}) => {
    const ledger = await Ledger.create({
        name: 'Test Ledger',
        description: 'Test Description',
        userId,
        members: members.map(m => ({ userId: m, permissions: ['read', 'write'] })),
        ...overrides
    })
    return ledger
}

module.exports = {
    createUser,
    generateToken,
    createLedger
}
