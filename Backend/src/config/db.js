const mongoose = require('mongoose')

async function connectToDatabase() {
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://sohaibcoding:ZoD25qS7tLErShun@cluster0.1dvpmqq.mongodb.net/'

    mongoose.set('strictQuery', true)

    await mongoose.connect(mongoUri, {
        autoIndex: true,
    })

    console.log('MongoDB connected')
}

module.exports = { connectToDatabase }


