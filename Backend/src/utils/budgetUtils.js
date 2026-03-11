const Budget = require('../models/Budget')

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

module.exports = { adjustBudgetsForCategoryAndDate }
