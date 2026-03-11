const express = require('express')
const { authMiddleware } = require('../middleware/auth')
const controller = require('../controllers/transactionController')

const router = express.Router()

router.use(authMiddleware)

const validate = require('../middleware/validate')
const { createTransactionSchema, updateTransactionSchema } = require('../validators/transaction')

router.get('/', controller.list)
router.get('/stats', controller.stats)
router.get('/:id', controller.getOne)
router.post('/', validate(createTransactionSchema), controller.create)
router.patch('/:id', validate(updateTransactionSchema), controller.update)
router.delete('/:id', controller.remove)

module.exports = router


