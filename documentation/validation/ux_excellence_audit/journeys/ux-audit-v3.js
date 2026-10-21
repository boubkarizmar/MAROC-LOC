/**
 * MAROC-LOC UX Excellence Audit v3
 * Robust: long waits, proper lazy-loading handling, exact selectors
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const OUT = path.resolve(__dirname);
const SS_DIR = path.join(OUT, 'screenshots');
const REPORT = path.join(OUT, 'UX_AUDIT_REPORT_FINAL.md');

let ssCounter = 0;
function ssDir(j) { const d = path.join(SS_DIR, j); fs.mkdirSync(d, { recursive: true }); return d; }
async function ss(page, journey, name, fullPage = true) {
  ssCounter++;
  const p = path.join(ssDir(journey), `${String(ssCounter).padStart(3, '0')}_${name}.png`);
  await page.screenshot({ path: p, fullPage });
  return p.replace(OUT + path.sep, '');
}

function jwt(role) {
  const h = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const p = Buffer.from(JSON.stringify({ sub: '999', name: 'Audit User', email: `a@${role}.com`, role, exp: Math.floor(Date.now() / 1000) + 86400 * 30, iat: Math.floor(Date.now() / 1000) })).toString('base64url');
  return `${h}.${p}.`;
}

async function injectAuth(page, role) {
  await page.goto(`${BASE_URL}/home`);
  await page.evaluate(({ t, u }) => { localStorage.setItem('token', t); localStorage.setItem('user', JSON.stringify(u)); localStorage.setItem('token_timestamp', Date.now().toString()); localStorage.setItem('marocloc_splash_seen', 'true'); localStorage.setItem('marocloc_onboarding_complete', 'true'); }, { t: jwt(role), u: { id: 999, name: 'Audit User', email: `a@${role}.com`, role } });
}

async function waitContent(page) {
  // Lazy chunks + framer-motion
  await page.waitForTimeout(3000);
}

async function safeCount(page, sel) {
  try { return await page.locator(sel).count(); } catch (e) { return 0; }
}

async function tryClick(page, sel) {
  try {
    const el = page.locator(sel).first();
    if (await el.count() > 0 && await el.isVisible({ timeout: 3000 })) { await el.click(); await page.waitForTimeout(1000); return true; }
  } catch (e) {}
  return false;
}

async function tryFill(page, sel, val) {
  try {
    const el = page.locator(sel).first();
    if (await el.count() > 0 && await el.isVisible({ timeout: 5000 })) { await el.fill(val); return true; }
  } catch (e) {}
  return false;
}

// ─── Main ───────────────────────────────────────────────────────

(async () => {
  console.log('═══════════════════════════════════════════════════');
  console.log('  MAROC-LOC UX AUDIT v3');
  console.log('═══════════════════════════════════════════════════');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const report = { journeys: [] };

  function J(name) { const j = { name, steps: [], clicks: 0, issues: [], ss: [] }; report.journeys.push(j); return j; }
  function S(j, t) { j.steps.push(t); console.log(`  [STEP] ${t}`); }
  function I(j, t) { j.issues.push(t); console.log(`  [ISSUE] ${t}`); }
  function C(j) { j.clicks++; }
  async function SH(page, j, n) { const p = await ss(page, j.name.toLowerCase().replace(/[^a-z0-9]+/g, '_'), n); j.ss.push(p); return p; }

  // ═══════════════════════════════════════════════════════════════
  // JOURNEY 1: VISITOR
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 JOURNEY 1: VISITOR\n');
  {
    const j = J('Visitor');
    const p = await context.newPage();
    await p.goto(`${BASE_URL}/home`);
    await waitContent(p);
    await SH(p, j, '01_homepage');
    S(j, `Homepage: ${p.url()}`);

    // Check if still on splash (shouldn't happen with /home direct)
    const onSplash = (await p.locator('text=/Chargement|Passer|Loading experience/i').count()) > 0;
    if (onSplash) I(j, 'Splash screen visible on /home — unexpected');

    // Scroll
    await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await p.waitForTimeout(1000);
    await SH(p, j, '02_homepage_scrolled');
    S(j, 'Scrolled homepage');

    // Property cards
    const cards = await safeCount(p, 'a[href^="/property/"]');
    S(j, `Property cards: ${cards}`);
    if (cards === 0) I(j, 'No property cards on homepage');

    // Click card or direct nav
    if (cards > 0) {
      await p.locator('a[href^="/property/"]').first().click(); C(j);
      await waitContent(p);
      await SH(p, j, '03_property_details');
      S(j, `Property Details: ${p.url()}`);
    } else {
      await p.goto(`${BASE_URL}/property/1`); await waitContent(p);
      await SH(p, j, '03_property_details_direct');
      S(j, `Property Details (direct): ${p.url()}`);
      I(j, 'No clickable property cards');
    }

    // Favorite attempt
    const hasHeart = await tryClick(p, 'button:has([data-lucide="heart"]), button[aria-label*="avori"], [class*="favorite"]');
    if (hasHeart) { C(j); await p.waitForTimeout(1500); await SH(p, j, '04_favorite_attempt'); S(j, `Favorite click → ${p.url()}`); if (!p.url().includes('/login')) I(j, 'No login redirect for unauth favorite'); else S(j, '✅ Redirected to login'); }
    else I(j, 'No favorite button on property detail');

    // Search
    await p.goto(`${BASE_URL}/home`); await waitContent(p);
    const hasSearch = await tryFill(p, 'input[type="search"], input[placeholder*="echerch"], input[placeholder*="Search"]', 'Rabat');
    if (hasSearch) { await p.keyboard.press('Enter'); C(j); await waitContent(p); await SH(p, j, '05_search_results'); S(j, `Search: ${p.url()}`); }
    else I(j, 'No search input on homepage');

    // Voir tout
    await p.goto(`${BASE_URL}/home`); await waitContent(p);
    const hasVoirTout = await tryClick(p, 'text=/Voir tout/i');
    if (hasVoirTout) { C(j); await waitContent(p); await SH(p, j, '06_voir_tout'); S(j, `Voir tout → ${p.url()}`); }
    else I(j, 'No "Voir tout" CTA');

    // Direct search Rabat
    await p.goto(`${BASE_URL}/search?city=Rabat`); await waitContent(p);
    await SH(p, j, '07_search_rabat');
    S(j, `Search Rabat direct: ${p.url()}`);
    const empty = await safeCount(p, 'text=/Aucun|No result|Empty/i');
    if (empty) S(j, 'Empty state shown');

    await p.close();
  }

  // ═══════════════════════════════════════════════════════════════
  // JOURNEY 2: BUYER
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 JOURNEY 2: BUYER\n');
  {
    const j = J('Buyer');
    const p = await context.newPage();

    // Register
    await p.goto(`${BASE_URL}/register`); await waitContent(p);
    await SH(p, j, '01_register_page');
    S(j, `Register: ${p.url()}`);
    const regFields = await safeCount(p, 'form input, form select, form textarea');
    S(j, `Register fields: ${regFields}`);
    if (regFields === 0) I(j, 'Register form not rendered — lazy chunk issue?');
    if (regFields > 8) I(j, `High friction: ${regFields} fields`);

    // Fill form
    const f1 = await tryFill(p, 'input[name="firstName"]', 'Audit');
    const f2 = await tryFill(p, 'input[name="lastName"]', 'Buyer');
    const f3 = await tryFill(p, 'input[name="fullName"]', 'Audit Buyer');
    const f4 = await tryFill(p, 'input[name="phone"]', '0612345678');
    const f5 = await tryFill(p, 'input[name="email"]', 'auditbuyer@test.com');
    const f6 = await tryFill(p, 'input[name="password"]', 'TestPass123!');
    if (f1 || f2 || f3) {
      await SH(p, j, '02_register_filled');
      S(j, `Filled register fields: ${[f1&&'firstName',f2&&'lastName',f3&&'fullName',f4&&'phone',f5&&'email',f6&&'password'].filter(Boolean).join(', ')}`);
      const sub = await tryClick(p, 'button[type="submit"]');
      if (sub) { C(j); await p.waitForTimeout(2500); await SH(p, j, '03_register_submit'); S(j, `After submit: ${p.url()}`); }
    } else {
      I(j, 'Could not fill register form');
    }

    // Login page
    await p.goto(`${BASE_URL}/login`); await waitContent(p);
    await SH(p, j, '04_login_page');
    S(j, `Login: ${p.url()}`);

    const social = await safeCount(p, 'button:has-text("oogle"), button:has-text("acebook"), .gsi-material-button');
    S(j, `Social login buttons: ${social}`);

    await tryFill(p, 'input[name="email"]', 'auditbuyer@test.com');
    await tryFill(p, 'input[name="password"]', 'TestPass123!');
    await SH(p, j, '05_login_filled');
    S(j, 'Filled login form');

    // Inject auth
    await injectAuth(p, 'LOCATAIRE');

    // Logged-in homepage
    await p.goto(`${BASE_URL}/home`); await p.reload(); await waitContent(p);
    await SH(p, j, '06_logged_in_homepage');
    S(j, `Logged-in homepage: ${p.url()}`);

    const userInd = await safeCount(p, 'text=/Audit|Mon compte|Profil|Dashboard/i');
    if (userInd === 0) I(j, 'No user indicator in navbar');

    // Property + favorite
    await p.goto(`${BASE_URL}/property/1`); await waitContent(p);
    await SH(p, j, '07_property_detail');
    S(j, `Property detail: ${p.url()}`);
    const hf = await tryClick(p, 'button:has([data-lucide="heart"])');
    if (hf) { C(j); await p.waitForTimeout(1000); await SH(p, j, '08_favorite_clicked'); S(j, 'Clicked favorite'); }
    else I(j, 'No heart button');

    // Favorites page
    await p.goto(`${BASE_URL}/favorites`); await waitContent(p);
    await SH(p, j, '09_favorites');
    S(j, `Favorites: ${p.url()}`);
    const favEmpty = await safeCount(p, 'text=/Aucun favori|No favorites|Empty/i');
    if (favEmpty) I(j, 'Favorites empty state — check design quality');

    // Message
    await p.goto(`${BASE_URL}/property/1`); await waitContent(p);
    const msg = await tryClick(p, 'button:has-text("essage"), button:has-text("Contact"), button:has([data-lucide="message-circle"]), button:has([data-lucide="send"])');
    if (msg) { C(j); await p.waitForTimeout(1500); await SH(p, j, '10_message_modal'); S(j, 'Opened message'); }
    else I(j, 'No contact button');

    // Inbox
    await p.goto(`${BASE_URL}/messages`); await waitContent(p);
    await SH(p, j, '11_inbox');
    S(j, `Inbox: ${p.url()}`);

    // Schedule visit
    await p.goto(`${BASE_URL}/property/1`); await waitContent(p);
    const vis = await tryClick(p, 'button:has-text("isite"), button:has-text("Visit"), button:has([data-lucide="calendar"])');
    if (vis) { C(j); await p.waitForTimeout(1500); await SH(p, j, '12_schedule_visit'); S(j, 'Opened schedule visit'); }
    else I(j, 'No schedule visit button');

    await p.close();
  }

  // ═══════════════════════════════════════════════════════════════
  // JOURNEY 3: OWNER
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 JOURNEY 3: OWNER\n');
  {
    const j = J('Owner');
    const p = await context.newPage();
    await injectAuth(p, 'PROPRIETAIRE');

    await p.goto(`${BASE_URL}/home`); await p.reload(); await waitContent(p);
    await SH(p, j, '01_homepage');
    S(j, `Owner homepage: ${p.url()}`);

    const dash = await safeCount(p, 'a[href="/dashboard"], a:has-text("Dashboard"), a:has-text("Tableau")');
    if (dash === 0) I(j, 'No dashboard nav link for owner');

    await p.goto(`${BASE_URL}/dashboard`); await waitContent(p);
    await SH(p, j, '02_dashboard');
    S(j, `Dashboard: ${p.url()}`);

    const ql = await safeCount(p, 'a[href*="analytics"], a[href*="visits"], button:has-text("Analytics"), button:has-text("Visites")');
    S(j, `Quick links: ${ql}`);

    await p.goto(`${BASE_URL}/property/create`); await waitContent(p);
    await SH(p, j, '03_create_property');
    S(j, `Create property: ${p.url()}`);
    const cf = await safeCount(p, 'form input, form select, form textarea');
    S(j, `Create form fields: ${cf}`);
    if (cf > 15) I(j, `High friction: ${cf} fields`);

    const ti = await tryFill(p, 'input[name="title"]', 'Audit Property');
    if (ti) { await tryFill(p, 'textarea[name="description"]', 'Audit desc'); await SH(p, j, '04_create_filled'); S(j, 'Filled create form'); }
    else I(j, 'No title field');

    const si = await safeCount(p, '[class*="step"], [role="tablist"], .stepper');
    if (si > 0) S(j, 'Multi-step form detected');
    else if (cf > 10) I(j, 'Long form without step indicators');

    await p.goto(`${BASE_URL}/dashboard/analytics`); await waitContent(p);
    await SH(p, j, '05_analytics');
    S(j, `Analytics: ${p.url()}`);
    const charts = await safeCount(p, 'canvas, svg, [class*="chart"], [class*="recharts"]');
    S(j, `Chart elements: ${charts}`);
    if (charts === 0) I(j, 'No charts on analytics');

    await p.goto(`${BASE_URL}/dashboard/visits`); await waitContent(p);
    await SH(p, j, '06_visits');
    S(j, `Visits: ${p.url()}`);
    const ve = await safeCount(p, 'text=/Aucune visite|No visits|Empty/i');
    if (ve) I(j, 'Visits empty state');

    await p.close();
  }

  // ═══════════════════════════════════════════════════════════════
  // JOURNEY 4: ADMIN
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📋 JOURNEY 4: ADMIN\n');
  {
    const j = J('Admin');
    const p = await context.newPage();
    await injectAuth(p, 'LOCATAIRE');

    await p.goto(`${BASE_URL}/admin`); await waitContent(p);
    await SH(p, j, '01_non_admin');
    S(j, `Non-admin /admin: ${p.url()}`);
    if (p.url().includes('/home')) S(j, '✅ Redirected to home');
    else if (p.url().includes('/login')) S(j, 'Redirected to login');
    else if (p.url().includes('/admin')) I(j, '❌ CRITICAL: Non-admin can access admin');

    await injectAuth(p, 'ADMIN');
    await p.goto(`${BASE_URL}/admin`); await p.reload(); await waitContent(p);
    await SH(p, j, '02_admin_panel');
    S(j, `Admin panel: ${p.url()}`);
    if (p.url().includes('/admin')) S(j, '✅ Admin access works');
    else I(j, 'Admin redirected unexpectedly');

    await p.close();
  }

  // ─── Report ───────────────────────────────────────────────────
  console.log('\nGenerating report...');
  const lines = [];
  lines.push(`# MAROC-LOC UX Excellence Audit — Final Report`);
  lines.push(`**Date:** ${new Date().toISOString()}`);
  lines.push(`**URL:** ${BASE_URL}`);
  lines.push(`**Tool:** Playwright Chromium (1440x900)`);
  lines.push(`**Note:** Backend offline; audit focuses on UI structure, forms, navigation, empty/error states.`);
  lines.push('');

  report.journeys.forEach(j => {
    lines.push(`## ${j.name}`);
    lines.push(`**Clicks:** ${j.clicks} | **Issues:** ${j.issues.length}`);
    lines.push('');
    lines.push(`### Steps Executed`);
    j.steps.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
    lines.push('');
    lines.push(`### Issues Found`);
    j.issues.length ? j.issues.forEach(i => lines.push(`- ⚠️ ${i}`)) : lines.push(`- ✅ No issues`);
    lines.push('');
    lines.push(`### Screenshots`);
    j.ss.forEach(s => lines.push(`- \`${s}\``));
    lines.push('');
    lines.push('---');
    lines.push('');
  });

  lines.push(`## Summary`);
  lines.push(`| Journey | Clicks | Issues | Rating |`);
  lines.push(`|---------|--------|--------|--------|`);
  report.journeys.forEach(j => {
    const r = j.issues.length === 0 ? '✅' : j.issues.length < 3 ? '⚠️' : '🔴';
    lines.push(`| ${j.name} | ${j.clicks} | ${j.issues.length} | ${r} |`);
  });
  lines.push('');

  fs.writeFileSync(REPORT, lines.join('\n'));
  console.log(`✅ Report: ${REPORT}`);
  console.log(`✅ Screenshots: ${SS_DIR}`);
  await browser.close();
})();
