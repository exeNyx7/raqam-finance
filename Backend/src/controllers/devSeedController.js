const bcrypt = require('bcryptjs')
const User = require('../models/User')
const Ledger = require('../models/Ledger')
const Transaction = require('../models/Transaction')
const Person = require('../models/Person')
const Budget = require('../models/Budget')
const Recurring = require('../models/Recurring')
const Bill = require('../models/Bill')
const Goal = require('../models/Goal')
const Notification = require('../models/Notification')
const Settings = require('../models/Settings')

function pick(array, count) {
    const cloned = [...array]
    const result = []
    while (cloned.length && result.length < count) {
        const idx = Math.floor(Math.random() * cloned.length)
        result.push(cloned.splice(idx, 1)[0])
    }
    return result
}

function daysFromNow(days) {
    const d = new Date()
    d.setDate(d.getDate() + days)
    return d
}

async function clearAllCollections() {
    await Promise.all([
        Transaction.deleteMany({}),
        Bill.deleteMany({}),
        Budget.deleteMany({}),
        Recurring.deleteMany({}),
        Goal.deleteMany({}),
        Person.deleteMany({}),
        Notification.deleteMany({}),
        Ledger.deleteMany({}),
        Settings.deleteMany({}),
    ])
    // Users last to avoid FK-like references
    await User.deleteMany({})
}

async function ensureSettingsForUsers(userIds) {
    // Unique constraint on userId
    const ops = userIds.map((id) =>
        Settings.updateOne(
            { userId: id },
            {
                $setOnInsert: {
                    userId: id,
                    currency: 'PKR',
                    dateFormat: 'DD/MM/YYYY',
                    theme: 'system',
                },
            },
            { upsert: true },
        ),
    )
    await Promise.all(ops)
}

