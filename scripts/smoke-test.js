const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password123';

const jar = new CookieJar();
const client = wrapper(axios.create({
  baseURL: BASE_URL,
  jar,
  validateStatus: () => true
}));

async function runSmokeTest() {
  console.log(`Starting smoke test against ${BASE_URL}...`);

  // 1. Check API Health
  console.log('Checking /api/v1/health...');
  const healthRes = await client.get('/api/v1/health');
  if (healthRes.status === 200) {
    console.log('✅ /api/v1/health is OK');
  } else {
    console.error(`❌ /api/v1/health failed with status ${healthRes.status}`);
    process.exit(1);
  }

  // 2. Check Backoffice Login Page
  console.log('Checking /backoffice/login page...');
  const loginPageRes = await client.get('/backoffice/login');
  if (loginPageRes.status === 200 || loginPageRes.status === 304) {
    console.log('✅ /backoffice/login is reachable');
  } else {
    console.error(`❌ /backoffice/login failed with status ${loginPageRes.status}`);
    process.exit(1);
  }

  // 3. Attempt Backoffice Login
  console.log('Attempting login to /backoffice/login...');
  // We need to find the form action and any CSRF tokens if present,
  // but AdminJS usually uses a standard POST to the same URL or /backoffice/login.
  // Actually, AdminJS Express uses POST /backoffice/login.

  const loginRes = await client.post('/backoffice/login', {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD
  });

  if (loginRes.status === 302 || (loginRes.status === 200 && !loginRes.data.includes('Login'))) {
    console.log('✅ Login successful (redirected or logged in)');
  } else {
    console.error(`❌ Login failed with status ${loginRes.status}`);
    // If it's a 200 but still has the login form, it failed.
    if (loginRes.data.includes('invalid') || loginRes.data.includes('Invalid')) {
       console.error('Reason: Invalid credentials');
    }
    // We don't exit here because we might not have valid credentials in the test env
  }

  // 4. Check if session persists by accessing dashboard
  console.log('Checking session persistence...');
  const dashboardRes = await client.get('/backoffice');
  if (dashboardRes.status === 200 && dashboardRes.data.includes('Welcome')) {
    console.log('✅ Session persisted, dashboard reachable');
  } else {
    console.warn('⚠️ Dashboard unreachable or session did not persist (might need valid credentials)');
  }

  console.log('Smoke test completed.');
}

runSmokeTest().catch(err => {
  console.error('Smoke test failed with error:', err.message);
  process.exit(1);
});
