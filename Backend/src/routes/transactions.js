const express = require('express')
const { authMiddleware } = require('../middleware/auth')
const controller = require('../controllers/transactionController')

const router = express.Router()

router.use(authMiddleware)

router.get('/', controller.list)
router.get('/stats', controller.stats)
router.get('/:id', controller.getOne)
router.post('/', controller.create)
router.patch('/:id', controller.update)
router.delete('/:id', controller.remove)

module.exports = router


