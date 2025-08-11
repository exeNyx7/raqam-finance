const mongoose = require('mongoose')

const billItemSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        amount: { type: Number, required: true },
        participants: [{ type: String, required: true }],
    },
    { _id: false },
)

const billSchema = new mongoose.Schema(
    {
        description: { type: String, required: true, trim: true },
        items: { type: [billItemSchema], default: [] },
        paidBy: { type: String, required: true },
        participants: { type: [String], default: [] },
        subtotal: { type: Number, required: true },
        tax: { type: Number, default: 0 },
        taxPercentage: { type: Number, default: 0 },
        tip: { type: Number, default: 0 },
        total: { type: Number, required: true },
        date: { type: Date, required: true },
        status: { type: String, enum: ['draft', 'finalized', 'settled'], default: 'finalized' },
        splits: { type: Map, of: Number, default: {} },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    },
    { timestamps: true },
)

billSchema.methods.toClient = function toClient() {
    return {
        id: this._id.toString(),
        description: this.description,
        items: this.items.map((i) => ({ id: undefined, name: i.name, amount: i.amount, participants: i.participants })),
        paidBy: this.paidBy,
        participants: this.participants,
        subtotal: this.subtotal,
        tax: this.tax,
        taxPercentage: this.taxPercentage,
        tip: this.tip,
        total: this.total,
        date: this.date.toISOString(),
        status: this.status,
        splits: Object.fromEntries(this.splits || []),
        userId: this.userId.toString(),
        createdAt: this.createdAt.toISOString(),
        updatedAt: this.updatedAt.toISOString(),
    }
}

const Bill = mongoose.model('Bill', billSchema)

module.exports = Bill


