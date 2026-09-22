const http = require('http');

const ROLES = [
  { role: 'SUPER_ADMIN', email: 'admin@supershop.com', password: 'Admin@12345' },
  { role: 'STORE_OWNER', email: 'owner@supershop.com', password: 'Owner@12345' },
  { role: 'STORE_MANAGER', email: 'manager@supershop.com', password: 'Manager@12345' },
  { role: 'CASHIER', email: 'cashier@supershop.com', password: 'Cashier@12345' },
  { role: 'INVENTORY_MANAGER', email: 'inventory@supershop.com', password: 'Inventory@12345' },
  { role: 'PURCHASING_OFFICER', email: 'purchasing@supershop.com', password: 'Purchase@12345' },
  { role: 'WAREHOUSE_STAFF', email: 'warehouse@supershop.com', password: 'Warehouse@12345' },
  { role: 'ACCOUNTANT', email: 'accountant@supershop.com', password: 'Account@12345' },
  { role: 'AUDITOR', email: 'auditor@supershop.com', password: 'Auditor@12345' },
];

const FRONTEND_ROUTES = [
  { path: '/pos', allowed: ['SUPER_ADMIN', 'STORE_OWNER', 'STORE_MANAGER', 'CASHIER'] },
  { path: '/inventory', allowed: ['SUPER_ADMIN', 'STORE_OWNER', 'STORE_MANAGER', 'INVENTORY_MANAGER', 'PURCHASING_OFFICER', 'WAREHOUSE_STAFF'] },
  { path: '/reports', allowed: ['SUPER_ADMIN', 'STORE_OWNER', 'STORE_MANAGER', 'ACCOUNTANT', 'AUDITOR', 'INVENTORY_MANAGER'] },
  { path: '/settings', allowed: ['SUPER_ADMIN', 'STORE_OWNER'] },
];

async function fetchRoute(path, cookie) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:3000${path}`, {
      headers: { Cookie: cookie }
    }, (res) => {
      resolve(res.statusCode);
    });
    req.on('error', () => resolve(500));
  });
}

async function login(email, password) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ identifier: email, password });
    const req = http.request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const cookies = res.headers['set-cookie'];
        const tokenCookie = cookies ? cookies.find(c => c.startsWith('supershop_token=')) : null;
        if (tokenCookie) {
          resolve(tokenCookie.split(';')[0]); // just the token part
        } else {
          resolve(null);
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Automated Role QA Suite...\n');
  let passed = 0;
  let failed = 0;

  for (const user of ROLES) {
    console.log(`\n========================================`);
    console.log(`👤 Testing Role: ${user.role}`);
    const cookie = await login(user.email, user.password);
    if (!cookie) {
      console.log(`❌ FAILED TO LOGIN`);
      failed++;
      continue;
    }

    for (const route of FRONTEND_ROUTES) {
      const status = await fetchRoute(route.path, cookie);
      const shouldAllow = route.allowed.includes(user.role);
      
      // Middleware redirects unauthorized to / which gives a 307. Authorized gives 200.
      const isAllowed = status === 200;
      
      if (isAllowed === shouldAllow) {
        console.log(`✅ PASS: ${route.path} (Expected: ${shouldAllow ? 'Allow' : 'Deny'}, Got: ${isAllowed ? 'Allow' : 'Deny'})`);
        passed++;
      } else {
        console.log(`❌ FAIL: ${route.path} (Expected: ${shouldAllow ? 'Allow' : 'Deny'}, Got: ${isAllowed ? 'Allow' : 'Deny'} - Status: ${status})`);
        failed++;
      }
    }
  }

  console.log(`\n========================================`);
  console.log(`🏁 QA Suite Completed.`);
  console.log(`✅ Passed: ${passed}`);
  if (failed > 0) {
    console.log(`❌ Failed: ${failed}`);
    process.exit(1);
  }
}

runTests();
