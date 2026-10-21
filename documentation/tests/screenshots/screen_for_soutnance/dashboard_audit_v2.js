const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:8080/api';
const REPORT_DIR = __dirname;

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function takeScreenshot(page, name) {
  const filePath = path.join(REPORT_DIR, 'screenshots', `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  return filePath;
}

async function checkOverflow(page) {
  return await page.evaluate(() => {
    const scrollWidth = document.documentElement.scrollWidth;
    const clientWidth = document.documentElement.clientWidth;
    const innerWidth = window.innerWidth;
    const hasHorizontalScrollbar = scrollWidth > clientWidth;
    return {
      scrollWidth,
      clientWidth,
      innerWidth,
      hasHorizontalScrollbar,
      overflowPixels: scrollWidth - clientWidth,
    };
  });
}

async function main() {
  ensureDir(path.join(REPORT_DIR, 'screenshots'));
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Users/HP/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe'
  });

  let accessToken = null;
  let refreshToken = null;
  let userId = null;

  // Step 1: Register via API
  console.log('[Dashboard v2] Registering via API...');
  try {
    const registerRes = await fetch(`${API_URL}/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'dash_test@test.com',
        password: 'Test1234!',
        fullName: 'Dash Test',
        city: 'Rabat',
        role: 'PROPRIETAIRE',
        phone: '+212600000001',
        firstName: 'Dash',
        lastName: 'Test'
      })
    });
    const registerData = await registerRes.json();
    console.log('Register response:', JSON.stringify(registerData, null, 2).substring(0, 200));
    if (registerData.accessToken) {
      accessToken = registerData.accessToken;
      refreshToken = registerData.refreshToken;
      userId = registerData.userId;
    }
  } catch (err) {
    console.log('Register API error:', err.message);
  }

  // Step 2: If register failed, try login
  if (!accessToken) {
    console.log('[Dashboard v2] Trying login via API...');
    try {
      const loginRes = await fetch(`${API_URL}/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'dash_test@test.com',
          password: 'Test1234!'
        })
      });
      const loginData = await loginRes.json();
      console.log('Login response:', JSON.stringify(loginData, null, 2).substring(0, 200));
      if (loginData.accessToken) {
        accessToken = loginData.accessToken;
        refreshToken = loginData.refreshToken;
        userId = loginData.userId;
      }
    } catch (err) {
      console.log('Login API error:', err.message);
    }
  }

  if (!accessToken) {
    console.log('Could not obtain access token. Aborting dashboard tests.');
    await browser.close();
    return;
  }

  console.log(`Got access token for user ${userId}`);

  // Step 3: Open browser and inject auth
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  // Navigate to base URL first, then inject tokens
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.evaluate(({ accessToken, refreshToken, userId }) => {
    localStorage.setItem('token', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('token_timestamp', Date.now().toString());
    localStorage.setItem('user', JSON.stringify({
      id: userId,
      name: 'Dash Test',
      email: 'dash_test@test.com',
      role: 'PROPRIETAIRE'
    }));
  }, { accessToken, refreshToken, userId });

  // Step 4: Navigate to dashboard
  console.log('[Dashboard v2] Navigating to /dashboard...');
  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  const dashboardScreenshot = await takeScreenshot(page, 'dashboard_authenticated');
  console.log('Dashboard screenshot:', dashboardScreenshot);
  console.log('Dashboard URL:', page.url());

  // Step 5: Check for analytics charts
  const chartElements = await page.evaluate(() => {
    const canvases = document.querySelectorAll('canvas');
    const svgs = document.querySelectorAll('svg');
    const chartDivs = document.querySelectorAll('[class*="chart" i], [class*="graph" i], [class*="recharts" i]');
    return {
      canvasCount: canvases.length,
      svgCount: svgs.length,
      chartDivCount: chartDivs.length,
      canvasDetails: Array.from(canvases).map((c, i) => ({
        index: i,
        width: c.width,
        height: c.height,
        parentClass: c.parentElement?.className?.substring(0, 100) || '',
      })),
    };
  });
  console.log('Charts:', chartElements);

  // Step 6: Check card alignment and spacing
  const cardMetrics = await page.evaluate(() => {
    const cards = document.querySelectorAll('[class*="card" i], [class*="Card" i], .MuiPaper-root, [class*="paper" i]');
    const metrics = [];
    cards.forEach((card, i) => {
      const rect = card.getBoundingClientRect();
      const style = window.getComputedStyle(card);
      metrics.push({
        index: i,
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left,
        marginTop: style.marginTop,
        marginBottom: style.marginBottom,
        paddingTop: style.paddingTop,
        paddingBottom: style.paddingBottom,
      });
    });
    return metrics;
  });
  console.log(`Found ${cardMetrics.length} card elements`);

  // Step 7: Extract UI text for numbers (stats)
  const uiNumbers = await page.evaluate(() => {
    const textElements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div'));
    const numbers = [];
    textElements.forEach((el) => {
      const text = el.textContent.trim();
      if (text.length > 0 && text.length < 100) {
        const matches = text.match(/(?:DH|€|\$)?\s*[\d,.]+[KMB]?\s*(?:DH|€|\$)?/g);
        if (matches) {
          numbers.push({ text, tag: el.tagName, className: el.className?.substring(0, 80) || '' });
        }
      }
    });
    return numbers.slice(0, 30);
  });
  console.log('UI numbers found:', uiNumbers.length);

  // Step 8: Check for missing sections
  const sections = await page.evaluate(() => {
    const sectionKeywords = ['analytics', 'statistics', 'overview', 'properties', 'bookings', 'revenue', 'messages', 'profile', 'settings', 'dashboard', 'visites', 'propriétés', 'réservations'];
    const found = {};
    sectionKeywords.forEach((kw) => {
      const elements = document.querySelectorAll(`[class*="${kw}" i], [id*="${kw}" i], h1, h2, h3, h4, h5, h6, span, div`);
      for (const el of elements) {
        if (el.textContent.toLowerCase().includes(kw)) {
          found[kw] = true;
          break;
        }
      }
      if (!found[kw]) found[kw] = false;
    });
    return found;
  });
  console.log('Sections:', sections);

  // Step 9: Fetch API data for comparison
  const apiResponse = await page.evaluate(async () => {
    const endpoints = ['/api/v1/analytics', '/api/v1/admin/analytics', '/api/v1/stats', '/api/v1/ads/my', '/api/v1/bookings'];
    const results = {};
    for (const ep of endpoints) {
      try {
        const resp = await fetch(ep, { credentials: 'include' });
        if (resp.ok) {
          const data = await resp.json();
          results[ep] = { status: resp.status, data };
        } else {
          results[ep] = { status: resp.status, error: await resp.text() };
        }
      } catch (e) {
        results[ep] = { error: e.message };
      }
    }
    return results;
  });
  console.log('API responses:', Object.keys(apiResponse).map(k => `${k}: ${apiResponse[k].status || apiResponse[k].error}`));

  // Step 10: Overflow check
  const overflow = await checkOverflow(page);
  console.log('Overflow:', overflow);

  // Step 11: Check for console errors
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push({ type: msg.type(), text: msg.text() });
  });
  await page.waitForTimeout(1000);

  await context.close();
  await browser.close();

  // Build report
  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    dashboard: {
      url: page.url(),
      screenshot: dashboardScreenshot,
      authenticated: !!accessToken,
      userId,
      charts: chartElements,
      cardMetrics: cardMetrics.slice(0, 20),
      uiNumbers: uiNumbers.slice(0, 20),
      sections,
      apiData: apiResponse,
      overflow,
      consoleLogs: consoleLogs.slice(0, 20),
    }
  };

  const reportPath = path.join(REPORT_DIR, 'dashboard_audit_v2.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Markdown report
  let md = `# Dashboard Audit Report (Authenticated)\n\n`;
  md += `**Date:** ${new Date().toISOString()}\n`;
  md += `**Base URL:** ${BASE_URL}\n\n`;

  md += `## Authentication\n`;
  md += `- User ID: ${userId}\n`;
  md += `- Token obtained: ${accessToken ? '✅ Yes' : '❌ No'}\n`;

  md += `\n## Dashboard Page\n`;
  md += `- URL: ${page.url()}\n`;
  md += `- Screenshot: \`screenshots/dashboard_authenticated.png\`\n`;

  md += `\n## Analytics Charts\n`;
  md += `- Canvas elements: **${chartElements.canvasCount}**\n`;
  md += `- SVG elements: **${chartElements.svgCount}**\n`;
  md += `- Chart divs: **${chartElements.chartDivCount}**\n`;
  if (chartElements.canvasCount === 0 && chartElements.svgCount === 0) {
    md += `> ⚠️ **No chart elements detected!**\n`;
  } else {
    md += `> ✅ Chart elements found.\n`;
  }

  md += `\n## Card Metrics (first 15)\n`;
  if (cardMetrics.length > 0) {
    md += `| Index | Width | Height | Top | Left |\n`;
    md += `|-------|-------|--------|-----|------|\n`;
    for (const c of cardMetrics.slice(0, 15)) {
      md += `| ${c.index} | ${c.width.toFixed(1)} | ${c.height.toFixed(1)} | ${c.top.toFixed(1)} | ${c.left.toFixed(1)} |\n`;
    }
  } else {
    md += `- No card elements detected.\n`;
  }

  md += `\n## UI Numbers Found\n`;
  if (uiNumbers.length > 0) {
    for (const n of uiNumbers.slice(0, 15)) {
      md += `- \`${n.text}\` (<${n.tag}>)\n`;
    }
  } else {
    md += `- No numeric UI elements detected.\n`;
  }

  md += `\n## Section Presence\n`;
  for (const [section, present] of Object.entries(sections)) {
    md += `- ${section}: ${present ? '✅ Found' : '❌ Missing'}\n`;
  }

  md += `\n## API Data Comparison\n`;
  for (const [ep, data] of Object.entries(apiResponse)) {
    md += `- \`${ep}\`: ${data.status ? `HTTP ${data.status}` : `Error: ${data.error}`}\n`;
  }

  md += `\n## Overflow\n`;
  md += `- Horizontal scrollbar: ${overflow.hasHorizontalScrollbar ? 'YES ⚠️' : 'No ✅'}\n`;

  const mdPath = path.join(REPORT_DIR, 'DASHBOARD_AUDIT_V2.md');
  fs.writeFileSync(mdPath, md);

  console.log(`\n=== DASHBOARD AUDIT COMPLETE ===`);
  console.log(`JSON report: ${reportPath}`);
  console.log(`Markdown report: ${mdPath}`);
}

main().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
