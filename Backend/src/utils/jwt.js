const jwt = require('jsonwebtoken')

const ACCESS_EXPIRES_SECONDS = 15 * 60 // 15 minutes

function createTokens(userId) {
    const accessToken = jwt.sign({ sub: userId }, process.env.JWT_SECRET || 'dev_secret', {
        expiresIn: ACCESS_EXPIRES_SECONDS,
    })
    const refreshToken = jwt.sign({ sub: userId, type: 'refresh' }, process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret', {
        expiresIn: '7d',
    })
    return { accessToken, refreshToken, expiresIn: ACCESS_EXPIRES_SECONDS }
}

function verifyAccessToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET || 'dev_secret')
}

function verifyRefreshToken(token) {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret')
}

module.exports = { createTokens, verifyAccessToken, verifyRefreshToken }


