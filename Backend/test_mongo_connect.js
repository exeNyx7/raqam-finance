const mongoose = require('mongoose');

const url = 'mongodb://127.0.0.1:27017/raqam_finance_test';

console.log('Attempting to connect to:', url);

mongoose.connect(url)
    .then(() => {
        console.log('Connected successfully!');
        mongoose.connection.close();
    })
    .catch(err => {
        console.error('Connection failed:', err);
    });
