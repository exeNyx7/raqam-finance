const Bill = require('../models/Bill')
const Transaction = require('../models/Transaction')

function buildFilter(query, userId) {
    const filter = { userId }
    if (query.search) {
        filter.description = { $regex: query.search, $options: 'i' }
    }
    if (query.filter) {
        try {
            const parsed = typeof query.filter === 'string' ? JSON.parse(query.filter) : query.filter
            if (parsed.status) filter.status = parsed.status
            if (parsed.paidBy) filter.paidBy = parsed.paidBy
            if (parsed.participant) filter.participants = parsed.participant
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
        const page = Number(req.query.page || 1)
        const limit = Number(req.query.limit || 20)
        const sort = req.query.sort || '-date'
        const filter = buildFilter(req.query, req.userId)

        const [items, total] = await Promise.all([
            Bill.find(filter).sort(sort).skip((page - 1) * limit).limit(limit),
            Bill.countDocuments(filter),
        ])

        const data = {
            data: items.map((b) => b.toClient()),
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
        const doc = await Bill.findOne({ _id: req.params.id, userId: req.userId })
        if (!doc) return res.status(404).json({ success: false, message: 'Not found', timestamp: new Date().toISOString() })
        res.json({ success: true, timestamp: new Date().toISOString(), data: doc.toClient() })
    } catch (err) {
        next(err)
    }
}

exports.create = async (req, res, next) => {
    try {
        const { description, items, paidBy, participants, subtotal, tax, taxPercentage, tip, total, date, status, splits } = req.body
        if (!description || !Array.isArray(items) || !paidBy || !Array.isArray(participants) || subtotal == null || total == null || !date) {
            return res.status(400).json({ success: false, message: 'Missing required fields', timestamp: new Date().toISOString() })
        }
        const normalizedItems = items.map((i) => ({ name: i.name, amount: i.amount, participants: i.participants || [] }))
        const doc = await Bill.create({
            description,
            items: normalizedItems,
            paidBy,
            participants,
            subtotal,
            tax: tax || 0,
            taxPercentage: taxPercentage || 0,
            tip: tip || 0,
            total,
            date: new Date(date),
            status: status || 'finalized',
            splits: splits || {},
            paymentStatus: { [paidBy]: true }, // Mark bill payer as already paid
            userId: req.userId,
        })

        // Create an expense transaction for the bill payer
        const expenseTransaction = new Transaction({
            userId: req.userId,
            description: `Paid bill: ${description}`,
            amount: total,
            type: 'expense',
            category: 'Bill Payment',
            date: new Date(date),
            status: 'completed',
            metadata: {
                billId: doc._id,
                paymentType: 'bill_payment'
            }
        })
        
        await expenseTransaction.save()

        res.status(201).json({ success: true, timestamp: new Date().toISOString(), data: doc.toClient() })
    } catch (err) {
        next(err)
    }
}

exports.update = async (req, res, next) => {
    try {
        const allowed = ['description', 'items', 'paidBy', 'participants', 'subtotal', 'tax', 'taxPercentage', 'tip', 'total', 'date', 'status', 'splits']
        const updates = {}
        for (const key of allowed) if (key in req.body) updates[key] = req.body[key]
        if (updates.date) updates.date = new Date(updates.date)
        if (updates.items) updates.items = updates.items.map((i) => ({ name: i.name, amount: i.amount, participants: i.participants || [] }))
        const doc = await Bill.findOneAndUpdate({ _id: req.params.id, userId: req.userId }, updates, { new: true })
        if (!doc) return res.status(404).json({ success: false, message: 'Not found', timestamp: new Date().toISOString() })
        res.json({ success: true, timestamp: new Date().toISOString(), data: doc.toClient() })
    } catch (err) {
        next(err)
    }
}

exports.remove = async (req, res, next) => {
    try {
        const doc = await Bill.findOneAndDelete({ _id: req.params.id, userId: req.userId })
        if (!doc) return res.status(404).json({ success: false, message: 'Not found', timestamp: new Date().toISOString() })
        
        // Remove all associated transactions for this bill
        await Transaction.deleteMany({
            userId: req.userId,
            'metadata.billId': doc._id
        })
        
        res.json({ success: true, timestamp: new Date().toISOString(), data: null })
    } catch (err) {
        next(err)
    }
}

// Update payment status for a specific participant in a bill
exports.updatePaymentStatus = async (req, res, next) => {
    try {
        const { id: billId } = req.params
        const { participantId, status } = req.body

        console.log('updatePaymentStatus called with:', {
            billId,
            participantId,
            status,
            userId: req.userId,
            params: req.params,
            body: req.body
        })

        if (!participantId || !status || !['paid', 'pending'].includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields or invalid status', 
                timestamp: new Date().toISOString() 
            })
        }

        const isPaid = status === 'paid'

        console.log('updatePaymentStatus - Searching for bill:', { billId, userId: req.userId })
        
        // Find the bill and verify ownership
        const bill = await Bill.findOne({ _id: billId, userId: req.userId })
        
        console.log('updatePaymentStatus - Bill found:', bill ? 'YES' : 'NO')
        if (bill) {
            console.log('updatePaymentStatus - Bill details:', { 
                _id: bill._id, 
                description: bill.description,
                userId: bill.userId 
            })
        }
        
        if (!bill) {
            return res.status(404).json({ 
                success: false, 
                message: 'Bill not found', 
                timestamp: new Date().toISOString() 
            })
        }

        // Verify participant is part of the bill
        if (!bill.participants.includes(participantId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Participant not found in this bill', 
                timestamp: new Date().toISOString() 
            })
        }

        // Initialize paymentStatus if it doesn't exist
        if (!bill.paymentStatus) {
            bill.paymentStatus = new Map()
        }

        // Update payment status
        bill.paymentStatus.set(participantId, isPaid)
        bill.markModified('paymentStatus')
        
        await bill.save()

        // If marking as paid, create a transaction record for cashflow tracking
        if (isPaid) {
            const splitAmount = bill.splits?.get(participantId) || 0
            
            if (splitAmount > 0) {
                // Create an income transaction representing the payment received
                const transaction = new Transaction({
                    userId: req.userId,
                    description: `Payment received from bill: ${bill.description}`,
                    amount: splitAmount,
                    type: 'income',
                    category: 'Bill Payment',
                    date: new Date(),
                    status: 'completed',
                    metadata: {
                        billId: bill._id,
                        participantId: participantId,
                        paymentType: 'bill_settlement'
                    }
                })
                
                await transaction.save()
            }
        } else {
            // If marking as unpaid, remove any existing settlement transaction
            await Transaction.deleteMany({
                userId: req.userId,
                'metadata.billId': bill._id,
                'metadata.participantId': participantId,
                'metadata.paymentType': 'bill_settlement'
            })
        }

        // Check if all participants have paid and update bill status
        const allPaid = bill.participants.every(pId => 
            pId === bill.paidBy || bill.paymentStatus?.get(pId) === true
        )
        
        if (allPaid && bill.status !== 'settled') {
            bill.status = 'settled'
            await bill.save()
        } else if (!allPaid && bill.status === 'settled') {
            bill.status = 'finalized'
            await bill.save()
        }

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            data: bill.toClient()
        })
    } catch (err) {
        next(err)
    }
}

