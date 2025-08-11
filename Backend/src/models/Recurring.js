const mongoose = require('mongoose')

const recurringSchema = new mongoose.Schema(
    {
        description: { type: String, required: true, trim: true },
        amount: { type: Number, required: true, min: 0 },
        category: { type: String, required: true, trim: true },
        frequency: {
            type: String,
            enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
            required: true,
        },
        startDate: { type: Date, required: true },
        nextDue: { type: Date, required: true },
        lastProcessed: { type: Date },
        totalOccurrences: { type: Number, default: 0 },
        status: { type: String, enum: ['active', 'paused', 'expired'], default: 'active' },
        ledgerId: { type: String },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
        metadata: { type: Object },
    },
    { timestamps: true },
)

recurringSchema.methods.toClient = function toClient() {
    return {
        id: this._id.toString(),
        description: this.description,
        amount: this.amount,
        category: this.category,
        frequency: this.frequency,
        startDate: this.startDate.toISOString().slice(0, 10),
        nextDue: this.nextDue.toISOString().slice(0, 10),
        lastProcessed: this.lastProcessed ? this.lastProcessed.toISOString().slice(0, 10) : null,
        totalOccurrences: this.totalOccurrences,
        status: this.status,
        ledgerId: this.ledgerId,
        userId: this.userId.toString(),
        metadata: this.metadata,
        createdAt: this.createdAt.toISOString(),
        updatedAt: this.updatedAt.toISOString(),
    }
}

const Recurring = mongoose.model('Recurring', recurringSchema)

module.exports = Recurring


