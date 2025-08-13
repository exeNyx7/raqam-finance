const mongoose = require('mongoose')

async function connectToDatabase() {
    const mongoUri = process.env.MONGODB_URI

    mongoose.set('strictQuery', true)

    await mongoose.connect(mongoUri, {
        autoIndex: true,
    })

    console.log('MongoDB connected')
}

module.exports = { connectToDatabase }


