const express = require('express')
const { authMiddleware } = require('../middleware/auth')
const controller = require('../controllers/recurringController')

const router = express.Router()

router.use(authMiddleware)

router.get('/', controller.list)
router.get('/meta', controller.meta)
router.get('/stats', controller.stats)
// Process due recurrings on-demand
router.post('/process', async (req, res, next) => {
    try {
        const { processDueRecurringsForUser } = require('../services/recurringProcessor')
        const result = await processDueRecurringsForUser(req.userId)
        res.json({ success: true, timestamp: new Date().toISOString(), data: result })
    } catch (err) {
        next(err)
    }
})
router.get('/:id', controller.getOne)
router.post('/', controller.create)
router.patch('/:id', controller.update)
router.delete('/:id', controller.remove)

module.exports = router


