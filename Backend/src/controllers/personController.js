const Person = require('../models/Person')
const User = require('../models/User')
const Bill = require('../models/Bill')
const Transaction = require('../models/Transaction')
const LedgerTransaction = require('../models/LedgerTransaction')

function buildFilter(query, userId) {
    const filter = { userId }
    if (query.search) {
        filter.$or = [
            { name: { $regex: query.search, $options: 'i' } },
            { email: { $regex: query.search, $options: 'i' } },
        ]
    }
    if (query.filter) {
        try {
            const parsed = typeof query.filter === 'string' ? JSON.parse(query.filter) : query.filter
            if (typeof parsed.isAppUser === 'boolean') filter.isAppUser = parsed.isAppUser
        } catch (_) { }
    }
    return filter
}

// Get all people added by current user (only custom people, not all registered users)
exports.getAllPeople = async (req, res, next) => {
    try {
        const page = Number(req.query.page || 1)
        const limit = Number(req.query.limit || 20)
        const search = req.query.search || ''
        const filter = req.query.filter
        
        // Parse filter if provided
        let filterCriteria = null
        if (filter) {
            try {
                filterCriteria = typeof filter === 'string' ? JSON.parse(filter) : filter
            } catch (_) { }
        }
        
        // Build query for user's people only
        const peopleFilter = { userId: req.userId }
        
        // Apply search if provided
        if (search) {
            peopleFilter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ]
        }
        
        // Apply isAppUser filter if specified
        if (filterCriteria && typeof filterCriteria.isAppUser === 'boolean') {
            peopleFilter.isAppUser = filterCriteria.isAppUser
        }
        
        // Get total count for pagination
        const total = await Person.countDocuments(peopleFilter)
        
        // Get paginated results
        const people = await Person.find(peopleFilter)
            .sort('-createdAt')
            .skip((page - 1) * limit)
            .limit(limit)
        
        const data = {
            data: people.map(p => p.toClient()),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: (page * limit) < total,
                hasPrev: page > 1,
            },
        }
        
        res.json({ success: true, timestamp: new Date().toISOString(), data })
    } catch (err) { 
        next(err) 
    }
}

