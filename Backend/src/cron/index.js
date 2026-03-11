const cron = require('node-cron');

const initCronJobs = () => {
    console.log('Initializing Cron Jobs...');

    // Run every day at midnight
    cron.schedule('0 0 * * *', () => {
        require('./checkBills')()
        require('./checkRecurring')()
    })

    // Run immediately on server start for dev/test (optional, maybe behind a flag)
    // if (process.env.NODE_ENV === 'development') {
    //     setTimeout(() => {
    //         require('./checkBills')()
    //         require('./checkRecurring')()
    //     }, 5000)
    // }
};

module.exports = initCronJobs;
