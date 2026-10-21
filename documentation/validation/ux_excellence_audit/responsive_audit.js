const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3456';
const OUTPUT_DIR = path.join(__dirname, 'responsive');

const homeViewports = [
  { name: 'iPhone_SE', width: 320, height: 568 },
  { name: 'iPhone_8', width: 375, height: 667 },
  { name: 'iPhone_13', width: 390, height: 844 },
  { name: 'iPad', width: 768, height: 1024 },
  { name: 'iPad_landscape', width: 1024, height: 768 },
  { name: 'laptop', width: 1280, height: 720 },
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'full_HD', width: 1920, height: 1080 },
];

const extraPages = [
  { path: '/property/1', name: 'property_detail' },
  { path: '/search?city=Rabat', name: 'search_rabat' },
];

const extraViewports = [
  { name: 'iPhone_8', width: 375, height: 667 },
  { name: 'iPad', width: 768, height: 1024 },
];

async function runAudit() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const results = [];

  // Homepage responsive audit
  for (const vp of homeViewports) {
    const page = await context.newPage({ viewport: { width: vp.width, height: vp.height } });
    console.log(`Testing homepage at ${vp.name} (${vp.width}x${vp.height})...`);

    try {
      await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);

      const screenshotPath = path.join(OUTPUT_DIR, `homepage_${vp.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });

      const audit = await page.evaluate(() => {
        const docWidth = document.documentElement.scrollWidth;
        const bodyWidth = document.body.scrollWidth;
        const vpWidth = window.innerWidth;

        const overflowX = docWidth > vpWidth || bodyWidth > vpWidth;

        const allElements = Array.from(document.querySelectorAll('*'));
        let offScreenButtons = 0;
        let truncatedText = 0;
        let cardsBreaking = 0;
        let imagesDistorted = 0;
        let navbarIssues = 0;
        let filterOverflow = 0;

        allElements.forEach(el => {
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);

          // Buttons off-screen
          if (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button') {
            if (rect.right > vpWidth + 5 || rect.left < -5) {
              offScreenButtons++;
            }
          }

          // Text truncation detection
          if (el.children.length === 0 && el.textContent.trim().length > 0) {
            if (rect.width > 0 && el.scrollWidth > rect.width + 2) {
              truncatedText++;
            }
          }

          // Images distortion
          if (el.tagName === 'IMG') {
            const naturalRatio = el.naturalWidth / el.naturalHeight;
            const displayRatio = el.width / el.height;
            if (naturalRatio > 0 && displayRatio > 0) {
              const ratioDiff = Math.abs(naturalRatio - displayRatio) / naturalRatio;
              if (ratioDiff > 0.2 && el.width > 50 && el.height > 50) {
                imagesDistorted++;
              }
            }
          }
        });

        // Cards breaking out of grid
        document.querySelectorAll('[class*="card"], [class*="Card"]').forEach(card => {
          const rect = card.getBoundingClientRect();
          if (rect.right > vpWidth + 5 || rect.left < -5) {
            cardsBreaking++;
          }
        });

        // Navbar issues
        const navbars = document.querySelectorAll('nav, [class*="navbar"], [class*="Navbar"], header');
        navbars.forEach(nav => {
          const rect = nav.getBoundingClientRect();
          if (rect.width > vpWidth + 5) {
            navbarIssues++;
          }
        });

        // Filter panel overflow
        const filters = document.querySelectorAll('[class*="filter"], [class*="Filter"]');
        filters.forEach(filter => {
          const rect = filter.getBoundingClientRect();
          if (rect.right > vpWidth + 5) {
            filterOverflow++;
          }
        });

        return {
          docWidth,
          bodyWidth,
          vpWidth,
          overflowX,
          offScreenButtons,
          truncatedText,
          cardsBreaking,
          imagesDistorted,
          navbarIssues,
          filterOverflow,
        };
      });

      results.push({
        page: 'homepage',
        viewport: vp.name,
        size: `${vp.width}x${vp.height}`,
        ...audit,
        screenshot: screenshotPath,
      });
    } catch (e) {
      results.push({
        page: 'homepage',
        viewport: vp.name,
        size: `${vp.width}x${vp.height}`,
        error: e.message,
      });
    }

    await page.close();
  }

  // Extra pages audit
  for (const ep of extraPages) {
    for (const vp of extraViewports) {
      const page = await context.newPage({ viewport: { width: vp.width, height: vp.height } });
      console.log(`Testing ${ep.path} at ${vp.name} (${vp.width}x${vp.height})...`);

      try {
        await page.goto(`${BASE_URL}${ep.path}`, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(2000);

        const screenshotPath = path.join(OUTPUT_DIR, `${ep.name}_${vp.name}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });

        const audit = await page.evaluate(() => {
          const docWidth = document.documentElement.scrollWidth;
          const bodyWidth = document.body.scrollWidth;
          const vpWidth = window.innerWidth;
          const overflowX = docWidth > vpWidth || bodyWidth > vpWidth;

          const allElements = Array.from(document.querySelectorAll('*'));
          let offScreenButtons = 0;
          let truncatedText = 0;
          let cardsBreaking = 0;
          let imagesDistorted = 0;
          let navbarIssues = 0;
          let filterOverflow = 0;

          allElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button') {
              if (rect.right > vpWidth + 5 || rect.left < -5) offScreenButtons++;
            }
            if (el.children.length === 0 && el.textContent.trim().length > 0) {
              if (rect.width > 0 && el.scrollWidth > rect.width + 2) truncatedText++;
            }
            if (el.tagName === 'IMG') {
              const naturalRatio = el.naturalWidth / el.naturalHeight;
              const displayRatio = el.width / el.height;
              if (naturalRatio > 0 && displayRatio > 0) {
                const ratioDiff = Math.abs(naturalRatio - displayRatio) / naturalRatio;
                if (ratioDiff > 0.2 && el.width > 50 && el.height > 50) imagesDistorted++;
              }
            }
          });

          document.querySelectorAll('[class*="card"], [class*="Card"]').forEach(card => {
            const rect = card.getBoundingClientRect();
            if (rect.right > vpWidth + 5 || rect.left < -5) cardsBreaking++;
          });

          const navbars = document.querySelectorAll('nav, [class*="navbar"], [class*="Navbar"], header');
          navbars.forEach(nav => {
            const rect = nav.getBoundingClientRect();
            if (rect.width > vpWidth + 5) navbarIssues++;
          });

          const filters = document.querySelectorAll('[class*="filter"], [class*="Filter"]');
          filters.forEach(filter => {
            const rect = filter.getBoundingClientRect();
            if (rect.right > vpWidth + 5) filterOverflow++;
          });

          return { docWidth, bodyWidth, vpWidth, overflowX, offScreenButtons, truncatedText, cardsBreaking, imagesDistorted, navbarIssues, filterOverflow };
        });

        results.push({
          page: ep.name,
          viewport: vp.name,
          size: `${vp.width}x${vp.height}`,
          ...audit,
          screenshot: screenshotPath,
        });
      } catch (e) {
        results.push({
          page: ep.name,
          viewport: vp.name,
          size: `${vp.width}x${vp.height}`,
          error: e.message,
        });
      }

      await page.close();
    }
  }

  await browser.close();

  // Save JSON report
  fs.writeFileSync(path.join(OUTPUT_DIR, 'responsive_audit_data.json'), JSON.stringify(results, null, 2));

  // Generate markdown report
  let md = `# MAROC-LOC Responsive Audit Report\n\nGenerated: ${new Date().toISOString()}\n\n`;
  md += `## Summary\n\n`;
  md += `| Page | Viewport | Overflow | Off-screen Buttons | Truncated Text | Card Breaks | Image Distortion | Navbar Issues | Filter Overflow |\n`;
  md += `|------|----------|----------|-------------------|----------------|-------------|------------------|---------------|-----------------|\n`;

  for (const r of results) {
    if (r.error) {
      md += `| ${r.page} | ${r.viewport} | ERROR: ${r.error} | - | - | - | - | - | - |\n`;
    } else {
      md += `| ${r.page} | ${r.viewport} (${r.size}) | ${r.overflowX ? '⚠️ YES' : '✅ No'} | ${r.offScreenButtons > 0 ? '⚠️ ' + r.offScreenButtons : '✅ 0'} | ${r.truncatedText > 0 ? '⚠️ ' + r.truncatedText : '✅ 0'} | ${r.cardsBreaking > 0 ? '⚠️ ' + r.cardsBreaking : '✅ 0'} | ${r.imagesDistorted > 0 ? '⚠️ ' + r.imagesDistorted : '✅ 0'} | ${r.navbarIssues > 0 ? '⚠️ ' + r.navbarIssues : '✅ 0'} | ${r.filterOverflow > 0 ? '⚠️ ' + r.filterOverflow : '✅ 0'} |\n`;
    }
  }

  md += `\n## Detailed Findings\n\n`;
  for (const r of results) {
    md += `### ${r.page} — ${r.viewport} (${r.size})\n\n`;
    if (r.error) {
      md += `- **Error**: ${r.error}\n`;
    } else {
      md += `- **Horizontal Overflow**: ${r.overflowX ? '⚠️ DETECTED' : '✅ None'} (doc: ${r.docWidth}px, body: ${r.bodyWidth}px, viewport: ${r.vpWidth}px)\n`;
      md += `- **Off-screen Buttons**: ${r.offScreenButtons}\n`;
      md += `- **Truncated Text Elements**: ${r.truncatedText}\n`;
      md += `- **Cards Breaking Grid**: ${r.cardsBreaking}\n`;
      md += `- **Image Distortions**: ${r.imagesDistorted}\n`;
      md += `- **Navbar Issues**: ${r.navbarIssues}\n`;
      md += `- **Filter Panel Overflow**: ${r.filterOverflow}\n`;
      md += `- **Screenshot**: \`${r.screenshot}\`\n`;
    }
    md += `\n`;
  }

  fs.writeFileSync(path.join(OUTPUT_DIR, 'RESPONSIVE_AUDIT.md'), md);
  console.log('Responsive audit complete. Reports saved to', OUTPUT_DIR);
}

runAudit().catch(console.error);
