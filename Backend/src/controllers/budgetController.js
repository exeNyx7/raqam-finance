const Budget = require('../models/Budget')

function calculateStatus(amount, spent) {
    if (spent >= amount) return 'exceeded'
    return 'active'
}

exports.list = async (req, res, next) => {
    try {
        const page = Number(req.query.page || 1)
        const limit = Number(req.query.limit || 10)
        const sort = req.query.sort || '-createdAt'

        const filter = { userId: req.userId }
        if (req.query.filter) {
            try {
                const parsed = typeof req.query.filter === 'string' ? JSON.parse(req.query.filter) : req.query.filter
                if (parsed.period) filter.period = parsed.period
                if (parsed.category) filter.category = parsed.category
                if (parsed.status) filter.status = parsed.status
            } catch (_) { }
        }

        const [items, total] = await Promise.all([
            Budget.find(filter).sort(sort).skip((page - 1) * limit).limit(limit),
            Budget.countDocuments(filter),
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
        const b = await Budget.findOne({ _id: req.params.id, userId: req.userId })
        if (!b) return res.status(404).json({ success: false, message: 'Not found', timestamp: new Date().toISOString() })
        res.json({ success: true, timestamp: new Date().toISOString(), data: b.toClient() })
    } catch (err) {
        next(err)
    }
}

exports.create = async (req, res, next) => {
    try {
        const { name, amount, period, category, startDate, endDate } = req.body
        if (!name || amount == null || !period || !startDate || !endDate) {
            return res.status(400).json({ success: false, message: 'Missing required fields', timestamp: new Date().toISOString() })
        }
        const doc = await Budget.create({
            name,
            amount,
            period,
            category,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            status: 'active',
            userId: req.userId,
        })
        res.status(201).json({ success: true, timestamp: new Date().toISOString(), data: doc.toClient() })
    } catch (err) {
        next(err)
    }
}

exports.update = async (req, res, next) => {
    try {
        const allowed = ['name', 'amount', 'spent', 'period', 'category', 'startDate', 'endDate', 'status']
        const updates = {}
        for (const key of allowed) if (key in req.body) updates[key] = req.body[key]
        if (updates.startDate) updates.startDate = new Date(updates.startDate)
        if (updates.endDate) updates.endDate = new Date(updates.endDate)
        if ('amount' in updates || 'spent' in updates) {
            const b = await Budget.findOne({ _id: req.params.id, userId: req.userId })
            if (!b) return res.status(404).json({ success: false, message: 'Not found', timestamp: new Date().toISOString() })
            const nextAmount = 'amount' in updates ? updates.amount : b.amount
            const nextSpent = 'spent' in updates ? updates.spent : b.spent
            updates.status = calculateStatus(nextAmount, nextSpent)
        }
        const updated = await Budget.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, updates, { new: true })
        if (!updated) return res.status(404).json({ success: false, message: 'Not found', timestamp: new Date().toISOString() })
        res.json({ success: true, timestamp: new Date().toISOString(), data: updated.toClient() })
    } catch (err) {
        next(err)
    }
}

exports.remove = async (req, res, next) => {
    try {
        const b = await Budget.findOneAndDelete({ _id: req.params.id, userId: req.userId })
        if (!b) return res.status(404).json({ success: false, message: 'Not found', timestamp: new Date().toISOString() })
        res.json({ success: true, timestamp: new Date().toISOString(), data: null })
    } catch (err) {
        next(err)
    }
}

exports.progress = async (req, res, next) => {
    try {
        const b = await Budget.findOne({ _id: req.params.id, userId: req.userId })
        if (!b) return res.status(404).json({ success: false, message: 'Not found', timestamp: new Date().toISOString() })
        const today = new Date()
        const daysLeft = Math.max(0, Math.ceil((b.endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
        const progress = Math.min(100, (b.spent / b.amount) * 100)
        const remaining = b.amount - b.spent
        const onTrack = progress <= 80
        const projectedSpend = (b.spent / Math.max(1, (today.getTime() - b.startDate.getTime()))) * (b.endDate.getTime() - b.startDate.getTime())
        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            data: {
                budget: b.toClient(),
                progress,
                remaining,
                daysLeft,
                onTrack,
                projectedSpend,
            },
        })
    } catch (err) {
        next(err)
    }
}


