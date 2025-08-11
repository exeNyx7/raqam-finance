const mongoose = require('mongoose')

const contributionSchema = new mongoose.Schema(
    {
        amount: { type: Number, required: true },
        note: { type: String },
        date: { type: Date, default: Date.now },
    },
    { _id: false },
)

const goalSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String },
        targetAmount: { type: Number, required: true },
        currentAmount: { type: Number, default: 0 },
        targetDate: { type: Date },
        category: { type: String, required: true, trim: true },
        priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
        status: { type: String, enum: ['active', 'completed', 'paused'], default: 'active' },
        contributions: { type: [contributionSchema], default: [] },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
    },
    { timestamps: true },
)

goalSchema.methods.toClient = function toClient() {
    return {
        id: this._id.toString(),
        name: this.name,
        description: this.description,
        targetAmount: this.targetAmount,
        currentAmount: this.currentAmount,
        targetDate: this.targetDate ? this.targetDate.toISOString().slice(0, 10) : undefined,
        category: this.category,
        priority: this.priority,
        status: this.status,
        createdAt: this.createdAt.toISOString(),
        updatedAt: this.updatedAt.toISOString(),
    }
}

const Goal = mongoose.model('Goal', goalSchema)

module.exports = Goal


