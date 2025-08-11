const express = require('express')
const { seedAll } = require('../controllers/devSeedController')

const router = express.Router()

// Development-only seeding route
router.post('/seed', seedAll)

module.exports = router


