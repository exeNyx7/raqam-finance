const express = require('express')
const { authMiddleware } = require('../middleware/auth')
const controller = require('../controllers/ledgerController')

const router = express.Router()

router.use(authMiddleware)

router.get('/', controller.list)
router.get('/:id', controller.getOne)
router.post('/', controller.create)
router.patch('/:id', controller.update)
router.delete('/:id', controller.remove)
router.post('/:id/leave', controller.leave)
// Ledger transactions and payments
router.get('/:id/transactions', controller.listTransactions)
router.post('/:id/transactions', controller.addTransaction)
router.post('/:id/transactions/:txId/mark-paid', controller.markSharePaid)
router.post('/:id/transactions/:txId/approve/:userId', controller.approveShare)
router.delete('/:id/transactions/:txId', controller.removeTransaction)

module.exports = router


