const Recurring = require('../models/Recurring')
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

function addFrequency(date, frequency) {
    const d = new Date(date)
    if (frequency === 'daily') {
        d.setDate(d.getDate() + 1)
    } else if (frequency === 'weekly') {
        d.setDate(d.getDate() + 7)
    } else if (frequency === 'monthly') {
        d.setMonth(d.getMonth() + 1)
    } else if (frequency === 'quarterly') {
        d.setMonth(d.getMonth() + 3)
    } else if (frequency === 'yearly') {
        d.setFullYear(d.getFullYear() + 1)
    }
    return d
}

async function processDueRecurringsForUser(userId) {
    const now = new Date()
    const dueRecurrings = await Recurring.find({ userId, status: 'active', nextDue: { $lte: now } })

    const createdTransactionIds = []
    const updatedRecurringIds = []

    for (const r of dueRecurrings) {
        let nextDue = new Date(r.nextDue)
        let changed = false

        while (nextDue <= now && r.status === 'active') {
            const dueDate = new Date(nextDue)

            const existing = await Transaction.findOne({
                userId,
                'metadata.recurringId': r._id,
                date: dueDate,
            })

            if (!existing) {
                const amount = -Math.abs(Number(r.amount) || 0)
                const tx = await Transaction.create({
                    description: r.description,
                    amount,
                    category: r.category,
                    date: dueDate,
                    ledgerId: r.ledgerId,
                    type: 'expense',
                    status: 'completed',
                    metadata: { recurringId: r._id.toString() },
                    userId,
                })
                createdTransactionIds.push(tx._id.toString())

                await adjustBudgetsForCategoryAndDate({
                    userId,
                    category: r.category,
                    date: dueDate,
                    deltaAmount: Math.abs(Number(r.amount) || 0),
                })
            }

            r.totalOccurrences = (r.totalOccurrences || 0) + 1
            r.lastProcessed = dueDate
            nextDue = addFrequency(nextDue, r.frequency)
            r.nextDue = nextDue
            changed = true
        }

        if (changed) {
            await r.save()
            updatedRecurringIds.push(r._id.toString())
        }
    }

    return { createdCount: createdTransactionIds.length, createdTransactionIds, updatedRecurringIds }
}

module.exports = { processDueRecurringsForUser }


