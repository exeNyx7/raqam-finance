const Ledger = require('../models/Ledger')
const Transaction = require('../models/Transaction')
const LedgerTransaction = require('../models/LedgerTransaction')
const Notification = require('../models/Notification')
const Budget = require('../models/Budget')
const User = require('../models/User')

async function adjustBudgetsForCategoryAndDate({ userId, category, date, deltaAmount }) {
    try {
        if (!category || !date || !deltaAmount) return
        const txDate = new Date(date)
        const budgets = await Budget.find({ userId, category, startDate: { $lte: txDate }, endDate: { $gte: txDate } })
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
                const role = l.userId.toString() === req.userId.toString() ? 'owner' : 'member'
                const stats = statsMap[l._id.toString()] || { transactionCount: 0, balance: 0, lastActivity: null }
                const ownerId = l.userId.toString()
                const seen = new Set([ownerId])
                const membersForDisplay = [{ userId: l.userId }, ...l.members.filter((m) => {
                    const id = m.userId.toString()
                    if (seen.has(id)) return false
                    seen.add(id)
                    return true
                })]
                const membersDetailed = membersForDisplay.map((m) => {
                    const id = m.userId.toString()
                    const u = usersMap[id]
                    const isSelf = id === req.userId.toString()
                    const name = isSelf ? 'You' : (u?.name || (id === ownerId ? 'Owner' : 'Member'))
                    return { id, name, email: u?.email || '', avatar: u?.avatar || null }
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
        const role = l.userId.toString() === req.userId.toString() ? 'owner' : 'member'
        const tx = await Transaction.find({ userId: req.userId, ledgerId: l._id.toString() })
        const totalExpenses = tx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
        const balance = tx.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0)
        const ownerId = l.userId.toString()
        const seen = new Set([ownerId])
        const membersForDisplay = [{ userId: l.userId }, ...l.members.filter((m) => {
            const id = m.userId.toString()
            if (seen.has(id)) return false
            seen.add(id)
            return true
        })]
        const detailed = {
            ...l.toClient(),
            role,
            totalExpenses,
            balance,
            membersDetailed: membersForDisplay.map((m) => {
                const id = m.userId.toString()
                const u = usersMap[id]
                const isSelf = id === req.userId.toString()
                const name = isSelf ? 'You' : (u?.name || (id === ownerId ? 'Owner' : 'Member'))
                return { id, name, email: u?.email || '', avatar: u?.avatar || null }
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

        // Optional members can be provided for shared ledgers
        const providedMembers = Array.isArray(req.body.members) ? req.body.members : []
        const normalizedMembers = []
        const seen = new Set()
        for (const m of providedMembers) {
            if (!m || !m.userId) continue
            const id = String(m.userId)
            if (id === String(req.userId)) continue // owner added separately
            if (seen.has(id)) continue
            seen.add(id)
            normalizedMembers.push({ userId: id })
        }

        const members = [{ userId: req.userId }, ...normalizedMembers]
        const doc = await Ledger.create({ name, description, userId: req.userId, members })

        // Notify added members so it shows in their shared ledger list
        if (normalizedMembers.length) {
            try {
                await Promise.all(
                    normalizedMembers.map((m) =>
                        Notification.create({
                            userId: m.userId,
                            type: 'added_to_ledger',
                            title: 'Added to ledger',
                            message: `You were added to ${name}`,
                            ledger: name,
                            metadata: { ledgerId: doc._id.toString() },
                        }),
                    ),
                )
            } catch (_) { }
        }

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



// Create a ledger transaction with splits, mirror payer's main transaction, and notify participants
exports.addTransaction = async (req, res, next) => {
    try {
        const { id } = req.params
        const { description, totalAmount, category, date, participants } = req.body
        // participants: Array<{ userId: string, amount?: number }>
        if (!description || totalAmount == null || !category || !date) {
            return res.status(400).json({ success: false, message: 'Missing required fields', timestamp: new Date().toISOString() })
        }
        const ledger = await Ledger.findOne({ _id: id, $or: [{ userId: req.userId }, { 'members.userId': req.userId }] })
        if (!ledger) return res.status(404).json({ success: false, message: 'Ledger not found', timestamp: new Date().toISOString() })

        const memberIds = new Set([ledger.userId.toString(), ...ledger.members.map((m) => m.userId.toString())])
        // Normalize participants: default equal split among provided or all members excluding payer if none provided
        let sharesInput = Array.isArray(participants) ? participants.filter((p) => p && p.userId && memberIds.has(String(p.userId))) : []
        const payerId = req.userId.toString()
        // Ensure payer is not included as a debtor
        sharesInput = sharesInput.filter((p) => String(p.userId) !== payerId)
        if (sharesInput.length === 0) {
            const others = Array.from(memberIds).filter((uid) => uid !== req.userId.toString())
            sharesInput = others.map((uid) => ({ userId: uid }))
        }

        const shareCount = sharesInput.length
        const equalShare = shareCount > 0 ? Math.abs(Number(totalAmount)) / shareCount : 0
        const normalizedShares = sharesInput.map((p) => ({
            userId: String(p.userId),
            amount: p.amount != null ? Math.abs(Number(p.amount)) : equalShare,
            status: 'pending',
        }))

        const ledgerTx = await LedgerTransaction.create({
            description,
            totalAmount: Math.abs(Number(totalAmount)),
            category,
            date: new Date(date),
            ledgerId: id,
            paidByUserId: payerId,
            shares: normalizedShares,
        })

        // Mirror payer's main expense transaction for the full amount under the ledger
        const payerExpense = await Transaction.create({
            description,
            amount: Math.abs(Number(totalAmount)),
            category,
            date: new Date(date),
            ledgerId: id,
            type: 'expense',
            metadata: { ledgerTransactionId: ledgerTx._id.toString(), paidByUserId: payerId },
            userId: req.userId,
        })
        await adjustBudgetsForCategoryAndDate({ userId: req.userId, category, date, deltaAmount: Math.abs(Number(totalAmount)) })

        // Notify participants of amount owed
        const users = await User.find({ _id: { $in: Array.from(memberIds) } })
        const usersMap = Object.fromEntries(users.map((u) => [u._id.toString(), u]))
        const payerName = usersMap[payerId]?.name || 'A member'
        await Promise.all(
            normalizedShares
                .filter((s) => s.userId !== payerId)
                .map((s) =>
                    Notification.create({
                        userId: s.userId,
                        type: 'new_expense',
                        title: 'Payment requested',
                        message: `${payerName} paid ${Math.abs(Number(totalAmount)).toFixed(2)}. Your share is ${s.amount.toFixed(2)}.`,
                        amount: s.amount,
                        ledger: ledger.name,
                        metadata: { ledgerId: id, ledgerTransactionId: ledgerTx._id.toString(), category },
                    }),
                ),
        )

        res.status(201).json({ success: true, timestamp: new Date().toISOString(), data: ledgerTx.toClient(usersMap) })
    } catch (err) {
        next(err)
    }
}

// Participant marks own share as paid
exports.markSharePaid = async (req, res, next) => {
    try {
        const { id, txId } = req.params
        const lt = await LedgerTransaction.findOne({ _id: txId, ledgerId: id })
        if (!lt) return res.status(404).json({ success: false, message: 'Not found', timestamp: new Date().toISOString() })
        const index = (lt.shares || []).findIndex((s) => s.userId.toString() === req.userId.toString())
        if (index === -1) return res.status(403).json({ success: false, message: 'Not a participant', timestamp: new Date().toISOString() })
        lt.shares[index].status = 'paid'
        lt.shares[index].paidAt = new Date()
        await lt.save()

        // Notify payer
        await Notification.create({
            userId: lt.paidByUserId,
            type: 'payment_received',
            title: 'Payment marked as sent',
            message: 'A participant marked their share as paid. Please review.',
            amount: lt.shares[index].amount,
            ledger: id,
            metadata: { ledgerTransactionId: lt._id.toString(), participantUserId: req.userId.toString() },
        })

        const users = await User.find({ _id: { $in: [lt.paidByUserId, ...lt.shares.map((s) => s.userId)] } })
        const usersMap = Object.fromEntries(users.map((u) => [u._id.toString(), u]))
        res.json({ success: true, timestamp: new Date().toISOString(), data: lt.toClient(usersMap) })
    } catch (err) { next(err) }
}

// Payer approves a participant's payment, mirror income to payer and expense to participant
exports.approveShare = async (req, res, next) => {
    try {
        const { id, txId, userId } = req.params
        const lt = await LedgerTransaction.findOne({ _id: txId, ledgerId: id })
        if (!lt) return res.status(404).json({ success: false, message: 'Not found', timestamp: new Date().toISOString() })
        if (lt.paidByUserId.toString() !== req.userId.toString()) {
            return res.status(403).json({ success: false, message: 'Only payer can approve', timestamp: new Date().toISOString() })
        }
        const index = (lt.shares || []).findIndex((s) => s.userId.toString() === String(userId))
        if (index === -1) return res.status(404).json({ success: false, message: 'Share not found', timestamp: new Date().toISOString() })
        lt.shares[index].status = 'approved'
        lt.shares[index].approvedAt = new Date()
        await lt.save()

        const amount = Math.abs(Number(lt.shares[index].amount))
        // Mirror income to payer
        await Transaction.create({
            description: `Reimbursement: ${lt.description}`,
            amount,
            category: lt.category,
            date: new Date(),
            ledgerId: id,
            type: 'income',
            metadata: { ledgerTransactionId: lt._id.toString(), fromUserId: String(userId) },
            userId: lt.paidByUserId,
        })
        // Mirror expense to participant
        const participantExpense = await Transaction.create({
            description: `Ledger payment: ${lt.description}`,
            amount,
            category: lt.category,
            date: new Date(),
            ledgerId: id,
            type: 'expense',
            metadata: { ledgerTransactionId: lt._id.toString(), toUserId: lt.paidByUserId.toString() },
            userId: String(userId),
        })
        await adjustBudgetsForCategoryAndDate({ userId: String(userId), category: lt.category, date: new Date(), deltaAmount: amount })

        // Notify participant of approval
        await Notification.create({
            userId: String(userId),
            type: 'payment_approved',
            title: 'Payment approved',
            message: 'Your payment was approved by the payer.',
            amount,
            ledger: id,
            metadata: { ledgerTransactionId: lt._id.toString() },
        })

        const users = await User.find({ _id: { $in: [lt.paidByUserId, ...lt.shares.map((s) => s.userId)] } })
        const usersMap = Object.fromEntries(users.map((u) => [u._id.toString(), u]))
        res.json({ success: true, timestamp: new Date().toISOString(), data: lt.toClient(usersMap) })
    } catch (err) { next(err) }
}

// List ledger transactions for a ledger (visible to members)
exports.listTransactions = async (req, res, next) => {
    try {
        const { id } = req.params
        const ledger = await Ledger.findOne({ _id: id, $or: [{ userId: req.userId }, { 'members.userId': req.userId }] })
        if (!ledger) return res.status(404).json({ success: false, message: 'Not found', timestamp: new Date().toISOString() })
        const [items, users] = await Promise.all([
            LedgerTransaction.find({ ledgerId: id }).sort('-date'),
            User.find({ _id: { $in: Array.from(new Set([ledger.userId.toString(), ...ledger.members.map((m) => m.userId.toString())])) } }),
        ])
        const usersMap = Object.fromEntries(users.map((u) => [u._id.toString(), u]))
        const data = items.map((lt) => lt.toClient(usersMap))
        res.json({ success: true, timestamp: new Date().toISOString(), data })
    } catch (err) { next(err) }
}

// Remove a ledger transaction (only payer can delete). Also remove mirrored payer expense.
exports.removeTransaction = async (req, res, next) => {
    try {
        const { id, txId } = req.params
        const lt = await LedgerTransaction.findOne({ _id: txId, ledgerId: id })
        if (!lt) return res.status(404).json({ success: false, message: 'Not found', timestamp: new Date().toISOString() })
        if (lt.paidByUserId.toString() !== req.userId.toString()) {
            return res.status(403).json({ success: false, message: 'Only creator can delete', timestamp: new Date().toISOString() })
        }
        await LedgerTransaction.deleteOne({ _id: txId })
        // Remove the initial mirrored expense for payer and adjust budgets
        const payerExpense = await Transaction.findOneAndDelete({
            'userId': lt.paidByUserId,
            'ledgerId': id,
            'type': 'expense',
            'metadata.ledgerTransactionId': txId,
        })
        if (payerExpense) {
            await adjustBudgetsForCategoryAndDate({ userId: lt.paidByUserId, category: payerExpense.category, date: payerExpense.date, deltaAmount: -Math.abs(Number(payerExpense.amount) || 0) })
        }
        res.json({ success: true, timestamp: new Date().toISOString(), data: null })
    } catch (err) { next(err) }
}