exports.list = async (req, res, next) => {
    try {
        const page = Number(req.query.page || 1)
        const limit = Number(req.query.limit || 20)
        const sort = req.query.sort || '-createdAt'
        const filter = buildFilter(req.query, req.userId)

        const [items, total] = await Promise.all([
            Person.find(filter).sort(sort).skip((page - 1) * limit).limit(limit),
            Person.countDocuments(filter),
        ])

        const data = {
            data: items.map((p) => p.toClient()),
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
    } catch (err) { next(err) }
}

// Get all transactions involving a specific person
exports.getPersonTransactions = async (req, res, next) => {
    try {
        const personId = req.params.id
        
        // Verify the person exists and belongs to the current user
        const person = await Person.findOne({ _id: personId, userId: req.userId })
        if (!person) {
            return res.status(404).json({ 
                success: false, 
                message: 'Person not found', 
                timestamp: new Date().toISOString() 
            })
        }

        // Get bills where person is involved
        const bills = await Bill.find({ userId: req.userId }).sort({ date: -1 })
        const relevantBills = []
        
        // Process bills in parallel for better performance
        const billPromises = bills.map(async (bill) => {
            const billParticipants = bill.participants || []
            let isInvolved = false
            
            // Check if person is in main participants
            if (billParticipants.includes(personId)) {
                isInvolved = true
            }
            
            // Check if person is in individual item participants
            if (!isInvolved && bill.items) {
                for (const item of bill.items) {
                    if (item.participants && item.participants.includes(personId)) {
                        isInvolved = true
                        break
                    }
                }
            }
            
            // For app users, also check by email/user association
            if (!isInvolved && person.isAppUser) {
                const user = await User.findOne({ email: person.email })
                if (user) {
                    const userId = user._id.toString()
                    if (billParticipants.includes(userId) || billParticipants.includes('current_user')) {
                        isInvolved = true
                    }
                    
                    // Check item participants
                    if (!isInvolved && bill.items) {
                        for (const item of bill.items) {
                            if (item.participants && (
                                item.participants.includes(userId) || 
                                item.participants.includes('current_user')
                            )) {
                                isInvolved = true
                                break
                            }
                        }
                    }
                }
            }
            
            if (isInvolved) {
                return {
                    id: bill._id.toString(),
                    description: bill.description,
                    total: bill.total,
                    date: bill.date.toISOString(),
                    status: bill.status,
                    paidBy: bill.paidBy,
                    participantCount: billParticipants.length,
                    splits: Object.fromEntries(bill.splits || []),
                    createdAt: bill.createdAt.toISOString()
                }
            }
            return null
        })
        
        const billResults = await Promise.all(billPromises)
        relevantBills.push(...billResults.filter(bill => bill !== null))

        // Get ledger transactions where person is involved
        const ledgerTransactions = await LedgerTransaction.find({
            $or: [
                { paidByUserId: req.userId },
                { 'shares.userId': req.userId }
            ]
        }).sort({ date: -1 })

        const relevantLedgerTransactions = []
        
        // Process ledger transactions in parallel
        const ledgerPromises = ledgerTransactions.map(async (ledgerTx) => {
            let isInvolved = false
            
            // Check if person is the payer (for app users)
            if (person.isAppUser) {
                const user = await User.findOne({ email: person.email })
                if (user && ledgerTx.paidByUserId.toString() === user._id.toString()) {
                    isInvolved = true
                }
            }
            
            // Check if person is in shares (for app users)
            if (!isInvolved && person.isAppUser) {
                const user = await User.findOne({ email: person.email })
                if (user) {
                    const hasShare = ledgerTx.shares.some(share => 
                        share.userId.toString() === user._id.toString()
                    )
                    if (hasShare) isInvolved = true
                }
            }
            
            if (isInvolved) {
                // Get user details for display
                const usersInTransaction = await User.find({
                    _id: { $in: [
                        ledgerTx.paidByUserId,
                        ...ledgerTx.shares.map(s => s.userId)
                    ]}
                })
                const usersMap = {}
                usersInTransaction.forEach(u => {
                    usersMap[u._id.toString()] = u
                })
                
                return {
                    id: ledgerTx._id.toString(),
                    description: ledgerTx.description,
                    totalAmount: ledgerTx.totalAmount,
                    date: ledgerTx.date.toISOString(),
                    category: ledgerTx.category,
                    ledgerId: ledgerTx.ledgerId,
                    paidBy: {
                        id: ledgerTx.paidByUserId.toString(),
                        name: usersMap[ledgerTx.paidByUserId.toString()]?.name || 'Unknown'
                    },
                    shareCount: ledgerTx.shares.length,
                    createdAt: ledgerTx.createdAt.toISOString()
                }
            }
            return null
        })
        
        const ledgerResults = await Promise.all(ledgerPromises)
        relevantLedgerTransactions.push(...ledgerResults.filter(tx => tx !== null))

        // Get direct transactions (regular Transaction model) 
        // These would be personal transactions that might reference people in metadata
        const directTransactions = await Transaction.find({ 
            userId: req.userId,
            $or: [
                { 'metadata.personId': personId },
                { 'metadata.relatedPerson': person.email }
            ]
        }).sort({ date: -1 })

        const relevantDirectTransactions = directTransactions.map(tx => ({
            id: tx._id.toString(),
            description: tx.description,
            amount: tx.amount,
            type: tx.type,
            category: tx.category,
            date: tx.date.toISOString(),
            status: tx.status,
            createdAt: tx.createdAt.toISOString()
        }))

        const result = {
            person: person.toClient(),
            bills: relevantBills,
            ledgerTransactions: relevantLedgerTransactions,
            directPayments: relevantDirectTransactions,
            summary: {
                totalBills: relevantBills.length,
                totalLedgerTransactions: relevantLedgerTransactions.length,
                totalDirectPayments: relevantDirectTransactions.length,
                totalTransactions: relevantBills.length + relevantLedgerTransactions.length + relevantDirectTransactions.length
            }
        }

        res.json({ 
            success: true, 
            timestamp: new Date().toISOString(), 
            data: result 
        })
    } catch (err) { 
        console.error('Error getting person transactions:', err)
        next(err) 
    }
}

exports.getOne = async (req, res, next) => {
    try {
        const p = await Person.findOne({ _id: req.params.id, userId: req.userId })
        if (!p) return res.status(404).json({ success: false, message: 'Not found', timestamp: new Date().toISOString() })
        res.json({ success: true, timestamp: new Date().toISOString(), data: p.toClient() })
    } catch (err) { next(err) }
}

exports.create = async (req, res, next) => {
    try {
        const { name, email, phone, notes, isAppUser, avatar } = req.body
        if (!name || !email) return res.status(400).json({ success: false, message: 'Name and email are required', timestamp: new Date().toISOString() })
        const doc = await Person.create({ name, email, phone, notes, isAppUser: !!isAppUser, avatar, userId: req.userId })
        res.status(201).json({ success: true, timestamp: new Date().toISOString(), data: doc.toClient() })
    } catch (err) { next(err) }
}

exports.update = async (req, res, next) => {
    try {
        const allowed = ['name', 'email', 'phone', 'notes', 'isAppUser', 'avatar']
        const updates = {}
        for (const key of allowed) if (key in req.body) updates[key] = req.body[key]
        const p = await Person.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, updates, { new: true })
        if (!p) return res.status(404).json({ success: false, message: 'Not found', timestamp: new Date().toISOString() })
        res.json({ success: true, timestamp: new Date().toISOString(), data: p.toClient() })
    } catch (err) { next(err) }
}

exports.remove = async (req, res, next) => {
    try {
        const p = await Person.findOneAndDelete({ _id: req.params.id, userId: req.userId })
        if (!p) return res.status(404).json({ success: false, message: 'Not found', timestamp: new Date().toISOString() })
        res.json({ success: true, timestamp: new Date().toISOString(), data: null })
    } catch (err) { next(err) }
}


