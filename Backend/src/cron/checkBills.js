const Bill = require('../models/Bill')
const Notification = require('../models/Notification')
const mongoose = require('mongoose')

const checkBills = async () => {
    console.log('Running Bill Check Job...')
    try {
        const today = new Date()
        const threeDaysLater = new Date(today)
        threeDaysLater.setDate(today.getDate() + 3)
        threeDaysLater.setHours(0, 0, 0, 0)

        const endOfThreeDays = new Date(threeDaysLater)
        endOfThreeDays.setHours(23, 59, 59, 999)

        // Find bills due in exactly 3 days (or range if job missed)
        const billsDue = await Bill.find({
            date: {
                $gte: threeDaysLater,
                $lte: endOfThreeDays
            },
            status: { $ne: 'settled' }
        })

        console.log(`Found ${billsDue.length} bills due soon.`)

        for (const bill of billsDue) {
            // Check if notification already exists to avoid spam
            const exists = await Notification.findOne({
                userId: bill.userId,
                type: 'bill_due',
                'metadata.billId': bill._id
            })

            if (!exists) {
                await Notification.create({
                    userId: bill.userId,
                    title: 'Upcoming Bill Due',
                    message: `Reminder: Your bill "${bill.description}" of $${bill.total} is due on ${bill.date.toLocaleDateString()}.`,
                    type: 'bill_due',
                    metadata: { billId: bill._id },
                    read: false
                })
                console.log(`Notification sent for bill ${bill._id}`)
            }
        }
    } catch (error) {
        console.error('Error in checkBills job:', error)
    }
}

module.exports = checkBills
