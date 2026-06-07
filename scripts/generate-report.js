'use strict';
// Parses Playwright merged JSON results and:
//   1. Writes a detailed markdown table to $GITHUB_STEP_SUMMARY
//   2. Writes a clean HTML report for email + PDF conversion
const fs   = require('fs');
const path = require('path');

const resultsFile = process.argv[2] || 'test-results/results.json';
const htmlOutput  = process.argv[3] || 'test-results/email-report.html';

// ── helpers ──────────────────────────────────────────────────────────────────

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function mdEsc(s) {
  return String(s || '').replace(/\|/g, '\\|');
}

// ── load results ─────────────────────────────────────────────────────────────

let data = { suites: [], stats: {} };
if (fs.existsSync(resultsFile)) {
  try {
    data = JSON.parse(fs.readFileSync(resultsFile, 'utf8'));
  } catch (e) {
    console.warn('Warning: could not parse results file:', e.message);
  }
} else {
  console.warn('Warning: results file not found:', resultsFile);
}

// ── recursive test collector ──────────────────────────────────────────────────
// Playwright JSON: top-level suites = browser projects
// Each project suite -> file suites -> (optional describe suites) -> specs

function collectTests(suites, projectName, out, inheritedFile) {
  for (const suite of suites || []) {
    const file = suite.file || inheritedFile || suite.title || '';
    for (const spec of suite.specs || []) {
      for (const test of spec.tests || []) {
        const firstResult = (test.results || [])[0] || {};
        const errorMsg    = (test.results || [])
          .map(r => r.error && r.error.message)
          .filter(Boolean)[0] || null;
        out.push({
          project:  projectName,
          file:     spec.file || file,
          title:    spec.title,
          status:   test.status,           // passed | failed | flaky | skipped
          duration: firstResult.duration || 0,
          error:    errorMsg,
        });
      }
    }
    collectTests(suite.suites || [], projectName, out, file);
  }
}

// ── build per-project stats ───────────────────────────────────────────────────

const allTests = [];
const projects = {};   // { chromium: { tests, total, passed, failed, flaky, skipped, passRate } }

for (const topSuite of data.suites || []) {
  const name  = topSuite.title;
  const tests = [];
  collectTests(topSuite.suites || [], name, tests, '');
  allTests.push(...tests);

  const isFail = t => t.status === 'failed' || t.status === 'unexpected';
  const passed  = tests.filter(t => t.status === 'passed').length;
  const failed  = tests.filter(isFail).length;
  const flaky   = tests.filter(t => t.status === 'flaky').length;
  const skipped = tests.filter(t => t.status === 'skipped').length;
  const total   = tests.length;

  projects[name] = {
    tests, total, passed, failed, flaky, skipped,
    passRate: total > 0 ? ((passed / total) * 100).toFixed(1) : '0.0',
  };
}

const projectNames = Object.keys(projects);
const totalAll     = allTests.length;
const totalPassed  = allTests.filter(t => t.status === 'passed').length;
const totalFailed  = allTests.filter(t => t.status === 'failed' || t.status === 'unexpected').length;
const overallRate  = totalAll > 0 ? ((totalPassed / totalAll) * 100).toFixed(1) : '0.0';

// ── cross-browser test map  (key = "file::title") ────────────────────────────

const testMap = new Map();
for (const t of allTests) {
  const key = `${t.file}::${t.title}`;
  if (!testMap.has(key)) testMap.set(key, { file: t.file, title: t.title });
  testMap.get(key)[t.project] = { status: t.status, error: t.error };
}
const allEntries = [...testMap.values()];

// ── environment ───────────────────────────────────────────────────────────────

const branch  = process.env.GITHUB_REF_NAME  || 'N/A';
const sha     = (process.env.GITHUB_SHA      || 'N/A').substring(0, 8);
const runNum  = process.env.GITHUB_RUN_NUMBER || 'N/A';
const runId   = process.env.GITHUB_RUN_ID    || '';
const repo    = process.env.GITHUB_REPOSITORY || '';
const runUrl  = repo ? `https://github.com/${repo}/actions/runs/${runId}` : '#';
const nowStr  = new Date().toUTCString();

