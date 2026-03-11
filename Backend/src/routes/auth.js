const express = require('express')
const { register, login, refresh, logout, me } = require('../controllers/authController')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

router.post('/register', register)
router.post('/login', login)
router.post('/refresh', refresh)
router.post('/logout', logout)
router.get('/me', authMiddleware, me)

module.exports = router


