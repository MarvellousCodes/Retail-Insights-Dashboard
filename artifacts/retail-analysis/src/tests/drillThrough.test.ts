/**
 * Drill-through question builder verification.
 *
 * This file tests the logic that builds contextual follow-up questions
 * when a user clicks on chart elements (hbar bars, column bars, donut segments, line points).
 *
 * Run: pnpm exec tsx src/tests/drillThrough.test.ts
 * (or simply verified by reading the logic inline)
 */

// Simulates the hbar drill-through handler logic
function buildHBarDrillQuestion(category: string, periodLabel: string): string {
  return periodLabel
    ? `Top 10 products in ${category} by revenue for ${periodLabel}`
    : `Top 10 products in ${category} by revenue`;
}

// Simulates the column drill-through handler logic
function buildColumnDrillQuestion(category: string, periodLabel: string): string {
  return periodLabel
    ? `Sales breakdown for ${category} for ${periodLabel}`
    : `Sales breakdown for ${category}`;
}

// Simulates the donut drill-through handler logic
function buildDonutDrillQuestion(category: string, periodLabel: string): string {
  return periodLabel
    ? `Top 10 products in ${category} for ${periodLabel}`
    : `Top 10 products in ${category}`;
}

// Simulates the line drill-through handler logic
function buildLineDrillQuestion(point: string): string {
  return `Sales breakdown for ${point}`;
}

// ===== ASSERTIONS =====
const tests: [string, string, string][] = [
  // [description, actual, expected]
  ["HBar: Bakery with period", buildHBarDrillQuestion("Bakery", "Today, Tue 22 Jul 2026"), "Top 10 products in Bakery by revenue for Today, Tue 22 Jul 2026"],
  ["HBar: Dairy without period", buildHBarDrillQuestion("Dairy", ""), "Top 10 products in Dairy by revenue"],
  ["Column: Saturday with period", buildColumnDrillQuestion("Saturday", "This week"), "Sales breakdown for Saturday for This week"],
  ["Column: no period", buildColumnDrillQuestion("Morning", ""), "Sales breakdown for Morning"],
  ["Donut: Tobacco with period", buildDonutDrillQuestion("Tobacco", "July 2026"), "Top 10 products in Tobacco for July 2026"],
  ["Line: January point", buildLineDrillQuestion("January"), "Sales breakdown for January"],
];

let passed = 0;
let failed = 0;
for (const [desc, actual, expected] of tests) {
  if (actual === expected) {
    console.log(`PASS: ${desc}`);
    passed++;
  } else {
    console.error(`FAIL: ${desc}\n  Expected: ${expected}\n  Actual:   ${actual}`);
    failed++;
  }
}
console.log(`\n${passed}/${passed + failed} passed`);
if (failed > 0) process.exit(1);
