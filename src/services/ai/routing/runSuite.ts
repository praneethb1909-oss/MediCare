import { runRouterValidationSuite } from './validateRouter';

async function main() {
  console.log('================================================================');
  console.log('   OLMERA HEALTHCARE - INTELLIGENT LLM API ROUTER TEST SUITE   ');
  console.log('================================================================\n');

  const report = await runRouterValidationSuite();

  report.results.forEach((r, idx) => {
    const symbol = r.passed ? '✓ [PASS]' : '✗ [FAIL]';
    console.log(`${symbol} Test ${idx + 1}: ${r.name}`);
    console.log(`   Details: ${r.details}\n`);
  });

  console.log('----------------------------------------------------------------');
  console.log(`Summary: ${report.testsPassed} / ${report.totalTests} tests passed (${Math.round((report.testsPassed / report.totalTests) * 100)}%).`);
  console.log('================================================================');

  if (report.testsPassed !== report.totalTests) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
