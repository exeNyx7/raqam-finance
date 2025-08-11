const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        passwordHash: { type: String, required: true },
        avatar: { type: String },
    },
    { timestamps: true },
)

userSchema.methods.comparePassword = function comparePassword(plainPassword) {
    return bcrypt.compare(plainPassword, this.passwordHash)
}

userSchema.statics.hashPassword = async function hashPassword(plainPassword) {
    const salt = await bcrypt.genSalt(10)
    return bcrypt.hash(plainPassword, salt)
}

userSchema.methods.toClient = function toClient() {
    return {
        id: this._id.toString(),
        name: this.name,
        email: this.email,
        avatar: this.avatar,
        createdAt: this.createdAt.toISOString(),
        updatedAt: this.updatedAt.toISOString(),
    }
}

const User = mongoose.model('User', userSchema)

module.exports = User


