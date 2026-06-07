'use strict';
// Renders the HTML report to a PDF using the Playwright chromium browser.
// Usage: node scripts/generate-pdf.js <input.html> <output.pdf>

const { chromium } = require('@playwright/test');
const path = require('path');
const fs   = require('fs');

async function main() {
  const htmlFile = path.resolve(process.argv[2] || 'test-results/email-report.html');
  const pdfFile  = path.resolve(process.argv[3] || 'test-results/playwright-report.pdf');

  if (!fs.existsSync(htmlFile)) {
    console.error('HTML file not found:', htmlFile);
    process.exit(1);
  }

  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page    = await browser.newPage();

  await page.goto(`file://${htmlFile}`, { waitUntil: 'networkidle' });

  fs.mkdirSync(path.dirname(pdfFile), { recursive: true });

  await page.pdf({
    path:            pdfFile,
    format:          'A4',
    printBackground: true,
    margin:          { top: '12mm', right: '12mm', bottom: '12mm', left: '12mm' },
  });

  await browser.close();
  console.log('✅ PDF report generated:', pdfFile);
}

main().catch(e => {
  console.error('PDF generation failed:', e.message);
  process.exit(1);
});
