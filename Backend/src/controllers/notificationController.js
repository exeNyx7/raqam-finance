const Notification = require('../models/Notification')

function buildFilter(query, userId) {
    const filter = { userId }
    if (query.filter) {
        try {
            const parsed = typeof query.filter === 'string' ? JSON.parse(query.filter) : query.filter
            if (typeof parsed.read === 'boolean') filter.read = parsed.read
            if (parsed.type) filter.type = parsed.type
        } catch (_) { }
    }
    return filter
}

exports.list = async (req, res, next) => {
    try {
        const page = Number(req.query.page || 1)
        const limit = Number(req.query.limit || 20)
        const sort = req.query.sort || '-createdAt'
        const filter = buildFilter(req.query, req.userId)

        const [items, total] = await Promise.all([
            Notification.find(filter).sort(sort).skip((page - 1) * limit).limit(limit),
            Notification.countDocuments(filter),
        ])

        const data = {
            data: items.map((n) => n.toClient()),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1,
            },
        }
        res.json({ success: true, timestamp: new Date().toISOString(), data })
    } catch (err) {
        next(err)
    }
}

exports.stats = async (req, res, next) => {
    try {
        const [total, unread] = await Promise.all([
            Notification.countDocuments({ userId: req.userId }),
            Notification.countDocuments({ userId: req.userId, read: false }),
        ])
        res.json({ success: true, timestamp: new Date().toISOString(), data: { total, unread } })
    } catch (err) {
        next(err)
    }
}

exports.markAsRead = async (req, res, next) => {
    try {
        const n = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.userId },
            { read: true },
            { new: true },
        )
        if (!n) return res.status(404).json({ success: false, message: 'Not found', timestamp: new Date().toISOString() })
        res.json({ success: true, timestamp: new Date().toISOString(), data: n.toClient() })
    } catch (err) {
        next(err)
    }
}

exports.markAllAsRead = async (req, res, next) => {
    try {
        await Notification.updateMany({ userId: req.userId, read: false }, { read: true })
        res.json({ success: true, timestamp: new Date().toISOString(), data: { updated: true } })
    } catch (err) {
        next(err)
    }
}

exports.remove = async (req, res, next) => {
    try {
        const n = await Notification.findOneAndDelete({ _id: req.params.id, userId: req.userId })
        if (!n) return res.status(404).json({ success: false, message: 'Not found', timestamp: new Date().toISOString() })
        res.json({ success: true, timestamp: new Date().toISOString(), data: null })
    } catch (err) {
        next(err)
    }
}


