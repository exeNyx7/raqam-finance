const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
        type: {
            type: String,
            enum: ['payment_received', 'payment_approved', 'added_to_ledger', 'new_expense', 'reminder'],
            required: true,
        },
        title: { type: String, required: true, trim: true },
        message: { type: String, required: true, trim: true },
        amount: { type: Number },
        ledger: { type: String },
        read: { type: Boolean, default: false, index: true },
        avatar: { type: String },
        metadata: { type: Object },
    },
    { timestamps: true },
)

notificationSchema.methods.toClient = function toClient() {
    return {
        id: this._id.toString(),
        userId: this.userId.toString(),
        type: this.type,
        title: this.title,
        message: this.message,
        amount: this.amount,
        ledger: this.ledger,
        read: this.read,
        avatar: this.avatar,
        timestamp: this.createdAt.toISOString(),
        createdAt: this.createdAt.toISOString(),
        updatedAt: this.updatedAt.toISOString(),
        metadata: this.metadata,
    }
}

const Notification = mongoose.model('Notification', notificationSchema)

module.exports = Notification


