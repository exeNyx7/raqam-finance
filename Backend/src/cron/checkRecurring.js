const Recurring = require('../models/Recurring')
const Transaction = require('../models/Transaction')
const Notification = require('../models/Notification')
const mongoose = require('mongoose')
const { adjustBudgetsForCategoryAndDate } = require('../utils/budgetUtils')

const checkRecurring = async () => {
    console.log('Running Recurring Transaction Check Job...')
    try {
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Find active recurring items due today or before (catch up)
        const dueItems = await Recurring.find({
            status: 'active',
            nextDue: { $lte: today }
        })

        console.log(`Found ${dueItems.length} recurring items due.`)

        for (const item of dueItems) {
            const session = await mongoose.startSession()
            session.startTransaction()
            try {
                // 1. Create the transaction
                const newTx = await Transaction.create([{
                    description: item.description,
                    amount: item.amount,
                    type: 'expense', // Recurring usually expenses, but could be income. Assuming expense for now or add type to Recurring model
                    category: item.category,
                    date: new Date(), // Transaction date is now
                    userId: item.userId,
                    ledgerId: item.ledgerId,
                    status: 'completed', // Auto-completed
                    metadata: { recurringId: item._id }
                }], { session })

                // 2. Update nextDue date
                let nextDate = new Date(item.nextDue)
                switch (item.frequency) {
                    case 'daily': nextDate.setDate(nextDate.getDate() + 1); break;
                    case 'weekly': nextDate.setDate(nextDate.getDate() + 7); break;
                    case 'monthly': nextDate.setMonth(nextDate.getMonth() + 1); break;
                    case 'quarterly': nextDate.setMonth(nextDate.getMonth() + 3); break;
                    case 'yearly': nextDate.setFullYear(nextDate.getFullYear() + 1); break;
                }

                await Recurring.findByIdAndUpdate(item._id, {
                    nextDue: nextDate,
                    lastProcessed: new Date(),
                    $inc: { totalOccurrences: 1 }
                }, { session })

                // 3. Notify User
                await Notification.create([{
                    userId: item.userId,
                    title: 'Recurring Transaction Processed',
                    message: `Successfully processed "${item.description}" ($${item.amount}). Next due: ${nextDate.toLocaleDateString()}`,
                    type: 'recurring_processed',
                    metadata: { transactionId: newTx[0]._id, recurringId: item._id },
                    read: false
                }], { session })

                await session.commitTransaction()
                // Update matching budgets for the recurring expense
                await adjustBudgetsForCategoryAndDate({
                    userId: item.userId,
                    category: item.category,
                    date: new Date(),
                    deltaAmount: Math.abs(Number(item.amount)),
                })
                console.log(`Processed recurring item ${item._id}`)

            } catch (err) {
                await session.abortTransaction()
                console.error(`Failed to process recurring item ${item._id}:`, err)
            } finally {
                session.endSession()
            }
        }
    } catch (error) {
        console.error('Error in checkRecurring job:', error)
    }
}

module.exports = checkRecurring
