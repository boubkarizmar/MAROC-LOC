const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3456';
const OUTPUT_DIR = path.join(__dirname, 'performance');

async function runAudit() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const results = [];

  const pagesToTest = [
    { path: '/', name: 'homepage' },
    { path: '/property/1', name: 'property_detail' },
    { path: '/search?city=Rabat', name: 'search_rabat' },
  ];

  for (const tp of pagesToTest) {
    const page = await context.newPage();
    console.log(`Performance testing ${tp.name}...`);

    try {
      // Navigate and wait for idle
      await page.goto(`${BASE_URL}${tp.path}`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(3000);

      // Measure LCP
      const lcp = await page.evaluate(() => {
        return new Promise((resolve) => {
          let lastEntry = null;
          const observer = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            if (entries.length > 0) {
              lastEntry = entries[entries.length - 1].startTime;
            }
          });
          observer.observe({ entryTypes: ['largest-contentful-paint'] });
          setTimeout(() => {
            observer.disconnect();
            resolve(lastEntry);
          }, 3000);
        });
      });

      // Measure CLS
      const cls = await page.evaluate(() => {
        return new Promise((resolve) => {
          let cls = 0;
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!entry.hadRecentInput) cls += entry.value;
            }
          });
          observer.observe({ entryTypes: ['layout-shift'] });
          setTimeout(() => {
            observer.disconnect();
            resolve(cls);
          }, 5000);
        });
      });

      // Measure FID polyfill (using first-input if available)
      const fid = await page.evaluate(() => {
        return new Promise((resolve) => {
          let fidValue = null;
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.processingStart && entry.startTime) {
                fidValue = entry.processingStart - entry.startTime;
              }
            }
          });
          observer.observe({ entryTypes: ['first-input'] });
          setTimeout(() => {
            observer.disconnect();
            resolve(fidValue);
          }, 5000);
        });
      });

      // Image sizes audit
      const images = await page.evaluate(() => {
        return Array.from(document.images).map(img => ({
          src: img.src,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          displayWidth: img.width,
          displayHeight: img.height,
          oversized: img.naturalWidth > img.width * 2 || img.naturalHeight > img.height * 2,
        }));
      });

      // Resource timing
      const resources = await page.evaluate(() => {
        return performance.getEntriesByType('resource').map(r => ({
          name: r.name,
          type: r.initiatorType,
          duration: r.duration,
          transferSize: r.transferSize,
        }));
      });

      // Core Web Vitals via web-vitals style metrics
      const paintMetrics = await page.evaluate(() => {
        const fp = performance.getEntriesByName('first-paint')[0]?.startTime;
        const fcp = performance.getEntriesByName('first-contentful-paint')[0]?.startTime;
        const nav = performance.getEntriesByType('navigation')[0];
        return {
          firstPaint: fp,
          firstContentfulPaint: fcp,
          domContentLoaded: nav?.domContentLoadedEventEnd,
          loadComplete: nav?.loadEventEnd,
          ttfb: nav?.responseStart,
        };
      });

      results.push({
        page: tp.name,
        url: tp.path,
        lcp,
        cls,
        fid,
        images,
        resources: resources.slice(0, 50),
        paintMetrics,
      });
    } catch (e) {
      results.push({
        page: tp.name,
        url: tp.path,
        error: e.message,
      });
    }

    await page.close();
  }

  await browser.close();

  // Save JSON
  fs.writeFileSync(path.join(OUTPUT_DIR, 'performance_audit_data.json'), JSON.stringify(results, null, 2));

  // Generate markdown report
  let md = `# MAROC-LOC Performance UX Audit Report\n\nGenerated: ${new Date().toISOString()}\n\n`;
  md += `## Core Web Vitals Summary\n\n`;
  md += `| Page | LCP | CLS | FID | FCP | TTFB |\n`;
  md += `|------|-----|-----|-----|-----|------|\n`;

  for (const r of results) {
    if (r.error) {
      md += `| ${r.page} | ERROR | - | - | - | - |\n`;
    } else {
      const lcpStr = r.lcp ? `${(r.lcp / 1000).toFixed(2)}s` : 'N/A';
      const clsStr = r.cls !== null ? r.cls.toFixed(4) : 'N/A';
      const fidStr = r.fid ? `${r.fid.toFixed(1)}ms` : 'N/A';
      const fcpStr = r.paintMetrics?.firstContentfulPaint ? `${(r.paintMetrics.firstContentfulPaint / 1000).toFixed(2)}s` : 'N/A';
      const ttfbStr = r.paintMetrics?.ttfb ? `${(r.paintMetrics.ttfb / 1000).toFixed(2)}s` : 'N/A';
      md += `| ${r.page} | ${lcpStr} | ${clsStr} | ${fidStr} | ${fcpStr} | ${ttfbStr} |\n`;
    }
  }

  md += `\n## Performance Budget Targets\n\n`;
  md += `- **LCP (Largest Contentful Paint)**: < 2.5s ✅ Good, < 4.0s ⚠️ Needs Improvement\n`;
  md += `- **CLS (Cumulative Layout Shift)**: < 0.1 ✅ Good, < 0.25 ⚠️ Needs Improvement\n`;
  md += `- **FID (First Input Delay)**: < 100ms ✅ Good, < 300ms ⚠️ Needs Improvement\n`;
  md += `- **FCP (First Contentful Paint)**: < 1.8s ✅ Good\n`;
  md += `- **TTFB (Time to First Byte)**: < 0.6s ✅ Good\n\n`;

  for (const r of results) {
    md += `## ${r.page}\n\n`;
    if (r.error) {
      md += `**Error**: ${r.error}\n\n`;
      continue;
    }

    md += `### Timing Metrics\n\n`;
    md += `- **LCP**: ${r.lcp ? `${(r.lcp / 1000).toFixed(2)}s` : 'N/A'} ${r.lcp && r.lcp > 2500 ? '⚠️ EXCEEDS 2.5s BUDGET' : (r.lcp && r.lcp > 4000 ? '🔴 POOR' : '✅ Good')}\n`;
    md += `- **CLS**: ${r.cls !== null ? r.cls.toFixed(4) : 'N/A'} ${r.cls && r.cls > 0.1 ? '⚠️ EXCEEDS 0.1 BUDGET' : (r.cls && r.cls > 0.25 ? '🔴 POOR' : '✅ Good')}\n`;
    md += `- **FID**: ${r.fid ? `${r.fid.toFixed(1)}ms` : 'N/A (no interaction)'} ${r.fid && r.fid > 100 ? '⚠️ EXCEEDS 100ms BUDGET' : ''}\n`;
    md += `- **FCP**: ${r.paintMetrics?.firstContentfulPaint ? `${(r.paintMetrics.firstContentfulPaint / 1000).toFixed(2)}s` : 'N/A'}\n`;
    md += `- **First Paint**: ${r.paintMetrics?.firstPaint ? `${(r.paintMetrics.firstPaint / 1000).toFixed(2)}s` : 'N/A'}\n`;
    md += `- **DOM Content Loaded**: ${r.paintMetrics?.domContentLoaded ? `${(r.paintMetrics.domContentLoaded / 1000).toFixed(2)}s` : 'N/A'}\n`;
    md += `- **Load Complete**: ${r.paintMetrics?.loadComplete ? `${(r.paintMetrics.loadComplete / 1000).toFixed(2)}s` : 'N/A'}\n`;
    md += `- **TTFB**: ${r.paintMetrics?.ttfb ? `${(r.paintMetrics.ttfb / 1000).toFixed(2)}s` : 'N/A'}\n\n`;

    md += `### Image Audit\n\n`;
    const oversizedImages = r.images.filter(img => img.oversized);
    md += `Total images: ${r.images.length}, Oversized: ${oversizedImages.length}\n\n`;
    if (oversizedImages.length > 0) {
      md += `| Src | Natural | Display | Ratio |\n`;
      md += `|-----|---------|---------|-------|\n`;
      for (const img of oversizedImages.slice(0, 10)) {
        const ratioW = (img.naturalWidth / img.displayWidth).toFixed(1);
        const ratioH = (img.naturalHeight / img.displayHeight).toFixed(1);
        const shortSrc = img.src.length > 60 ? img.src.slice(-60) : img.src;
        md += `| ${shortSrc} | ${img.naturalWidth}x${img.naturalHeight} | ${img.displayWidth}x${img.displayHeight} | ${ratioW}x / ${ratioH}x |\n`;
      }
    }
    md += `\n`;

    md += `### Resource Timing (Top by duration)\n\n`;
    const sortedResources = r.resources.sort((a, b) => b.duration - a.duration).slice(0, 10);
    md += `| Resource | Type | Duration | Transfer Size |\n`;
    md += `|----------|------|----------|---------------|\n`;
    for (const res of sortedResources) {
      const shortName = res.name.length > 60 ? '...' + res.name.slice(-60) : res.name;
      md += `| ${shortName} | ${res.type} | ${res.duration.toFixed(0)}ms | ${res.transferSize}B |\n`;
    }
    md += `\n`;
  }

  fs.writeFileSync(path.join(OUTPUT_DIR, 'PERFORMANCE_AUDIT.md'), md);
  console.log('Performance audit complete. Reports saved to', OUTPUT_DIR);
}

runAudit().catch(console.error);
