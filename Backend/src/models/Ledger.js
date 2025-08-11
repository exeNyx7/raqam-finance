const mongoose = require('mongoose')

const ledgerMemberSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        role: { type: String, enum: ['owner', 'editor', 'viewer'], default: 'viewer' },
    },
    { _id: false },
)

const ledgerSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, trim: true },
        members: { type: [ledgerMemberSchema], default: [] },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true }, // owner for quick queries
    },
    { timestamps: true },
)

ledgerSchema.methods.toClient = function toClient() {
    return {
        id: this._id.toString(),
        name: this.name,
        description: this.description || null,
        members: this.members.map((m) => ({ userId: m.userId.toString(), role: m.role })),
        userId: this.userId.toString(),
        createdAt: this.createdAt.toISOString(),
        updatedAt: this.updatedAt.toISOString(),
    }
}

const Ledger = mongoose.model('Ledger', ledgerSchema)

module.exports = Ledger


