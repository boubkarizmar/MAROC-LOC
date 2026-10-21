const http = require('http');

const BASE = 'http://localhost:8080/api';
const EMAIL = 'testowner@example.com';
const PASSWORD = 'Password123!';

function request(method, path, data, token, query) {
  return new Promise((resolve, reject) => {
    let urlPath = path;
    if (query) {
      const q = new URLSearchParams(query).toString();
      urlPath += '?' + q;
    }
    const options = {
      hostname: 'localhost',
      port: 8080,
      path: '/api' + urlPath,
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    };
    if (token) options.headers.Authorization = 'Bearer ' + token;
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body || '{}') });
        } catch (e) {
          resolve({ status: res.statusCode, body: { raw: body } });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function login() {
  const r = await request('POST', '/v1/auth/login', { email: EMAIL, password: PASSWORD });
  if (r.status !== 200) throw new Error('Login failed: ' + JSON.stringify(r.body));
  return r.body.accessToken;
}

async function createProperty(token) {
  const payload = {
    title: 'Appartement test audit CMI ' + Date.now(),
    description: "Ceci est une description de test pour l'audit CMI. Elle fait plus de cinquante caractères pour satisfaire la validation.",
    price: 1500,
    city: 'Rabat',
    address: 'Avenue Hassan II',
    type: 'RENT',
    category: 'APARTMENT',
    surface: 80,
    rooms: 3,
    bedrooms: 2,
    bathrooms: 1,
    floorNumber: 2,
    totalFloors: 5,
    buildingAge: 5,
    latitude: 34.020882,
    longitude: -6.84165,
  };
  const r = await request('POST', '/v2/properties/json', payload, token);
  if (r.status !== 201 && r.status !== 200) throw new Error('Create property failed: ' + JSON.stringify(r.body));
  return r.body.id;
}

async function createAdRequest(token, propertyId) {
  const payload = {
    title: 'Annonce test audit CMI ' + propertyId,
    description: 'Annonce publicitaire de test pour valider le paiement CMI.',
    type: 'FEATURED_PROPERTY',
    plan: 'BOOST_BASIC',
    propertyIds: [propertyId],
    propertyId: propertyId,
    budget: 500,
    startDate: '2026-07-01',
    endDate: '2026-07-31',
    currency: 'MAD',
  };
  const r = await request('POST', '/v1/ads/requests', payload, token);
  if (r.status !== 201 && r.status !== 200) throw new Error('Create ad failed: ' + JSON.stringify(r.body));
  return r.body.id;
}

async function getAd(token, adId) {
  const r = await request('GET', '/v1/ads/user', null, token);
  const list = Array.isArray(r.body) ? r.body : [];
  return list.find((a) => a.id === adId);
}

async function initiateCmi(token, orderId, advertisementId) {
  const payload = {
    orderId,
    amount: 500.0,
    currency: '504',
    lang: 'fr',
    email: EMAIL,
    advertisementId,
  };
  const r = await request('POST', '/v1/payments/cmi/initiate', payload, token);
  if (r.status !== 200) throw new Error('Initiate failed: ' + JSON.stringify(r.body));
  return r.body.data || r.body;
}

async function runScenario(token, name, adId, orderId, callbackPath, extraParams = {}) {
  console.log('\n=== SCENARIO:', name, '===');
  const params = await initiateCmi(token, orderId, adId);
  console.log('Initiate OK -> hash present:', !!params.hash);

  const callbackParams = { ...params, ...extraParams };
  const cb = await request('POST', callbackPath, null, null, callbackParams);
  console.log('Callback HTTP:', cb.status, '->', cb.body.status || cb.body);

  const status = await request('GET', '/v1/payments/status', null, token, { orderId });
  const statusData = status.body.data || status.body;
  console.log('Payment status:', statusData.status);

  const ad = await getAd(token, adId);
  if (ad) {
    console.log('Ad status:', ad.status, '| paymentStatus:', ad.paymentStatus);
  } else {
    console.log('Ad not found in user list');
  }

  return {
    name,
    initiateOk: !!params.hash,
    callbackStatus: cb.status,
    callbackValid: cb.status === 200 && cb.body.status === 'SUCCESS',
    paymentStatus: statusData.status,
    adStatus: ad?.status,
    adPaymentStatus: ad?.paymentStatus,
  };
}

(async () => {
  try {
    const token = await login();
    console.log('Logged in as', EMAIL);

    const results = [];

    const prop1 = await createProperty(token);
    const ad1 = await createAdRequest(token, prop1);
    results.push(await runScenario(token, 'SUCCESS', ad1, 'CMI-SUCCESS-V2-001', '/v1/payments/cmi/callback/success'));

    const prop2 = await createProperty(token);
    const ad2 = await createAdRequest(token, prop2);
    // For FAILURE/CANCEL we reuse the signed params without extra fields so the signature verifies.
    // The backend maps cancellation to FAILED because there is no CANCELLED enum.
    results.push(await runScenario(token, 'FAILURE', ad2, 'CMI-FAILURE-V2-001', '/v1/payments/cmi/callback/fail'));

    const prop3 = await createProperty(token);
    const ad3 = await createAdRequest(token, prop3);
    results.push(await runScenario(token, 'CANCEL', ad3, 'CMI-CANCEL-V2-001', '/v1/payments/cmi/callback/fail'));

    console.log('\n=== SUMMARY ===');
    console.table(results);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
