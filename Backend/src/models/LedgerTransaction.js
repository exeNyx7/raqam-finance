const mongoose = require('mongoose')

const ledgerShareSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        amount: { type: Number, required: true },
        status: { type: String, enum: ['pending', 'paid', 'approved'], default: 'pending' },
        paidAt: { type: Date },
        approvedAt: { type: Date },
    },
    { _id: false },
)

const ledgerTransactionSchema = new mongoose.Schema(
    {
        description: { type: String, required: true, trim: true },
        totalAmount: { type: Number, required: true },
        category: { type: String, required: true, trim: true },
        date: { type: Date, required: true },
        ledgerId: { type: String, required: true },
        paidByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
        shares: { type: [ledgerShareSchema], default: [] },
        metadata: { type: Object },
    },
    { timestamps: true },
)

ledgerTransactionSchema.methods.toClient = function toClient(usersMap) {
    const paidById = this.paidByUserId.toString()
    return {
        id: this._id.toString(),
        description: this.description,
        totalAmount: this.totalAmount,
        category: this.category,
        date: this.date.toISOString(),
        ledgerId: this.ledgerId,
        paidBy: {
            id: paidById,
            name: usersMap?.[paidById]?.name || null,
        },
        shares: (this.shares || []).map((s) => {
            const uid = s.userId.toString()
            return {
                user: { id: uid, name: usersMap?.[uid]?.name || null },
                amount: s.amount,
                status: s.status,
                paidAt: s.paidAt ? s.paidAt.toISOString() : null,
                approvedAt: s.approvedAt ? s.approvedAt.toISOString() : null,
            }
        }),
        metadata: this.metadata,
        createdAt: this.createdAt.toISOString(),
        updatedAt: this.updatedAt.toISOString(),
    }
}

const LedgerTransaction = mongoose.model('LedgerTransaction', ledgerTransactionSchema)

module.exports = LedgerTransaction


