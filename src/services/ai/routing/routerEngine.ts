/**
 * Olmera Healthcare - Intelligent LLM API Router Engine
 * 
 * Multi-key load balancing, rate limit (RPM/TPM) enforcement, cost tracking,
 * circuit breaker, and automatic failover.
 */

import { 
  LLMKeyConfig, KeyRealtimeMetrics, RouterExecutionRequest, 
  RouterExecutionResponse, RouterAuditLogEntry, RouterSystemHealth, 
  RoutingStrategy, LLMProvider 
} from './types';
import { KeySlidingWindow } from './slidingWindow';
import { KNOWN_MODEL_BENCHMARKS, calculateTokenCost } from './pricing';
import { executeProviderCall, ProviderAPIError } from './providerClients';

const STORAGE_KEYS_CONFIG = 'olmera_llm_router_keys_v2';
const STORAGE_ROUTER_METRICS = 'olmera_llm_router_metrics_v2';

export class SmartLLMRouter {
  private static instance: SmartLLMRouter;
  private keys: Map<string, LLMKeyConfig> = new Map();
  private metrics: Map<string, KeyRealtimeMetrics> = new Map();
  private windows: Map<string, KeySlidingWindow> = new Map();
  private auditLogs: RouterAuditLogEntry[] = [];
  private activeStrategy: RoutingStrategy = 'priority_weighted';
  private roundRobinIndices: Map<number, number> = new Map(); // priorityTier -> currentIndex

  private constructor() {
    this.initializeDefaultKeys();
    this.loadState();
  }

  public static getInstance(): SmartLLMRouter {
    if (!SmartLLMRouter.instance) {
      SmartLLMRouter.instance = new SmartLLMRouter();
    }
    return SmartLLMRouter.instance;
  }

  /**
   * Initializes default configuration seeded from environment variables
   */
  private initializeDefaultKeys(): void {
    const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) 
      ? (import.meta as any).env 
      : (typeof process !== 'undefined' && (process as any).env ? (process as any).env : {});
    const geminiKey = env.VITE_GEMINI_API_KEY || '';
    const anthropicKey = env.VITE_ANTHROPIC_API_KEY || '';

    const defaultKeys: LLMKeyConfig[] = [
      {
        id: 'gemini-flash-primary',
        name: 'Gemini 1.5 Flash (Primary Tier 1)',
        provider: 'gemini',
        apiKey: geminiKey || 'AIzaSyDemoLocalTestingKey1234567890',
        model: 'gemini-1.5-flash',
        priority: 1,
        weight: 5,
        rateLimits: {
          rpm: 15,
          tpm: 1000000,
          rpd: 1500
        },
        quotas: {
          monthlyBudgetUsd: 50,
          costPer1kPromptTokens: 0.000075,
          costPer1kCompletionTokens: 0.0003
        },
        enabled: true,
        tags: ['clinical', 'chat', 'general']
      },
      {
        id: 'gemini-flash-secondary',
        name: 'Gemini 1.5 Flash (Overflow Key 2)',
        provider: 'gemini',
        apiKey: geminiKey || 'AIzaSyDemoSecondaryKey987654321',
        model: 'gemini-1.5-flash',
        priority: 1,
        weight: 3,
        rateLimits: {
          rpm: 15,
          tpm: 1000000,
          rpd: 1500
        },
        quotas: {
          monthlyBudgetUsd: 50,
          costPer1kPromptTokens: 0.000075,
          costPer1kCompletionTokens: 0.0003
        },
        enabled: true,
        tags: ['clinical', 'chat']
      },
      {
        id: 'claude-sonnet-backup',
        name: 'Claude 3.5 Sonnet (Tier 2 High-Precision Backup)',
        provider: 'anthropic',
        apiKey: anthropicKey || 'sk-ant-demo-placeholder-tier2',
        model: 'claude-3-5-sonnet',
        priority: 2,
        weight: 2,
        rateLimits: {
          rpm: 50,
          tpm: 40000,
          rpd: 5000
        },
        quotas: {
          monthlyBudgetUsd: 150,
          costPer1kPromptTokens: 0.003,
          costPer1kCompletionTokens: 0.015
        },
        enabled: true,
        tags: ['complex_analysis', 'clinical_summary']
      },
      {
        id: 'openai-mini-failover',
        name: 'OpenAI GPT-4o Mini (Tier 3 Emergency Failover)',
        provider: 'openai',
        apiKey: 'sk-demo-openai-failover-tier3',
        model: 'gpt-4o-mini',
        priority: 3,
        weight: 1,
        rateLimits: {
          rpm: 500,
          tpm: 200000,
          rpd: 10000
        },
        quotas: {
          monthlyBudgetUsd: 30,
          costPer1kPromptTokens: 0.00015,
          costPer1kCompletionTokens: 0.0006
        },
        enabled: true,
        tags: ['emergency_failover']
      }
    ];

