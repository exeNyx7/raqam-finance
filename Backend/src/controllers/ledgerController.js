const Ledger = require('../models/Ledger')
const Transaction = require('../models/Transaction')
const User = require('../models/User')

exports.list = async (req, res, next) => {
    try {
        const page = Number(req.query.page || 1)
        const limit = Number(req.query.limit || 20)
        const sort = req.query.sort || '-createdAt'

        const filter = { $or: [{ userId: req.userId }, { 'members.userId': req.userId }] }

        const [items, total] = await Promise.all([
            Ledger.find(filter).sort(sort).skip((page - 1) * limit).limit(limit),
            Ledger.countDocuments(filter),
        ])

        // Build stats per ledger for current user
        const ledgerIds = items.map((l) => l._id.toString())
        const txByLedger = await Transaction.aggregate([
            { $match: { userId: req.userId, ledgerId: { $in: ledgerIds } } },
            { $group: { _id: '$ledgerId', count: { $sum: 1 }, lastActivity: { $max: '$date' }, expenses: { $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] } }, income: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] } } } },
        ])
        const statsMap = Object.fromEntries(
            txByLedger.map((t) => [t._id, { transactionCount: t.count, balance: (t.income || 0) - (t.expenses || 0), lastActivity: t.lastActivity }]),
        )

        // Build members details for the current page of ledgers
        const allMemberIds = Array.from(
            new Set(
                items.flatMap((l) => [l.userId.toString(), ...l.members.map((m) => m.userId.toString())]),
            ),
        )
        const users = allMemberIds.length ? await User.find({ _id: { $in: allMemberIds } }) : []
        const usersMap = Object.fromEntries(users.map((u) => [u._id.toString(), u]))

        const data = {
            data: items.map((l) => {
                const base = l.toClient()
                const role = l.members.find((m) => m.userId.toString() === req.userId.toString())?.role || (l.userId.toString() === req.userId.toString() ? 'owner' : 'viewer')
                const stats = statsMap[l._id.toString()] || { transactionCount: 0, balance: 0, lastActivity: null }
                const membersDetailed = l.members.map((m) => {
                    const u = usersMap[m.userId.toString()]
                    return {
                        id: m.userId.toString(),
                        name: u?.name || 'Member',
                        email: u?.email || '',
                        avatar: u?.avatar || null,
                        role: m.role,
                    }
                })
                return { ...base, role, balance: stats.balance, transactionCount: stats.transactionCount, lastActivity: stats.lastActivity ? new Date(stats.lastActivity).toISOString() : null, membersDetailed }
            }),
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
        const l = await Ledger.findOne({ _id: req.params.id, $or: [{ userId: req.userId }, { 'members.userId': req.userId }] })
        if (!l) return res.status(404).json({ success: false, message: 'Not found', timestamp: new Date().toISOString() })
        const memberUserIds = Array.from(new Set([l.userId.toString(), ...l.members.map((m) => m.userId.toString())]))
        const users = await User.find({ _id: { $in: memberUserIds } })
        const usersMap = Object.fromEntries(users.map((u) => [u._id.toString(), u]))
        const role = l.members.find((m) => m.userId.toString() === req.userId.toString())?.role || (l.userId.toString() === req.userId.toString() ? 'owner' : 'viewer')
        const tx = await Transaction.find({ userId: req.userId, ledgerId: l._id.toString() })
        const totalExpenses = tx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
        const balance = tx.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0)
        const detailed = {
            ...l.toClient(),
            role,
            totalExpenses,
            balance,
            membersDetailed: l.members.map((m) => {
                const u = usersMap[m.userId.toString()]
                return {
                    id: m.userId.toString(),
                    name: u?.name || 'Member',
                    email: u?.email || '',
                    avatar: u?.avatar || null,
                    role: m.role,
                }
            }),
        }
        res.json({ success: true, timestamp: new Date().toISOString(), data: detailed })
    } catch (err) {
        next(err)
    }
}

exports.create = async (req, res, next) => {
    try {
        const { name, description } = req.body
        if (!name) return res.status(400).json({ success: false, message: 'Name is required', timestamp: new Date().toISOString() })
        const doc = await Ledger.create({ name, description, userId: req.userId, members: [{ userId: req.userId, role: 'owner' }] })
        res.status(201).json({ success: true, timestamp: new Date().toISOString(), data: doc.toClient() })
    } catch (err) { next(err) }
}

exports.update = async (req, res, next) => {
    try {
        const allowed = ['name', 'description', 'members']
        const updates = {}
        for (const key of allowed) if (key in req.body) updates[key] = req.body[key]
        const l = await Ledger.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, updates, { new: true })
        if (!l) return res.status(404).json({ success: false, message: 'Not found', timestamp: new Date().toISOString() })
        res.json({ success: true, timestamp: new Date().toISOString(), data: l.toClient() })
    } catch (err) { next(err) }
}

exports.remove = async (req, res, next) => {
    try {
        const l = await Ledger.findOneAndDelete({ _id: req.params.id, userId: req.userId })
        if (!l) return res.status(404).json({ success: false, message: 'Not found', timestamp: new Date().toISOString() })
        res.json({ success: true, timestamp: new Date().toISOString(), data: null })
    } catch (err) { next(err) }
}

exports.leave = async (req, res, next) => {
    try {
        const ledger = await Ledger.findOne({ _id: req.params.id, $or: [{ userId: req.userId }, { 'members.userId': req.userId }] })
        if (!ledger) return res.status(404).json({ success: false, message: 'Not found', timestamp: new Date().toISOString() })
        // Owner cannot leave own ledger
        if (ledger.userId.toString() === req.userId.toString()) {
            return res.status(400).json({ success: false, message: 'Owner cannot leave the ledger', timestamp: new Date().toISOString() })
        }
        const before = ledger.members.length
        ledger.members = ledger.members.filter((m) => m.userId.toString() !== req.userId.toString())
        if (ledger.members.length === before) {
            return res.status(400).json({ success: false, message: 'Not a member', timestamp: new Date().toISOString() })
        }
        await ledger.save()
        return res.json({ success: true, timestamp: new Date().toISOString(), data: ledger.toClient() })
    } catch (err) {
        next(err)
    }
}


