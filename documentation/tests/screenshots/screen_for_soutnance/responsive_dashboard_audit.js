const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const REPORT_DIR = __dirname;

const viewports = [
  { name: 'Desktop', width: 1920, height: 1080 },
  { name: 'Laptop', width: 1366, height: 768 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Mobile', width: 375, height: 667 },
];

const pages = [
  { name: 'Homepage', path: '/' },
  { name: 'PropertyDetails', path: '/property/1' },
  { name: 'SearchResults', path: '/search' },
  { name: 'Login', path: '/login' },
];

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function takeScreenshot(page, name) {
  const filePath = path.join(REPORT_DIR, 'screenshots', `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  return filePath;
}

async function checkOverflow(page) {
  const result = await page.evaluate(() => {
    const scrollWidth = document.documentElement.scrollWidth;
    const clientWidth = document.documentElement.clientWidth;
    const innerWidth = window.innerWidth;
    const hasHorizontalScrollbar = document.documentElement.scrollWidth > document.documentElement.clientWidth;
    return {
      scrollWidth,
      clientWidth,
      innerWidth,
      hasHorizontalScrollbar,
      overflowPixels: scrollWidth - clientWidth,
    };
  });
  return result;
}

async function checkLayoutIssues(page) {
  const issues = await page.evaluate(() => {
    const results = [];
    // Check for elements wider than viewport
    const allElements = document.querySelectorAll('*');
    const viewportWidth = window.innerWidth;
    let wideElements = 0;
    allElements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width > viewportWidth + 5) {
        wideElements++;
      }
    });
    results.push({ type: 'wide_elements', count: wideElements });

    // Check navbar issues
    const navbars = document.querySelectorAll('nav, header');
    let navbarIssues = 0;
    navbars.forEach((nav) => {
      const navRect = nav.getBoundingClientRect();
      if (navRect.width > viewportWidth + 5) {
        navbarIssues++;
      }
      // Check for overlapping items in navbar
      const children = nav.querySelectorAll('a, button, div');
      const childRects = Array.from(children).map((c) => c.getBoundingClientRect());
      for (let i = 0; i < childRects.length; i++) {
        for (let j = i + 1; j < childRects.length; j++) {
          const r1 = childRects[i];
          const r2 = childRects[j];
          if (
            r1.width > 0 && r2.width > 0 &&
            r1.left < r2.right && r1.right > r2.left &&
            r1.top < r2.bottom && r1.bottom > r2.top
          ) {
            // Only count if both are visible and reasonably sized
            if (r1.height > 5 && r2.height > 5 && r1.width > 5 && r2.width > 5) {
              navbarIssues++;
              break;
            }
          }
        }
        if (navbarIssues > 10) break;
      }
    });
    results.push({ type: 'navbar_issues', count: navbarIssues });

    // Check for broken grids - cards that overflow their container
    const cards = document.querySelectorAll('[class*="card"], [class*="Card"]');
    let cardOverflows = 0;
    cards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const parent = card.parentElement;
      if (parent) {
        const parentRect = parent.getBoundingClientRect();
        if (rect.right > parentRect.right + 2 || rect.left < parentRect.left - 2) {
          cardOverflows++;
        }
      }
    });
    results.push({ type: 'card_overflows', count: cardOverflows });

    // Check filter panels
    const filters = document.querySelectorAll('[class*="filter"], [class*="Filter"]');
    let filterOverflows = 0;
    filters.forEach((f) => {
      const rect = f.getBoundingClientRect();
      if (rect.width > viewportWidth + 5) {
        filterOverflows++;
      }
    });
    results.push({ type: 'filter_overflows', count: filterOverflows });

    // Check for hamburger menu presence on mobile
    const hamburger = document.querySelector('[class*="hamburger"], [class*="menu"], button svg, .MuiIconButton-root');
    results.push({ type: 'hamburger_found', present: !!hamburger });

    return results;
  });
  return issues;
}

async function runResponsiveTests(browser) {
  const results = [];
  for (const vp of viewports) {
    for (const pg of pages) {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();
      const url = `${BASE_URL}${pg.path}`;
      console.log(`[Responsive] Testing ${vp.name} (${vp.width}x${vp.height}) on ${pg.name}...`);
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        // Wait a bit for layout to settle
        await page.waitForTimeout(1500);
        const screenshotPath = await takeScreenshot(page, `responsive_${vp.name}_${pg.name}`);
        const overflow = await checkOverflow(page);
        const layoutIssues = await checkLayoutIssues(page);
        results.push({
          viewport: vp.name,
          dimensions: `${vp.width}x${vp.height}`,
          page: pg.name,
          url,
          screenshot: screenshotPath,
          overflow,
          layoutIssues,
          status: 'ok',
        });
      } catch (err) {
        results.push({
          viewport: vp.name,
          dimensions: `${vp.width}x${vp.height}`,
          page: pg.name,
          url,
          error: err.message,
          status: 'error',
        });
      }
      await context.close();
    }
  }
  return results;
}

async function runDashboardTests(browser) {
  const results = {};
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  // Step 1: Register test user
  console.log('[Dashboard] Registering test user...');
  try {
    await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);

    // Fill registration form
    const emailInput = await page.$('input[type="email"], input[name="email"]');
    const passwordInput = await page.$('input[type="password"], input[name="password"]');
    const fullNameInput = await page.$('input[name="fullName"], input[name="name"], input[placeholder*="nom" i], input[placeholder*="name" i]');
    const cityInput = await page.$('input[name="city"], input[placeholder*="ville" i], input[placeholder*="city" i]');

    if (emailInput) await emailInput.fill('dash_test@test.com');
    if (passwordInput) await passwordInput.fill('Test1234!');
    if (fullNameInput) await fullNameInput.fill('Dash Test');
    if (cityInput) await cityInput.fill('Rabat');

    // Try to select role if exists
    const roleSelect = await page.$('select[name="role"], [role="combobox"]');
    if (roleSelect) {
      await roleSelect.selectOption?.('PROPRIETAIRE');
      if (!roleSelect.selectOption) {
        await roleSelect.click();
        await page.waitForTimeout(500);
        const option = await page.$('text=PROPRIETAIRE');
        if (option) await option.click();
      }
    }

    const submitBtn = await page.$('button[type="submit"], button:has-text("Register"), button:has-text("S\'inscrire"), button:has-text("Créer")');
    if (submitBtn) await submitBtn.click();
    await page.waitForTimeout(3000);
    results.registration = { screenshot: await takeScreenshot(page, 'dashboard_registration_attempt'), url: page.url() };
  } catch (err) {
    results.registration = { error: err.message };
  }

  // Step 2: Login
  console.log('[Dashboard] Logging in...');
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1000);
    const emailInput = await page.$('input[type="email"], input[name="email"]');
    const passwordInput = await page.$('input[type="password"], input[name="password"]');
    if (emailInput) await emailInput.fill('dash_test@test.com');
    if (passwordInput) await passwordInput.fill('Test1234!');
    const submitBtn = await page.$('button[type="submit"], button:has-text("Login"), button:has-text("Connexion")');
    if (submitBtn) await submitBtn.click();
    await page.waitForTimeout(3000);
    results.login = { screenshot: await takeScreenshot(page, 'dashboard_login'), url: page.url() };
  } catch (err) {
    results.login = { error: err.message };
  }

  // Step 3: Navigate to dashboard
  console.log('[Dashboard] Navigating to /dashboard...');
  try {
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    const dashboardScreenshot = await takeScreenshot(page, 'dashboard_main');
    results.dashboard = { screenshot: dashboardScreenshot, url: page.url() };

    // Check for analytics charts (canvas/svg elements)
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
    results.charts = chartElements;

    // Check card alignment and spacing
    const cardMetrics = await page.evaluate(() => {
      const cards = document.querySelectorAll('[class*="card" i], [class*="Card" i], .MuiPaper-root');
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
    results.cardMetrics = cardMetrics;

    // Extract UI text for numbers (stats)
    const uiNumbers = await page.evaluate(() => {
      const textElements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div'));
      const numbers = [];
      textElements.forEach((el) => {
        const text = el.textContent.trim();
        // Look for numeric patterns like "1,234", "123", "12.5K", "$123", "DH 1234"
        const matches = text.match(/(?:DH|€|\$)?\s*[\d,.]+[KMB]?\s*(?:DH|€|\$)?/g);
        if (matches) {
          numbers.push({ text, tag: el.tagName, className: el.className?.substring(0, 80) || '' });
        }
      });
      return numbers.slice(0, 30);
    });
    results.uiNumbers = uiNumbers;

    // Check for missing sections by looking for common dashboard section indicators
    const sections = await page.evaluate(() => {
      const sectionKeywords = ['analytics', 'statistics', 'overview', 'properties', 'bookings', 'revenue', 'messages', 'profile', 'settings'];
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
    results.sections = sections;

    // Try to fetch API data if dashboard calls an API
    const apiResponse = await page.evaluate(async () => {
      try {
        // Common dashboard API endpoints
        const endpoints = ['/api/dashboard', '/api/analytics', '/api/stats', '/api/properties/my', '/api/bookings'];
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
      } catch (e) {
        return { error: e.message };
      }
    });
    results.apiData = apiResponse;

    // Overflow check on dashboard
    results.overflow = await checkOverflow(page);

  } catch (err) {
    results.dashboard = { error: err.message };
  }

  await context.close();
  return results;
}

async function main() {
  ensureDir(path.join(REPORT_DIR, 'screenshots'));
  const browser = await chromium.launch({ headless: true, executablePath: "C:/Users/HP/AppData/Local/ms-playwright/chromium-1223/chrome-win64/chrome.exe" });

  console.log('=== STARTING RESPONSIVE DESIGN TESTS ===');
  const responsiveResults = await runResponsiveTests(browser);

  console.log('=== STARTING DASHBOARD TESTS ===');
  const dashboardResults = await runDashboardTests(browser);

  await browser.close();

  // Build report
  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    responsive: responsiveResults,
    dashboard: dashboardResults,
  };

  const reportPath = path.join(REPORT_DIR, 'audit_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Generate Markdown report
  let md = `# Responsive Design & Dashboard Audit Report\n\n**Date:** ${new Date().toISOString()}\n**Base URL:** ${BASE_URL}\n\n`;

  md += `## 1. Responsive Design Tests\n\n`;
  md += `| Viewport | Dimensions | Page | Horizontal Scroll | Overflow (px) | Wide Elements | Navbar Issues | Card Overflows | Filter Overflows | Status |\n`;
  md += `|----------|------------|------|-------------------|---------------|---------------|---------------|----------------|------------------|--------|\n`;
  for (const r of responsiveResults) {
    if (r.status === 'error') {
      md += `| ${r.viewport} | ${r.dimensions} | ${r.page} | - | - | - | - | - | - | ERROR: ${r.error} |\n`;
    } else {
      const li = r.layoutIssues;
      const wide = li.find((x) => x.type === 'wide_elements')?.count ?? '-';
      const nav = li.find((x) => x.type === 'navbar_issues')?.count ?? '-';
      const card = li.find((x) => x.type === 'card_overflows')?.count ?? '-';
      const filt = li.find((x) => x.type === 'filter_overflows')?.count ?? '-';
      const hScroll = r.overflow.hasHorizontalScrollbar ? 'YES ⚠️' : 'No ✅';
      md += `| ${r.viewport} | ${r.dimensions} | ${r.page} | ${hScroll} | ${r.overflow.overflowPixels}px | ${wide} | ${nav} | ${card} | ${filt} | ${r.status} |\n`;
    }
  }

  md += `\n### Screenshots\n`;
  for (const r of responsiveResults) {
    if (r.screenshot) {
      md += `- **${r.viewport} - ${r.page}**: \`screenshots/responsive_${r.viewport}_${r.page}.png\`\n`;
    }
  }

  md += `\n## 2. Dashboard UI Tests\n\n`;
  md += `### Registration & Login\n`;
  md += `- Registration URL after attempt: ${dashboardResults.registration?.url || 'N/A'}\n`;
  md += `- Login URL after attempt: ${dashboardResults.login?.url || 'N/A'}\n`;
  md += `\n### Dashboard Page\n`;
  md += `- URL: ${dashboardResults.dashboard?.url || 'N/A'}\n`;
  md += `- Screenshot: \`screenshots/dashboard_main.png\`\n`;

  md += `\n### Analytics Charts\n`;
  if (dashboardResults.charts) {
    md += `- Canvas elements: **${dashboardResults.charts.canvasCount}**\n`;
    md += `- SVG elements: **${dashboardResults.charts.svgCount}**\n`;
    md += `- Chart divs: **${dashboardResults.charts.chartDivCount}**\n`;
    if (dashboardResults.charts.canvasCount === 0 && dashboardResults.charts.svgCount === 0) {
      md += `> ⚠️ **No chart elements detected!** Dashboard may be missing analytics visualizations.\n`;
    } else {
      md += `> ✅ Chart elements found.\n`;
    }
    if (dashboardResults.charts.canvasDetails?.length > 0) {
      md += `\nCanvas details:\n`;
      for (const c of dashboardResults.charts.canvasDetails) {
        md += `- Canvas #${c.index}: ${c.width}x${c.height} (parent: ${c.parentClass})\n`;
      }
    }
  }

  md += `\n### UI Numbers Found\n`;
  if (dashboardResults.uiNumbers?.length > 0) {
    for (const n of dashboardResults.uiNumbers.slice(0, 15)) {
      md += `- \`${n.text}\` (<${n.tag}>)\n`;
    }
  } else {
    md += `- No numeric UI elements detected.\n`;
  }

  md += `\n### Section Presence\n`;
  if (dashboardResults.sections) {
    for (const [section, present] of Object.entries(dashboardResults.sections)) {
      md += `- ${section}: ${present ? '✅ Found' : '❌ Missing'}\n`;
    }
  }

  md += `\n### Card Metrics (first 10)\n`;
  if (dashboardResults.cardMetrics?.length > 0) {
    md += `| Index | Width | Height | Top | Left | Margin Top | Margin Bottom |\n`;
    md += `|-------|-------|--------|-----|------|------------|---------------|\n`;
    for (const c of dashboardResults.cardMetrics.slice(0, 10)) {
      md += `| ${c.index} | ${c.width.toFixed(1)} | ${c.height.toFixed(1)} | ${c.top.toFixed(1)} | ${c.left.toFixed(1)} | ${c.marginTop} | ${c.marginBottom} |\n`;
    }
  } else {
    md += `- No card elements detected.\n`;
  }

  md += `\n### API Data Comparison\n`;
  if (dashboardResults.apiData) {
    for (const [ep, data] of Object.entries(dashboardResults.apiData)) {
      md += `- \`${ep}\`: ${data.status ? `HTTP ${data.status}` : `Error: ${data.error}`}\n`;
    }
  }

  md += `\n### Dashboard Overflow\n`;
  if (dashboardResults.overflow) {
    const o = dashboardResults.overflow;
    md += `- scrollWidth: ${o.scrollWidth}, clientWidth: ${o.clientWidth}\n`;
    md += `- Horizontal scrollbar: ${o.hasHorizontalScrollbar ? 'YES ⚠️' : 'No ✅'}\n`;
  }

  const mdPath = path.join(REPORT_DIR, 'AUDIT_REPORT.md');
  fs.writeFileSync(mdPath, md);

  console.log(`\n=== AUDIT COMPLETE ===`);
  console.log(`JSON report: ${reportPath}`);
  console.log(`Markdown report: ${mdPath}`);
  console.log(`Screenshots dir: ${path.join(REPORT_DIR, 'screenshots')}`);
}

main().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
