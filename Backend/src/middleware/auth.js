const { verifyAccessToken } = require('../utils/jwt')

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
    if (!token) {
        return res.status(401).json({ success: false, message: 'Unauthorized', timestamp: new Date().toISOString() })
    }
    try {
        const decoded = verifyAccessToken(token)
        req.userId = decoded.sub
        next()
    } catch (e) {
        return res.status(401).json({ success: false, message: 'Unauthorized', timestamp: new Date().toISOString() })
    }
}

module.exports = { authMiddleware }


