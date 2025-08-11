const express = require('express')
const { authMiddleware } = require('../middleware/auth')
const controller = require('../controllers/analyticsController')

const router = express.Router()

router.use(authMiddleware)

router.get('/dashboard', controller.dashboard)
router.get('/expenses/breakdown', controller.expenseBreakdown)
router.get('/trends/monthly', controller.monthlyTrends)

module.exports = router


