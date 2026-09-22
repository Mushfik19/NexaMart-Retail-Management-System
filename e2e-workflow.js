const http = require('http');

async function request(method, path, body = null, cookie = null) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      method,
      headers: {}
    };
    if (data) {
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }
    if (cookie) {
      options.headers['Cookie'] = cookie;
    }

    const req = http.request(`http://localhost:3000${path}`, options, (res) => {
      let resBody = '';
      res.on('data', chunk => resBody += chunk);
      res.on('end', () => {
        const cookies = res.headers['set-cookie'];
        const tokenCookie = cookies ? cookies.find(c => c.startsWith('supershop_token=')) : null;
        const newCookie = tokenCookie ? tokenCookie.split(';')[0] : cookie;
        
        try {
          resolve({ status: res.statusCode, data: JSON.parse(resBody), cookie: newCookie });
        } catch(e) {
          resolve({ status: res.statusCode, data: resBody, cookie: newCookie });
        }
      });
    });
    req.on('error', () => resolve({ status: 500 }));
    if (data) req.write(data);
    req.end();
  });
}

async function login(email, password) {
  const res = await request('POST', '/api/auth/login', { identifier: email, password });
  if (res.status === 200) return res.cookie;
  throw new Error(`Login failed for ${email}`);
}

async function runE2E() {
  console.log('🚀 Starting Epic 1 - Final E2E Business Workflow Test\n');

  try {
    // 1. Manager checks if Business Day is open, closes it if needed
    console.log('1️⃣ STORE MANAGER: Opening Business Day');
    const managerCookie = await login('manager@supershop.com', 'Manager@12345');
    const getDay = await request('GET', '/api/store-day', null, managerCookie);
    if (getDay.data?.activeDay) {
      console.log('   (Day already open, proceeding to use it)');
    } else {
      const storeDayRes = await request('POST', '/api/store-day', { 
        action: 'OPEN_DAY', 
        storeId: 'cmucg9fpb0000rol0s18344kq', 
        notes: '[E2E TEST] Opening Day'
      }, managerCookie);
      console.log(`   Result: ${storeDayRes.status}`);
    }

    // 2. Cashier opens Shift
    console.log('\n2️⃣ CASHIER: Opening Cash Register Shift');
    const cashierCookie = await login('cashier@supershop.com', 'Cashier@12345');
    
    let activeShiftRes = await request('GET', '/api/register', null, cashierCookie);
    let shiftId = activeShiftRes.data.shiftMetrics?.shiftId;
    
    if (shiftId) {
      console.log('   (Shift already open, closing it first)');
      await request('POST', '/api/register', {
        action: 'CLOSE_SHIFT',
        shiftId,
        actualCash: 200,
        notes: 'E2E Reset close'
      }, cashierCookie);
    }
    
    const regList = await request('GET', '/api/register', null, cashierCookie);
    const registerId = regList.data.registers?.[0]?.id;
    if (!registerId) throw new Error('No register found');

    const openShiftRes = await request('POST', '/api/register', {
      action: 'OPEN_SHIFT',
      registerId,
      openingCash: 200,
      notes: 'E2E test float'
    }, cashierCookie);
    console.log(`   Result: ${openShiftRes.status} ${openShiftRes.status === 200 ? '✅' : '❌'}`);
    if (openShiftRes.status !== 200) console.log('   Error:', openShiftRes.data);

    // 3. Cashier closes Shift
    console.log('\n3️⃣ CASHIER: Closing Cash Register Shift');
    activeShiftRes = await request('GET', '/api/register', null, cashierCookie);
    shiftId = activeShiftRes.data.shiftMetrics?.shiftId;
    if (!shiftId) throw new Error('No active shift found');

    const closeShiftRes = await request('POST', '/api/register', {
      action: 'CLOSE_SHIFT',
      shiftId,
      actualCash: 250, // $50 overage
      notes: 'E2E close'
    }, cashierCookie);
    console.log(`   Result: ${closeShiftRes.status} ${closeShiftRes.status === 200 ? '✅' : '❌'}`);

    // 4. Manager closes Business Day
    console.log('\n4️⃣ STORE MANAGER: Closing Business Day');
    
    // Get metrics
    const dayDataRes = await request('GET', '/api/store-day', null, managerCookie);
    const metrics = dayDataRes.data.metrics;

    const closeDayRes = await request('POST', '/api/store-day', {
      action: 'CLOSE_DAY',
      storeId: dayDataRes.data.activeDay.storeId,
      notes: '[E2E TEST] Closing Day',
      metrics
    }, managerCookie);
    console.log(`   Result: ${closeDayRes.status} ${closeDayRes.status === 200 ? '✅' : '❌'}`);

    console.log('\n🎉 E2E Workflow completed successfully!');

  } catch (error) {
    console.error('\n❌ E2E Workflow Failed:', error.message);
  }
}

runE2E();
