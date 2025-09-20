const express = require('express')
const { authMiddleware } = require('../middleware/auth')
const controller = require('../controllers/personController')

const router = express.Router()

router.use(authMiddleware)

router.get('/all', controller.getAllPeople) // New route for global + custom people
router.get('/:id/transactions', controller.getPersonTransactions) // Get all transactions involving a person
router.get('/', controller.list)
router.get('/:id', controller.getOne)
router.post('/', controller.create)
router.patch('/:id', controller.update)
router.delete('/:id', controller.remove)

module.exports = router


