const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const REPORT_DIR = path.resolve('test_results');
const SCREENSHOT_DIR = path.join(REPORT_DIR, 'image_audit_screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const collectImages = async (page) => {
  return page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    return imgs.map((img, index) => {
      let parent = img.parentElement;
      let parentInfo = { tag: null, className: null, componentName: null };
      for (let i = 0; i < 4 && parent; i++) {
        const tag = parent.tagName;
        const cls = parent.className || '';
        const testId = parent.getAttribute('data-testid');
        if (testId) {
          parentInfo.componentName = testId;
        }
        if (!parentInfo.tag) {
          parentInfo.tag = tag;
          parentInfo.className = cls;
        }
        parent = parent.parentElement;
      }
      return {
        index,
        src: img.currentSrc || img.src,
        alt: img.alt,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        complete: img.complete,
        classList: Array.from(img.classList),
        parentTag: parentInfo.tag,
        parentClass: parentInfo.className,
        parentComponent: parentInfo.componentName,
        isFallback: (img.currentSrc || img.src).includes('no-image.svg'),
        isOpacityZero: Array.from(img.classList).includes('opacity-0'),
        boundingRect: {
          width: img.getBoundingClientRect().width,
          height: img.getBoundingClientRect().height,
          top: img.getBoundingClientRect().top,
          left: img.getBoundingClientRect().left,
        },
      };
    });
  });
};

const checkFileOnDisk = (src) => {
  if (!src || src.startsWith('data:')) return null;
  try {
    const url = new URL(src);
    const pathname = url.pathname;
    let relativePath = pathname;
    if (relativePath.startsWith('/api/uploads/')) {
      relativePath = relativePath.replace('/api/uploads/', 'backend/uploads/');
    } else if (relativePath.startsWith('/uploads/')) {
      relativePath = relativePath.replace('/uploads/', 'backend/uploads/');
    } else if (relativePath.startsWith('/images/')) {
      relativePath = relativePath.replace('/images/', 'frontend/public/images/');
    } else if (relativePath.startsWith('/video/')) {
      relativePath = relativePath.replace('/video/', 'frontend/public/video/');
    } else if (relativePath.startsWith('/')) {
      relativePath = 'frontend/public' + relativePath;
    } else {
      return null;
    }
    const fullPath = path.resolve(relativePath);
    return fs.existsSync(fullPath);
  } catch (e) {
    return null;
  }
};

const resolveDiskPath = (src) => {
  if (!src || src.startsWith('data:')) return null;
  try {
    const url = new URL(src);
    const pathname = url.pathname;
    let relativePath = pathname;
    if (relativePath.startsWith('/api/uploads/')) {
      relativePath = relativePath.replace('/api/uploads/', 'backend/uploads/');
    } else if (relativePath.startsWith('/uploads/')) {
      relativePath = relativePath.replace('/uploads/', 'backend/uploads/');
    } else if (relativePath.startsWith('/images/')) {
      relativePath = relativePath.replace('/images/', 'frontend/public/images/');
    } else if (relativePath.startsWith('/video/')) {
      relativePath = relativePath.replace('/video/', 'frontend/public/video/');
    } else if (relativePath.startsWith('/')) {
      relativePath = 'frontend/public' + relativePath;
    } else {
      return null;
    }
    return path.resolve(relativePath);
  } catch (e) {
    return null;
  }
};

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/c/Program Files/Google/Chrome/Application/chrome.exe',
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  const report = {
    timestamp: new Date().toISOString(),
    pages: [],
    brokenImages: [],
    fallbackImages: [],
    opacityZeroImages: [],
    diskCheck: [],
    summary: {},
  };

  const auditPage = async (pageName, url) => {
    console.log('Auditing ' + pageName + ' at ' + url);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    const images = await collectImages(page);
    return { pageName, url, images };
  };

  const homeInitial = await auditPage('home_initial', BASE_URL);
  report.pages.push(homeInitial);

  console.log('Waiting 5 seconds for lazy-loaded images...');
  await page.waitForTimeout(5000);
  const homeAfterWait = { pageName: 'home_after_wait', url: page.url(), images: await collectImages(page) };
  report.pages.push(homeAfterWait);

  const propertyPage = await auditPage('property_details', BASE_URL + '/property/1');
  report.pages.push(propertyPage);

  console.log('Navigating to search results...');
  await page.goto(BASE_URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  try {
    await page.waitForSelector('section#categories button', { timeout: 8000 });
    const buttons = await page.$$('section#categories button');
    if (buttons.length > 0) {
      await buttons[0].click();
      console.log('Clicked first category');
      await page.waitForTimeout(3000);
      await page.waitForLoadState('networkidle');
    }
  } catch (e) {
    console.log('Category click failed: ' + e.message);
  }
  const searchResults = { pageName: 'search_results', url: page.url(), images: await collectImages(page) };
  report.pages.push(searchResults);

  const allImages = report.pages.flatMap(p => p.images.map(img => ({ ...img, page: p.pageName, pageUrl: p.url })));

  report.brokenImages = allImages
    .filter(img => img.naturalWidth === 0 || img.complete === false)
    .map(img => ({
      src: img.src,
      alt: img.alt,
      page: img.page,
      pageUrl: img.pageUrl,
      parentTag: img.parentTag,
      parentClass: img.parentClass,
      parentComponent: img.parentComponent,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      complete: img.complete,
      isFallback: img.isFallback,
      isOpacityZero: img.isOpacityZero,
      fileExists: checkFileOnDisk(img.src),
      diskPath: resolveDiskPath(img.src),
    }));

  report.fallbackImages = allImages
    .filter(img => img.isFallback)
    .map(img => ({
      src: img.src,
      alt: img.alt,
      page: img.page,
      pageUrl: img.pageUrl,
      parentTag: img.parentTag,
      parentClass: img.parentClass,
    }));

  report.opacityZeroImages = allImages
    .filter(img => img.isOpacityZero)
    .map(img => ({
      src: img.src,
      alt: img.alt,
      page: img.page,
      pageUrl: img.pageUrl,
      complete: img.complete,
      naturalWidth: img.naturalWidth,
      boundingRect: img.boundingRect,
    }));

  const uniqueSrcs = [...new Set(allImages.map(img => img.src).filter(s => s && !s.startsWith('data:')))];
  report.diskCheck = uniqueSrcs.map(src => ({
    src,
    exists: checkFileOnDisk(src),
    diskPath: resolveDiskPath(src),
  }));

  for (const p of report.pages) {
    const hasBroken = p.images.some(img => img.naturalWidth === 0 || img.complete === false);
    if (hasBroken) {
      const screenshotPath = path.join(SCREENSHOT_DIR, p.pageName + '_broken.png');
      await page.goto(p.url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      p.screenshot = screenshotPath;
      console.log('Screenshot saved: ' + screenshotPath);
    }
  }

  report.summary = {
    totalImagesAudited: allImages.length,
    brokenImagesCount: report.brokenImages.length,
    fallbackImagesCount: report.fallbackImages.length,
    opacityZeroImagesCount: report.opacityZeroImages.length,
    pagesAudited: report.pages.length,
    uniqueSrcsChecked: uniqueSrcs.length,
    filesMissingOnDisk: re
