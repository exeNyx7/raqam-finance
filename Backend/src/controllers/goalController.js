const Goal = require('../models/Goal')
const Transaction = require('../models/Transaction')
const Budget = require('../models/Budget')

function deriveStatus(currentAmount, targetAmount, existingStatus) {
    if (currentAmount >= targetAmount) return 'completed'
    if (existingStatus === 'paused') return 'paused'
    return 'active'
}

async function adjustBudgetsForCategoryAndDate({ userId, category, date, deltaAmount }) {
    try {
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
    } catch (_) { }
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
                if (parsed.status) filter.status = parsed.status
                if (parsed.category) filter.category = parsed.category
                if (parsed.priority) filter.priority = parsed.priority
            } catch (_) { }
        }

        const [items, total] = await Promise.all([
            Goal.find(filter).sort(sort).skip((page - 1) * limit).limit(limit),
            Goal.countDocuments(filter),
        ])

        const data = {
            data: items.map((g) => g.toClient()),
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
        const g = await Goal.findOne({ _id: req.params.id, userId: req.userId })
        if (!g) return res.status(404).json({ success: false, message: 'Not found', timestamp: new Date().toISOString() })
        res.json({ success: true, timestamp: new Date().toISOString(), data: g.toClient() })
    } catch (err) {
        next(err)
    }
}

exports.create = async (req, res, next) => {
    try {
        const { name, description, targetAmount, currentAmount = 0, targetDate, category, priority = 'medium', status = 'active' } = req.body
        if (!name || targetAmount == null || !category) {
            return res.status(400).json({ success: false, message: 'Missing required fields', timestamp: new Date().toISOString() })
        }
        const doc = await Goal.create({
            name,
            description,
            targetAmount,
            currentAmount,
            targetDate: targetDate ? new Date(targetDate) : undefined,
            category,
            priority,
            status: deriveStatus(currentAmount, targetAmount, status),
            userId: req.userId,
        })
        res.status(201).json({ success: true, timestamp: new Date().toISOString(), data: doc.toClient() })
    } catch (err) {
        next(err)
    }
}

exports.update = async (req, res, next) => {
    try {
        const allowed = ['name', 'description', 'targetAmount', 'currentAmount', 'targetDate', 'category', 'priority', 'status']
        const updates = {}
        for (const key of allowed) if (key in req.body) updates[key] = req.body[key]
        if (updates.targetDate) updates.targetDate = new Date(updates.targetDate)

        if ('currentAmount' in updates || 'targetAmount' in updates || 'status' in updates) {
            const g = await Goal.findOne({ _id: req.params.id, userId: req.userId })
            if (!g) return res.status(404).json({ success: false, message: 'Not found', timestamp: new Date().toISOString() })
            const nextCurrent = 'currentAmount' in updates ? updates.currentAmount : g.currentAmount
            const nextTarget = 'targetAmount' in updates ? updates.targetAmount : g.targetAmount
            const nextStatus = 'status' in updates ? updates.status : g.status
            updates.status = deriveStatus(nextCurrent, nextTarget, nextStatus)
        }

        const updated = await Goal.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, updates, { new: true })
        if (!updated) return res.status(404).json({ success: false, message: 'Not found', timestamp: new Date().toISOString() })
        res.json({ success: true, timestamp: new Date().toISOString(), data: updated.toClient() })
    } catch (err) {
        next(err)
    }
}

exports.remove = async (req, res, next) => {
    try {
        const g = await Goal.findOneAndDelete({ _id: req.params.id, userId: req.userId })
        if (!g) return res.status(404).json({ success: false, message: 'Not found', timestamp: new Date().toISOString() })
        res.json({ success: true, timestamp: new Date().toISOString(), data: null })
    } catch (err) {
        next(err)
    }
}

exports.addContribution = async (req, res, next) => {
    try {
        const { amount, note } = req.body
        if (amount == null) {
            return res.status(400).json({ success: false, message: 'Amount is required', timestamp: new Date().toISOString() })
        }
        const g = await Goal.findOne({ _id: req.params.id, userId: req.userId })
        if (!g) return res.status(404).json({ success: false, message: 'Not found', timestamp: new Date().toISOString() })

        g.currentAmount += Number(amount)
        g.status = deriveStatus(g.currentAmount, g.targetAmount, g.status)
        g.contributions.push({ amount: Number(amount), note })
        await g.save()

        // Mirror as an expense transaction (savings contribution reduces balance)
        const now = new Date()
        await Transaction.create({
            description: `Goal contribution: ${g.name}`,
            amount: Math.abs(Number(amount)),
            category: g.category,
            date: now,
            type: 'expense',
            metadata: { goalId: g._id.toString(), note },
            userId: req.userId,
        })

        // Adjust budgets for the category if any are active
        await adjustBudgetsForCategoryAndDate({
            userId: req.userId,
            category: g.category,
            date: now,
            deltaAmount: Math.abs(Number(amount) || 0),
        })

        res.json({ success: true, timestamp: new Date().toISOString(), data: g.toClient() })
    } catch (err) {
        next(err)
    }
}

exports.withdraw = async (req, res, next) => {
    try {
        const { amount, note } = req.body
        if (amount == null) {
            return res.status(400).json({ success: false, message: 'Amount is required', timestamp: new Date().toISOString() })
        }
        const withdrawal = Math.abs(Number(amount))
        const g = await Goal.findOne({ _id: req.params.id, userId: req.userId })
        if (!g) return res.status(404).json({ success: false, message: 'Not found', timestamp: new Date().toISOString() })
        if (g.currentAmount < withdrawal) {
            return res.status(400).json({ success: false, message: 'Insufficient goal balance', timestamp: new Date().toISOString() })
        }

        g.currentAmount -= withdrawal
        g.status = deriveStatus(g.currentAmount, g.targetAmount, g.status)
        g.contributions.push({ amount: -withdrawal, note })
        await g.save()

        // Mirror as an income transaction (withdrawing from savings increases balance)
        const now = new Date()
        await Transaction.create({
            description: `Goal withdrawal: ${g.name}`,
            amount: withdrawal,
            category: g.category,
            date: now,
            type: 'income',
            metadata: { goalId: g._id.toString(), note },
            userId: req.userId,
        })

        res.json({ success: true, timestamp: new Date().toISOString(), data: g.toClient() })
    } catch (err) {
        next(err)
    }
}


