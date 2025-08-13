const User = require('../models/User')

exports.getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId)
        if (!user) return res.status(404).json({ success: false, message: 'User not found', timestamp: new Date().toISOString() })
        return res.json({ success: true, timestamp: new Date().toISOString(), data: user.toClient() })
    } catch (err) {
        next(err)
    }
}

exports.updateProfile = async (req, res, next) => {
    try {
        const allowed = ['name', 'email', 'avatar']
        const updates = {}
        for (const key of allowed) if (key in req.body) updates[key] = req.body[key]
        const user = await User.findByIdAndUpdate(req.userId, updates, { new: true })
        if (!user) return res.status(404).json({ success: false, message: 'User not found', timestamp: new Date().toISOString() })
        return res.json({ success: true, timestamp: new Date().toISOString(), data: user.toClient() })
    } catch (err) {
        next(err)
    }
}

exports.changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Current and new password required', timestamp: new Date().toISOString() })
        }
        const user = await User.findById(req.userId)
        if (!user) return res.status(404).json({ success: false, message: 'User not found', timestamp: new Date().toISOString() })
        const valid = await user.comparePassword(currentPassword)
        if (!valid) return res.status(400).json({ success: false, message: 'Current password incorrect', timestamp: new Date().toISOString() })
        user.passwordHash = await User.hashPassword(newPassword)
        await user.save()
        return res.json({ success: true, timestamp: new Date().toISOString(), data: null })
    } catch (err) {
        next(err)
    }
}

// Search app users by email or name (limited fields)
exports.search = async (req, res, next) => {
    try {
        const raw = (req.query.search || req.query.email || '').toString().trim()
        if (!raw || raw.length < 2) {
            return res.json({ success: true, timestamp: new Date().toISOString(), data: [] })
        }
        const regex = new RegExp(raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
        const users = await User.find({ _id: { $ne: req.userId }, $or: [{ email: regex }, { name: regex }] }).limit(10)
        const data = users.map((u) => ({ id: u._id.toString(), name: u.name, email: u.email, avatar: u.avatar || null }))
        return res.json({ success: true, timestamp: new Date().toISOString(), data })
    } catch (err) {
        next(err)
    }
}


