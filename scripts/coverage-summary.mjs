#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

// Check if we want a simplified version for GitHub comments
const isSimplified = process.argv.includes('--simple');

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
    lines: total.lines?.pct ?? 0,
    statements: total.statements?.pct ?? 0,
    functions: total.functions?.pct ?? 0,
    branches: total.branches?.pct ?? 0,
  };
}

function getCoverageStatus(percentage) {
  if (percentage >= 90) return '🟢 Excellent';
  if (percentage >= 80) return '🟡 Good';
  if (percentage >= 70) return '🟠 Fair';
  if (percentage >= 60) return '🔴 Poor';
  return '⚫ Critical';
}

function getBadge(percentage) {
  if (percentage >= 90) return '![Coverage](https://img.shields.io/badge/coverage-90%25%2B-brightgreen)';
  if (percentage >= 80) return '![Coverage](https://img.shields.io/badge/coverage-80%25%2B-yellow)';
  if (percentage >= 70) return '![Coverage](https://img.shields.io/badge/coverage-70%25%2B-orange)';
  if (percentage >= 60) return '![Coverage](https://img.shields.io/badge/coverage-60%25%2B-red)';
  return '![Coverage](https://img.shields.io/badge/coverage-below%2060%25-critical)';
}

function createBarChart(percentage, width = 20) {
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return `${bar} ${percentage.toFixed(1)}%`;
}

function formatCoverageTable(totals, label) {
  if (!totals) {
    return `| ${label} | ❌ | N/A | N/A | N/A | N/A |`;
  }
  
  const { lines, statements, functions, branches } = totals;
  const overall = (lines + statements + functions + branches) / 4;
  const status = getCoverageStatus(overall);
  
  return `| ${label} | ${status} | ${lines.toFixed(1)}% | ${statements.toFixed(1)}% | ${functions.toFixed(1)}% | ${branches.toFixed(1)}% |`;
}

function getDetailedCoverage(apiUnit, apiE2e, web) {
  const details = [];
  
  if (apiUnit) {
    details.push('### 📊 Backend Unit Tests Details');
    details.push('');
    details.push('| Module | Lines | Statements | Functions | Branches |');
    details.push('|--------|-------|------------|-----------|----------|');
    
    Object.entries(apiUnit).forEach(([module, data]) => {
      if (module !== 'total' && data && data.lines) {
        const lines = data.lines?.pct ?? 0;
        const statements = data.statements?.pct ?? 0;
        const functions = data.functions?.pct ?? 0;
        const branches = data.branches?.pct ?? 0;
        details.push(`| ${module} | ${lines.toFixed(1)}% | ${statements.toFixed(1)}% | ${functions.toFixed(1)}% | ${branches.toFixed(1)}% |`);
      }
    });
    details.push('');
  }
  
  if (web) {
    details.push('### 🌐 Frontend Tests Details');
    details.push('');
    details.push('| Module | Lines | Statements | Functions | Branches |');
    details.push('|--------|-------|------------|-----------|----------|');
    
    Object.entries(web).forEach(([module, data]) => {
      if (module !== 'total' && data && data.lines) {
        const lines = data.lines?.pct ?? 0;
        const statements = data.statements?.pct ?? 0;
        const functions = data.functions?.pct ?? 0;
        const branches = data.branches?.pct ?? 0;
        details.push(`| ${module} | ${lines.toFixed(1)}% | ${statements.toFixed(1)}% | ${functions.toFixed(1)}% | ${branches.toFixed(1)}% |`);
      }
    });
    details.push('');
  }
  
  return details.join('\n');
}

