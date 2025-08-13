const express = require('express')
const { authMiddleware } = require('../middleware/auth')
const controller = require('../controllers/userController')

const router = express.Router()

router.use(authMiddleware)

router.get('/me', controller.getProfile)
router.patch('/me', controller.updateProfile)
router.post('/me/change-password', controller.changePassword)
router.get('/search', controller.search)

module.exports = router


