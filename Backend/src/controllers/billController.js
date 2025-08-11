const Bill = require('../models/Bill')

function buildFilter(query, userId) {
    const filter = { userId }
    if (query.search) {
        filter.description = { $regex: query.search, $options: 'i' }
    }
    if (query.filter) {
        try {
            const parsed = typeof query.filter === 'string' ? JSON.parse(query.filter) : query.filter
            if (parsed.status) filter.status = parsed.status
            if (parsed.paidBy) filter.paidBy = parsed.paidBy
            if (parsed.participant) filter.participants = parsed.participant
            if (parsed.dateFrom || parsed.dateTo) {
                filter.date = {}
                if (parsed.dateFrom) filter.date.$gte = new Date(parsed.dateFrom)
                if (parsed.dateTo) filter.date.$lte = new Date(parsed.dateTo)
            }
        } catch (_) { }
    }
    return filter
}

exports.list = async (req, res, next) => {
    try {
        const page = Number(req.query.page || 1)
        const limit = Number(req.query.limit || 20)
        const sort = req.query.sort || '-date'
        const filter = buildFilter(req.query, req.userId)

        const [items, total] = await Promise.all([
            Bill.find(filter).sort(sort).skip((page - 1) * limit).limit(limit),
            Bill.countDocuments(filter),
        ])

        const data = {
            data: items.map((b) => b.toClient()),
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

exports.getOne = async (req, res, next) => {
    try {
        const doc = await Bill.findOne({ _id: req.params.id, userId: req.userId })
        if (!doc) return res.status(404).json({ success: false, message: 'Not found', timestamp: new Date().toISOString() })
        res.json({ success: true, timestamp: new Date().toISOString(), data: doc.toClient() })
    } catch (err) {
        next(err)
    }
}

exports.create = async (req, res, next) => {
    try {
        const { description, items, paidBy, participants, subtotal, tax, taxPercentage, tip, total, date, status, splits } = req.body
        if (!description || !Array.isArray(items) || !paidBy || !Array.isArray(participants) || subtotal == null || total == null || !date) {
            return res.status(400).json({ success: false, message: 'Missing required fields', timestamp: new Date().toISOString() })
        }
        const normalizedItems = items.map((i) => ({ name: i.name, amount: i.amount, participants: i.participants || [] }))
        const doc = await Bill.create({
            description,
            items: normalizedItems,
            paidBy,
            participants,
            subtotal,
            tax: tax || 0,
            taxPercentage: taxPercentage || 0,
            tip: tip || 0,
            total,
            date: new Date(date),
            status: status || 'finalized',
            splits: splits || {},
            userId: req.userId,
        })
        res.status(201).json({ success: true, timestamp: new Date().toISOString(), data: doc.toClient() })
    } catch (err) {
        next(err)
    }
}

exports.update = async (req, res, next) => {
    try {
        const allowed = ['description', 'items', 'paidBy', 'participants', 'subtotal', 'tax', 'taxPercentage', 'tip', 'total', 'date', 'status', 'splits']
        const updates = {}
        for (const key of allowed) if (key in req.body) updates[key] = req.body[key]
        if (updates.date) updates.date = new Date(updates.date)
        if (updates.items) updates.items = updates.items.map((i) => ({ name: i.name, amount: i.amount, participants: i.participants || [] }))
        const doc = await Bill.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, updates, { new: true })
        if (!doc) return res.status(404).json({ success: false, message: 'Not found', timestamp: new Date().toISOString() })
        res.json({ success: true, timestamp: new Date().toISOString(), data: doc.toClient() })
    } catch (err) {
        next(err)
    }
}

exports.remove = async (req, res, next) => {
    try {
        const doc = await Bill.findOneAndDelete({ _id: req.params.id, userId: req.userId })
        if (!doc) return res.status(404).json({ success: false, message: 'Not found', timestamp: new Date().toISOString() })
        res.json({ success: true, timestamp: new Date().toISOString(), data: null })
    } catch (err) {
        next(err)
    }
}