function getRecommendations(apiUnitTotals, apiE2eTotals, webTotals) {
  const recommendations = [];
  
  if (apiUnitTotals) {
    const { lines, statements, functions, branches } = apiUnitTotals;
    if (lines < 80) recommendations.push('🔧 **Backend Unit Tests**: Consider adding more test cases to improve line coverage');
    if (branches < 70) recommendations.push('🔧 **Backend Unit Tests**: Focus on testing conditional branches and edge cases');
  }
  
  if (apiE2eTotals) {
    const { lines, statements, functions, branches } = apiE2eTotals;
    if (lines < 60) recommendations.push('🔧 **Backend E2E Tests**: Add more end-to-end test scenarios');
  }
  
  if (webTotals) {
    const { lines, statements, functions, branches } = webTotals;
    if (lines < 80) recommendations.push('🔧 **Frontend Tests**: Increase component and utility function coverage');
    if (branches < 70) recommendations.push('🔧 **Frontend Tests**: Add tests for conditional rendering and user interactions');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('🎉 **Excellent coverage!** All test suites are performing well.');
  }
  
  return recommendations;
}

function generateSimpleReport(apiUnitTotals, apiE2eTotals, webTotals, combinedTotals) {
  const report = [];
  
  report.push('## 📈 Test Coverage Summary');
  report.push('');
  
  const overallPercentage = (combinedTotals.lines + combinedTotals.statements + combinedTotals.functions + combinedTotals.branches) / 4;
  report.push(getBadge(overallPercentage));
  report.push('');
  
  report.push('| Test Suite | Status | Lines | Functions | Branches |');
  report.push('|------------|--------|-------|-----------|----------|');
  
  if (apiUnitTotals) {
    const overall = (apiUnitTotals.lines + apiUnitTotals.statements + apiUnitTotals.functions + apiUnitTotals.branches) / 4;
    const status = getCoverageStatus(overall);
    report.push(`| Backend (Unit) | ${status} | ${apiUnitTotals.lines.toFixed(1)}% | ${apiUnitTotals.functions.toFixed(1)}% | ${apiUnitTotals.branches.toFixed(1)}% |`);
  } else {
    report.push('| Backend (Unit) | ❌ | N/A | N/A | N/A |');
  }
  
  if (apiE2eTotals) {
    const overall = (apiE2eTotals.lines + apiE2eTotals.statements + apiE2eTotals.functions + apiE2eTotals.branches) / 4;
    const status = getCoverageStatus(overall);
    report.push(`| Backend (E2E) | ${status} | ${apiE2eTotals.lines.toFixed(1)}% | ${apiE2eTotals.functions.toFixed(1)}% | ${apiE2eTotals.branches.toFixed(1)}% |`);
  } else {
    report.push('| Backend (E2E) | ❌ | N/A | N/A | N/A |');
  }
  
  if (webTotals) {
    const overall = (webTotals.lines + webTotals.statements + webTotals.functions + webTotals.branches) / 4;
    const status = getCoverageStatus(overall);
    report.push(`| Frontend | ${status} | ${webTotals.lines.toFixed(1)}% | ${webTotals.functions.toFixed(1)}% | ${webTotals.branches.toFixed(1)}% |`);
  } else {
    report.push('| Frontend | ❌ | N/A | N/A | N/A |');
  }
  
  const overallCombined = (combinedTotals.lines + combinedTotals.statements + combinedTotals.functions + combinedTotals.branches) / 4;
  const status = getCoverageStatus(overallCombined);
  report.push(`| **Overall** | ${status} | ${combinedTotals.lines.toFixed(1)}% | ${combinedTotals.functions.toFixed(1)}% | ${combinedTotals.branches.toFixed(1)}% |`);
  report.push('');
  
  // Visual representation
  report.push('## 📊 Visual Coverage Overview');
  report.push('');
  
  if (apiUnitTotals) {
    const overall = (apiUnitTotals.lines + apiUnitTotals.statements + apiUnitTotals.functions + apiUnitTotals.branches) / 4;
    report.push('### Backend Unit Tests');
    report.push(`\`\`\``);
    report.push(`Lines:      ${createBarChart(apiUnitTotals.lines)}`);
    report.push(`Statements: ${createBarChart(apiUnitTotals.statements)}`);
    report.push(`Functions:  ${createBarChart(apiUnitTotals.functions)}`);
    report.push(`Branches:   ${createBarChart(apiUnitTotals.branches)}`);
    report.push(`Overall:    ${createBarChart(overall)}`);
    report.push(`\`\`\``);
    report.push('');
  }
  
  if (apiE2eTotals) {
    const overall = (apiE2eTotals.lines + apiE2eTotals.statements + apiE2eTotals.functions + apiE2eTotals.branches) / 4;
    report.push('### Backend E2E Tests');
    report.push(`\`\`\``);
    report.push(`Lines:      ${createBarChart(apiE2eTotals.lines)}`);
    report.push(`Statements: ${createBarChart(apiE2eTotals.statements)}`);
    report.push(`Functions:  ${createBarChart(apiE2eTotals.functions)}`);
    report.push(`Branches:   ${createBarChart(apiE2eTotals.branches)}`);
    report.push(`Overall:    ${createBarChart(overall)}`);
    report.push(`\`\`\``);
    report.push('');
  }
  
  if (webTotals) {
    const overall = (webTotals.lines + webTotals.statements + webTotals.functions + webTotals.branches) / 4;
    report.push('### Frontend Tests');
    report.push(`\`\`\``);
    report.push(`Lines:      ${createBarChart(webTotals.lines)}`);
    report.push(`Statements: ${createBarChart(webTotals.statements)}`);
    report.push(`Functions:  ${createBarChart(webTotals.functions)}`);
    report.push(`Branches:   ${createBarChart(webTotals.branches)}`);
    report.push(`Overall:    ${createBarChart(overall)}`);
    report.push(`\`\`\``);
    report.push('');
  }
  
  // Overall combined
  const overallCombinedVisual = (combinedTotals.lines + combinedTotals.statements + combinedTotals.functions + combinedTotals.branches) / 4;
  report.push('### Overall Project Coverage');
  report.push(`\`\`\``);
  report.push(`Lines:      ${createBarChart(combinedTotals.lines)}`);
  report.push(`Statements: ${createBarChart(combinedTotals.statements)}`);
  report.push(`Functions:  ${createBarChart(combinedTotals.functions)}`);
  report.push(`Branches:   ${createBarChart(combinedTotals.branches)}`);
  report.push(`Overall:    ${createBarChart(overallCombinedVisual)}`);
  report.push(`\`\`\``);
  report.push('');
  
  // Quick recommendations
  const recommendations = getRecommendations(apiUnitTotals, apiE2eTotals, webTotals);
  if (recommendations.length > 0) {
    report.push('### 💡 Quick Recommendations');
    recommendations.slice(0, 2).forEach(rec => report.push(`- ${rec}`));
    if (recommendations.length > 2) {
      report.push(`- *... and ${recommendations.length - 2} more recommendations*`);
    }
  }
  
  return report.join('\n');
}

