'use strict';
// Parses Playwright merged JSON results and:
//   1. Writes a detailed markdown table to $GITHUB_STEP_SUMMARY
//   2. Writes a clean HTML report for email + PDF conversion
//
// JSON structure from Playwright merge-reports:
//   data.suites[]            → file-level suites  (title = file path)
//   suite.suites[]           → describe blocks
//   spec.tests[]             → one entry PER BROWSER PROJECT
//   test.projectName         → "chromium" | "webkit"
//   test.status              → "expected"(pass) | "unexpected"(fail) | "flaky" | "skipped"
//   test.results[].errors[]  → error details

const fs   = require('fs');
const path = require('path');

const resultsFile = process.argv[2] || 'test-results/results.json';
const htmlOutput  = process.argv[3] || 'test-results/email-report.html';

// ── helpers ───────────────────────────────────────────────────────────────────

function esc(s) {
  return String(s || '')
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;');
}
function mdEsc(s) { return String(s || '').replace(/\|/g, '\\|'); }

// Strip ANSI escape codes from error messages
function stripAnsi(s) {
  return String(s || '').replace(/\[[0-9;]*m/g, '').replace(/\[[\d;]*m/g, '');
}

// Convert Playwright's internal status → human-readable status
function toStatus(raw) {
  if (raw === 'expected')   return 'passed';
  if (raw === 'unexpected') return 'failed';
  return raw; // 'flaky', 'skipped'
}

// ── load results ──────────────────────────────────────────────────────────────

let data = { suites: [], stats: {} };
if (fs.existsSync(resultsFile)) {
  try { data = JSON.parse(fs.readFileSync(resultsFile, 'utf8')); }
  catch (e) { console.warn('Warning: could not parse results file:', e.message); }
} else {
  console.warn('Warning: results file not found:', resultsFile);
}

// ── walk all suites recursively, collect per-spec cross-browser data ──────────
//
// specMap key  = "file::title"
// specMap value = { file, title, chromium: {status, error}, webkit: {status, error} }

const specMap  = new Map();
const allTests = [];  // flat list for per-project aggregation

function walkSuites(suite, fileHint) {
  const file = suite.file || fileHint || suite.title || '';

  for (const spec of (suite.specs || [])) {
    const specFile = spec.file || file;
    const key = `${specFile}::${spec.title}`;
    if (!specMap.has(key)) specMap.set(key, { file: specFile, title: spec.title });
    const entry = specMap.get(key);

    for (const test of (spec.tests || [])) {
      const project = test.projectName || 'unknown';
      const status  = toStatus(test.status);

      // Extract first error message from any failed result
      const failedResult = (test.results || []).find(r => r.status !== 'passed' && r.status !== 'skipped');
      const rawError = failedResult
        ? (failedResult.errors?.[0]?.message || failedResult.error?.message || null)
        : null;
      const error = rawError ? stripAnsi(rawError).split('\n')[0] : null;

      entry[project] = { status, error };
      allTests.push({ project, file: specFile, title: spec.title, status, error });
    }
  }

  for (const child of (suite.suites || [])) {
    walkSuites(child, file);
  }
}

for (const topSuite of (data.suites || [])) {
  walkSuites(topSuite, topSuite.title);
}

// ── per-project statistics ────────────────────────────────────────────────────

const projects = {};  // { chromium: { tests[], total, passed, failed, flaky, skipped, passRate } }

for (const t of allTests) {
  if (!projects[t.project]) {
    projects[t.project] = { tests: [], total: 0, passed: 0, failed: 0, flaky: 0, skipped: 0, passRate: '0.0' };
  }
  const p = projects[t.project];
  p.tests.push(t);
  p.total++;
  if (t.status === 'passed')  p.passed++;
  if (t.status === 'failed')  p.failed++;
  if (t.status === 'flaky')   p.flaky++;
  if (t.status === 'skipped') p.skipped++;
}
for (const p of Object.values(projects)) {
  p.passRate = p.total > 0 ? ((p.passed / p.total) * 100).toFixed(1) : '0.0';
}

const projectNames = Object.keys(projects);
const allEntries   = [...specMap.values()];
const totalAll     = allTests.length;
const totalPassed  = allTests.filter(t => t.status === 'passed').length;
const totalFailed  = allTests.filter(t => t.status === 'failed').length;
const totalFlaky   = allTests.filter(t => t.status === 'flaky').length;
const overallRate  = totalAll > 0 ? ((totalPassed / totalAll) * 100).toFixed(1) : '0.0';

// ── environment ───────────────────────────────────────────────────────────────

const branch = process.env.GITHUB_REF_NAME   || 'N/A';
const sha    = (process.env.GITHUB_SHA       || 'N/A').substring(0, 8);
const runNum = process.env.GITHUB_RUN_NUMBER || 'N/A';
const runId  = process.env.GITHUB_RUN_ID     || '';
const repo   = process.env.GITHUB_REPOSITORY || '';
const runUrl = repo ? `https://github.com/${repo}/actions/runs/${runId}` : '#';
const nowStr = new Date().toUTCString();

// ── status display maps ───────────────────────────────────────────────────────

const STATUS_MD = { passed: '✅', failed: '❌', flaky: '⚠️', skipped: '⏭️' };

const STATUS_HTML = {
  passed:  '<span style="color:#16a34a;font-weight:700">✅ Pass</span>',
  failed:  '<span style="color:#dc2626;font-weight:700">❌ Fail</span>',
  flaky:   '<span style="color:#d97706;font-weight:700">⚠️ Flaky</span>',
  skipped: '<span style="color:#94a3b8">⏭️ Skip</span>',
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

  const headline = totalFailed === 0 && totalFlaky === 0
    ? `✅ ALL PASSED — ${overallRate}% (${totalPassed}/${totalAll})`
    : `${totalFailed > 0 ? '❌' : '⚠️'} ${totalFailed} FAILED · ${totalFlaky} FLAKY — ${overallRate}% (${totalPassed}/${totalAll} passed)`;
  L.push(`### ${headline}`);
  L.push('');
  L.push('---');
  L.push('');

  // Browser summary table
  L.push('## 📊 Results by Browser');
  L.push('');
  L.push('| Browser | Total | ✅ Passed | ❌ Failed | ⚠️ Flaky | ⏭️ Skipped | Pass Rate |');
  L.push('|---------|------:|----------:|----------:|---------:|-----------:|----------:|');
  for (const [name, p] of Object.entries(projects)) {
    L.push(`| ${browserLabel(name)} | ${p.total} | **${p.passed}** | **${p.failed}** | ${p.flaky} | ${p.skipped} | **${p.passRate}%** |`);
  }
  L.push('');

  // Failed tests
  if (totalFailed > 0) {
    L.push('---');
    L.push('');
    L.push('## ❌ Failed Tests');
    L.push('');
    for (const [name, p] of Object.entries(projects)) {
      const failed = p.tests.filter(t => t.status === 'failed');
      if (!failed.length) continue;
      L.push(`### ${browserLabel(name)} — ${failed.length} failed`);
      L.push('');
      L.push('| # | Test Case | File | Error |');
      L.push('|---|-----------|------|-------|');
      failed.forEach((t, i) => {
        const err = t.error ? t.error.replace(/\|/g, '\\|').substring(0, 100) : '—';
        L.push(`| ${i + 1} | \`${mdEsc(t.title)}\` | \`${mdEsc(t.file)}\` | ${err} |`);
      });
      L.push('');
    }
  }

  // Flaky tests
  if (totalFlaky > 0) {
    L.push('---');
    L.push('');
    L.push('## ⚠️ Flaky Tests');
    L.push('');
    for (const [name, p] of Object.entries(projects)) {
      const flaky = p.tests.filter(t => t.status === 'flaky');
      if (!flaky.length) continue;
      L.push(`### ${browserLabel(name)} — ${flaky.length} flaky`);
      L.push('');
      flaky.forEach((t, i) => L.push(`${i + 1}. \`${t.title}\` — \`${t.file}\``));
      L.push('');
    }
  }

  // Complete cross-browser table
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

const summaryRows = Object.entries(projects).map(([name, p]) => {
  const rate    = parseFloat(p.passRate);
  const rateClr = rate >= 80 ? '#16a34a' : rate >= 50 ? '#d97706' : '#dc2626';
  return `<tr>
    <td><strong>${browserLabel(name)}</strong><br><small style="color:#64748b">${name}</small></td>
    <td class="num">${p.total}</td>
    <td class="num pass">${p.passed}</td>
    <td class="num fail">${p.failed}</td>
    <td class="num flaky">${p.flaky}</td>
    <td class="num skip">${p.skipped}</td>
    <td class="num" style="color:${rateClr};font-weight:700;font-size:15px">${p.passRate}%</td>
  </tr>`;
}).join('');

const failedSections = Object.entries(projects).map(([name, p]) => {
  const failed = p.tests.filter(t => t.status === 'failed');
  if (!failed.length) return '';
  const rows = failed.map((t, i) => `<tr>
    <td>${i + 1}</td>
    <td>${esc(t.title)}</td>
    <td class="mono">${esc(t.file)}</td>
    <td class="mono err">${esc((t.error || '—').substring(0, 140))}</td>
  </tr>`).join('');
  return `<h3 style="color:#dc2626">${browserLabel(name)} — ${failed.length} failed</h3>
  <table>
    <thead><tr><th>#</th><th>Test Case</th><th>File</th><th>Error</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}).join('');

const flakySections = Object.entries(projects).map(([name, p]) => {
  const flaky = p.tests.filter(t => t.status === 'flaky');
  if (!flaky.length) return '';
  const rows = flaky.map((t, i) => `<tr>
    <td>${i + 1}</td>
    <td>${esc(t.title)}</td>
    <td class="mono">${esc(t.file)}</td>
  </tr>`).join('');
  return `<h3 style="color:#d97706">${browserLabel(name)} — ${flaky.length} flaky</h3>
  <table>
    <thead><tr><th>#</th><th>Test Case</th><th>File</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}).join('');

const projHeaderCols = projectNames.map(n => `<th class="center">${browserLabel(n)}</th>`).join('');

const allTestRows = allEntries.map((entry, i) => {
  const cols = projectNames.map(proj => {
    const t = entry[proj];
    return `<td class="center">${t ? (STATUS_HTML[t.status] || `<span>${t.status}</span>`) : '<span style="color:#e2e8f0">—</span>'}</td>`;
  }).join('');
  return `<tr>
    <td style="color:#94a3b8;font-size:12px">${i + 1}</td>
    <td>${esc(entry.title)}</td>
    <td class="mono small">${esc(entry.file)}</td>
    ${cols}
  </tr>`;
}).join('');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Playwright Test Report — Run #${esc(runNum)}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;background:#f1f5f9;color:#1e293b}
  .wrap{max-width:1080px;margin:0 auto;padding:24px}
  .hdr{background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);color:#fff;padding:28px 32px;border-radius:12px;margin-bottom:18px}
  .hdr h1{font-size:22px;font-weight:700;margin-bottom:8px}
  .meta{display:flex;gap:10px;flex-wrap:wrap;font-size:12px;margin:10px 0}
  .meta span{background:rgba(255,255,255,.13);padding:3px 10px;border-radius:99px}
  .badge{display:inline-block;background:${overallBg};color:#fff;font-size:20px;font-weight:700;padding:8px 20px;border-radius:8px;margin-top:14px}
  .sub{margin-top:7px;font-size:13px;opacity:.85}
  .card{background:#fff;border-radius:10px;padding:22px 24px;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,.07)}
  .card h2{font-size:16px;font-weight:700;margin-bottom:14px;padding-bottom:9px;border-bottom:2px solid #f1f5f9;color:#0f172a}
  .card h3{font-size:13px;font-weight:600;margin:14px 0 8px}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th{background:#f8fafc;color:#64748b;font-weight:600;text-align:left;padding:9px 12px;border-bottom:2px solid #e2e8f0}
  td{padding:8px 12px;border-bottom:1px solid #f1f5f9;vertical-align:top}
  tr:last-child td{border-bottom:none}
  tr:hover td{background:#fafafa}
  .num{text-align:right}
  .center{text-align:center}
  .pass{color:#16a34a;font-weight:700}
  .fail{color:#dc2626;font-weight:700}
  .flaky{color:#d97706;font-weight:700}
  .skip{color:#94a3b8}
  .mono{font-family:'SFMono-Regular',Consolas,monospace;font-size:12px}
  .small{color:#64748b;font-size:11px}
  .err{color:#dc2626}
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
    <div class="sub">${totalPassed} passed · ${totalFailed} failed · ${totalFlaky} flaky · ${totalAll} total tests</div>
  </div>

  <div class="card">
    <h2>📊 Results by Browser</h2>
    <table>
      <thead><tr><th>Browser</th><th class="num">Total</th><th class="num">✅ Passed</th><th class="num">❌ Failed</th><th class="num">⚠️ Flaky</th><th class="num">⏭️ Skipped</th><th class="num">Pass Rate</th></tr></thead>
      <tbody>${summaryRows}</tbody>
    </table>
  </div>

  <div class="card">
    <h2>❌ Failed Tests</h2>
    ${totalFailed > 0 ? failedSections : '<p style="color:#16a34a;padding:4px 0">✅ No failed tests across all browsers.</p>'}
  </div>

  ${totalFlaky > 0 ? `<div class="card"><h2>⚠️ Flaky Tests</h2>${flakySections}</div>` : ''}

  <div class="card">
    <h2>📋 Complete Test Results (${allEntries.length} unique tests)</h2>
    <table>
      <thead><tr><th>#</th><th>Test Case</th><th>File</th>${projHeaderCols}</tr></thead>
      <tbody>${allTestRows}</tbody>
    </table>
  </div>

  <div class="footer">🎭 Playwright CI/CD · Generated ${esc(nowStr)} · Branch: ${esc(branch)} · Run #${esc(runNum)}</div>
</div>
</body>
</html>`;

fs.mkdirSync(path.dirname(htmlOutput), { recursive: true });
fs.writeFileSync(htmlOutput, html, 'utf8');
console.log(`✅ HTML report written: ${htmlOutput}`);

// ── console summary ───────────────────────────────────────────────────────────
console.log('');
console.log('━━━ TEST SUMMARY ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`  Overall : ${totalPassed}/${totalAll} passed (${overallRate}%) — ${totalFailed} failed, ${totalFlaky} flaky`);
for (const [name, p] of Object.entries(projects)) {
  const icon = p.failed === 0 ? '✅' : '❌';
  console.log(`  ${icon} ${browserLabel(name).padEnd(14)}: ${p.passed}/${p.total} passed (${p.passRate}%) — ${p.failed} failed, ${p.flaky} flaky`);
}
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
