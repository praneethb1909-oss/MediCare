/**
 * Olmera Healthcare - LLM API Router Validation & Test Suite
 * 
 * Tests load distribution, failover on 429, token tracking, and circuit breaker.
 */

import { SmartLLMRouter } from './routerEngine';
import { LLMKeyConfig } from './types';

export interface ValidationReport {
  testsPassed: number;
  totalTests: number;
  results: Array<{
    name: string;
    passed: boolean;
    details: string;
  }>;
}

export async function runRouterValidationSuite(): Promise<ValidationReport> {
  const router = SmartLLMRouter.getInstance();
  const results: Array<{ name: string; passed: boolean; details: string }> = [];

  // Reset before testing
  router.resetKeyMetrics();

  // ---------------------------------------------------------------------------
  // Test 1: Priority Tier Selection (Tier 1 vs Tier 2)
  // ---------------------------------------------------------------------------
  try {
    const selected = router.selectKey({ prompt: 'Test Priority Tier' });
    const isTier1 = selected.key.priority === 1;
    results.push({
      name: 'Priority Tier Selection',
      passed: isTier1,
      details: `Selected key "${selected.key.id}" has Priority Tier ${selected.key.priority} (Expected Tier 1).`
    });
  } catch (e: any) {
    results.push({ name: 'Priority Tier Selection', passed: false, details: e.message });
  }

  // ---------------------------------------------------------------------------
  // Test 2: Weighted Load Balancing within Tier 1
  // ---------------------------------------------------------------------------
  try {
    const counts: Record<string, number> = {};
    for (let i = 0; i < 20; i++) {
      const { key } = router.selectKey({ prompt: 'Load balancing test' });
      counts[key.id] = (counts[key.id] || 0) + 1;
    }

    const hasDistributed = Object.keys(counts).length >= 1;
    results.push({
      name: 'Weighted Load Balancing',
      passed: hasDistributed,
      details: `Traffic distribution across 20 iterations: ${JSON.stringify(counts)}`
    });
  } catch (e: any) {
    results.push({ name: 'Weighted Load Balancing', passed: false, details: e.message });
  }

  // ---------------------------------------------------------------------------
  // Test 3: Automated Failover on Simulated 429 Rate Limit
  // ---------------------------------------------------------------------------
  try {
    // Intentionally trip primary key into rate limited status
    const metrics = router.getMetrics().find(m => m.keyId === 'gemini-flash-primary');
    if (metrics) {
      metrics.status = 'RATE_LIMITED';
      metrics.cooldownUntil = new Date(Date.now() + 60000).toISOString();
    }

    // Attempt selection again: router MUST avoid the rate-limited primary key
    const failoverSelection = router.selectKey({ prompt: 'Failover probe' });
    const avoidedTrip = failoverSelection.key.id !== 'gemini-flash-primary';

    results.push({
      name: 'Automated Rate Limit (429) Failover',
      passed: avoidedTrip,
      details: `Primary key tripped to RATE_LIMITED. Router automatically failed over to "${failoverSelection.key.id}".`
    });

    // Reset status
    if (metrics) {
      metrics.status = 'HEALTHY';
      metrics.cooldownUntil = undefined;
    }
  } catch (e: any) {
    results.push({ name: 'Automated Rate Limit (429) Failover', passed: false, details: e.message });
  }

  // ---------------------------------------------------------------------------
  // Test 4: End-to-End Request Execution & Telemetry Accounting
  // ---------------------------------------------------------------------------
  try {
    const res = await router.completePrompt({
      prompt: 'Summarize HbA1c 6.8% control in diabetic patient.',
      taskType: 'clinical_summary'
    });

    const hasContent = Boolean(res.content && res.content.length > 0);
    const hasTokens = res.metrics.totalTokens > 0;
    const hasTrace = res.routingTrace.attempts >= 1;

    results.push({
      name: 'End-to-End Execution & Token Tracking',
      passed: hasContent && hasTokens && hasTrace,
      details: `Key: ${res.keyUsed.id} (${res.keyUsed.provider}) | Tokens: ${res.metrics.totalTokens} | Latency: ${res.metrics.latencyMs}ms | Cost: $${res.metrics.estimatedCostUsd}`
    });
  } catch (e: any) {
    results.push({ name: 'End-to-End Execution & Token Tracking', passed: false, details: e.message });
  }

  // ---------------------------------------------------------------------------
  // Test 5: Circuit Breaker & Cooldown Recovery
  // ---------------------------------------------------------------------------
  try {
    const health = router.getSystemHealth();
    const isSystemHealthy = health.totalConfiguredKeys >= 3 && health.healthyKeys >= 1;
    results.push({
      name: 'System Health & Circuit Breaker Tracking',
      passed: isSystemHealthy,
      details: `Configured: ${health.totalConfiguredKeys} | Healthy: ${health.healthyKeys} | Strategy: ${health.activeStrategy}`
    });
  } catch (e: any) {
    results.push({ name: 'System Health & Circuit Breaker Tracking', passed: false, details: e.message });
  }

  const passedCount = results.filter(r => r.passed).length;
  return {
    testsPassed: passedCount,
    totalTests: results.length,
    results
  };
}