const root = process.cwd();

// Read coverage files
const apiUnit = readJson(path.join(root, 'apps', 'api', 'coverage', 'coverage-summary.json'));
const apiE2e = readJson(path.join(root, 'apps', 'api', 'test', 'coverage-e2e', 'coverage-summary.json'));
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

// Generate report based on mode
if (isSimplified) {
  console.log(generateSimpleReport(apiUnitTotals, apiE2eTotals, webTotals, combinedTotals));
} else {
  // Generate full markdown report
  const report = [];

  // Header
  report.push('# 📈 Test Coverage Report');
  report.push('');
  report.push(`**Generated on:** ${new Date().toLocaleString('fr-FR')}`);
  report.push('');

  // Overall badges
  const overallPercentage = (combinedTotals.lines + combinedTotals.statements + combinedTotals.functions + combinedTotals.branches) / 4;
  report.push(getBadge(overallPercentage));
  report.push('');

  // Summary table
  report.push('## 📋 Coverage Summary');
  report.push('');
  report.push('| Test Suite | Status | Lines | Statements | Functions | Branches |');
  report.push('|------------|--------|-------|------------|-----------|----------|');
  report.push(formatCoverageTable(apiUnitTotals, 'Backend (Unit)'));
  report.push(formatCoverageTable(apiE2eTotals, 'Backend (E2E)'));
  report.push(formatCoverageTable(webTotals, 'Frontend'));
  report.push(formatCoverageTable(combinedTotals, '**Overall**'));
  report.push('');

  // Visual representation
  report.push('## 📊 Visual Coverage Overview');
  report.push('');

  if (apiUnitTotals) {
    const overall = (apiUnitTotals.lines + apiUnitTotals.statements + apiUnitTotals.functions + apiUnitTotals.branches) / 4;
    report.push('### Backend Unit Tests');
    report.push(`\`\`\``);
    report.push(`Lines:      ${createBarChart(apiUnitTotals.lines)}`);
    report.push(`Statements: ${createBarChart(apiUnitTotals.statements)}`);
    report.push(`Functions:  ${createBarChart(apiUnitTotals.functions)}`);
    report.push(`Branches:   ${createBarChart(apiUnitTotals.branches)}`);
    report.push(`Overall:    ${createBarChart(overall)}`);
    report.push(`\`\`\``);
    report.push('');
  }

  if (apiE2eTotals) {
    const overall = (apiE2eTotals.lines + apiE2eTotals.statements + apiE2eTotals.functions + apiE2eTotals.branches) / 4;
    report.push('### Backend E2E Tests');
    report.push(`\`\`\``);
    report.push(`Lines:      ${createBarChart(apiE2eTotals.lines)}`);
    report.push(`Statements: ${createBarChart(apiE2eTotals.statements)}`);
    report.push(`Functions:  ${createBarChart(apiE2eTotals.functions)}`);
    report.push(`Branches:   ${createBarChart(apiE2eTotals.branches)}`);
    report.push(`Overall:    ${createBarChart(overall)}`);
    report.push(`\`\`\``);
    report.push('');
  }

  if (webTotals) {
    const overall = (webTotals.lines + webTotals.statements + webTotals.functions + webTotals.branches) / 4;
    report.push('### Frontend Tests');
    report.push(`\`\`\``);
    report.push(`Lines:      ${createBarChart(webTotals.lines)}`);
    report.push(`Statements: ${createBarChart(webTotals.statements)}`);
    report.push(`Functions:  ${createBarChart(webTotals.functions)}`);
    report.push(`Branches:   ${createBarChart(webTotals.branches)}`);
    report.push(`Overall:    ${createBarChart(overall)}`);
    report.push(`\`\`\``);
    report.push('');
  }

  // Overall combined
  const overallCombined = (combinedTotals.lines + combinedTotals.statements + combinedTotals.functions + combinedTotals.branches) / 4;
  report.push('### Overall Project Coverage');
  report.push(`\`\`\``);
  report.push(`Lines:      ${createBarChart(combinedTotals.lines)}`);
  report.push(`Statements: ${createBarChart(combinedTotals.statements)}`);
  report.push(`Functions:  ${createBarChart(combinedTotals.functions)}`);
  report.push(`Branches:   ${createBarChart(combinedTotals.branches)}`);
  report.push(`Overall:    ${createBarChart(overallCombined)}`);
  report.push(`\`\`\``);
  report.push('');

  // Detailed breakdown
  const details = getDetailedCoverage(apiUnit, apiE2e, web);
  if (details) {
    report.push(details);
  }

  // Recommendations
  report.push('## 💡 Recommendations');
  report.push('');
  const recommendations = getRecommendations(apiUnitTotals, apiE2eTotals, webTotals);
  recommendations.forEach(rec => report.push(`- ${rec}`));
  report.push('');

  // Footer
  report.push('---');
  report.push('*This report was automatically generated by the CI/CD pipeline*');

  console.log(report.join('\n'));
}


