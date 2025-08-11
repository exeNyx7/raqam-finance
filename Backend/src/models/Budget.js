const mongoose = require('mongoose')

const budgetSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        amount: { type: Number, required: true },
        spent: { type: Number, default: 0 },
        period: { type: String, enum: ['weekly', 'monthly', 'yearly'], required: true },
        category: { type: String },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        status: { type: String, enum: ['active', 'exceeded', 'completed'], default: 'active' },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    },
    { timestamps: true },
)

budgetSchema.methods.toClient = function toClient() {
    return {
        id: this._id.toString(),
        name: this.name,
        amount: this.amount,
        spent: this.spent,
        period: this.period,
        category: this.category,
        startDate: this.startDate.toISOString().slice(0, 10),
        endDate: this.endDate.toISOString().slice(0, 10),
        status: this.status,
        createdAt: this.createdAt.toISOString(),
        updatedAt: this.updatedAt.toISOString(),
    }
}

const Budget = mongoose.model('Budget', budgetSchema)

module.exports = Budget


