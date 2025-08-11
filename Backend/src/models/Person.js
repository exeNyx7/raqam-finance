const mongoose = require('mongoose')

const personSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true, lowercase: true },
        avatar: { type: String },
        isAppUser: { type: Boolean, default: false },
        phone: { type: String },
        notes: { type: String },
    },
    { timestamps: true },
)

personSchema.methods.toClient = function toClient() {
    return {
        id: this._id.toString(),
        name: this.name,
        email: this.email,
        avatar: this.avatar || null,
        isAppUser: this.isAppUser,
        phone: this.phone || null,
        notes: this.notes || null,
        createdAt: this.createdAt.toISOString(),
        updatedAt: this.updatedAt.toISOString(),
    }
}

const Person = mongoose.model('Person', personSchema)

module.exports = Person