exports.getSettlementDetails = async (req, res, next) => {
    try {
        const { id } = req.params
        const bill = await Bill.findOne({ _id: id, userId: req.userId })
        
        if (!bill) {
            return res.status(404).json({ success: false, message: 'Bill not found', timestamp: new Date().toISOString() })
        }

        // Calculate settlement details
        const settlements = []
        const paymentStatus = bill.paymentStatus || new Map()
        
        for (const participantId of bill.participants) {
            const owedAmount = bill.splits?.get(participantId) || 0
            const isPaid = paymentStatus.get(participantId) || false
            
            if (participantId !== bill.paidBy && owedAmount > 0) {
                settlements.push({
                    participantId,
                    owedAmount,
                    isPaid,
                    remainingAmount: isPaid ? 0 : owedAmount
                })
            }
        }

        const totalOwed = settlements.reduce((sum, s) => sum + s.owedAmount, 0)
        const totalPaid = settlements.reduce((sum, s) => sum + (s.isPaid ? s.owedAmount : 0), 0)
        const totalRemaining = totalOwed - totalPaid

        // Fix: If there are no settlements (no splits), settlement percentage should be 0
        const settlementPercentage = totalOwed > 0 ? Math.round((totalPaid / totalOwed) * 100) : 0

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            data: {
                billId: bill._id,
                billDescription: bill.description,
                totalAmount: bill.total,
                paidBy: bill.paidBy,
                status: bill.status,
                settlements,
                summary: {
                    totalOwed,
                    totalPaid,
                    totalRemaining,
                    isFullySettled: totalRemaining === 0 && totalOwed > 0,
                    settlementPercentage
                }
            }
        })
    } catch (err) {
        next(err)
    }
}

exports.getOptimalSettlements = async (req, res, next) => {
    try {
        const { id } = req.params
        const bill = await Bill.findOne({ _id: id, userId: req.userId })
        
        if (!bill) {
            return res.status(404).json({ success: false, message: 'Bill not found', timestamp: new Date().toISOString() })
        }

        const paymentStatus = bill.paymentStatus || new Map()
        const settlements = []
        
        // Calculate who owes what to the bill payer
        for (const participantId of bill.participants) {
            const owedAmount = bill.splits?.get(participantId) || 0
            const isPaid = paymentStatus.get(participantId) || false
            
            if (participantId !== bill.paidBy && owedAmount > 0 && !isPaid) {
                settlements.push({
                    from: participantId,
                    to: bill.paidBy,
                    amount: owedAmount,
                    reason: `Share of "${bill.description}"`
                })
            }
        }

        res.json({
            success: true,
            timestamp: new Date().toISOString(),
            data: {
                billId: bill._id,
                paidBy: bill.paidBy,
                settlements,
                totalPending: settlements.reduce((sum, s) => sum + s.amount, 0)
            }
        })
    } catch (err) {
        next(err)
    }
}


