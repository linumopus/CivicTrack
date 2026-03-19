const base = 'http://localhost:3000';

async function j(path, opts = {}) {
  const res = await fetch(base + path, {
    ...opts,
    headers: { 'content-type': 'application/json', ...(opts.headers || {}) },
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text || null;
  }
  if (!res.ok) {
    const msg =
      data && typeof data === 'object' && 'message' in data
        ? data.message
        : JSON.stringify(data);
    throw new Error(`${path} -> ${res.status} ${msg}`);
  }
  return data;
}

async function main() {
  const stamp = Date.now();
  const citizen = {
    name: 'Test Citizen',
    email: `citizen_${stamp}@test.local`,
    password: 'Passw0rd!',
  };
  const admin = {
    name: 'Test Admin',
    email: `admin_${stamp}@test.local`,
    password: 'Passw0rd!',
    role: 'admin',
    department: 'Roads',
  };

  console.log('1) GET /api/health');
  const health = await j('/api/health', { method: 'GET' });
  console.log(health);
  if (!health.ok) throw new Error('health.ok is false');

  console.log('2) Register citizen');
  const regC = await j('/api/auth/register', { method: 'POST', body: JSON.stringify(citizen) });
  const citizenToken = regC.token;
  if (!citizenToken) throw new Error('Missing citizen token');
  if (regC.user.role !== 'citizen') throw new Error('Citizen role mismatch');

  console.log('3) /api/auth/me (citizen)');
  const meC = await j('/api/auth/me', { headers: { authorization: `Bearer ${citizenToken}` } });
  if (!meC.user || meC.user.email !== citizen.email) throw new Error('Citizen /me mismatch');

  console.log('4) Create complaint');
  const created = await j('/api/complaints', {
    method: 'POST',
    headers: { authorization: `Bearer ${citizenToken}` },
    body: JSON.stringify({
      title: 'Pothole near test',
      description: 'Big pothole',
      category: 'Road',
      coordinates: [88.3639, 22.5726],
    }),
  });
  const complaintId = created.complaint?._id;
  if (!complaintId) throw new Error('Missing complaintId');

  console.log('5) GET /api/complaints includes created');
  const list1 = await j('/api/complaints');
  const found = list1.complaints.find((c) => c._id === complaintId);
  if (!found) throw new Error('Created complaint not in list');

  console.log('6) Upvote (first time)');
  const up1 = await j(`/api/complaints/${complaintId}/upvote`, {
    method: 'POST',
    headers: { authorization: `Bearer ${citizenToken}` },
  });
  const upCount1 = up1.upvotes.length;
  if (upCount1 < 1) throw new Error('Upvote did not register');

  console.log('7) Upvote duplicate should not increase');
  const up2 = await j(`/api/complaints/${complaintId}/upvote`, {
    method: 'POST',
    headers: { authorization: `Bearer ${citizenToken}` },
  });
  const upCount2 = up2.upvotes.length;
  if (upCount2 !== upCount1) throw new Error('Duplicate upvote increased');

  console.log('8) Register admin');
  const regA = await j('/api/auth/register', { method: 'POST', body: JSON.stringify(admin) });
  const adminToken = regA.token;
  if (!adminToken) throw new Error('Missing admin token');
  if (regA.user.role !== 'admin') throw new Error('Admin role mismatch');

  console.log('9) PATCH status as admin');
  const st = await j(`/api/complaints/${complaintId}/status`, {
    method: 'PATCH',
    headers: { authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ status: 'In-Progress' }),
  });
  if (st.status !== 'In-Progress') throw new Error('Status did not update');

  console.log('10) PATCH status as citizen should 403');
  let citizenGot403 = false;
  try {
    await j(`/api/complaints/${complaintId}/status`, {
      method: 'PATCH',
      headers: { authorization: `Bearer ${citizenToken}` },
      body: JSON.stringify({ status: 'Resolved' }),
    });
  } catch (e) {
    citizenGot403 = String(e).includes('-> 403');
  }
  if (!citizenGot403) throw new Error('Citizen status update did not 403');

  console.log('11) DELETE as admin should 204');
  const delRes = await fetch(base + `/api/complaints/${complaintId}`, {
    method: 'DELETE',
    headers: { authorization: `Bearer ${adminToken}` },
  });
  if (delRes.status !== 204) {
    throw new Error(`Delete expected 204 got ${delRes.status} ${await delRes.text()}`);
  }

  console.log('12) GET /api/complaints should not include deleted');
  const list2 = await j('/api/complaints');
  if (list2.complaints.some((c) => c._id === complaintId)) throw new Error('Deleted complaint still in list');

  console.log('ALL TESTS PASSED');
}

main().catch((e) => {
  console.error('TEST FAILED:', e);
  process.exit(1);
});

