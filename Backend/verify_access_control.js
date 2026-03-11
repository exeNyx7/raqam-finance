const axios = require('axios');

// Config
const BASE_URL = 'http://localhost:5000/api';
const USERS = [
    { name: 'UserA', email: 'usera@test.com', password: 'password123' },
    { name: 'UserB', email: 'userb@test.com', password: 'password123' },
    { name: 'UserC', email: 'userc@test.com', password: 'password123' }
];

let tokens = {};
let userIds = {};

async function loginOrRegister(user) {
    try {
        let res = await axios.post(`${BASE_URL}/auth/login`, { email: user.email, password: user.password });
        return { token: res.data.data.accessToken, id: res.data.data.user.id };
    } catch (e) {
        if (e.response && (e.response.status === 404 || e.response.status === 401)) {
            let res = await axios.post(`${BASE_URL}/auth/register`, user);
            return { token: res.data.data.accessToken, id: res.data.data.user.id };
        }
        if (e.code === 'ECONNREFUSED') {
            console.error("CRITICAL: Backend server is not running on port 5000. Please start the server.");
            process.exit(1);
        }
        console.error(`Login failed for ${user.email}:`, e.message);
        throw e;
    }
}

async function run() {
    console.log('--- Starting Access Control Verification ---');

    // 1. Setup Users
    for (const u of USERS) {
        const creds = await loginOrRegister(u);
        tokens[u.name] = creds.token;
        userIds[u.name] = creds.id;
        console.log(`LoggedIn: ${u.name} (${creds.id})`);
    }

    // 2. Test Personal Ledger (User A & User B)
    console.log('\n--- Test 1: Personal Ledger (A & B) ---');
    try {
        const res = await axios.post(`${BASE_URL}/ledgers`, {
            name: 'Personal Trip',
            description: 'A and B only',
            members: [{ userId: userIds['UserB'] }]
        }, { headers: { Authorization: `Bearer ${tokens['UserA']}` } });

        const ledgerId = res.data.data.id;
        console.log(`Ledger Created: ${ledgerId}`);

        // Verify A can access
        await axios.get(`${BASE_URL}/ledgers/${ledgerId}`, { headers: { Authorization: `Bearer ${tokens['UserA']}` } });
        console.log('✅ User A can access');

        // Verify B can access
        await axios.get(`${BASE_URL}/ledgers/${ledgerId}`, { headers: { Authorization: `Bearer ${tokens['UserB']}` } });
        console.log('✅ User B can access');

        // Verify C CANNOT access
        try {
            await axios.get(`${BASE_URL}/ledgers/${ledgerId}`, { headers: { Authorization: `Bearer ${tokens['UserC']}` } });
            console.error('❌ User C accessed Personal Ledger! (FAIL)');
        } catch (e) {
            if (e.response.status === 404) console.log('✅ User C blocked (404 Not Found)');
            else console.error(`❌ Unexpected error for User C: ${e.message}`);
        }

    } catch (e) {
        console.error('Test 1 Failed:', e.message);
        if (e.response) console.error(e.response.data);
    }

    // 3. Test Shared Ledger (A, B, C)
    console.log('\n--- Test 2: Shared Ledger (A, B, C) ---');
    try {
        const res = await axios.post(`${BASE_URL}/ledgers`, {
            name: 'Group House',
            description: 'All 3',
            members: [{ userId: userIds['UserB'] }, { userId: userIds['UserC'] }]
        }, { headers: { Authorization: `Bearer ${tokens['UserA']}` } });

        const ledgerId = res.data.data.id;
        console.log(`Ledger Created: ${ledgerId}`);

        // Verify all can access
        await axios.get(`${BASE_URL}/ledgers/${ledgerId}`, { headers: { Authorization: `Bearer ${tokens['UserA']}` } });
        await axios.get(`${BASE_URL}/ledgers/${ledgerId}`, { headers: { Authorization: `Bearer ${tokens['UserB']}` } });
        await axios.get(`${BASE_URL}/ledgers/${ledgerId}`, { headers: { Authorization: `Bearer ${tokens['UserC']}` } });
        console.log('✅ Users A, B, C can access');

        // 4. Test Notification Trigger
        console.log('\n--- Test 3: Notification Trigger ---');
        // A adds expense
        const txRes = await axios.post(`${BASE_URL}/ledgers/${ledgerId}/transactions`, {
            description: 'Shared Dinner',
            totalAmount: 90,
            category: 'Food',
            date: new Date().toISOString(),
            participants: [{ userId: userIds['UserB'] }, { userId: userIds['UserC'] }]
        }, { headers: { Authorization: `Bearer ${tokens['UserA']}` } });
        console.log('Transaction Created');

        // Check B's notifications
        const notifResB = await axios.get(`${BASE_URL}/notifications`, { headers: { Authorization: `Bearer ${tokens['UserB']}` } });
        // Response string: { success: true, data: { data: [], pagination: {} } }
        const bNotifications = notifResB.data.data.data || [];
        const hasNotifB = bNotifications.some(n => n.metadata?.ledgerId === ledgerId && n.type === 'new_expense');
        console.log(hasNotifB ? '✅ User B received notification' : '❌ User B missed notification');

        // Check C's notifications
        const notifResC = await axios.get(`${BASE_URL}/notifications`, { headers: { Authorization: `Bearer ${tokens['UserC']}` } });
        const cNotifications = notifResC.data.data.data || [];
        const hasNotifC = cNotifications.some(n => n.metadata?.ledgerId === ledgerId && n.type === 'new_expense');
        console.log(hasNotifC ? '✅ User C received notification' : '❌ User C missed notification');

    } catch (e) {
        console.error('Test 2/3 Failed:', e.message);
        if (e.response) console.error(e.response.data);
    }
}

run();