// ── STATUS helpers ────────────────────────────────────────────────────────────

const STATUS_MD = {
  passed:     '✅',
  failed:     '❌',
  unexpected: '❌',
  flaky:      '⚠️',
  skipped:    '⏭️',
};

const STATUS_HTML = {
  passed:     '<span style="color:#16a34a;font-weight:700">✅ Pass</span>',
  failed:     '<span style="color:#dc2626;font-weight:700">❌ Fail</span>',
  unexpected: '<span style="color:#dc2626;font-weight:700">❌ Fail</span>',
  flaky:      '<span style="color:#d97706;font-weight:700">⚠️ Flaky</span>',
  skipped:    '<span style="color:#94a3b8">⏭️ Skip</span>',
};

function browserLabel(name) {
  if (name === 'chromium') return '🌐 Chrome';
  if (name === 'webkit')   return '🧭 Safari';
  return name;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 1.  GITHUB STEP SUMMARY
// ═══════════════════════════════════════════════════════════════════════════════

const summaryFile = process.env.GITHUB_STEP_SUMMARY;
if (summaryFile) {
  const L = [];

  L.push('# 🎭 Playwright Test Execution Report');
  L.push('');
  L.push(`> **Branch:** \`${branch}\` &nbsp;·&nbsp; **Commit:** \`${sha}\` &nbsp;·&nbsp; **Run:** [#${runNum}](${runUrl})`);
  L.push('');

  const headline = totalFailed === 0
    ? `✅ ALL PASSED — ${overallRate}% (${totalPassed}/${totalAll})`
    : `❌ ${totalFailed} FAILED — ${overallRate}% (${totalPassed}/${totalAll})`;
  L.push(`### ${headline}`);
  L.push('');
  L.push('---');
  L.push('');

  // ── Browser summary table ──
  L.push('## 📊 Results by Browser');
  L.push('');
  L.push('| Browser | Total | ✅ Passed | ❌ Failed | ⚠️ Flaky | ⏭️ Skipped | Pass Rate |');
  L.push('|---------|------:|----------:|----------:|---------:|-----------:|----------:|');
  for (const [name, p] of Object.entries(projects)) {
    L.push(`| ${browserLabel(name)} | ${p.total} | **${p.passed}** | **${p.failed}** | ${p.flaky} | ${p.skipped} | **${p.passRate}%** |`);
  }
  L.push('');

  // ── Failed tests detail ──
  if (totalFailed > 0) {
    L.push('---');
    L.push('');
    L.push('## ❌ Failed Tests');
    L.push('');
    for (const [name, p] of Object.entries(projects)) {
      const failed = p.tests.filter(t => t.status === 'failed' || t.status === 'unexpected');
      if (!failed.length) continue;
      L.push(`### ${browserLabel(name)} — ${failed.length} failed`);
      L.push('');
      L.push('| # | Test Case | File | Error |');
      L.push('|---|-----------|------|-------|');
      failed.forEach((t, i) => {
        const err = t.error
          ? t.error.replace(/\n[\s\S]*/m, '').replace(/\|/g, '\\|').substring(0, 100)
          : '—';
        L.push(`| ${i + 1} | \`${mdEsc(t.title)}\` | \`${mdEsc(t.file)}\` | ${err} |`);
      });
      L.push('');
    }
  }

  // ── Complete test table ──
  L.push('---');
  L.push('');
  L.push(`## 📋 All Test Results — ${allEntries.length} unique test${allEntries.length !== 1 ? 's' : ''}`);
  L.push('');
  const projHeaders = projectNames.map(n => browserLabel(n)).join(' | ');
  L.push(`| # | Test Case | File | ${projHeaders} |`);
  L.push(`|---|-----------|------|${projectNames.map(() => ':---:').join('|')}|`);

  allEntries.forEach((entry, i) => {
    const cells = projectNames.map(proj => {
      const t = entry[proj];
      return t ? (STATUS_MD[t.status] || t.status) : '—';
    });
    L.push(`| ${i + 1} | ${mdEsc(entry.title)} | \`${mdEsc(entry.file)}\` | ${cells.join(' | ')} |`);
  });

  L.push('');
  L.push('---');
  L.push('');
  L.push('> 📥 Download **HTML report** and **PDF report** from the *Artifacts* section below.');

  fs.appendFileSync(summaryFile, L.join('\n') + '\n');
  console.log('✅ GitHub Step Summary written.');
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2.  HTML REPORT  (email body + PDF source)
// ═══════════════════════════════════════════════════════════════════════════════

const overallBg = parseFloat(overallRate) >= 80 ? '#16a34a'
                : parseFloat(overallRate) >= 50 ? '#d97706' : '#dc2626';

// Browser summary rows
const summaryRows = Object.entries(projects).map(([name, p]) => {
  const rate    = parseFloat(p.passRate);
  const rateClr = rate >= 80 ? '#16a34a' : rate >= 50 ? '#d97706' : '#dc2626';
  return `<tr>
    <td>${browserLabel(name)} (${name})</td>
    <td class="num">${p.total}</td>
    <td class="num pass">${p.passed}</td>
    <td class="num fail">${p.failed}</td>
    <td class="num flaky">${p.flaky}</td>
    <td class="num skip">${p.skipped}</td>
    <td class="num" style="color:${rateClr};font-weight:700">${p.passRate}%</td>
  </tr>`;
}).join('');

// Failed test sections per browser
const failedSections = Object.entries(projects).map(([name, p]) => {
  const failed = p.tests.filter(t => t.status === 'failed' || t.status === 'unexpected');
  if (!failed.length) return '';
  const rows = failed.map((t, i) => `<tr>
    <td>${i + 1}</td>
    <td>${esc(t.title)}</td>
    <td class="mono">${esc(t.file)}</td>
    <td class="mono err">${esc((t.error || '—').substring(0, 130))}</td>
  </tr>`).join('');
  return `<h3>${browserLabel(name)} (${name}) — ${failed.length} failed</h3>
  <table>
    <thead><tr><th>#</th><th>Test</th><th>File</th><th>Error</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}).join('');

// Cross-browser all-tests table
const projHeaderCols = projectNames
  .map(n => `<th class="center">${browserLabel(n)}</th>`)
  .join('');

const allTestRows = allEntries.map((entry, i) => {
  const cols = projectNames.map(proj => {
    const t = entry[proj];
    const html = t ? (STATUS_HTML[t.status] || `<span>${t.status}</span>`) : '<span style="color:#cbd5e1">—</span>';
    return `<td class="center">${html}</td>`;
  }).join('');
  return `<tr>
    <td>${i + 1}</td>
    <td>${esc(entry.title)}</td>
    <td class="mono small">${esc(entry.file)}</td>
    ${cols}
  </tr>`;
}).join('');

const noFailSection = '<p style="color:#16a34a;font-size:14px;padding:8px 0">✅ No failures detected across all browsers.</p>';

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Playwright Test Report — Run #${esc(runNum)}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background:#f1f5f9;color:#1e293b;padding:0}
  .wrap{max-width:1080px;margin:0 auto;padding:24px}
  /* header */
  .hdr{background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);color:#fff;padding:28px 32px;border-radius:12px;margin-bottom:18px}
  .hdr h1{font-size:22px;font-weight:700;margin-bottom:8px}
  .meta{display:flex;gap:10px;flex-wrap:wrap;font-size:12px;margin:10px 0}
  .meta span{background:rgba(255,255,255,.13);padding:3px 10px;border-radius:99px}
  .badge{display:inline-block;background:${overallBg};color:#fff;font-size:18px;font-weight:700;padding:7px 18px;border-radius:8px;margin-top:14px}
  .sub{margin-top:6px;font-size:13px;opacity:.8}
  /* cards */
  .card{background:#fff;border-radius:10px;padding:22px 24px;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,.07)}
  .card h2{font-size:16px;font-weight:700;margin-bottom:14px;padding-bottom:9px;border-bottom:2px solid #f1f5f9;color:#0f172a}
  .card h3{font-size:13px;font-weight:600;color:#475569;margin:14px 0 8px}
  /* tables */
  table{width:100%;border-collapse:collapse;font-size:13px}
  th{background:#f8fafc;color:#64748b;font-weight:600;text-align:left;padding:8px 11px;border-bottom:2px solid #e2e8f0}
  td{padding:7px 11px;border-bottom:1px solid #f1f5f9;vertical-align:top}
  tr:last-child td{border-bottom:none}
  /* utils */
  .num{text-align:right}
  .center{text-align:center}
  .pass{color:#16a34a;font-weight:700}
  .fail{color:#dc2626;font-weight:700}
  .flaky{color:#d97706;font-weight:700}
  .skip{color:#94a3b8}
  .mono{font-family:'SFMono-Regular',Consolas,monospace;font-size:12px}
  .small{font-size:11px;color:#64748b}
  .err{color:#dc2626;font-size:11px}
  .footer{text-align:center;color:#94a3b8;font-size:11px;margin-top:18px;padding-bottom:8px}
</style>
</head>
<body>
<div class="wrap">

  <div class="hdr">
    <h1>🎭 Playwright Test Report</h1>
    <div class="meta">
      <span>📅 ${esc(nowStr)}</span>
      <span>🌿 ${esc(branch)}</span>
      <span>🔨 ${esc(sha)}</span>
      <span>▶️ Run #${esc(runNum)}</span>
    </div>
    <div class="badge">${overallRate}% Pass Rate</div>
    <div class="sub">${totalPassed} passed · ${totalFailed} failed · ${totalAll} total tests across all browsers</div>
  </div>

  <!-- Browser summary -->
  <div class="card">
    <h2>📊 Results by Browser</h2>
    <table>
      <thead>
        <tr>
          <th>Browser</th>
          <th class="num">Total</th>
          <th class="num">✅ Passed</th>
          <th class="num">❌ Failed</th>
          <th class="num">⚠️ Flaky</th>
          <th class="num">⏭️ Skipped</th>
          <th class="num">Pass Rate</th>
        </tr>
      </thead>
      <tbody>${summaryRows}</tbody>
    </table>
  </div>

  <!-- Failed tests -->
  <div class="card">
    <h2>❌ Failed Tests</h2>
    ${totalFailed > 0 ? failedSections : noFailSection}
  </div>

  <!-- All results -->
  <div class="card">
    <h2>📋 Complete Test Results (${allEntries.length} unique tests)</h2>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Test Case</th>
          <th>File</th>
          ${projHeaderCols}
        </tr>
      </thead>
      <tbody>${allTestRows}</tbody>
    </table>
  </div>

  <div class="footer">
    🎭 Playwright CI/CD — Generated ${esc(nowStr)} · Branch: ${esc(branch)} · Run #${esc(runNum)}
  </div>
</div>
</body>
</html>`;

fs.mkdirSync(path.dirname(htmlOutput), { recursive: true });
fs.writeFileSync(htmlOutput, html, 'utf8');
console.log(`✅ HTML report written: ${htmlOutput}`);

// ── console summary ───────────────────────────────────────────────────────────
console.log('');
console.log('━━━ TEST SUMMARY ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`  Overall : ${totalPassed}/${totalAll} passed (${overallRate}%)`);
for (const [name, p] of Object.entries(projects)) {
  const icon = p.failed === 0 ? '✅' : '❌';
  console.log(`  ${icon} ${browserLabel(name).padEnd(14)}: ${p.passed}/${p.total} passed (${p.passRate}%) — ${p.failed} failed, ${p.flaky} flaky`);
}
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
