const fetch = require('node-fetch');

async function runTests() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('=== 1. Driver CRUD ===');
  console.log('INPUT: Create driver');
  const createRes = await fetch(`${baseUrl}/api/drivers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Driver', email: 'test@test.com', employee_code: 'EMP-TEST',
      license_number: 'LIC-TEST', license_type: 'HMV', license_expiry: '2027-01-01'
    })
  });
  const createdDriver = await createRes.json();
  console.log('OUTPUT (Created Driver):', JSON.stringify(createdDriver, null, 2));

  console.log('\n=== 2. Maintenance Rules ===');
  console.log('INPUT: Create maintenance for Vehicle ID: 1');
  const maintRes = await fetch(`${baseUrl}/api/maintenance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vehicle_id: 1, maintenance_type: 'Oil Change', priority: 'MEDIUM', created_by: 1 })
  });
  const createdMaint = await maintRes.json();
  console.log('OUTPUT (Created Maintenance):', JSON.stringify(createdMaint, null, 2));

  console.log('\nINPUT: Fetch Vehicle 1 status after creating maintenance');
  const vRes = await fetch(`${baseUrl}/api/vehicles`); // Wait, we don't have a public GET /api/vehicles/{id}, but we have a general list
  const vJson = await vRes.json();
  const vBefore = vJson.data.find(v => v.id === 1);
  console.log('OUTPUT (Vehicle 1 Status):', vBefore ? vBefore.status : 'Not found');

  if (createdMaint.success && createdMaint.data) {
    const maintId = createdMaint.data.id;
    console.log(`\nINPUT: Close Maintenance ID: ${maintId}`);
    const closeRes = await fetch(`${baseUrl}/api/maintenance/${maintId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CLOSED', completed_date: '2026-07-12' })
    });
    console.log('OUTPUT (Close Maintenance):', JSON.stringify(await closeRes.json(), null, 2));

    const vResAfter = await fetch(`${baseUrl}/api/vehicles`);
    const vJsonAfter = await vResAfter.json();
    const vAfter = vJsonAfter.data.find(v => v.id === 1);
    console.log('\nOUTPUT (Vehicle 1 Status After Close):', vAfter ? vAfter.status : 'Not found');
  }

  console.log('\n=== 3. Notifications ===');
  console.log('INPUT: Scan for Notifications');
  await fetch(`${baseUrl}/api/notifications`, { method: 'POST' }); // Trigger scan
  const notifRes = await fetch(`${baseUrl}/api/notifications`);
  const notifs = await notifRes.json();
  console.log('OUTPUT (Notifications Count):', notifs.data.length);
  if (notifs.data.length > 0) {
    console.log('Example Notification:', JSON.stringify(notifs.data[0], null, 2));
  }
}

runTests().catch(console.error);
