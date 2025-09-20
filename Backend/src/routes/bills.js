const express = require('express')
const { authMiddleware } = require('../middleware/auth')
const controller = require('../controllers/billController')

const router = express.Router()

router.use(authMiddleware)

router.get('/', controller.list)
router.get('/:id', controller.getOne)
router.get('/:id/settlement', controller.getSettlementDetails)
router.get('/:id/optimal-settlements', controller.getOptimalSettlements)
router.post('/', controller.create)
router.patch('/:id', controller.update)
router.patch('/:id/payment-status', controller.updatePaymentStatus)
router.delete('/:id', controller.remove)

module.exports = router


