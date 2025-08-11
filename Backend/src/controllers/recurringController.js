const Recurring = require('../models/Recurring')

function buildFilter(query, userId) {
    const filter = { userId }
    if (query.search) {
        filter.description = { $regex: query.search, $options: 'i' }
    }
    if (query.filter) {
        try {
            const parsed = typeof query.filter === 'string' ? JSON.parse(query.filter) : query.filter
            if (parsed.category) filter.category = parsed.category
            if (parsed.frequency) filter.frequency = parsed.frequency
            if (parsed.status) filter.status = parsed.status
            if (parsed.ledgerId) filter.ledgerId = parsed.ledgerId
            if (parsed.nextDueFrom || parsed.nextDueTo) {
                filter.nextDue = {}
                if (parsed.nextDueFrom) filter.nextDue.$gte = new Date(parsed.nextDueFrom)
                if (parsed.nextDueTo) filter.nextDue.$lte = new Date(parsed.nextDueTo)
            }
        } catch (_) { }
    }
    return filter
}

exports.list = async (req, res, next) => {
    try {
        const page = Number(req.query.page || 1)
        const limit = Number(req.query.limit || 10)
        const sort = req.query.sort || 'nextDue'
        const filter = buildFilter(req.query, req.userId)

        const [items, total] = await Promise.all([
            Recurring.find(filter).sort(sort).skip((page - 1) * limit).limit(limit),
            Recurring.countDocuments(filter),
        ])

        const data = {
            data: items.map((r) => r.toClient()),
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
        const r = await Recurring.findOne({ _id: req.params.id, userId: req.userId })
        if (!r) return res.status(404).json({ success: false, message: 'Not found', timestamp: new Date().toISOString() })
        res.json({ success: true, timestamp: new Date().toISOString(), data: r.toClient() })
    } catch (err) {
        next(err)
    }
}

exports.create = async (req, res, next) => {
    try {
        const { description, amount, category, frequency, startDate, ledgerId, status } = req.body
        if (!description || amount == null || !category || !frequency || !startDate) {
            return res.status(400).json({ success: false, message: 'Missing required fields', timestamp: new Date().toISOString() })
        }

        // nextDue starts as the startDate for a newly created recurring item
        const start = new Date(startDate)
        const doc = await Recurring.create({
            description,
            amount,
            category,
            frequency,
            startDate: start,
            nextDue: start,
            status: status || 'active',
            ledgerId,
            userId: req.userId,
        })
        res.status(201).json({ success: true, timestamp: new Date().toISOString(), data: doc.toClient() })
    } catch (err) {
        next(err)
    }
}

exports.update = async (req, res, next) => {
    try {
        const allowed = [
            'description',
            'amount',
            'category',
            'frequency',
            'startDate',
            'nextDue',
            'lastProcessed',
            'totalOccurrences',
            'status',
            'ledgerId',
            'metadata',
        ]
        const updates = {}
        for (const key of allowed) if (key in req.body) updates[key] = req.body[key]
        if (updates.startDate) updates.startDate = new Date(updates.startDate)
        if (updates.nextDue) updates.nextDue = new Date(updates.nextDue)
        if (updates.lastProcessed) updates.lastProcessed = new Date(updates.lastProcessed)
        const r = await Recurring.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, updates, { new: true })
        if (!r) return res.status(404).json({ success: false, message: 'Not found', timestamp: new Date().toISOString() })
        res.json({ success: true, timestamp: new Date().toISOString(), data: r.toClient() })
    } catch (err) {
        next(err)
    }
}

exports.remove = async (req, res, next) => {
    try {
        const r = await Recurring.findOneAndDelete({ _id: req.params.id, userId: req.userId })
        if (!r) return res.status(404).json({ success: false, message: 'Not found', timestamp: new Date().toISOString() })
        res.json({ success: true, timestamp: new Date().toISOString(), data: null })
    } catch (err) {
        next(err)
    }
}

exports.stats = async (req, res, next) => {
    try {
        const all = await Recurring.find({ userId: req.userId })
        const activeCount = all.filter((r) => r.status === 'active').length
        const monthlyTotal = all
            .filter((r) => r.status === 'active' && r.frequency === 'monthly')
            .reduce((s, r) => s + r.amount, 0)
        const nextDue = all
            .filter((r) => r.status === 'active')
            .sort((a, b) => a.nextDue.getTime() - b.nextDue.getTime())[0]?.nextDue

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            data: {
                activeCount,
                monthlyTotal,
                nextDue: nextDue ? nextDue.toISOString().slice(0, 10) : null,
            },
        })
    } catch (err) {
        next(err)
    }
}

// Return metadata useful for building UI filters/forms
exports.meta = async (_req, res, next) => {
    try {
        const categories = [
            'Housing',
            'Transportation',
            'Food',
            'Entertainment',
            'Health',
            'Utilities',
            'Insurance',
            'Subscriptions',
            'Other',
        ]

        const frequencies = [
            { value: 'daily', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' },
            { value: 'monthly', label: 'Monthly' },
            { value: 'quarterly', label: 'Quarterly' },
            { value: 'yearly', label: 'Yearly' },
        ]

        const statuses = ['active', 'paused', 'expired']

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            data: { categories, frequencies, statuses },
        })
    } catch (err) {
        next(err)
    }
}


