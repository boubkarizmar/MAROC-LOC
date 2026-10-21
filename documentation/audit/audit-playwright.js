/**
 * MAROC-LOC Frontend Audit Script
 * Tests: Dark Mode, Translations (FR/EN/AR), Filters
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const REPORT_DIR = path.join(__dirname, 'audit-report');
const SCREENSHOTS_DIR = path.join(REPORT_DIR, 'screenshots');

// Ensure directories exist
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const screenshot = async (page, name) => {
  const filePath = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  return filePath;
};

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function runAudit() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  const report = {
    timestamp: new Date().toISOString(),
    url: BASE_URL,
    darkMode: { status: 'pending', issues: [], screenshots: [] },
    translation: { status: 'pending', issues: [], screenshots: [] },
    filters: { status: 'pending', issues: [], screenshots: [], networkLogs: [] },
  };

  // ========================
  // DARK MODE TEST
  // ========================
  try {
    console.log('[DARK MODE] Navigating to homepage...');
    await page.goto(`${BASE_URL}/home`, { waitUntil: 'networkidle', timeout: 30000 });
    await delay(1000);

    const initialTheme = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    });
    console.log(`[DARK MODE] Initial theme: ${initialTheme}`);

    // Find and click theme toggle button
    const toggleBtn = await page.locator('button[aria-label*="mode"], button:has(svg[data-lucide="sun"]), button:has(svg[data-lucide="moon"]), nav button:has(.lucide-sun), nav button:has(.lucide-moon)').first();

    let toggleFound = false;
    try {
      await toggleBtn.waitFor({ state: 'visible', timeout: 5000 });
      await screenshot(page, '01_homepage_initial');
      report.darkMode.screenshots.push('01_homepage_initial');

      await toggleBtn.click();
      await delay(800);
      await screenshot(page, '02_homepage_after_toggle');
      report.darkMode.screenshots.push('02_homepage_after_toggle');
      toggleFound = true;
      console.log('[DARK MODE] Toggle clicked');
    } catch (e) {
      // Try broader selector
      const allButtons = await page.locator('nav button').all();
      for (const btn of allButtons) {
        const html = await btn.innerHTML();
        if (html.includes('sun') || html.includes('moon') || html.includes('Sun') || html.includes('Moon')) {
          await btn.click();
          await delay(800);
          await screenshot(page, '02_homepage_after_toggle');
          report.darkMode.screenshots.push('02_homepage_after_toggle');
          toggleFound = true;
          console.log('[DARK MODE] Toggle clicked (fallback)');
          break;
        }
      }
    }

    if (!toggleFound) {
      report.darkMode.issues.push({ severity: 'high', message: 'Theme toggle button not found in navbar' });
    }

    const afterToggleTheme = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    });
    console.log(`[DARK MODE] Theme after toggle: ${afterToggleTheme}`);

    if (afterToggleTheme === initialTheme && toggleFound) {
      report.darkMode.issues.push({ severity: 'high', message: `Theme did not change after toggle (stayed ${initialTheme})` });
    }

    // Check localStorage persistence
    const storedTheme = await page.evaluate(() => localStorage.getItem('marocloc-theme'));
    console.log(`[DARK MODE] localStorage theme: ${storedTheme}`);
    if (!storedTheme || !['light', 'dark'].includes(storedTheme)) {
      report.darkMode.issues.push({ severity: 'medium', message: `Theme not persisted correctly in localStorage: ${storedTheme}` });
    }

    // Refresh and verify persistence
    await page.reload({ waitUntil: 'networkidle' });
    await delay(1000);
    const afterReloadTheme = await page.evaluate(() => {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    });
    console.log(`[DARK MODE] Theme after reload: ${afterReloadTheme}`);
    await screenshot(page, '03_homepage_after_reload');
    report.darkMode.screenshots.push('03_homepage_after_reload');

    if (afterReloadTheme !== afterToggleTheme) {
      report.darkMode.issues.push({ severity: 'high', message: `Theme did not persist after reload. Before: ${afterToggleTheme}, After: ${afterReloadTheme}` });
    }

    // Navigate to property details page (find first property link)
    try {
      const propertyLinks = await page.locator('a[href*="/property/"]').all();
      if (propertyLinks.length > 0) {
        await propertyLinks[0].click();
        await page.waitForLoadState('networkidle');
        await delay(1000);
        const detailTheme = await page.evaluate(() => document.documentElement.classList.contains('dark') ? 'dark' : 'light');
        console.log(`[DARK MODE] Theme on property details: ${detailTheme}`);
        await screenshot(page, '04_property_details_theme');
        report.darkMode.screenshots.push('04_property_details_theme');
        if (detailTheme !== afterReloadTheme) {
          report.darkMode.issues.push({ severity: 'medium', message: `Theme inconsistent on property details page: ${detailTheme} vs ${afterReloadTheme}` });
        }
      } else {
        report.darkMode.issues.push({ severity: 'low', message: 'No property links found to test theme consistency' });
      }
    } catch (e) {
      report.darkMode.issues.push({ severity: 'low', message: `Could not navigate to property details: ${e.message}` });
    }

    // Navigate to dashboard (may need login)
    try {
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 15000 });
      await delay(1000);
      const dashTheme = await page.evaluate(() => document.documentElement.classList.contains('dark') ? 'dark' : 'light');
      console.log(`[DARK MODE] Theme on dashboard: ${dashTheme}`);
      await screenshot(page, '05_dashboard_theme');
      report.darkMode.screenshots.push('05_dashboard_theme');
      if (dashTheme !== afterReloadTheme) {
        report.darkMode.issues.push({ severity: 'medium', message: `Theme inconsistent on dashboard page: ${dashTheme} vs ${afterReloadTheme}` });
      }
    } catch (e) {
      report.darkMode.issues.push({ severity: 'low', message: `Could not test dashboard theme: ${e.message}` });
    }

    // Check for hardcoded colors (inline styles with rgb/hex not using CSS vars)
    await page.goto(`${BASE_URL}/home`, { waitUntil: 'networkidle' });
    await delay(1000);
    const hardcodedColors = await page.evaluate(() => {
      const issues = [];
      const allElements = document.querySelectorAll('*');
      const colorRegex = /^(rgb|rgba|#[0-9a-fA-F]{3,6})/;
      for (const el of allElements) {
        const style = el.getAttribute('style');
        if (style && (colorRegex.test(style) || /color|background|border-color/.test(style))) {
          // Skip if it uses CSS var
          if (!style.includes('var(--color') && !style.includes('var(--tw')) {
            const tag = el.tagName.toLowerCase();
            const cls = el.className?.toString()?.substring(0, 60) || '';
            issues.push({ tag, className: cls, style: style.substring(0, 200) });
          }
        }
      }
      // Deduplicate
      const seen = new Set();
      return issues.filter(i => {
        const key = i.style;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).slice(0, 30);
    });
    console.log(`[DARK MODE] Found ${hardcodedColors.length} potential hardcoded inline colors`);
    if (hardcodedColors.length > 0) {
      report.darkMode.issues.push({
        severity: 'medium',
        message: `Found ${hardcodedColors.length} elements with hardcoded inline colors (not CSS variables)`,
        details: hardcodedColors,
      });
    }

    report.darkMode.status = report.darkMode.issues.length === 0 ? 'pass' : 'fail';
  } catch (e) {
    report.darkMode.status = 'error';
    report.darkMode.issues.push({ severity: 'high', message: e.message });
  }

  // ========================
  // TRANSLATION TEST
  // ========================
  try {
    console.log('[TRANSLATION] Starting translation tests...');
    await page.goto(`${BASE_URL}/home`, { waitUntil: 'networkidle' });
    await delay(1000);

    const languages = [
      { code: 'fr', name: 'French', textSamples: ['Rechercher', 'Ville', 'Biens', 'Utilisateurs'] },
      { code: 'en', name: 'English', textSamples: ['Search', 'City', 'Properties', 'Users'] },
      { code: 'ar', name: 'Arabic', textSamples: ['بحث', 'مدينة', 'عقارات', 'مستخدمين'] },
    ];

    const hardcodedStrings = [];

    for (const lang of languages) {
      console.log(`[TRANSLATION] Switching to ${lang.name}...`);

      // Click language switcher
      const langBtn = await page.locator('button[aria-label*="langue"], button[aria-label*="language"], button:has(.lucide-globe)').first();
      try {
        await langBtn.waitFor({ state: 'visible', timeout: 5000 });
        await langBtn.click();
        await delay(500);
      } catch (e) {
        // Fallback: find any button with Globe
        const allNavButtons = await page.locator('nav button').all();
        for (const btn of allNavButtons) {
          const html = await btn.innerHTML().catch(() => '');
          if (html.includes('globe') || html.includes('Globe')) {
            await btn.click();
            await delay(500);
            break;
          }
        }
      }

      // Select language
      const langOption = await page.locator(`button:has-text("${lang.code.toUpperCase()}"), [role="option"]:has-text("${lang.name}")`).first();
      try {
        await langOption.click();
      } catch (e) {
        // Try clicking by flag or text content
        const options = await page.locator('[role="option"]').all();
        for (const opt of options) {
          const text = await opt.textContent();
          if (text && text.toLowerCase().includes(lang.code)) {
            await opt.click();
            break;
          }
        }
      }
      await delay(1500);

      await screenshot(page, `06_lang_${lang.code}_homepage`);
      report.translation.screenshots.push(`06_lang_${lang.code}_homepage`);

      // Check HTML lang and dir
      const htmlLang = await page.evaluate(() => document.documentElement.lang);
      const htmlDir = await page.evaluate(() => document.documentElement.dir);
      console.log(`[TRANSLATION] ${lang.name} -> html lang=${htmlLang}, dir=${htmlDir}`);

      if (htmlLang !== lang.code) {
        hardcodedStrings.push({
          language: lang.name,
          issue: 'HTML lang attribute mismatch',
          expected: lang.code,
          actual: htmlLang,
          element: '<html>',
        });
      }
      if (lang.code === 'ar' && htmlDir !== 'rtl') {
        hardcodedStrings.push({
          language: lang.name,
          issue: 'RTL direction not applied for Arabic',
          expected: 'rtl',
          actual: htmlDir,
          element: '<html>',
        });
      }

      // Collect all visible text and look for French text in EN/AR modes
      const visibleTexts = await page.evaluate(() => {
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
        const texts = [];
        let node;
        while ((node = walker.nextNode())) {
          const text = node.textContent.trim();
          const parent = node.parentElement;
          if (text.length > 2 && parent && !['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName)) {
            const rect = parent.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              texts.push({
                text: text.substring(0, 120),
                tag: parent.tagName.toLowerCase(),
                className: parent.className?.toString()?.substring(0, 80) || '',
                placeholder: parent.getAttribute('placeholder') || '',
              });
            }
          }
        }
        return texts;
      });

      // Look for common French words that shouldn't appear in EN/AR
      if (lang.code !== 'fr') {
        const frenchIndicators = ['Rechercher', 'Ville', 'Toutes les villes', 'Location', 'Achat', 'Crédit', 'Biens', 'Utilisateurs', 'Villes', 'Langue', 'Français', 'Changer de langue', 'Connexion', 'Inscription', 'Tableau de bord'];
        for (const item of visibleTexts) {
          for (const indicator of frenchIndicators) {
            if (item.text === indicator || item.placeholder === indicator) {
              hardcodedStrings.push({
                language: lang.name,
                text: indicator,
                element: `<${item.tag} class="${item.className}">`,
                context: item.text,
              });
            }
          }
        }
      }

      // Check buttons, placeholders, labels
      const buttons = await page.locator('button, a[role="button"], input[type="submit"]').all();
      for (const btn of buttons) {
        const text = await btn.textContent().catch(() => '');
        const ariaLabel = await btn.getAttribute('aria-label').catch(() => '');
        const placeholder = await btn.getAttribute('placeholder').catch(() => '');
        const cls = await btn.getAttribute('class').catch(() => '');

        if (lang.code === 'en') {
          const frenchWords = ['Rechercher', 'Connexion', 'Inscription', 'Langue', 'Location', 'Achat'];
          for (const fw of frenchWords) {
            if (text.trim() === fw || ariaLabel === fw || placeholder === fw) {
              hardcodedStrings.push({ language: lang.name, text: fw, element: `button/a`, className: cls });
            }
          }
        } else if (lang.code === 'ar') {
          // In Arabic, most UI should be Arabic script. Check for French/English only text
          const textTrim = text.trim();
          if (textTrim.length > 2 && !/[\u0600-\u06FF]/.test(textTrim) && !/^[0-9\s\W]+$/.test(textTrim)) {
            // Could be untranslated text - but be lenient with short/common words
            const likelyUntranslated = ['Rechercher', 'Search', 'Ville', 'City', 'Biens', 'Properties', 'Utilisateurs', 'Users', 'Langue', 'Language'];
            if (likelyUntranslated.some(w => textTrim.includes(w))) {
              hardcodedStrings.push({ language: lang.name, text: textTrim, element: `button/a`, className: cls });
            }
          }
        }
      }

      // Check placeholders
      const inputs = await page.locator('input, textarea, select').all();
      for (const input of inputs) {
        const placeholder = await input.getAttribute('placeholder').catch(() => '');
        if (placeholder) {
          if (lang.code === 'en' && ['Appartement, villa, riad moderne...', 'Toutes les villes', 'Mots-clés'].includes(placeholder)) {
            hardcodedStrings.push({ language: lang.name, text: placeholder, element: 'input/textarea', attribute: 'placeholder' });
          }
          if (lang.code === 'ar' && !/[\u0600-\u06FF]/.test(placeholder) && placeholder.length > 3) {
            hardcodedStrings.push({ language: lang.name, text: placeholder, element: 'input/textarea', attribute: 'placeholder' });
          }
        }
      }
    }

    // Deduplicate hardcoded strings
    const uniqueHardcoded = [];
    const seen = new Set();
    for (const item of hardcodedStrings) {
      const key = `${item.language}|${item.text}|${item.element}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueHardcoded.push(item);
      }
    }

    report.translation.issues = uniqueHardcoded;
    report.translation.status = uniqueHardcoded.length === 0 ? 'pass' : 'fail';
    console.log(`[TRANSLATION] Found ${uniqueHardcoded.length} potential hardcoded strings`);
  } catch (e) {
    report.translation.status = 'error';
    report.translation.issues.push({ severity: 'high', message: e.message });
  }

  // ========================
  // FILTER TEST
  // ========================
  try {
    console.log('[FILTERS] Starting filter tests...');
    await page.goto(`${BASE_URL}/home`, { waitUntil: 'networkidle' });
    await delay(1000);
    await screenshot(page, '07_filters_initial');
    report.filters.screenshots.push('07_filters_initial');

    // Capture network requests
    const networkLogs = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/') || request.url().includes('/properties')) {
        networkLogs.push({ type: 'request', url: request.url(), method: request.method() });
      }
    });
    page.on('response', async (response) => {
      if (response.url().includes('/api/') || response.url().includes('/properties')) {
        networkLogs.push({ type: 'response', url: response.url(), status: response.status() });
      }
    });

    // Open advanced filter panel
    const filterBtn = await page.locator('button:has(.lucide-sliders-horizontal), button:has-text("Filtres"), button:has-text("Filters"), [aria-label*="filtre" i]').first();
    try {
      await filterBtn.waitFor({ state: 'visible', timeout: 5000 });
      await filterBtn.click();
      await delay(800);
      await screenshot(page, '08_filters_panel_open');
      report.filters.screenshots.push('08_filters_panel_open');
    } catch (e) {
      report.filters.issues.push({ severity: 'high', message: 'Could not open filter panel: ' + e.message });
    }

    // Apply price filter (if available)
    try {
      const priceOptions = await page.locator('button, label').filter({ hasText: /DH|€|\$|price|prix/i }).all();
      if (priceOptions.length > 0) {
        await priceOptions[0].click();
        await delay(500);
        console.log('[FILTERS] Price filter applied');
      }
    } catch (e) {
      console.log('[FILTERS] Price filter not found or not clickable');
    }

    // Apply city filter
    try {
      const citySelect = await page.locator('select').filter({ hasText: /Casablanca|Rabat|Marrakech|Toutes/i }).first();
      const options = await citySelect.locator('option').all();
      if (options.length > 1) {
        const secondOption = options[1];
        const cityName = await secondOption.textContent();
        await citySelect.selectOption(cityName);
        await delay(500);
        console.log(`[FILTERS] City filter applied: ${cityName}`);
      }
    } catch (e) {
      console.log('[FILTERS] City filter select not found');
    }

    // Apply property type filter
    try {
      const typeButtons = await page.locator('button, label').filter({ hasText: /Appartement|Villa|Maison|Studio|Riad|Office/i }).all();
      if (typeButtons.length > 0) {
        await typeButtons[0].click();
        await delay(500);
        console.log('[FILTERS] Property type filter applied');
      }
    } catch (e) {
      console.log('[FILTERS] Property type filter not found');
    }

    // Apply bedrooms filter
    try {
      const bedButtons = await page.locator('button, label').filter({ hasText: /chambre|bedroom|bed|pièce/i }).all();
      if (bedButtons.length > 0) {
        await bedButtons[0].click();
        await delay(500);
        console.log('[FILTERS] Bedrooms filter applied');
      }
    } catch (e) {
      console.log('[FILTERS] Bedrooms filter not found');
    }

    // Click Apply button
    try {
      const applyBtn = await page.locator('button').filter({ hasText: /Appliquer|Apply|Search|Rechercher| Filtrer/i }).first();
      await applyBtn.click();
      await delay(1500);
      await screenshot(page, '09_filters_applied');
      report.filters.screenshots.push('09_filters_applied');
    } catch (e) {
      console.log('[FILTERS] Apply button not found, trying form submit');
    }

    // Check URL for filter params
    const currentUrl = page.url();
    console.log(`[FILTERS] URL after filters: ${currentUrl}`);
    report.filters.urlAfterApply = currentUrl;

    const hasFilterParams = currentUrl.includes('?') && (/city|price|type|bedrooms|filter/i.test(currentUrl) || currentUrl.includes('='));
    if (!hasFilterParams) {
      report.filters.issues.push({ severity: 'medium', message: `URL does not contain filter parameters: ${currentUrl}` });
    }

    // Check for duplicate filter state (look for multiple query string params with same key)
    if (currentUrl.includes('?')) {
      const urlObj = new URL(currentUrl);
      const keys = Array.from(urlObj.searchParams.keys());
      const duplicates = keys.filter((item, index) => keys.indexOf(item) !== index);
      if (duplicates.length > 0) {
        report.filters.issues.push({ severity: 'high', message: `Duplicate filter parameters in URL: ${duplicates.join(', ')}` });
      }
    }

    // Clear filters
    try {
      const resetBtn = await page.locator('button').filter({ hasText: /Réinitialiser|Reset|Clear|Effacer/i }).first();
      await resetBtn.click();
      await delay(1500);
      await screenshot(page, '10_filters_cleared');
      report.filters.screenshots.push('10_filters_cleared');

      const clearedUrl = page.url();
      report.filters.urlAfterClear = clearedUrl;
      if (clearedUrl.includes('?') && /city|price|type|bedrooms/i.test(clearedUrl)) {
        report.filters.issues.push({ severity: 'medium', message: `Filters not fully cleared from URL: ${clearedUrl}` });
      }
    } catch (e) {
      report.filters.issues.push({ severity: 'medium', message: 'Could not clear filters: ' + e.message });
    }

    report.filters.networkLogs = networkLogs;
    report.filters.status = report.filters.issues.length === 0 ? 'pass' : 'fail';
  } catch (e) {
    report.filters.status = 'error';
    report.filters.issues.push({ severity: 'high', message: e.message });
  }

  await browser.close();

  // ========================
  // WRITE REPORT
  // ========================
  const reportPath = path.join(REPORT_DIR, 'audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Markdown report
  const md = `# MAROC-LOC Frontend Audit Report

**Date:** ${new Date().toISOString()}
**URL:** ${BASE_URL}

---

## 1. Dark/Light Mode Toggle

**Status:** ${report.darkMode.status.toUpperCase()}
**Screenshots:** ${report.darkMode.screenshots.join(', ')}

${report.darkMode.issues.length > 0 ? '### Issues\n' + report.darkMode.issues.map(i => `- **${i.severity.toUpperCase()}**: ${i.message}${i.details ? `\n  \`\`\`json\n  ${JSON.stringify(i.details.slice(0, 5), null, 2)}\n  \`\`\`` : ''}`).join('\n') : '✅ No issues found.'}

---

## 2. Translation (i18n) Completeness

**Status:** ${report.translation.status.toUpperCase()}
**Screenshots:** ${report.translation.screenshots.join(', ')}

${report.translation.issues.length > 0 ? '### Hardcoded / Untranslated Strings\n' + report.translation.issues.map(i => `- **${i.language}**: \`${i.text}\` on \`${i.element || i.className || 'unknown'}\`${i.issue ? ` — *${i.issue}*` : ''}`).join('\n') : '✅ No hardcoded strings detected.'}

---

## 3. Filter System Functionality

**Status:** ${report.filters.status.toUpperCase()}
**Screenshots:** ${report.filters.screenshots.join(', ')}

**URL after apply:** \`${report.filters.urlAfterApply || 'N/A'}\`
**URL after clear:** \`${report.filters.urlAfterClear || 'N/A'}\`

${report.filters.issues.length > 0 ? '### Issues\n' + report.filters.issues.map(i => `- **${i.severity.toUpperCase()}**: ${i.message}`).join('\n') : '✅ No issues found.'}

### Network Logs (Filter-related)
${report.filters.networkLogs?.length > 0 ? report.filters.networkLogs.map(l => `- [${l.type.toUpperCase()}] ${l.method || ''} ${l.url} ${l.status || ''}`).join('\n') : 'No filter-related network calls captured.'}

---

*End of report.*
`;

  const mdPath = path.join(REPORT_DIR, 'audit-report.md');
  fs.writeFileSync(mdPath, md);

  console.log('\n✅ Audit complete!');
  console.log(`Report JSON: ${reportPath}`);
  console.log(`Report MD:   ${mdPath}`);
  console.log(`Screenshots: ${SCREENSHOTS_DIR}`);

  return report;
}

runAudit().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
