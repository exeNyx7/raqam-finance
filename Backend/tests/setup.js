const mongoose = require('mongoose');
// const { Crypto } = require('lucide-react'); // Removed invalid import

// Connect to a test database
beforeAll(async () => {
    // efficient connection string for local testing
    const url = process.env.MONGO_URI_TEST || 'mongodb://127.0.0.1:27017/raqam_finance_test';

    // Set JWT Secret for tests
    process.env.JWT_SECRET = 'test_secret';

    try {
        await mongoose.connect(url);
        // console.log('Connected to Test DB');
    } catch (err) {
        console.error('Failed to connect to Test DB:', err);
        process.exit(1);
    }
});

// Clear database after each test suite (optional, or use beforeEach)
afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany();
    }
});

// Disconnect after all tests
afterAll(async () => {
    await mongoose.connection.close();
});
