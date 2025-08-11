const Person = require('../models/Person')

function buildFilter(query, userId) {
    const filter = { userId }
    if (query.search) {
        filter.$or = [
            { name: { $regex: query.search, $options: 'i' } },
            { email: { $regex: query.search, $options: 'i' } },
        ]
    }
    if (query.filter) {
        try {
            const parsed = typeof query.filter === 'string' ? JSON.parse(query.filter) : query.filter
            if (typeof parsed.isAppUser === 'boolean') filter.isAppUser = parsed.isAppUser
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
            Person.find(filter).sort(sort).skip((page - 1) * limit).limit(limit),
            Person.countDocuments(filter),
        ])

        const data = {
            data: items.map((p) => p.toClient()),
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
    } catch (err) { next(err) }
}

exports.getOne = async (req, res, next) => {
    try {
        const p = await Person.findOne({ _id: req.params.id, userId: req.userId })
        if (!p) return res.status(404).json({ success: false, message: 'Not found', timestamp: new Date().toISOString() })
        res.json({ success: true, timestamp: new Date().toISOString(), data: p.toClient() })
    } catch (err) { next(err) }
}

exports.create = async (req, res, next) => {
    try {
        const { name, email, phone, notes, isAppUser, avatar } = req.body
        if (!name || !email) return res.status(400).json({ success: false, message: 'Name and email are required', timestamp: new Date().toISOString() })
        const doc = await Person.create({ name, email, phone, notes, isAppUser: !!isAppUser, avatar, userId: req.userId })
        res.status(201).json({ success: true, timestamp: new Date().toISOString(), data: doc.toClient() })
    } catch (err) { next(err) }
}

exports.update = async (req, res, next) => {
    try {
        const allowed = ['name', 'email', 'phone', 'notes', 'isAppUser', 'avatar']
        const updates = {}
        for (const key of allowed) if (key in req.body) updates[key] = req.body[key]
        const p = await Person.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, updates, { new: true })
        if (!p) return res.status(404).json({ success: false, message: 'Not found', timestamp: new Date().toISOString() })
        res.json({ success: true, timestamp: new Date().toISOString(), data: p.toClient() })
    } catch (err) { next(err) }
}

exports.remove = async (req, res, next) => {
    try {
        const p = await Person.findOneAndDelete({ _id: req.params.id, userId: req.userId })
        if (!p) return res.status(404).json({ success: false, message: 'Not found', timestamp: new Date().toISOString() })
        res.json({ success: true, timestamp: new Date().toISOString(), data: null })
    } catch (err) { next(err) }
}


