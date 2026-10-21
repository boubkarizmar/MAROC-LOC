/**
 * MAROC-LOC UX Excellence Audit v2
 * Improved with exact selectors, splash skip, and better wait logic
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const OUTPUT_DIR = path.resolve(__dirname);
const SCREENSHOT_DIR = path.join(OUTPUT_DIR, 'screenshots');
const REPORT_PATH = path.join(OUTPUT_DIR, 'UX_AUDIT_REPORT_V2.md');

let screenshotCounter = 0;
function ssPath(journey, name) {
  screenshotCounter++;
  const dir = path.join(SCREENSHOT_DIR, journey);
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, `${String(screenshotCounter).padStart(3, '0')}_${name}.png`);
}

async function screenshot(page, journey, name, fullPage = true) {
  const p = ssPath(journey, name);
  await page.screenshot({ path: p, fullPage });
  return p.replace(OUTPUT_DIR + path.sep, '');
}

async function waitForApp(page) {
  // Wait for splash to be gone or main content to appear
  try {
    await page.waitForSelector('#root', { timeout: 10000 });
  } catch (e) {}
  // Wait for lazy chunks + framer-motion animations
  await page.waitForTimeout(2500);
}

function generateFakeJWT(role = 'LOCATAIRE') {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    sub: '999',
    name: 'Audit Test User',
    email: `audit_${role.toLowerCase()}@test.com`,
    role: role,
    exp: Math.floor(Date.now() / 1000) + 86400 * 30,
    iat: Math.floor(Date.now() / 1000)
  })).toString('base64url');
  return `${header}.${payload}.`;
}

async function skipSplashAndOnboarding(page) {
  await page.goto(`${BASE_URL}/home`);
  await page.evaluate(() => {
    localStorage.setItem('marocloc_splash_seen', 'true');
    localStorage.setItem('marocloc_onboarding_complete', 'true');
  });
}

async function setAuth(page, role = 'LOCATAIRE') {
  await page.goto(`${BASE_URL}/home`);
  await page.evaluate(({ token, user }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token_timestamp', Date.now().toString());
  }, {
    token: generateFakeJWT(role),
    user: { id: 999, name: 'Audit User', email: `audit_${role.toLowerCase()}@test.com`, role }
  });
}

async function clickIfExists(page, selector, journey, desc) {
  try {
    const el = page.locator(selector).first();
    if (await el.count() > 0 && await el.isVisible({ timeout: 3000 })) {
      await el.click();
      await page.waitForTimeout(800);
      return true;
    }
  } catch (e) {}
  return false;
}

// ─── Main ───────────────────────────────────────────────────────

(async () => {
  console.log('═══════════════════════════════════════════════════');
  console.log('  MAROC-LOC UX EXCELLENCE AUDIT v2');
  console.log('═══════════════════════════════════════════════════\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  const report = {
    journeys: [],
    meta: { date: new Date().toISOString(), url: BASE_URL }
  };

  function addJourney(name) {
    const j = { name, steps: [], clicks: 0, issues: [], screenshots: [] };
    report.journeys.push(j);
    return j;
  }
  function step(j, text) { j.steps.push(text); console.log(`  [STEP] ${text}`); }
  function issue(j, text) { j.issues.push(text); console.log(`  [ISSUE] ${text}`); }
  function click(j) { j.clicks++; }
  async function ss(page, j, name) {
    const p = await screenshot(page, j.name.toLowerCase().replace(/[^a-z0-9]+/g, '_'), name);
    j.screenshots.push(p);
    return p;
  }

  // ═══════════════════════════════════════════════════════════════
  // JOURNEY 1: VISITOR
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 JOURNEY 1: VISITOR (no login)\n');
  {
    const j = addJourney('Visitor');
    const page = await context.newPage();
    await skipSplashAndOnboarding(page);

    // 1.1 Homepage
    await page.goto(`${BASE_URL}/home`);
    await waitForApp(page);
    await ss(page, j, '01_homepage');
    step(j, `Homepage loaded: ${page.url()}`);

    // Check for splash still showing
    const splashVisible = await page.locator('text=/Chargement de l\'expérience|Loading|Passer/i').count() > 0;
    if (splashVisible) {
      issue(j, 'Splash screen still visible despite localStorage skip - UX blocker');
      // Force skip
      await page.evaluate(() => {
        const splash = document.querySelector('[class*="splash"]');
        if (splash) splash.remove();
      });
      await page.waitForTimeout(500);
    }

    // Scroll
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(1000);
    await ss(page, j, '02_homepage_scrolled');
    step(j, 'Scrolled homepage');

    // Check property cards
    const cards = await page.locator('a[href^="/property/"]').count();
    step(j, `Found ${cards} property card links`);
    if (cards === 0) {
      issue(j, 'No property cards on homepage - check empty state quality');
    }

    // 1.2 Click property card (or direct nav)
    if (cards > 0) {
      await page.locator('a[href^="/property/"]').first().click();
      click(j);
      await waitForApp(page);
      await ss(page, j, '03_property_details');
      step(j, `Property Details: ${page.url()}`);
    } else {
      await page.goto(`${BASE_URL}/property/1`);
      await waitForApp(page);
      await ss(page, j, '03_property_details_direct');
      step(j, `Property Details (direct): ${page.url()}`);
      issue(j, 'No clickable property cards found');
    }

    // 1.3 Try favorite
    const favClicked = await clickIfExists(page, 'button:has([data-lucide="heart"]), button:has-text("avori"), [aria-label*="avori"]', j, 'favorite');
    if (favClicked) {
      click(j);
      await page.waitForTimeout(1500);
      await ss(page, j, '04_favorite_attempt');
      step(j, `Favorite attempt result: ${page.url()}`);
      if (page.url().includes('/login')) {
        step(j, '✅ Correctly redirected to login');
      } else {
        issue(j, 'No redirect to login for unauthenticated favorite action');
      }
    } else {
      issue(j, 'No favorite/heart button found on property details');
    }

    // 1.4 Search/filter
    await page.goto(`${BASE_URL}/home`);
    await waitForApp(page);
    const searchInput = page.locator('input[type="search"], input[placeholder*="echerch"], input[placeholder*="Search"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('Rabat');
      await page.keyboard.press('Enter');
      click(j);
      await waitForApp(page);
      await ss(page, j, '05_search_results');
      step(j, `Search result: ${page.url()}`);
    } else {
      issue(j, 'No search input found on homepage');
    }

    // 1.5 Click "Voir tout"
    await page.goto(`${BASE_URL}/home`);
    await waitForApp(page);
    const voirTout = await page.locator('text=/Voir tout/i').count();
    if (voirTout > 0) {
      await page.locator('text=/Voir tout/i').first().click();
      click(j);
      await waitForApp(page);
      await ss(page, j, '06_voir_tout');
      step(j, `After "Voir tout": ${page.url()}`);
    } else {
      issue(j, 'No "Voir tout" CTA found');
    }

    // 1.6 Navigate to /search?city=Rabat
    await page.goto(`${BASE_URL}/search?city=Rabat`);
    await waitForApp(page);
    await ss(page, j, '07_search_rabat_direct');
    step(j, `Direct search Rabat: ${page.url()}`);

    const emptyMsg = await page.locator('text=/Aucun|No result|Empty|Rien/i').count();
    if (emptyMsg > 0) {
      step(j, 'Empty state displayed for Rabat search');
    }

    await page.close();
  }

  // ═══════════════════════════════════════════════════════════════
  // JOURNEY 2: BUYER
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 JOURNEY 2: BUYER\n');
  {
    const j = addJourney('Buyer');
    const page = await context.newPage();
    await skipSplashAndOnboarding(page);

    // 2.1 Register
    await page.goto(`${BASE_URL}/register`);
    await waitForApp(page);
    await ss(page, j, '01_register_page');
    step(j, `Register page: ${page.url()}`);

    const formInputs = await page.locator('form input, form select, form textarea').count();
    step(j, `Register form has ${formInputs} fields`);
    if (formInputs > 8) issue(j, `Registration form has ${formInputs} fields — high friction`);

    // Fill registration
    await page.fill('input[name="firstName"]', 'Audit');
    await page.fill('input[name="lastName"]', 'Buyer');
    await page.fill('input[name="fullName"]', 'Audit Buyer');
    await page.selectOption('select[name="city"]', 'Rabat');
    await page.fill('input[name="phone"]', '0612345678');
    await page.fill('input[name="email"]', 'auditbuyer@test.com');
    await page.fill('input[name="password"]', 'TestPass123!');
    await page.selectOption('select[name="type"]', 'LOCATAIRE');
    await ss(page, j, '02_register_filled');
    step(j, 'Filled all registration fields');

    // Submit (will fail due to no backend)
    const submitBtn = page.locator('button[type="submit"]').first();
    if (await submitBtn.count() > 0) {
      await submitBtn.click();
      click(j);
      await page.waitForTimeout(2000);
      await ss(page, j, '03_register_submit');
      step(j, `After register submit: ${page.url()}`);
      const netErr = await page.locator('text=/network|connexion|erreur/i').count();
      if (netErr > 0) issue(j, 'Network error shown on register — backend unavailable');
    }

    // 2.2 Login page
    await page.goto(`${BASE_URL}/login`);
    await waitForApp(page);
    await ss(page, j, '04_login_page');
    step(j, `Login page: ${page.url()}`);

    // Check social login
    const social = await page.locator('button:has-text("oogle"), button:has-text("acebook"), .gsi-material-button').count();
    step(j, `Found ${social} social login buttons`);

    await page.fill('input[name="email"]', 'auditbuyer@test.com');
    await page.fill('input[name="password"]', 'TestPass123!');
    await ss(page, j, '05_login_filled');
    step(j, 'Filled login form');

    // Simulate login
    await setAuth(page, 'LOCATAIRE');

    // 2.3 Logged-in homepage
    await page.goto(`${BASE_URL}/home`);
    await page.reload();
    await waitForApp(page);
    await ss(page, j, '06_logged_in_homepage');
    step(j, `Logged-in homepage: ${page.url()}`);

    // Check user indicator
    const userIndicator = await page.locator('text=/Audit|Mon compte|Profil/i').count();
    if (userIndicator === 0) issue(j, 'No user name/avatar visible in navbar after login');

    // 2.4 Property + favorite
    await page.goto(`${BASE_URL}/property/1`);
    await waitForApp(page);
    await ss(page, j, '07_property_detail');
    step(j, `Property detail (auth): ${page.url()}`);

    const heart = page.locator('button:has([data-lucide="heart"])').first();
    if (await heart.count() > 0) {
      await heart.click();
      click(j);
      await page.waitForTimeout(1000);
      await ss(page, j, '08_favorite_clicked');
      step(j, 'Clicked favorite button');
    } else {
      issue(j, 'No heart/favorite button on property detail');
    }

    // 2.5 Favorites page
    await page.goto(`${BASE_URL}/favorites`);
    await waitForApp(page);
    await ss(page, j, '09_favorites_page');
    step(j, `Favorites page: ${page.url()}`);

    const favEmpty = await page.locator('text=/Aucun favori|No favorites|Empty/i').count();
    if (favEmpty > 0) {
      step(j, 'Favorites page shows empty state');
      issue(j, 'Empty state on favorites — verify design quality and CTA presence');
    }

    // 2.6 Send message
    await page.goto(`${BASE_URL}/property/1`);
    await waitForApp(page);
    const msgBtn = await page.locator('button:has-text("essage"), button:has-text("Contact"), button:has([data-lucide="message-circle"]), button:has([data-lucide="send"])').count();
    if (msgBtn > 0) {
      await page.locator('button:has-text("essage"), button:has-text("Contact"), button:has([data-lucide="message-circle"]), button:has([data-lucide="send"])').first().click();
      click(j);
      await page.waitForTimeout(1500);
      await ss(page, j, '10_message_modal');
      step(j, 'Opened contact/message form');
    } else {
      issue(j, 'No contact/message button on property detail');
    }

    // 2.7 Inbox
    await page.goto(`${BASE_URL}/messages`);
    await waitForApp(page);
    await ss(page, j, '11_inbox_page');
    step(j, `Inbox: ${page.url()}`);

    // 2.8 Schedule visit
    await page.goto(`${BASE_URL}/property/1`);
    await waitForApp(page);
    const visitBtn = await page.locator('button:has-text("isite"), button:has-text("Visit"), button:has-text("Rendez"), button:has([data-lucide="calendar"])').count();
    if (visitBtn > 0) {
      await page.locator('button:has-text("isite"), button:has-text("Visit"), button:has-text("Rendez"), button:has([data-lucide="calendar"])').first().click();
      click(j);
      await page.waitForTimeout(1500);
      await ss(page, j, '12_schedule_visit');
      step(j, 'Opened schedule visit');
    } else {
      issue(j, 'No schedule visit button on property detail');
    }

    await page.close();
  }

  // ═══════════════════════════════════════════════════════════════
  // JOURNEY 3: OWNER
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 JOURNEY 3: OWNER\n');
  {
    const j = addJourney('Owner');
    const page = await context.newPage();
    await skipSplashAndOnboarding(page);
    await setAuth(page, 'PROPRIETAIRE');

    // 3.1 Owner homepage
    await page.goto(`${BASE_URL}/home`);
    await page.reload();
    await waitForApp(page);
    await ss(page, j, '01_owner_homepage');
    step(j, `Owner homepage: ${page.url()}`);

    // Check dashboard link
    const dashLink = await page.locator('a[href="/dashboard"]').count();
    if (dashLink === 0) issue(j, 'No dashboard link visible for owner');
    else step(j, `Found ${dashLink} dashboard link(s)`);

    // 3.2 Dashboard
    await page.goto(`${BASE_URL}/dashboard`);
    await waitForApp(page);
    await ss(page, j, '02_dashboard');
    step(j, `Dashboard: ${page.url()}`);

    const quickLinks = await page.locator('a[href*="analytics"], a[href*="visits"], button:has-text("Analytics"), button:has-text("Visites")').count();
    step(j, `Found ${quickLinks} analytics/visits quick links`);

    // 3.3 Create property
    await page.goto(`${BASE_URL}/property/create`);
    await waitForApp(page);
    await ss(page, j, '03_create_property');
    step(j, `Create property: ${page.url()}`);

    const createFields = await page.locator('form input, form select, form textarea').count();
    step(j, `Create property form has ${createFields} fields`);
    if (createFields > 15) issue(j, `Property creation has ${createFields} fields — very high friction`);

    // Try fill some fields
    const titleInput = page.locator('input[name="title"]').first();
    if (await titleInput.count() > 0) {
      await titleInput.fill('Audit Test Property');
      const desc = page.locator('textarea[name="description"]').first();
      if (await desc.count() > 0) await desc.fill('Audit test description');
      await ss(page, j, '04_create_property_filled');
      step(j, 'Filled property creation fields');
    } else {
      issue(j, 'No title input found on create property page');
    }

    const stepIndicator = await page.locator('[class*="step"], [role="tablist"]').count();
    if (stepIndicator > 0) step(j, 'Multi-step form detected');
    else if (createFields > 10) issue(j, 'Long form without step indicators');

    // 3.4 Analytics
    await page.goto(`${BASE_URL}/dashboard/analytics`);
    await waitForApp(page);
    await ss(page, j, '05_analytics');
    step(j, `Analytics: ${page.url()}`);

    const charts = await page.locator('canvas, svg, [class*="chart"], [class*="recharts"]').count();
    step(j, `Found ${charts} chart elements`);
    if (charts === 0) issue(j, 'No charts on analytics page');

    // 3.5 Visits
    await page.goto(`${BASE_URL}/dashboard/visits`);
    await waitForApp(page);
    await ss(page, j, '06_visits');
    step(j, `Visits: ${page.url()}`);

    const visitsEmpty = await page.locator('text=/Aucune visite|No visits|Empty/i').count();
    if (visitsEmpty > 0) issue(j, 'Visits page empty state — verify quality');

    await page.close();
  }

  // ═══════════════════════════════════════════════════════════════
  // JOURNEY 4: ADMIN
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 JOURNEY 4: ADMIN\n');
  {
    const j = addJourney('Admin');
    const page = await context.newPage();
    await skipSplashAndOnboarding(page);

    // Non-admin access attempt
    await setAuth(page, 'LOCATAIRE');
    await page.goto(`${BASE_URL}/admin`);
    await waitForApp(page);
    await ss(page, j, '01_non_admin_attempt');
    step(j, `Non-admin /admin: ${page.url()}`);

    if (page.url().includes('/home')) {
      step(j, '✅ Non-admin redirected to home');
    } else if (page.url().includes('/login')) {
      step(j, 'Non-admin redirected to login');
    } else if (page.url().includes('/admin')) {
      issue(j, '❌ CRITICAL: Non-admin can access admin panel');
    }

    // Admin access
    await setAuth(page, 'ADMIN');
    await page.goto(`${BASE_URL}/admin`);
    await page.reload();
    await waitForApp(page);
    await ss(page, j, '02_admin_panel');
    step(j, `Admin panel: ${page.url()}`);

    if (page.url().includes('/admin')) {
      step(j, '✅ Admin can access admin panel');
    } else {
      issue(j, 'Admin redirected away from admin panel unexpectedly');
    }

    await page.close();
  }

  // ─── Generate Report ──────────────────────────────────────────
  console.log('\n\nGenerating report...');

  const lines = [];
  lines.push(`# MAROC-LOC UX Excellence Audit Report v2`);
  lines.push(`**Date:** ${report.meta.date}`);
  lines.push(`**URL:** ${report.meta.url}`);
  lines.push(`**Method:** Playwright Chromium (1440x900), splash skipped via localStorage`);
  lines.push('');

  report.journeys.forEach(j => {
    lines.push(`## ${j.name}`);
    lines.push(`**Clicks:** ${j.clicks} | **Issues:** ${j.issues.length}`);
    lines.push('');
    lines.push(`### Steps`);
    j.steps.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
    lines.push('');
    lines.push(`### Issues`);
    if (j.issues.length) j.issues.forEach(i => lines.push(`- ⚠️ ${i}`));
    else lines.push(`- ✅ No issues detected`);
    lines.push('');
    lines.push(`### Screenshots`);
    j.screenshots.forEach(s => lines.push(`- \`${s}\``));
    lines.push('');
    lines.push('---');
    lines.push('');
  });

  lines.push(`## Executive Summary`);
  lines.push(`| Journey | Clicks | Issues | Rating |`);
  lines.push(`|---------|--------|--------|--------|`);
  report.journeys.forEach(j => {
    const rating = j.issues.length === 0 ? '✅ Excellent' : j.issues.length < 3 ? '⚠️ Needs Improvement' : '🔴 Critical';
    lines.push(`| ${j.name} | ${j.clicks} | ${j.issues.length} | ${rating} |`);
  });

  fs.writeFileSync(REPORT_PATH, lines.join('\n'));
  console.log(`✅ Report: ${REPORT_PATH}`);
  console.log(`✅ Screenshots: ${SCREENSHOT_DIR}`);

  await browser.close();
})();
