#!/usr/bin/env node

import lighthouse from 'lighthouse';
import chromeLauncher from 'chrome-launcher';
import fs from 'fs/promises';

async function runLighthouseAudit() {
  // Start Chrome
  const chrome = await chromeLauncher.launch({chromeFlags: ['--headless']});
  const options = {
    logLevel: 'info',
    output: 'html',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    port: chrome.port,
  };

  // Run Lighthouse audit
  const runnerResult = await lighthouse('http://localhost:5173', options);

  // Save report
  const reportHtml = runnerResult.report;
  await fs.writeFile('lighthouse-report.html', reportHtml);
  
  // Output scores
  console.log('Lighthouse Report Generated');
  console.log('Performance Score:', runnerResult.lhr.categories.performance.score * 100);
  console.log('Accessibility Score:', runnerResult.lhr.categories.accessibility.score * 100);
  console.log('Best Practices Score:', runnerResult.lhr.categories['best-practices'].score * 100);
  console.log('SEO Score:', runnerResult.lhr.categories.seo.score * 100);

  // Kill Chrome
  await chrome.kill();
}

runLighthouseAudit().catch(err => {
  console.error('Lighthouse audit failed:', err);
  process.exit(1);
});