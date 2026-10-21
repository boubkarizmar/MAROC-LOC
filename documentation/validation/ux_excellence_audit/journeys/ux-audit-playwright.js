/**
 * MAROC-LOC UX Excellence Audit - Playwright Browser Automation
 *
 * Audits all user journeys with real browser navigation, screenshots,
 * click counting, and issue documentation.
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// ─── Configuration ──────────────────────────────────────────────
const BASE_URL = 'http://localhost:3000';
const OUTPUT_DIR = path.resolve(__dirname);
const SCREENSHOT_DIR = path.join(OUTPUT_DIR, 'screenshots');
const REPORT_PATH = path.join(OUTPUT_DIR, 'UX_AUDIT_REPORT.md');

// Ensure directories exist
fs.mkdirSync(path.join(SCREENSHOT_DIR, 'journey1_visitor'), { recursive: true });
fs.mkdirSync(path.join(SCREENSHOT_DIR, 'journey2_buyer'), { recursive: true });
fs.mkdirSync(path.join(SCREENSHOT_DIR, 'journey3_owner'), { recursive: true });
fs.mkdirSync(path.join(SCREENSHOT_DIR, 'journey4_admin'), { recursive: true });

// ─── Helpers ────────────────────────────────────────────────────

function generateFakeJWT(role = 'LOCATAIRE') {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    sub: '999',
    name: 'Audit Test User',
    email: `audit_${role.toLowerCase()}@test.com`,
    role: role,
    exp: Math.floor(Date.now() / 1000) + 86400 * 30, // 30 days
    iat: Math.floor(Date.now() / 1000)
  })).toString('base64url');
  return `${header}.${payload}.`;
}

function makeUser(role = 'LOCATAIRE') {
  return {
    id: 999,
    name: 'Audit Test User',
    email: `audit_${role.toLowerCase()}@test.com`,
    role: role
  };
}

let screenshotCounter = 0;
async function screenshot(page, journey, stepName, fullPage = true) {
  screenshotCounter++;
  const filename = `${String(screenshotCounter).padStart(3, '0')}_${journey}_${stepName}.png`;
  const dir = path.join(SCREENSHOT_DIR, journey);
  const filepath = path.join(dir, filename);
  await page.screenshot({ path: filepath, fullPage });
  return { filename, filepath: filepath.replace(OUTPUT_DIR + path.sep, '') };
}

async function safeClick(page, selector, options = {}) {
  try {
    await page.waitForSelector(selector, { timeout: 5000, ...options });
    await page.click(selector, options);
    return true;
  } catch (e) {
    return false;
  }
}

async function safeFill(page, selector, value) {
  try {
    await page.waitForSelector(selector, { timeout: 5000 });
    await page.fill(selector, value);
    return true;
  } catch (e) {
    return false;
  }
}

async function waitForLoad(page) {
  try {
    await page.waitForLoadState('networkidle', { timeout: 8000 });
  } catch (e) {
    // Network may never idle if backend is down
  }
  // Always wait a bit for animations
  await page.waitForTimeout(1200);
}

// ─── Journey Data ───────────────────────────────────────────────
const journeys = {
  journey1: {
    name: 'VISITOR (no login)',
    steps: [],
    clicks: 0,
    issues: [],
    screenshots: []
  },
  journey2: {
    name: 'BUYER',
    steps: [],
    clicks: 0,
    issues: [],
    screenshots: []
  },
  journey3: {
    name: 'OWNER',
    steps: [],
    clicks: 0,
    issues: [],
    screenshots: []
  },
  journey4: {
    name: 'ADMIN',
    steps: [],
    clicks: 0,
    issues: [],
    screenshots: []
  }
};

function logIssue(journey, issue) {
  journeys[journey].issues.push(issue);
  console.log(`  [ISSUE] ${issue}`);
}

function logStep(journey, step) {
  journeys[journey].steps.push(step);
  console.log(`  [STEP] ${step}`);
}

function countClick(journey) {
  journeys[journey].clicks++;
}

// ─── Main Audit ─────────────────────────────────────────────────

(async () => {
  console.log('═══════════════════════════════════════════════════');
  console.log('  MAROC-LOC UX EXCELLENCE AUDIT');
  console.log('═══════════════════════════════════════════════════\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1
  });

  // ═══════════════════════════════════════════════════════════════
  // JOURNEY 1: VISITOR
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 JOURNEY 1: VISITOR (no login)\n');
  {
    const page = await context.newPage();

    // Step 1.1: Homepage
    await page.goto(`${BASE_URL}/home`);
    await waitForLoad(page);
    const ss1 = await screenshot(page, 'journey1_visitor', '01_homepage');
    logStep('journey1', `Homepage loaded: ${page.url()}`);

    // Check for splash/onboarding interference
    const hasOnboarding = await page.locator('[class*="onboarding"], [class*="tour"], [role="dialog"]').count() > 0;
    if (hasOnboarding) {
      logIssue('journey1', 'Onboarding/tour modal appears immediately - may block first-time visitors');
    }

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(800);
    const ss2 = await screenshot(page, 'journey1_visitor', '02_homepage_scrolled');
    logStep('journey1', 'Scrolled homepage');

    // Check for property cards
    const propertyCards = await page.locator('[class*="property"], [class*="card"], article').count();
    logStep('journey1', `Found ~${propertyCards} potential property cards`);
    if (propertyCards === 0) {
      logIssue('journey1', 'No property cards visible on homepage - backend down or empty state');
    }

    // Step 1.2: Click a property card
    const cardSelectors = [
      'a[href^="/property/"]',
      '[class*="property-card"]',
      'article',
      'a[class*="card"]'
    ];
    let cardClicked = false;
    for (const sel of cardSelectors) {
      const count = await page.locator(sel).count();
      if (count > 0) {
        await page.locator(sel).first().click();
        countClick('journey1');
        cardClicked = true;
        break;
      }
    }

    if (cardClicked) {
      await waitForLoad(page);
      const ss3 = await screenshot(page, 'journey1_visitor', '03_property_details');
      logStep('journey1', `Property Details page: ${page.url()}`);
    } else {
      // Navigate directly to a property
      await page.goto(`${BASE_URL}/property/1`);
      await waitForLoad(page);
      const ss3 = await screenshot(page, 'journey1_visitor', '03_property_details_direct');
      logStep('journey1', `Property Details (direct nav): ${page.url()}`);
      logIssue('journey1', 'Could not click property card - no clickable cards found');
    }

    // Step 1.3: Try to add to favorites
    const favBtn = await page.locator('button[aria-label*="favori"], button[class*="favorite"], [class*="heart"]').count();
    if (favBtn > 0) {
      await page.locator('button[aria-label*="favori"], button[class*="favorite"], [class*="heart"]').first().click();
      countClick('journey1');
      await page.waitForTimeout(1500);
      const ss4 = await screenshot(page, 'journey1_visitor', '04_favorite_attempt');
      logStep('journey1', `Attempted add to favorite: ${page.url()}`);

      if (page.url().includes('/login')) {
        logStep('journey1', '✅ Correctly redirected to login');
      } else {
        logIssue('journey1', '❌ No redirect to login when adding favorite as visitor');
      }
    } else {
      logIssue('journey1', 'No favorite button found on property details');
    }

    // Step 1.4: Use search/filter on homepage
    await page.goto(`${BASE_URL}/home`);
    await waitForLoad(page);

    const searchInput = await page.locator('input[placeholder*="echerche"], input[placeholder*="Search"], input[type="search"]').count();
    if (searchInput > 0) {
      await page.locator('input[placeholder*="echerche"], input[placeholder*="Search"], input[type="search"]').first().fill('Rabat');
      await page.keyboard.press('Enter');
      countClick('journey1');
      await waitForLoad(page);
      const ss5 = await screenshot(page, 'journey1_visitor', '05_search_results');
      logStep('journey1', `Search results: ${page.url()}`);
    } else {
      logIssue('journey1', 'No search input found on homepage');
    }

    // Step 1.5: Click "Voir tout" on recommendations
    await page.goto(`${BASE_URL}/home`);
    await waitForLoad(page);
    const voirTout = await page.locator('text=/Voir tout|See all|View all/i').count();
    if (voirTout > 0) {
      await page.locator('text=/Voir tout|See all|View all/i').first().click();
      countClick('journey1');
      await waitForLoad(page);
      const ss6 = await screenshot(page, 'journey1_visitor', '06_voir_tout');
      logStep('journey1', `After "Voir tout": ${page.url()}`);
    } else {
      logIssue('journey1', 'No "Voir tout" link found on homepage');
    }

    // Step 1.6: Navigate to /search?city=Rabat
    await page.goto(`${BASE_URL}/search?city=Rabat`);
    await waitForLoad(page);
    const ss7 = await screenshot(page, 'journey1_visitor', '07_search_rabat');
    logStep('journey1', `Search Rabat direct: ${page.url()}`);

    // Check for empty state quality
    const emptyState = await page.locator('text=/Aucun|No results|Empty|Rien/i').count();
    if (emptyState > 0) {
      logIssue('journey1', 'Empty state shown for Rabat search - check if quality empty state with helpful CTA');
    }

    await page.close();
  }

  // ═══════════════════════════════════════════════════════════════
  // JOURNEY 2: BUYER
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 JOURNEY 2: BUYER\n');
  {
    const page = await context.newPage();

    // Step 2.1: Register as buyer
    await page.goto(`${BASE_URL}/register`);
    await waitForLoad(page);
    const ss1 = await screenshot(page, 'journey2_buyer', '01_register_page');
    logStep('journey2', `Register page: ${page.url()}`);

    // Check form fields
    const formFields = await page.locator('input, select, textarea').count();
    logStep('journey2', `Register form has ${formFields} input fields`);
    if (formFields > 8) {
      logIssue('journey2', `Registration form has ${formFields} fields - high friction`);
    }

    // Fill form
    const filled = await safeFill(page, 'input[name="name"], input[placeholder*="nom"], input[type="text"]', 'Audit Buyer');
    if (filled) {
      await safeFill(page, 'input[name="email"], input[type="email"]', 'auditbuyer@test.com');
      await safeFill(page, 'input[name="password"], input[type="password"]', 'TestPassword123!');
      await safeFill(page, 'input[name="phone"], input[type="tel"]', '0612345678');

      const ss2 = await screenshot(page, 'journey2_buyer', '02_register_filled');
      logStep('journey2', 'Filled registration form');

      // Look for submit
      const submitBtn = await page.locator('button[type="submit"]').count();
      if (submitBtn > 0) {
        await page.locator('button[type="submit"]').first().click();
        countClick('journey2');
        await page.waitForTimeout(2000);
        const ss3 = await screenshot(page, 'journey2_buyer', '03_register_submit');
        logStep('journey2', `After register submit: ${page.url()}`);
      }
    } else {
      logIssue('journey2', 'Could not locate registration form fields');
    }

    // Step 2.2: Login
    await page.goto(`${BASE_URL}/login`);
    await waitForLoad(page);
    const ss4 = await screenshot(page, 'journey2_buyer', '04_login_page');
    logStep('journey2', `Login page: ${page.url()}`);

    // Check for social login options
    const socialBtns = await page.locator('button[class*="google"], button[class*="facebook"], button[class*="social"]').count();
    logStep('journey2', `Found ${socialBtns} social login buttons`);

    await safeFill(page, 'input[type="email"]', 'auditbuyer@test.com');
    await safeFill(page, 'input[type="password"]', 'TestPassword123!');
    const ss5 = await screenshot(page, 'journey2_buyer', '05_login_filled');

    // Simulate login by injecting auth (since backend is down)
    const token = generateFakeJWT('LOCATAIRE');
    const user = makeUser('LOCATAIRE');
    await page.evaluate(({ token, user }) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token_timestamp', Date.now().toString());
    }, { token, user });

    // Step 2.3: Browse properties + add to favorites
    await page.goto(`${BASE_URL}/home`);
    await page.reload(); // Ensure auth context picks up localStorage
    await waitForLoad(page);
    const ss6 = await screenshot(page, 'journey2_buyer', '06_logged_in_homepage');
    logStep('journey2', `Logged-in homepage: ${page.url()}`);

    // Check navbar for user indicator
    const userMenu = await page.locator('[class*="avatar"], [class*="user"], button[class*="profile"]').count();
    if (userMenu === 0) {
      logIssue('journey2', 'No user avatar/profile indicator in navbar after login');
    }

    // Navigate to property and try favorite
    await page.goto(`${BASE_URL}/property/1`);
    await waitForLoad(page);
    const ss7 = await screenshot(page, 'journey2_buyer', '07_property_favorite');
    logStep('journey2', `Property detail (logged in): ${page.url()}`);

    const favBtn = await page.locator('button[aria-label*="favori"], button[class*="favorite"], [class*="heart"]').count();
    if (favBtn > 0) {
      await page.locator('button[aria-label*="favori"], button[class*="favorite"], [class*="heart"]').first().click();
      countClick('journey2');
      await page.waitForTimeout(1000);
      logStep('journey2', 'Clicked favorite button');
    }

    // Step 2.4: View favorites page
    await page.goto(`${BASE_URL}/favorites`);
    await waitForLoad(page);
    const ss8 = await screenshot(page, 'journey2_buyer', '08_favorites_page');
    logStep('journey2', `Favorites page: ${page.url()}`);

    const favEmpty = await page.locator('text=/Aucun favori|No favorites|Empty/i').count();
    if (favEmpty > 0) {
      logIssue('journey2', 'Favorites page shows empty state - verify quality of empty state design');
    }

    // Step 2.5: Send message to owner
    await page.goto(`${BASE_URL}/property/1`);
    await waitForLoad(page);
    const msgBtn = await page.locator('button:has-text("essage"), button:has-text("Contact"), button[class*="message"]').count();
    if (msgBtn > 0) {
      await page.locator('button:has-text("essage"), button:has-text("Contact"), button[class*="message"]').first().click();
      countClick('journey2');
      await page.waitForTimeout(1000);
      const ss9 = await screenshot(page, 'journey2_buyer', '09_message_modal');
      logStep('journey2', 'Opened message/contact modal');
    } else {
      logIssue('journey2', 'No contact/message button found on property details');
    }

    // Step 2.6: View inbox
    await page.goto(`${BASE_URL}/messages`);
    await waitForLoad(page);
    const ss10 = await screenshot(page, 'journey2_buyer', '10_inbox_page');
    logStep('journey2', `Inbox page: ${page.url()}`);

    // Step 2.7: Schedule a visit
    await page.goto(`${BASE_URL}/property/1`);
    await waitForLoad(page);
    const visitBtn = await page.locator('button:has-text("isite"), button:has-text("Visit"), button:has-text("Rendez"), [class*="visit"]').count();
    if (visitBtn > 0) {
      await page.locator('button:has-text("isite"), button:has-text("Visit"), button:has-text("Rendez"), [class*="visit"]').first().click();
      countClick('journey2');
      await page.waitForTimeout(1500);
      const ss11 = await screenshot(page, 'journey2_buyer', '11_schedule_visit');
      logStep('journey2', 'Opened schedule visit modal/form');
    } else {
      logIssue('journey2', 'No schedule visit button found on property details');
    }

    await page.close();
  }

  // ═══════════════════════════════════════════════════════════════
  // JOURNEY 3: OWNER
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 JOURNEY 3: OWNER\n');
  {
    const page = await context.newPage();

    // Inject owner auth
    const token = generateFakeJWT('PROPRIETAIRE');
    const user = makeUser('PROPRIETAIRE');
    await page.goto(`${BASE_URL}/home`);
    await page.evaluate(({ token, user }) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token_timestamp', Date.now().toString());
    }, { token, user });

    // Step 3.1: Login as owner
    await page.goto(`${BASE_URL}/home`);
    await page.reload();
    await waitForLoad(page);
    const ss1 = await screenshot(page, 'journey3_owner', '01_owner_logged_in');
    logStep('journey3', `Owner logged in: ${page.url()}`);

    // Check for owner-specific nav items
    const dashboardLink = await page.locator('a[href="/dashboard"], a:has-text("Dashboard"), a:has-text("Tableau")').count();
    if (dashboardLink === 0) {
      logIssue('journey3', 'No dashboard link visible for owner in navigation');
    }

    // Step 3.2: Dashboard
    await page.goto(`${BASE_URL}/dashboard`);
    await waitForLoad(page);
    const ss2 = await screenshot(page, 'journey3_owner', '02_dashboard');
    logStep('journey3', `Owner Dashboard: ${page.url()}`);

    // Check for analytics/visits quick links
    const quickLinks = await page.locator('a[href*="analytics"], a[href*="visits"], button:has-text("Analytics"), button:has-text("Visites")').count();
    logStep('journey3', `Found ${quickLinks} analytics/visits quick links`);

    // Step 3.3: Create property
    await page.goto(`${BASE_URL}/property/create`);
    await waitForLoad(page);
    const ss3 = await screenshot(page, 'journey3_owner', '03_create_property_step1');
    logStep('journey3', `Create property page: ${page.url()}`);

    // Count form fields
    const createFields = await page.locator('input, select, textarea').count();
    logStep('journey3', `Create property form has ${createFields} fields`);
    if (createFields > 15) {
      logIssue('journey3', `Property creation has ${createFields} fields - very high friction`);
    }

    // Try to fill some fields
    await safeFill(page, 'input[name="title"], input[placeholder*="titre"], input[placeholder*="Title"]', 'Audit Test Property');
    await safeFill(page, 'textarea[name="description"], textarea[placeholder*="description"]', 'This is an audit test property description.');
    const ss4 = await screenshot(page, 'journey3_owner', '04_create_property_filled');
    logStep('journey3', 'Filled some property creation fields');

    // Check for step indicators
    const stepIndicator = await page.locator('[class*="step"], [role="tablist"], .stepper').count();
    if (stepIndicator > 0) {
      logStep('journey3', 'Multi-step form detected with step indicators');
    } else if (createFields > 10) {
      logIssue('journey3', 'Long form without step indicators - overwhelming for users');
    }

    // Step 3.4: View analytics
    await page.goto(`${BASE_URL}/dashboard/analytics`);
    await waitForLoad(page);
    const ss5 = await screenshot(page, 'journey3_owner', '05_analytics');
    logStep('journey3', `Analytics page: ${page.url()}`);

    // Check for charts
    const charts = await page.locator('canvas, svg, [class*="chart"], [class*="recharts"]').count();
    logStep('journey3', `Found ${charts} chart elements`);
    if (charts === 0) {
      logIssue('journey3', 'No charts/visualizations on analytics page - poor data presentation');
    }

    // Step 3.5: View visits
    await page.goto(`${BASE_URL}/dashboard/visits`);
    await waitForLoad(page);
    const ss6 = await screenshot(page, 'journey3_owner', '06_visits');
    logStep('journey3', `Visits page: ${page.url()}`);

    const visitsEmpty = await page.locator('text=/Aucune visite|No visits|Empty/i').count();
    if (visitsEmpty > 0) {
      logIssue('journey3', 'Visits page shows empty state - verify quality');
    }

    await page.close();
  }

  // ═══════════════════════════════════════════════════════════════
  // JOURNEY 4: ADMIN
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 JOURNEY 4: ADMIN\n');
  {
    const page = await context.newPage();

    // Non-admin user tries admin panel
    const token = generateFakeJWT('LOCATAIRE');
    const user = makeUser('LOCATAIRE');
    await page.goto(`${BASE_URL}/home`);
    await page.evaluate(({ token, user }) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token_timestamp', Date.now().toString());
    }, { token, user });

    await page.goto(`${BASE_URL}/admin`);
    await waitForLoad(page);
    const ss1 = await screenshot(page, 'journey4_admin', '01_non_admin_attempt');
    logStep('journey4', `Non-admin accessing admin: ${page.url()}`);

    if (page.url().includes('/home')) {
      logStep('journey4', '✅ Correctly redirected non-admin to home');
    } else if (page.url().includes('/login')) {
      logStep('journey4', 'Redirected to login (acceptable)');
    } else if (page.url().includes('/admin')) {
      logIssue('journey4', '❌ CRITICAL: Non-admin can access admin panel!');
    }

    // Now try with admin role
    const adminToken = generateFakeJWT('ADMIN');
    const adminUser = makeUser('ADMIN');
    await page.evaluate(({ token, user }) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token_timestamp', Date.now().toString());
    }, { token: adminToken, user: adminUser });

    await page.goto(`${BASE_URL}/admin`);
    await page.reload();
    await waitForLoad(page);
    const ss2 = await screenshot(page, 'journey4_admin', '02_admin_panel');
    logStep('journey4', `Admin panel (as admin): ${page.url()}`);

    if (page.url().includes('/admin')) {
      logStep('journey4', '✅ Admin can access admin panel');
    } else {
      logIssue('journey4', 'Admin user redirected away from admin panel unexpectedly');
    }

    await page.close();
  }

  // ─── Generate Report ──────────────────────────────────────────
  console.log('\n\n═══════════════════════════════════════════════════');
  console.log('  GENERATING REPORT...');
  console.log('═══════════════════════════════════════════════════\n');

  const report = [];
  report.push(`# MAROC-LOC UX Excellence Audit Report`);
  report.push(`**Date:** ${new Date().toISOString()}`);
  report.push(`**Base URL:** ${BASE_URL}`);
  report.push(`**Auditor:** Playwright Automated UX Audit`);
  report.push('');
  report.push(`---`);
  report.push('');

  for (const [key, journey] of Object.entries(journeys)) {
    report.push(`## ${journey.name}`);
    report.push('');
    report.push(`**Total Clicks:** ${journey.clicks}`);
    report.push(`**Issues Found:** ${journey.issues.length}`);
    report.push('');
    report.push(`### Steps Executed`);
    journey.steps.forEach((step, i) => {
      report.push(`${i + 1}. ${step}`);
    });
    report.push('');
    if (journey.issues.length > 0) {
      report.push(`### Issues Identified`);
      journey.issues.forEach((issue, i) => {
        report.push(`- ⚠️ ${issue}`);
      });
      report.push('');
    } else {
      report.push(`### Issues Identified`);
      report.push(`- ✅ No critical issues detected in automated checks`);
      report.push('');
    }
    report.push(`---`);
    report.push('');
  }

  report.push(`## Summary`);
  report.push('');
  report.push(`| Journey | Clicks | Issues | Status |`);
  report.push(`|---------|--------|--------|--------|`);
  for (const [key, journey] of Object.entries(journeys)) {
    const status = journey.issues.length === 0 ? '✅ Pass' : journey.issues.length < 3 ? '⚠️ Warn' : '🔴 Fail';
    report.push(`| ${journey.name} | ${journey.clicks} | ${journey.issues.length} | ${status} |`);
  }
  report.push('');
  report.push(`## Screenshot Directory`);
  report.push(`All screenshots saved to: \`${SCREENSHOT_DIR}\``);
  report.push('');
  report.push(`## Methodology`);
  report.push(`- Browser: Chromium (headless, 1440x900)`);
  report.push(`- Wait strategy: networkidle + 1200ms animation buffer`);
  report.push(`- Auth simulation: JWT injected via localStorage`);
  report.push(`- Backend status: Not running (frontend-only audit)`);
  report.push('');

  fs.writeFileSync(REPORT_PATH, report.join('\n'));
  console.log(`✅ Report saved to: ${REPORT_PATH}`);
  console.log(`✅ Screenshots saved to: ${SCREENSHOT_DIR}`);

  await browser.close();

  console.log('\n═══════════════════════════════════════════════════');
  console.log('  AUDIT COMPLETE');
  console.log('═══════════════════════════════════════════════════');
})();
