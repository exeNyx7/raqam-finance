const User = require('../models/User')
const { createTokens, verifyRefreshToken } = require('../utils/jwt')

// token utilities moved to utils/jwt

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days — matches JWT refresh expiry
    path: '/api/auth',
}

exports.register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email and password are required', timestamp: new Date().toISOString() })
        }

        const existing = await User.findOne({ email })
        if (existing) {
            return res.status(409).json({ success: false, message: 'Email already in use', timestamp: new Date().toISOString() })
        }

        const passwordHash = await User.hashPassword(password)
        const user = await User.create({ name, email, passwordHash })

        const { accessToken, refreshToken, expiresIn } = createTokens(user.id)
        res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS)
        return res.status(201).json({
            success: true,
            timestamp: new Date().toISOString(),
            data: {
                user: user.toClient(),
                accessToken,
                expiresIn,
            },
        })
    } catch (err) {
        next(err)
    }
}

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required', timestamp: new Date().toISOString() })
        }

        const user = await User.findOne({ email })
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials', timestamp: new Date().toISOString() })
        }

        const valid = await user.comparePassword(password)
        if (!valid) {
            return res.status(401).json({ success: false, message: 'Invalid credentials', timestamp: new Date().toISOString() })
        }

        const { accessToken, refreshToken, expiresIn } = createTokens(user.id)
        res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS)
        return res.json({
            success: true,
            timestamp: new Date().toISOString(),
            data: {
                user: user.toClient(),
                accessToken,
                expiresIn,
            },
        })
    } catch (err) {
        next(err)
    }
}

exports.refresh = async (req, res, next) => {
    try {
        const refreshToken = req.cookies?.refreshToken
        if (!refreshToken) {
            return res.status(400).json({ success: false, message: 'Refresh token required', timestamp: new Date().toISOString() })
        }
        try {
            const decoded = verifyRefreshToken(refreshToken)
            const { accessToken, refreshToken: newRefresh, expiresIn } = createTokens(decoded.sub)
            res.cookie('refreshToken', newRefresh, COOKIE_OPTIONS)
            return res.json({ success: true, timestamp: new Date().toISOString(), data: { accessToken, expiresIn } })
        } catch (e) {
            return res.status(401).json({ success: false, message: 'Invalid refresh token', timestamp: new Date().toISOString() })
        }
    } catch (err) {
        next(err)
    }
}

exports.logout = (req, res) => {
    res.clearCookie('refreshToken', { path: '/api/auth' })
    return res.json({ success: true, timestamp: new Date().toISOString() })
}

exports.me = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId)
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found', timestamp: new Date().toISOString() })
        }
        return res.json({ success: true, timestamp: new Date().toISOString(), data: user.toClient() })
    } catch (err) {
        next(err)
    }
}


