const express = require('express')
const { authMiddleware } = require('../middleware/auth')
const controller = require('../controllers/settingsController')

const router = express.Router()

router.use(authMiddleware)

router.get('/', controller.getSettings)
router.patch('/', controller.updateSettings)
router.get('/categories', controller.listCategories)
router.post('/categories', controller.addCategory)
router.delete('/categories/:name', controller.deleteCategory)

module.exports = router


