const axios = require('axios');

// Config
const BASE_URL = 'http://localhost:5000/api';
const CONCURRENT_REQUESTS = 10;
const TEST_LEDGER_NAME = 'Stress Test Ledger';

let tokenA = '';
let userIdB = '';

async function login(user) {
    try {
        let res = await axios.post(`${BASE_URL}/auth/login`, { email: user.email, password: user.password });
        return { token: res.data.data.accessToken, id: res.data.data.user.id };
    } catch (e) {
        console.error(`Login failed: ${e.message}`);
        throw e;
    }
}

async function run() {
    console.log('--- Starting Stress Test ---');

    // 1. Setup
    try {
        const credsA = await login({ email: 'usera@test.com', password: 'password123' });
        tokenA = credsA.token;
        const credsB = await login({ email: 'userb@test.com', password: 'password123' });
        userIdB = credsB.id;

        // Create Ledger
        const res = await axios.post(`${BASE_URL}/ledgers`, {
            name: TEST_LEDGER_NAME,
            description: 'Load Testing',
            members: [{ userId: userIdB }]
        }, { headers: { Authorization: `Bearer ${tokenA}` } });
        const ledgerId = res.data.data.id;
        console.log(`Ledger Created: ${ledgerId}`);

        // 2. Concurrent Requests
        console.log(`Sending ${CONCURRENT_REQUESTS} concurrent transaction requests...`);
        const promises = [];
        const startTime = Date.now();

        for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
            promises.push(
                axios.post(`${BASE_URL}/ledgers/${ledgerId}/transactions`, {
                    description: `Stress Tx ${i}`,
                    totalAmount: 10 + i,
                    category: 'Food',
                    date: new Date().toISOString(),
                    participants: [{ userId: userIdB }]
                }, { headers: { Authorization: `Bearer ${tokenA}` } })
            );
        }

        const results = await Promise.allSettled(promises);
        const endTime = Date.now();

        const successCount = results.filter(r => r.status === 'fulfilled').length;
        const failCount = results.filter(r => r.status === 'rejected').length;

        console.log(`\n--- Results ---`);
        console.log(`Total Time: ${endTime - startTime}ms`);
        console.log(`Success: ${successCount}`);
        console.log(`Failed: ${failCount}`);

        if (failCount > 0) {
            console.error('Errors:', results.filter(r => r.status === 'rejected').map(r => r.reason.message));
        }

        // Verify Data Integrity
        const txRes = await axios.get(`${BASE_URL}/ledgers/${ledgerId}/transactions`, { headers: { Authorization: `Bearer ${tokenA}` } });
        const totalTx = txRes.data.data.length;
        console.log(`Total Transactions in Ledger: ${totalTx}`);

        if (totalTx === CONCURRENT_REQUESTS) {
            console.log('✅ Data Integrity Confirmed: All transactions recorded.');
        } else {
            console.error('❌ Data Mismatch! Possible race condition.');
        }

    } catch (e) {
        console.error('Stress Test Failed:', e.message);
        if (e.response) console.error(e.response.data);
    }
}

run();
