#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

function readJson(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

function pickTotals(summaryJson) {
  if (!summaryJson) return null;
  const total = summaryJson.total || summaryJson;
  return {
    lines: total.lines?.pct ?? total.lines?.pct ?? 0,
    statements: total.statements?.pct ?? 0,
    functions: total.functions?.pct ?? 0,
    branches: total.branches?.pct ?? 0,
  };
}

function formatLine(label, totals) {
  if (!totals) return `${label}: N/A`;
  const { lines, statements, functions, branches } = totals;
  const fmt = (n) => `${Number(n).toFixed(1)}%`;
  return `${label}: lines ${fmt(lines)}, statements ${fmt(statements)}, functions ${fmt(functions)}, branches ${fmt(branches)}`;
}

const root = process.cwd();

// Backend unit (Jest)
const apiUnit = readJson(path.join(root, 'apps', 'api', 'coverage', 'coverage-summary.json'));
// Backend e2e (Jest, separate dir)
const apiE2e = readJson(path.join(root, 'apps', 'api', 'test', 'coverage-e2e', 'coverage-summary.json'));
// Frontend (Vitest)
const web = readJson(path.join(root, 'apps', 'web', 'coverage', 'coverage-summary.json'));

const apiUnitTotals = pickTotals(apiUnit);
const apiE2eTotals = pickTotals(apiE2e);
const webTotals = pickTotals(web);

function averagePct(values) {
  const nums = values.filter((v) => typeof v === 'number');
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function combineTotals(parts) {
  const keys = ['lines', 'statements', 'functions', 'branches'];
  const combined = {};
  for (const key of keys) {
    combined[key] = averagePct(parts.map((p) => p?.[key]).filter((x) => x != null));
  }
  return combined;
}

const combinedTotals = combineTotals([apiUnitTotals, apiE2eTotals, webTotals]);

const lines = [];
lines.push('Coverage Summary');
lines.push('');
lines.push(formatLine('Backend (unit)', apiUnitTotals));
lines.push(formatLine('Backend (e2e)', apiE2eTotals));
lines.push(formatLine('Frontend', webTotals));
lines.push('');
lines.push(formatLine('Overall (avg)', combinedTotals));

console.log(lines.join('\n'));


