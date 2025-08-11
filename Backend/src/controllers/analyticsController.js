const Transaction = require('../models/Transaction')

exports.dashboard = async (req, res, next) => {
    try {
        let period = 'month'
        if (req.query.filter) {
            try {
                const parsed = typeof req.query.filter === 'string' ? JSON.parse(req.query.filter) : req.query.filter
                if (parsed?.period) period = parsed.period
            } catch (_) { }
        }

        const { start: currentStart, end: currentEnd } = getPeriodRange(period)

        // Derive previous period range
        const prevEnd = new Date(currentStart)
        prevEnd.setDate(prevEnd.getDate() - 1)
        const prevStart = new Date(prevEnd)
        if (period === 'week') prevStart.setDate(prevEnd.getDate() - 6)
        else if (period === 'month') prevStart.setMonth(prevEnd.getMonth() - 1)
        else if (period === 'quarter') prevStart.setMonth(prevEnd.getMonth() - 3)
        else if (period === 'year') prevStart.setFullYear(prevEnd.getFullYear() - 1)

        const [currentTx, prevTx, allTx] = await Promise.all([
            Transaction.find({ userId: req.userId, date: { $gte: currentStart, $lte: currentEnd } }),
            Transaction.find({ userId: req.userId, date: { $gte: prevStart, $lte: prevEnd } }),
            Transaction.find({ userId: req.userId })
        ])

        const periodIncome = currentTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
        const periodExpenses = currentTx.filter((t) => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0)

        const prevIncome = prevTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
        const prevExpenses = prevTx.filter((t) => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0)

        const totalIncome = allTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
        const totalExpenses = allTx.filter((t) => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0)
        const totalBalance = totalIncome - totalExpenses

        const incomeTrend = prevIncome > 0 ? ((periodIncome - prevIncome) / prevIncome) * 100 : 0
        const expensesTrend = prevExpenses > 0 ? ((periodExpenses - prevExpenses) / prevExpenses) * 100 : 0
        const currentBalance = periodIncome - periodExpenses
        const prevBalance = prevIncome - prevExpenses
        const balanceTrend = prevBalance !== 0 ? ((currentBalance - prevBalance) / Math.abs(prevBalance)) * 100 : 0

        const activeLedgers = 0

        const data = {
            totalBalance,
            monthlyIncome: periodIncome,
            monthlyExpenses: periodExpenses,
            activeLedgers,
            trends: {
                income: Math.round(incomeTrend * 10) / 10,
                expenses: Math.round(expensesTrend * 10) / 10,
                balance: Math.round(balanceTrend * 10) / 10
            },
        }
        res.json({ success: true, timestamp: new Date().toISOString(), data })
    } catch (err) {
        next(err)
    }
}

function getPeriodRange(period) {
    const now = new Date()
    const end = now
    const start = new Date(now)
    if (period === 'week') start.setDate(now.getDate() - 7)
    else if (period === 'month') start.setMonth(now.getMonth() - 1)
    else if (period === 'quarter') start.setMonth(now.getMonth() - 3)
    else if (period === 'year') start.setFullYear(now.getFullYear() - 1)
    return { start, end }
}

exports.expenseBreakdown = async (req, res, next) => {
    try {
        let period = 'month'
        if (req.query.filter) {
            try {
                const parsed = typeof req.query.filter === 'string' ? JSON.parse(req.query.filter) : req.query.filter
                if (parsed?.period) period = parsed.period
            } catch (_) { }
        }

        const { start, end } = getPeriodRange(period)
        const tx = await Transaction.find({
            userId: req.userId,
            type: 'expense',
            date: { $gte: start, $lte: end },
        })

        const byCategory = {}
        tx.forEach((t) => {
            const key = t.category || 'Uncategorized'
            if (!byCategory[key]) byCategory[key] = { amount: 0, transactions: 0 }
            byCategory[key].amount += Math.abs(t.amount)
            byCategory[key].transactions += 1
        })

        const total = Object.values(byCategory).reduce((s, v) => s + v.amount, 0)
        const data = Object.entries(byCategory).map(([category, stats]) => ({
            category,
            amount: stats.amount,
            percentage: total ? (stats.amount / total) * 100 : 0,
            transactions: stats.transactions,
            trend: 0, // placeholder; could compare with previous period if needed
        }))

        res.json({ success: true, timestamp: new Date().toISOString(), data })
    } catch (err) {
        next(err)
    }
}

exports.monthlyTrends = async (req, res, next) => {
    try {
        let months = 6
        if (req.query.filter) {
            try {
                const parsed = typeof req.query.filter === 'string' ? JSON.parse(req.query.filter) : req.query.filter
                if (parsed?.months) months = Number(parsed.months)
            } catch (_) { }
        }

        const now = new Date()
        const start = new Date(now)
        start.setMonth(now.getMonth() - (months - 1))
        start.setDate(1)

        const tx = await Transaction.find({ userId: req.userId, date: { $gte: start, $lte: now } })

        const bucket = new Map()
        for (let i = 0; i < months; i++) {
            const d = new Date(start)
            d.setMonth(start.getMonth() + i)
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            bucket.set(key, { income: 0, expenses: 0 })
        }

        tx.forEach((t) => {
            const d = t.date
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            if (!bucket.has(key)) return
            if (t.type === 'income') bucket.get(key).income += t.amount
            else if (t.type === 'expense') bucket.get(key).expenses += Math.abs(t.amount)
        })

        const data = Array.from(bucket.entries()).map(([key, v]) => {
            const [year, month] = key.split('-')
            const date = new Date(Number(year), Number(month) - 1, 1)
            const monthLabel = date.toLocaleString('en-US', { month: 'short' })
            const savings = v.income - v.expenses
            const savingsRate = v.income ? (savings / v.income) * 100 : 0
            return { month: monthLabel, income: v.income, expenses: v.expenses, savings, savingsRate }
        })

        res.json({ success: true, timestamp: new Date().toISOString(), data })
    } catch (err) {
        next(err)
    }
}

