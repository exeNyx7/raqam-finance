const mongoose = require('mongoose')

const notificationsSchema = new mongoose.Schema(
    {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
        reminders: { type: Boolean, default: true },
    },
    { _id: false },
)

const privacySchema = new mongoose.Schema(
    {
        profileVisibility: { type: String, enum: ['public', 'friends', 'private'], default: 'friends' },
        transactionVisibility: { type: String, enum: ['public', 'friends', 'private'], default: 'friends' },
    },
    { _id: false },
)

const settingsSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, index: true, required: true },
        currency: { type: String, default: 'PKR' },
        dateFormat: { type: String, default: 'DD/MM/YYYY' },
        theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
        notifications: { type: notificationsSchema, default: () => ({}) },
        privacy: { type: privacySchema, default: () => ({}) },
        categories: {
            type: [String],
            default: () => [
                'Food & Dining',
                'Transportation',
                'Shopping',
                'Entertainment',
                'Bills & Utilities',
                'Healthcare',
                'Travel',
                'Income',
                'Emergency',
                'Savings',
                'Investment',
                'Education',
                'Other',
            ],
        },
    },
    { timestamps: true },
)

settingsSchema.methods.toClient = function toClient() {
    return {
        currency: this.currency,
        dateFormat: this.dateFormat,
        theme: this.theme,
        notifications: {
            email: !!this.notifications?.email,
            push: !!this.notifications?.push,
            reminders: !!this.notifications?.reminders,
        },
        privacy: {
            profileVisibility: this.privacy?.profileVisibility || 'friends',
            transactionVisibility: this.privacy?.transactionVisibility || 'friends',
        },
        categories: Array.isArray(this.categories) ? this.categories : [],
        updatedAt: this.updatedAt.toISOString(),
    }
}

const Settings = mongoose.model('Settings', settingsSchema)

module.exports = Settings


