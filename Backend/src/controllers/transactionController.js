const Transaction = require('../models/Transaction')
const Budget = require('../models/Budget')

async function adjustBudgetsForCategoryAndDate({ userId, category, date, deltaAmount }) {
    if (!category || !date || !deltaAmount) return
    const txDate = new Date(date)
    const budgets = await Budget.find({
        userId,
        category,
        startDate: { $lte: txDate },
        endDate: { $gte: txDate },
    })
    for (const b of budgets) {
        const nextSpent = Math.max(0, (b.spent || 0) + deltaAmount)
        const nextStatus = nextSpent >= b.amount ? 'exceeded' : 'active'
        await Budget.findByIdAndUpdate(b._id, { $set: { spent: nextSpent, status: nextStatus } })
    }
}

function buildFilter(query, userId) {
    const filter = { userId }
    if (query.search) {
        filter.description = { $regex: query.search, $options: 'i' }
    }
    if (query.filter) {
        try {
            const parsed = typeof query.filter === 'string' ? JSON.parse(query.filter) : query.filter
            if (parsed.category) filter.category = parsed.category
            if (parsed.type) filter.type = parsed.type
            if (parsed.ledgerId) filter.ledgerId = parsed.ledgerId
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
        // Ensure due recurrings are processed so recent transactions include them
        try {
            const { processDueRecurringsForUser } = require('../services/recurringProcessor')
            await processDueRecurringsForUser(req.userId)
        } catch (_) { /* ignore processing errors for listing */ }
        const page = Number(req.query.page || 1)
        const limit = Number(req.query.limit || 10)
        const sort = req.query.sort || '-date'
        const filter = buildFilter(req.query, req.userId)

        const [items, total] = await Promise.all([
            Transaction.find(filter).sort(sort).skip((page - 1) * limit).limit(limit),
            Transaction.countDocuments(filter),
        ])

        const data = {
            data: items.map((t) => t.toClient()),
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
        const t = await Transaction.findOne({ _id: req.params.id, userId: req.userId })
        if (!t) return res.status(404).json({ success: false, message: 'Not found', timestamp: new Date().toISOString() })
        res.json({ success: true, timestamp: new Date().toISOString(), data: t.toClient() })
    } catch (err) {
        next(err)
    }
}

exports.create = async (req, res, next) => {
    try {
        const { description, amount, category, date, ledgerId, type, metadata } = req.body
        if (!description || amount == null || !category || !date || !type) {
            return res.status(400).json({ success: false, message: 'Missing required fields', timestamp: new Date().toISOString() })
        }
        const doc = await Transaction.create({
            description,
            amount,
            category,
            date: new Date(date),
            ledgerId,
            type,
            metadata,
            userId: req.userId,
        })
        // Sync budgets when an expense is created
        if (type === 'expense') {
            await adjustBudgetsForCategoryAndDate({
                userId: req.userId,
                category,
                date,
                // Amount might be negative for expenses; use absolute value for budget spent
                deltaAmount: Math.abs(Number(amount) || 0),
            })
        }
        res.status(201).json({ success: true, timestamp: new Date().toISOString(), data: doc.toClient() })
    } catch (err) {
        next(err)
    }
}

exports.update = async (req, res, next) => {
    try {
        const allowed = ['description', 'amount', 'category', 'date', 'ledgerId', 'type', 'status', 'metadata']
        const updates = {}
        for (const key of allowed) if (key in req.body) updates[key] = req.body[key]
        if (updates.date) updates.date = new Date(updates.date)
        const original = await Transaction.findOne({ _id: req.params.id, userId: req.userId })
        if (!original) return res.status(404).json({ success: false, message: 'Not found', timestamp: new Date().toISOString() })
        const t = await Transaction.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, updates, { new: true })
        if (!t) return res.status(404).json({ success: false, message: 'Not found', timestamp: new Date().toISOString() })
        // Re-sync budgets: remove previous expense impact, then add new expense impact
        if (original.type === 'expense') {
            await adjustBudgetsForCategoryAndDate({
                userId: req.userId,
                category: original.category,
                date: original.date,
                deltaAmount: -Math.abs(Number(original.amount) || 0),
            })
        }
        if (t.type === 'expense') {
            await adjustBudgetsForCategoryAndDate({
                userId: req.userId,
                category: t.category,
                date: t.date,
                deltaAmount: Math.abs(Number(t.amount) || 0),
            })
        }
        res.json({ success: true, timestamp: new Date().toISOString(), data: t.toClient() })
    } catch (err) {
        next(err)
    }
}

exports.remove = async (req, res, next) => {
    try {
        const t = await Transaction.findOneAndDelete({ _id: req.params.id, userId: req.userId })
        if (!t) return res.status(404).json({ success: false, message: 'Not found', timestamp: new Date().toISOString() })
        // Revert budget spent if an expense is removed
        if (t.type === 'expense') {
            await adjustBudgetsForCategoryAndDate({
                userId: req.userId,
                category: t.category,
                date: t.date,
                deltaAmount: -Math.abs(Number(t.amount) || 0),
            })
        }
        res.json({ success: true, timestamp: new Date().toISOString(), data: null })
    } catch (err) {
        next(err)
    }
}

exports.stats = async (req, res, next) => {
    try {
        const period = (() => {
            try {
                const parsed = typeof req.query.filter === 'string' ? JSON.parse(req.query.filter) : req.query.filter
                return parsed?.period || 'month'
            } catch (_) {
                return 'month'
            }
        })()

        const now = new Date()
        const start = new Date(now)
        if (period === 'week') start.setDate(now.getDate() - 7)
        else if (period === 'month') start.setMonth(now.getMonth() - 1)
        else if (period === 'year') start.setFullYear(now.getFullYear() - 1)

        const tx = await Transaction.find({ userId: req.userId, date: { $gte: start, $lte: now } })
        const totalIncome = tx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
        const totalExpenses = tx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
        const netAmount = totalIncome - totalExpenses

        const byCategory = {}
        for (const t of tx) {
            if (t.type !== 'expense') continue
            byCategory[t.category] = (byCategory[t.category] || 0) + t.amount
        }
        const sum = Object.values(byCategory).reduce((s, v) => s + v, 0)
        const categoryBreakdown = Object.entries(byCategory).map(([category, amount]) => ({
            category,
            amount,
            percentage: sum ? (amount / sum) * 100 : 0,
        }))

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            data: { totalIncome, totalExpenses, netAmount, categoryBreakdown },
        })
    } catch (err) {
        next(err)
    }
}