    defaultKeys.forEach(k => {
      this.keys.set(k.id, k);
      this.initializeKeyMetrics(k.id);
    });
  }

  private initializeKeyMetrics(keyId: string): void {
    if (!this.windows.has(keyId)) {
      this.windows.set(keyId, new KeySlidingWindow());
    }
    if (!this.metrics.has(keyId)) {
      this.metrics.set(keyId, {
        keyId,
        status: 'HEALTHY',
        requestsInCurrentMinute: 0,
        tokensInCurrentMinute: 0,
        requestsToday: 0,
        tokensToday: 0,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        totalCostUsd: 0,
        consecutiveErrors: 0,
        averageLatencyMs: 0
      });
    }
  }

  private loadState(): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;

      const savedKeys = localStorage.getItem(STORAGE_KEYS_CONFIG);
      if (savedKeys) {
        const parsed: LLMKeyConfig[] = JSON.parse(savedKeys);
        parsed.forEach(k => {
          this.keys.set(k.id, k);
          this.initializeKeyMetrics(k.id);
        });
      }

      const savedMetrics = localStorage.getItem(STORAGE_ROUTER_METRICS);
      if (savedMetrics) {
        const parsedM: KeyRealtimeMetrics[] = JSON.parse(savedMetrics);
        parsedM.forEach(m => {
          const existing = this.metrics.get(m.keyId);
          if (existing) {
            this.metrics.set(m.keyId, {
              ...existing,
              totalRequests: m.totalRequests || 0,
              successfulRequests: m.successfulRequests || 0,
              failedRequests: m.failedRequests || 0,
              totalPromptTokens: m.totalPromptTokens || 0,
              totalCompletionTokens: m.totalCompletionTokens || 0,
              totalCostUsd: m.totalCostUsd || 0
            });
          }
        });
      }
    } catch (e) {
      console.warn('Could not load LLM router state from localStorage:', e);
    }
  }

  private saveState(): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      localStorage.setItem(STORAGE_KEYS_CONFIG, JSON.stringify(Array.from(this.keys.values())));
      localStorage.setItem(STORAGE_ROUTER_METRICS, JSON.stringify(Array.from(this.metrics.values())));
    } catch (e) {
      console.warn('Could not save LLM router state:', e);
    }
  }

  /**
   * Refreshes real-time metrics and evaluations from sliding windows
   */
  private refreshMetrics(): void {
    const now = Date.now();
    for (const [keyId, config] of this.keys.entries()) {
      const window = this.windows.get(keyId);
      const metric = this.metrics.get(keyId);
      if (!window || !metric) continue;

      const rpm = window.getRPM(now);
      const tpm = window.getTPM(now);
      const rpd = window.getDailyRequests(now);
      const tpd = window.getDailyTokens(now);

      metric.requestsInCurrentMinute = rpm;
      metric.tokensInCurrentMinute = tpm;
      metric.requestsToday = rpd;
      metric.tokensToday = tpd;

      // Check Cooldown expiration
      if (metric.cooldownUntil) {
        const cooldownMs = new Date(metric.cooldownUntil).getTime();
        if (now >= cooldownMs) {
          metric.cooldownUntil = undefined;
          if (metric.status === 'RATE_LIMITED') {
            metric.status = 'HEALTHY';
            metric.statusReason = undefined;
          }
        }
      }

      // Check Quota limits
      if (config.quotas.monthlyBudgetUsd && metric.totalCostUsd >= config.quotas.monthlyBudgetUsd) {
        metric.status = 'QUOTA_EXHAUSTED';
        metric.statusReason = `Monthly budget ceiling of $${config.quotas.monthlyBudgetUsd} reached.`;
      } else if (!config.enabled) {
        metric.status = 'DISABLED';
        metric.statusReason = 'Key has been manually disabled by administrator.';
      } else if (metric.status !== 'RATE_LIMITED' && metric.status !== 'DEGRADED') {
        metric.status = 'HEALTHY';
        metric.statusReason = undefined;
      }
    }
  }

  /**
   * Evaluates key eligibility based on real-time limits, budget and health
   */
  public isKeyEligible(key: LLMKeyConfig, metric: KeyRealtimeMetrics, window: KeySlidingWindow): boolean {
    if (!key.enabled || metric.status === 'DISABLED' || metric.status === 'QUOTA_EXHAUSTED') {
      return false;
    }

    // Cooldown check
    if (metric.cooldownUntil && new Date(metric.cooldownUntil).getTime() > Date.now()) {
      return false;
    }

    // RPM check
    if (window.getRPM() >= key.rateLimits.rpm) {
      return false;
    }

    // TPM check
    if (window.getTPM() >= key.rateLimits.tpm) {
      return false;
    }

    // Daily limit check
    if (window.getDailyRequests() >= key.rateLimits.rpd) {
      return false;
    }

    return true;
  }

  /**
   * Core Routing Algorithm: Selects the best key for the incoming request
   */
  public selectKey(
    request: RouterExecutionRequest = { prompt: '' },
    excludedKeyIds: Set<string> = new Set()
  ): { key: LLMKeyConfig; metric: KeyRealtimeMetrics } {
    this.refreshMetrics();

    // 1. Gather all candidates that pass basic constraints
    const candidates: Array<{ key: LLMKeyConfig; metric: KeyRealtimeMetrics; window: KeySlidingWindow }> = [];

    for (const [id, key] of this.keys.entries()) {
      if (excludedKeyIds.has(id)) continue;
      if (request.preferredProvider && key.provider !== request.preferredProvider) continue;
      if (request.requiredTier && key.priority !== request.requiredTier) continue;

      const metric = this.metrics.get(id);
      const window = this.windows.get(id);
      if (!metric || !window) continue;

      if (this.isKeyEligible(key, metric, window)) {
        candidates.push({ key, metric, window });
      }
    }

    if (candidates.length === 0) {
      // If no keys in primary tier or requested provider, search without preferred provider constraint
      if (request.preferredProvider) {
        return this.selectKey({ ...request, preferredProvider: undefined }, excludedKeyIds);
      }
      throw new ProviderAPIError('All configured LLM API keys are currently rate-limited, exhausted, or in cooldown.', 429);
    }

    // 2. Partition by Priority Tier (Tier 1 is highest priority, followed by Tier 2, etc.)
    candidates.sort((a, b) => a.key.priority - b.key.priority);
    const topPriority = candidates[0].key.priority;
    const tierCandidates = candidates.filter(c => c.key.priority === topPriority);

    // 3. Apply Routing Strategy within top priority tier
    let selected = tierCandidates[0];

    switch (this.activeStrategy) {
      case 'least_utilized': {
        // Pick key with lowest TPM used in the current 60s window
        tierCandidates.sort((a, b) => a.window.getTPM() - b.window.getTPM());
        selected = tierCandidates[0];
        break;
      }

      case 'round_robin': {
        // Sequential rotation in this priority tier
        const lastIdx = this.roundRobinIndices.get(topPriority) || 0;
        const nextIdx = (lastIdx + 1) % tierCandidates.length;
        this.roundRobinIndices.set(topPriority, nextIdx);
        selected = tierCandidates[nextIdx];
        break;
      }

      case 'cost_optimized': {
        // Pick key with lowest combined token cost
        tierCandidates.sort((a, b) => {
          const costA = a.key.quotas.costPer1kPromptTokens + a.key.quotas.costPer1kCompletionTokens;
          const costB = b.key.quotas.costPer1kPromptTokens + b.key.quotas.costPer1kCompletionTokens;
          return costA - costB;
        });
        selected = tierCandidates[0];
        break;
      }

      case 'priority_weighted':
      default: {
        // Weighted remaining capacity score:
        // score = (1 - (currentRPM / maxRPM)) * weight
        let maxScore = -1;
        for (const candidate of tierCandidates) {
          const rpmUsed = candidate.window.getRPM();
          const rpmLimit = candidate.key.rateLimits.rpm || 1;
          const remainingHeadroom = Math.max(0.05, 1 - (rpmUsed / rpmLimit));
          const score = remainingHeadroom * candidate.key.weight;

          if (score > maxScore) {
            maxScore = score;
            selected = candidate;
          }
        }
        break;
      }
    }

    return { key: selected.key, metric: selected.metric };
  }

  /**
   * Execute request with automated failover and telemetry logging
   */
  public async completePrompt(
    request: RouterExecutionRequest
  ): Promise<RouterExecutionResponse> {
    const maxAttempts = Math.min(4, this.keys.size);
    const excludedKeyIds = new Set<string>();
    const failovers: Array<{ keyId: string; reason: string; statusCode?: number }> = [];

    let attempt = 0;

    while (attempt < maxAttempts) {
      attempt++;
      let selected: { key: LLMKeyConfig; metric: KeyRealtimeMetrics };

      try {
        selected = this.selectKey(request, excludedKeyIds);
      } catch (err: any) {
        // No keys available
        throw new ProviderAPIError(
          `Router failover exhausted (${attempt - 1} attempts failed). ${err.message}`,
          429
        );
      }

      const { key, metric } = selected;
      const window = this.windows.get(key.id)!;

      try {
        const result = await executeProviderCall(
          key,
          request.prompt,
          request.systemInstruction,
          request.temperature ?? 0.7,
          request.maxTokens ?? 1024
        );

        // Record successful usage
        const totalTokens = result.promptTokens + result.completionTokens;
        window.recordUsage(totalTokens);

        const cost = calculateTokenCost(
          key.model,
          result.promptTokens,
          result.completionTokens,
          key.quotas.costPer1kPromptTokens,
          key.quotas.costPer1kCompletionTokens
        );

        metric.totalRequests += 1;
        metric.successfulRequests += 1;
        metric.totalPromptTokens += result.promptTokens;
        metric.totalCompletionTokens += result.completionTokens;
        metric.totalCostUsd = Number((metric.totalCostUsd + cost).toFixed(6));
        metric.lastUsedAt = new Date().toISOString();
        metric.consecutiveErrors = 0;
        metric.averageLatencyMs = metric.averageLatencyMs === 0 
          ? result.latencyMs 
          : Math.round((metric.averageLatencyMs * 0.8) + (result.latencyMs * 0.2));

        if (metric.status === 'DEGRADED') {
          metric.status = 'HEALTHY';
        }

        this.logAudit({
          id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          timestamp: new Date().toISOString(),
          keyId: key.id,
          provider: key.provider,
          model: key.model,
          taskType: request.taskType || 'chat',
          status: 'SUCCESS',
          latencyMs: result.latencyMs,
          tokens: totalTokens,
          costUsd: cost
        });

        this.saveState();

        return {
          content: result.text,
          keyUsed: {
            id: key.id,
            name: key.name,
            provider: key.provider,
            model: key.model,
            priority: key.priority
          },
          metrics: {
            promptTokens: result.promptTokens,
            completionTokens: result.completionTokens,
            totalTokens,
            estimatedCostUsd: cost,
            latencyMs: result.latencyMs
          },
          routingTrace: {
            attempts: attempt,
            failovers,
            strategyUsed: this.activeStrategy
          }
        };

      } catch (err: any) {
        metric.totalRequests += 1;
        metric.failedRequests += 1;
        metric.consecutiveErrors += 1;
        metric.lastError = {
          statusCode: err.statusCode,
          message: err.message,
          timestamp: new Date().toISOString()
        };

        const isRateLimit = err.isRateLimit || err.statusCode === 429;
        const isQuota = err.isQuotaExceeded;

        if (isRateLimit) {
          metric.status = 'RATE_LIMITED';
          // 60-second cooldown on rate limits
          metric.cooldownUntil = new Date(Date.now() + 60000).toISOString();
          metric.statusReason = `Hit Rate Limit (HTTP 429). Cooldown for 60s.`;
        } else if (isQuota) {
          metric.status = 'QUOTA_EXHAUSTED';
          metric.statusReason = `Provider reported quota / balance exhaustion.`;
        } else if (metric.consecutiveErrors >= 3) {
          metric.status = 'DEGRADED';
          metric.statusReason = `Repeated errors (${metric.consecutiveErrors} consecutive).`;
        }

        failovers.push({
          keyId: key.id,
          reason: err.message,
          statusCode: err.statusCode
        });

        this.logAudit({
          id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          timestamp: new Date().toISOString(),
          keyId: key.id,
          provider: key.provider,
          model: key.model,
          taskType: request.taskType || 'chat',
          status: 'FAILOVER',
          latencyMs: 0,
          tokens: 0,
          costUsd: 0,
          failoverReason: err.message
        });

        excludedKeyIds.add(key.id);
        this.saveState();
        // Continue loop to failover to next key
      }
    }

    throw new ProviderAPIError(`All eligible keys failed after ${attempt} failover attempts.`, 503);
  }

  private logAudit(entry: RouterAuditLogEntry): void {
    this.auditLogs.unshift(entry);
    if (this.auditLogs.length > 100) {
      this.auditLogs.pop();
    }
  }

  // ---------------------------------------------------------------------------
  // Management & Administrative APIs
  // ---------------------------------------------------------------------------

  public getKeys(): LLMKeyConfig[] {
    return Array.from(this.keys.values());
  }

  public getMetrics(): KeyRealtimeMetrics[] {
    this.refreshMetrics();
    return Array.from(this.metrics.values());
  }

  public getAuditLogs(): RouterAuditLogEntry[] {
    return this.auditLogs;
  }

  public getActiveStrategy(): RoutingStrategy {
    return this.activeStrategy;
  }

  public setStrategy(strategy: RoutingStrategy): void {
    this.activeStrategy = strategy;
  }

  public addKey(config: LLMKeyConfig): void {
    this.keys.set(config.id, config);
    this.initializeKeyMetrics(config.id);
    this.saveState();
  }

  public updateKey(id: string, updates: Partial<LLMKeyConfig>): void {
    const existing = this.keys.get(id);
    if (!existing) return;
    this.keys.set(id, { ...existing, ...updates });
    this.saveState();
  }

  public deleteKey(id: string): void {
    this.keys.delete(id);
    this.metrics.delete(id);
    this.windows.delete(id);
    this.saveState();
  }

  public toggleKey(id: string, enabled?: boolean): void {
    const key = this.keys.get(id);
    if (!key) return;
    key.enabled = enabled !== undefined ? enabled : !key.enabled;
    this.saveState();
    this.refreshMetrics();
  }

  public resetKeyMetrics(id?: string): void {
    if (id) {
      this.windows.get(id)?.reset();
      const m = this.metrics.get(id);
      if (m) {
        m.requestsInCurrentMinute = 0;
        m.tokensInCurrentMinute = 0;
        m.requestsToday = 0;
        m.tokensToday = 0;
        m.totalRequests = 0;
        m.successfulRequests = 0;
        m.failedRequests = 0;
        m.totalPromptTokens = 0;
        m.totalCompletionTokens = 0;
        m.totalCostUsd = 0;
        m.consecutiveErrors = 0;
        m.cooldownUntil = undefined;
        m.status = 'HEALTHY';
        m.statusReason = undefined;
      }
    } else {
      for (const [keyId] of this.keys.entries()) {
        this.resetKeyMetrics(keyId);
      }
      this.auditLogs = [];
    }
    this.saveState();
  }

  public getSystemHealth(): RouterSystemHealth {
    this.refreshMetrics();
    const metricsArr = Array.from(this.metrics.values());
    const keysArr = Array.from(this.keys.values());

    let sysRpm = 0;
    let sysTpm = 0;
    let spendToday = 0;
    let totalTokens = 0;
    let healthyCount = 0;
    let rateLimitedCount = 0;
    let exhaustedCount = 0;

    metricsArr.forEach(m => {
      sysRpm += m.requestsInCurrentMinute;
      sysTpm += m.tokensInCurrentMinute;
      spendToday += m.totalCostUsd;
      totalTokens += (m.totalPromptTokens + m.totalCompletionTokens);
      if (m.status === 'HEALTHY') healthyCount++;
      if (m.status === 'RATE_LIMITED') rateLimitedCount++;
      if (m.status === 'QUOTA_EXHAUSTED') exhaustedCount++;
    });

    return {
      activeKeysCount: keysArr.filter(k => k.enabled).length,
      totalConfiguredKeys: keysArr.length,
      healthyKeys: healthyCount,
      rateLimitedKeys: rateLimitedCount,
      exhaustedKeys: exhaustedCount,
      systemRPM: sysRpm,
      systemTPM: sysTpm,
      totalSpendTodayUsd: Number(spendToday.toFixed(4)),
      lifetimeTokens: totalTokens,
      activeStrategy: this.activeStrategy
    };
  }
}

// Export singleton helper
export const routerEngine = SmartLLMRouter.getInstance();
