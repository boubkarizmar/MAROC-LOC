async (page) => {
  const BASE_URL = 'http://localhost:4173';
  const partnerId = 123;
  const currentUser = { id: 999, name: 'Playwright User', email: 'playwright@marocloc.test', role: 'ADMIN' };

  const conversationsPayload = [
    {
      partnerId,
      partnerName: 'Ahmed Propriétaire',
      partnerAvatar: '',
      partnerRole: 'PROPRIETAIRE',
      lastMessage: 'Bonjour, le studio est-il toujours disponible ?',
      lastMessageDate: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      unreadCount: 2,
      propertyId: 42,
      propertyTitle: 'Studio moderne Casablanca',
    },
  ];

  const messagesPayload = [
    {
      id: 1,
      senderId: partnerId,
      senderName: 'Ahmed Propriétaire',
      senderRole: 'PROPRIETAIRE',
      receiverId: currentUser.id,
      receiverName: 'Playwright User',
      receiverRole: 'ADMIN',
      content: 'Bonjour, le studio est-il toujours disponible ?',
      isRead: true,
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      propertyId: 42,
      propertyTitle: 'Studio moderne Casablanca',
    },
    {
      id: 2,
      senderId: currentUser.id,
      senderName: 'Playwright User',
      senderRole: 'ADMIN',
      receiverId: partnerId,
      receiverName: 'Ahmed Propriétaire',
      receiverRole: 'PROPRIETAIRE',
      content: 'Oui, il est toujours disponible. Souhaitez-vous visiter ?',
      isRead: true,
      timestamp: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
      propertyId: 42,
      propertyTitle: 'Studio moderne Casablanca',
    },
  ];

  const errors = [];
  page.on('pageerror', (err) => errors.push({ type: 'pageerror', message: err.message, stack: err.stack }));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push({ type: 'console', text: msg.text() }); });

  await page.route(`${BASE_URL}/api/v1/messages/conversations`, (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(conversationsPayload) });
  });
  await page.route((url) => url.pathname === '/api/v1/messages/conversation', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(messagesPayload) });
  });
  await page.route(`${BASE_URL}/api/v1/notifications/**`, (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [], totalElements: 0, last: true, number: 0 }) });
  });

  // Simulate backend returning paginated objects for array-like endpoints.
  // The hooks should normalize these to arrays so consumers never call .sort on an object.
  await page.route(`${BASE_URL}/api/v2/properties/city-stats/detailed`, (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [], totalElements: 0 }) });
  });
  await page.route(`${BASE_URL}/api/v2/properties/category-counts`, (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ content: [], totalElements: 0 }) });
  });

  await page.goto(`${BASE_URL}/login`);
  await page.evaluate((user) => {
    const b64 = (obj) => btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const token = `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ sub: 'playwright', exp: 9999999999, roles: ['ADMIN'] })}.`;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('refreshToken', token);
  }, currentUser);

  await page.goto(`${BASE_URL}/messages?partnerId=${partnerId}`);
  await page.waitForSelector('text=Souhaitez-vous visiter ?', { timeout: 10000 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);

  const screenshotPath = 'test_results/react_messages.png';
  await page.screenshot({ path: screenshotPath, fullPage: true });

  return { errors, screenshot: screenshotPath };
}
