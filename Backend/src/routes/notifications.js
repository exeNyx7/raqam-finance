const express = require('express')
const { authMiddleware } = require('../middleware/auth')
const controller = require('../controllers/notificationController')

const router = express.Router()

router.use(authMiddleware)

router.get('/', controller.list)
router.get('/stats', controller.stats)
router.post('/mark-all-read', controller.markAllAsRead)
router.post('/:id/read', controller.markAsRead)
router.delete('/:id', controller.remove)

module.exports = router