function buildDefaults() {
    const today = new Date()
    const nextMonth = daysFromNow(30)

    const users = [
        { name: 'Alice Tester', email: 'alice@example.com', password: 'Password123!' },
        { name: 'Bob Builder', email: 'bob@example.com', password: 'Password123!' },
        { name: 'Charlie Dev', email: 'charlie@example.com', password: 'Password123!' },
        { name: 'Diana QA', email: 'diana@example.com', password: 'Password123!' },
        { name: 'Eve Ops', email: 'eve@example.com', password: 'Password123!' },
    ]

    const ledgers = [
        { name: 'Household', description: 'Home expenses' },
        { name: 'Travel 2025', description: 'Trips and vacations' },
        { name: 'Side Hustle', description: 'Freelance income and expenses' },
        { name: 'Friends Group', description: 'Shared hangouts' },
        { name: 'Car', description: 'Car related expenses' },
    ]

    const budgets = [
        {
            name: 'Groceries',
            amount: 40000,
            spent: 12000,
            period: 'monthly',
            category: 'Food & Dining',
            startDate: new Date(today.getFullYear(), today.getMonth(), 1),
            endDate: new Date(today.getFullYear(), today.getMonth() + 1, 0),
            status: 'active',
        },
        {
            name: 'Transport',
            amount: 15000,
            spent: 2000,
            period: 'monthly',
            category: 'Transportation',
            startDate: new Date(today.getFullYear(), today.getMonth(), 1),
            endDate: new Date(today.getFullYear(), today.getMonth() + 1, 0),
            status: 'active',
        },
        {
            name: 'Entertainment',
            amount: 12000,
            spent: 9000,
            period: 'monthly',
            category: 'Entertainment',
            startDate: new Date(today.getFullYear(), today.getMonth(), 1),
            endDate: new Date(today.getFullYear(), today.getMonth() + 1, 0),
            status: 'active',
        },
        {
            name: 'Dining Out',
            amount: 10000,
            spent: 1500,
            period: 'monthly',
            category: 'Food & Dining',
            startDate: new Date(today.getFullYear(), today.getMonth(), 1),
            endDate: new Date(today.getFullYear(), today.getMonth() + 1, 0),
            status: 'active',
        },
        {
            name: 'Shopping',
            amount: 25000,
            spent: 5000,
            period: 'monthly',
            category: 'Shopping',
            startDate: new Date(today.getFullYear(), today.getMonth(), 1),
            endDate: new Date(today.getFullYear(), today.getMonth() + 1, 0),
            status: 'active',
        },
    ]

    const recurrings = [
        { description: 'Netflix', amount: 1600, category: 'Entertainment', frequency: 'monthly', startDate: today, nextDue: nextMonth },
        { description: 'Gym', amount: 3000, category: 'Healthcare', frequency: 'monthly', startDate: today, nextDue: nextMonth },
        { description: 'Internet', amount: 4500, category: 'Bills & Utilities', frequency: 'monthly', startDate: today, nextDue: nextMonth },
        { description: 'Rent', amount: 50000, category: 'Bills & Utilities', frequency: 'monthly', startDate: today, nextDue: nextMonth },
        { description: 'Savings', amount: 10000, category: 'Savings', frequency: 'monthly', startDate: today, nextDue: nextMonth },
    ]

    const goals = [
        { name: 'Emergency Fund', description: '6 months expenses', targetAmount: 300000, currentAmount: 50000, targetDate: daysFromNow(180), category: 'Savings', priority: 'high' },
        { name: 'New Laptop', description: 'Dev machine', targetAmount: 250000, currentAmount: 90000, targetDate: daysFromNow(120), category: 'Investment', priority: 'medium' },
        { name: 'Vacation', description: 'Beach trip', targetAmount: 200000, currentAmount: 20000, targetDate: daysFromNow(200), category: 'Travel', priority: 'medium' },
        { name: 'Course', description: 'Online education', targetAmount: 50000, currentAmount: 10000, targetDate: daysFromNow(90), category: 'Education', priority: 'low' },
        { name: 'Phone Upgrade', description: 'New phone', targetAmount: 180000, currentAmount: 30000, targetDate: daysFromNow(150), category: 'Shopping', priority: 'low' },
    ]

    const people = [
        { name: 'Faisal Khan', email: 'faisal@example.com', avatar: '', isAppUser: false, phone: '+92 300 0000001', notes: 'Colleague' },
        { name: 'Hina Ali', email: 'hina@example.com', avatar: '', isAppUser: false, phone: '+92 300 0000002', notes: 'Friend' },
        { name: 'Usman Iqbal', email: 'usman@example.com', avatar: '', isAppUser: false, phone: '+92 300 0000003', notes: 'Gym buddy' },
        { name: 'Sana Tariq', email: 'sana@example.com', avatar: '', isAppUser: false, phone: '+92 300 0000004', notes: 'Neighbor' },
        { name: 'Zain Malik', email: 'zain@example.com', avatar: '', isAppUser: false, phone: '+92 300 0000005', notes: 'Cousin' },
    ]

    const notifications = [
        { type: 'payment_received', title: 'Payment received', message: 'You received PKR 2,000', amount: 2000 },
        { type: 'added_to_ledger', title: 'Added to ledger', message: 'You were added to Household ledger', ledger: 'Household' },
        { type: 'new_expense', title: 'New expense', message: 'New expense in Travel 2025' },
        { type: 'reminder', title: 'Upcoming bill', message: 'Internet bill due soon', amount: 4500 },
        { type: 'payment_approved', title: 'Payment approved', message: 'Your payment was approved' },
    ]

    const transactions = [
        { description: 'Groceries at Imtiaz', amount: 5200, category: 'Food & Dining', date: daysFromNow(-3), type: 'expense' },
        { description: 'Fuel', amount: 4500, category: 'Transportation', date: daysFromNow(-2), type: 'expense' },
        { description: 'Freelance payout', amount: 75000, category: 'Income', date: daysFromNow(-7), type: 'income' },
        { description: 'Dinner', amount: 3200, category: 'Food & Dining', date: daysFromNow(-1), type: 'expense' },
        { description: 'Movie night', amount: 1800, category: 'Entertainment', date: daysFromNow(-5), type: 'expense' },
        { description: 'Phone bill', amount: 2300, category: 'Bills & Utilities', date: daysFromNow(-9), type: 'expense' },
        { description: 'Pharmacy', amount: 1200, category: 'Healthcare', date: daysFromNow(-4), type: 'expense' },
        { description: 'Cafe', amount: 900, category: 'Food & Dining', date: daysFromNow(-2), type: 'expense' },
        { description: 'Dividends', amount: 5000, category: 'Income', date: daysFromNow(-10), type: 'income' },
        { description: 'Uber', amount: 650, category: 'Transportation', date: daysFromNow(-1), type: 'expense' },
    ]

    const bills = [
        {
            description: 'Dinner split',
            items: [
                { name: 'Pizzas', amount: 2400, participants: ['Alice', 'Bob'] },
                { name: 'Drinks', amount: 600, participants: ['Alice', 'Bob', 'Charlie'] },
            ],
            paidBy: 'Alice',
            participants: ['Alice', 'Bob', 'Charlie'],
            subtotal: 3000,
            tax: 0,
            taxPercentage: 0,
            tip: 0,
            total: 3000,
            date: daysFromNow(-2),
        },
        {
            description: 'Groceries split',
            items: [
                { name: 'Veggies', amount: 1200, participants: ['Diana', 'Eve'] },
                { name: 'Snacks', amount: 800, participants: ['Diana', 'Eve'] },
            ],
            paidBy: 'Diana',
            participants: ['Diana', 'Eve'],
            subtotal: 2000,
            tax: 0,
            taxPercentage: 0,
            tip: 0,
            total: 2000,
            date: daysFromNow(-3),
        },
        {
            description: 'Ride to airport',
            items: [{ name: 'Uber', amount: 1800, participants: ['Alice', 'Charlie'] }],
            paidBy: 'Charlie',
            participants: ['Alice', 'Charlie'],
            subtotal: 1800,
            tax: 0,
            taxPercentage: 0,
            tip: 0,
            total: 1800,
            date: daysFromNow(-1),
        },
        {
            description: 'Snacks',
            items: [{ name: 'Chips', amount: 300, participants: ['Bob', 'Eve'] }],
            paidBy: 'Bob',
            participants: ['Bob', 'Eve'],
            subtotal: 300,
            tax: 0,
            taxPercentage: 0,
            tip: 0,
            total: 300,
            date: daysFromNow(-6),
        },
        {
            description: 'BBQ Night',
            items: [{ name: 'BBQ items', amount: 4200, participants: ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'] }],
            paidBy: 'Alice',
            participants: ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'],
            subtotal: 4200,
            tax: 0,
            taxPercentage: 0,
            tip: 0,
            total: 4200,
            date: daysFromNow(-8),
        },
    ]

    return { users, ledgers, budgets, recurrings, goals, people, notifications, transactions, bills }
}

async function seedAll(req, res) {
    try {
        if (process.env.NODE_ENV === 'production') {
            return res.status(403).json({ success: false, message: 'Seeding disabled in production' })
        }

        const providedKey = req.headers['x-dev-seed-key'] || req.query.key
        if (process.env.DEV_SEED_KEY && providedKey !== process.env.DEV_SEED_KEY) {
            return res.status(401).json({ success: false, message: 'Unauthorized: invalid dev seed key' })
        }

        const dropFirst = Boolean(req.body?.dropFirst ?? true)
        const bodyData = req.body?.data || {}

        if (dropFirst) {
            await clearAllCollections()
        }

        const defaults = buildDefaults()

        const usersInput = Array.isArray(bodyData.users) && bodyData.users.length ? bodyData.users : defaults.users
        const ledgersInput = Array.isArray(bodyData.ledgers) && bodyData.ledgers.length ? bodyData.ledgers : defaults.ledgers
        const budgetsInput = Array.isArray(bodyData.budgets) && bodyData.budgets.length ? bodyData.budgets : defaults.budgets
        const recurringsInput = Array.isArray(bodyData.recurrings) && bodyData.recurrings.length ? bodyData.recurrings : defaults.recurrings
        const goalsInput = Array.isArray(bodyData.goals) && bodyData.goals.length ? bodyData.goals : defaults.goals
        const peopleInput = Array.isArray(bodyData.people) && bodyData.people.length ? bodyData.people : defaults.people
        const notificationsInput = Array.isArray(bodyData.notifications) && bodyData.notifications.length ? bodyData.notifications : defaults.notifications
        const transactionsInput = Array.isArray(bodyData.transactions) && bodyData.transactions.length ? bodyData.transactions : defaults.transactions
        const billsInput = Array.isArray(bodyData.bills) && bodyData.bills.length ? bodyData.bills : defaults.bills

        // 1) Users
        const usersDocs = []
        for (const item of usersInput) {
            const passwordHash = await User.hashPassword ? await User.hashPassword(item.password || 'Password123!') : await bcrypt.hash(item.password || 'Password123!', 10)
            const user = await User.create({
                name: item.name,
                email: item.email,
                passwordHash,
                avatar: item.avatar || '',
            })
            usersDocs.push(user)
        }
        const userByEmail = new Map(usersDocs.map((u) => [u.email, u]))
        const userIds = usersDocs.map((u) => u._id)

        // 2) Settings (one per user)
        await ensureSettingsForUsers(userIds)

        // 3) Ledgers
        const ledgersDocs = []
        for (const [idx, item] of ledgersInput.entries()) {
            const owner = usersDocs[idx % usersDocs.length]
            const members = pick(usersDocs, Math.min(3, usersDocs.length)).map((u, i) => ({ userId: u._id, role: i === 0 ? 'owner' : 'editor' }))
            if (!members.find((m) => String(m.userId) === String(owner._id))) {
                members.unshift({ userId: owner._id, role: 'owner' })
            }
            const ledger = await Ledger.create({ name: item.name, description: item.description || '', userId: owner._id, members })
            ledgersDocs.push(ledger)
        }
        const ledgerByName = new Map(ledgersDocs.map((l) => [l.name, l]))

        // 4) Budgets
        const budgetsDocs = []
        for (const [idx, item] of budgetsInput.entries()) {
            const owner = usersDocs[idx % usersDocs.length]
            const budget = await Budget.create({ ...item, userId: owner._id })
            budgetsDocs.push(budget)
        }

        // 5) Recurrings
        const recurringsDocs = []
        for (const [idx, item] of recurringsInput.entries()) {
            const owner = usersDocs[idx % usersDocs.length]
            const ledger = ledgersDocs[idx % ledgersDocs.length]
            const recurring = await Recurring.create({ ...item, ledgerId: String(ledger._id), userId: owner._id })
            recurringsDocs.push(recurring)
        }

        // 6) Goals
        const goalsDocs = []
        for (const [idx, item] of goalsInput.entries()) {
            const owner = usersDocs[idx % usersDocs.length]
            const goal = await Goal.create({ ...item, userId: owner._id })
            goalsDocs.push(goal)
        }

        // 7) People
        const peopleDocs = []
        for (const [idx, item] of peopleInput.entries()) {
            const owner = usersDocs[idx % usersDocs.length]
            const person = await Person.create({ ...item, userId: owner._id })
            peopleDocs.push(person)
        }

        // 8) Notifications
        const notificationsDocs = []
        for (const [idx, item] of notificationsInput.entries()) {
            const owner = usersDocs[idx % usersDocs.length]
            const ledger = ledgerByName.get(item.ledger) || ledgersDocs[idx % ledgersDocs.length]
            const notification = await Notification.create({ ...item, ledger: ledger ? ledger.name : item.ledger, userId: owner._id })
            notificationsDocs.push(notification)
        }

        // 9) Transactions
        const transactionsDocs = []
        for (const [idx, item] of transactionsInput.entries()) {
            const owner = usersDocs[idx % usersDocs.length]
            const ledger = ledgersDocs[idx % ledgersDocs.length]
            const tx = await Transaction.create({ ...item, userId: owner._id, ledgerId: String(ledger._id), status: item.status || 'completed' })
            transactionsDocs.push(tx)
        }

        // 10) Bills
        const billsDocs = []
        for (const [idx, item] of billsInput.entries()) {
            const owner = usersDocs[idx % usersDocs.length]
            const bill = await Bill.create({ ...item, userId: owner._id })
            billsDocs.push(bill)
        }

        return res.json({
            success: true,
            message: 'Seeded dummy data for all models',
            data: {
                counts: {
                    users: usersDocs.length,
                    settings: userIds.length,
                    ledgers: ledgersDocs.length,
                    budgets: budgetsDocs.length,
                    recurrings: recurringsDocs.length,
                    goals: goalsDocs.length,
                    people: peopleDocs.length,
                    notifications: notificationsDocs.length,
                    transactions: transactionsDocs.length,
                    bills: billsDocs.length,
                },
            },
        })
    } catch (error) {
        console.error('Seed error:', error)
        return res.status(500).json({ success: false, message: error.message || 'Failed to seed data' })
    }
}

module.exports = { seedAll }


