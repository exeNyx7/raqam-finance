const mongoose = require('mongoose')

const transactionSchema = new mongoose.Schema(
    {
        description: { type: String, required: true, trim: true },
        amount: { type: Number, required: true },
        category: { type: String, required: true, trim: true },
        date: { type: Date, required: true },
        ledgerId: { type: String, required: false },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
        type: { type: String, enum: ['income', 'expense'], required: true },
        status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'completed' },
        metadata: { type: Object },
    },
    { timestamps: true },
)

transactionSchema.methods.toClient = function toClient() {
    return {
        id: this._id.toString(),
        description: this.description,
        amount: this.amount,
        category: this.category,
        date: this.date.toISOString(),
        ledgerId: this.ledgerId,
        userId: this.userId.toString(),
        type: this.type,
        status: this.status,
        metadata: this.metadata,
        createdAt: this.createdAt.toISOString(),
        updatedAt: this.updatedAt.toISOString(),
    }
}

const Transaction = mongoose.model('Transaction', transactionSchema)

module.exports = Transaction


