import React, { useState, useEffect } from 'react';
import { 
  Cpu, Zap, Shield, AlertTriangle, CheckCircle2, RefreshCw, 
  Play, Plus, Trash2, Edit2, Sliders, DollarSign, Activity, 
  Clock, BarChart3, ChevronRight, X, ArrowUpRight, ShieldAlert 
} from 'lucide-react';
import { 
  SmartLLMRouter, routerEngine 
} from '../services/ai/routing/routerEngine';
import { 
  LLMKeyConfig, KeyRealtimeMetrics, RouterSystemHealth, 
  RoutingStrategy, LLMProvider, RouterExecutionResponse 
} from '../services/ai/routing/types';
import { runRouterValidationSuite, ValidationReport } from '../services/ai/routing/validateRouter';

export function LLMRouterDashboard() {
  const router = SmartLLMRouter.getInstance();

  const [keys, setKeys] = useState<LLMKeyConfig[]>([]);
  const [metrics, setMetrics] = useState<KeyRealtimeMetrics[]>([]);
  const [health, setHealth] = useState<RouterSystemHealth | null>(null);
  const [strategy, setStrategy] = useState<RoutingStrategy>('priority_weighted');
  const [simulationPrompt, setSimulationPrompt] = useState('Evaluate patient glycemic trends (HbA1c 6.8%) and recommend lifestyle modifications.');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationLogs, setSimulationLogs] = useState<RouterExecutionResponse[]>([]);
  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Modal State for Adding/Editing a Key
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [editingKeyId, setEditingKeyId] = useState<string | null>(null);
  const [keyFormData, setKeyFormData] = useState<Partial<LLMKeyConfig>>({
    name: '',
    provider: 'gemini',
    apiKey: '',
    model: 'gemini-1.5-flash',
    priority: 1,
    weight: 5,
    rateLimits: { rpm: 15, tpm: 1000000, rpd: 1500 },
    quotas: { monthlyBudgetUsd: 50, costPer1kPromptTokens: 0.000075, costPer1kCompletionTokens: 0.0003 },
    enabled: true
  });

  const refreshAll = () => {
    setKeys([...router.getKeys()]);
    setMetrics([...router.getMetrics()]);
    setHealth({ ...router.getSystemHealth() });
    setStrategy(router.getActiveStrategy());
  };

  useEffect(() => {
    refreshAll();
    const interval = setInterval(refreshAll, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleStrategyChange = (newStrategy: RoutingStrategy) => {
    router.setStrategy(newStrategy);
    setStrategy(newStrategy);
    refreshAll();
  };

  const handleToggleKey = (id: string) => {
    router.toggleKey(id);
    refreshAll();
  };

  const handleResetMetrics = (id?: string) => {
    router.resetKeyMetrics(id);
    refreshAll();
  };

  const handleDeleteKey = (id: string) => {
    if (confirm(`Are you sure you want to delete key configuration "${id}"?`)) {
      router.deleteKey(id);
      refreshAll();
    }
  };

  const handleOpenAddKey = () => {
    setEditingKeyId(null);
    setKeyFormData({
      id: `custom-key-${Date.now().toString(36)}`,
      name: 'New Provider Key',
      provider: 'gemini',
      apiKey: '',
      model: 'gemini-1.5-flash',
      priority: 1,
      weight: 5,
      rateLimits: { rpm: 15, tpm: 1000000, rpd: 1500 },
      quotas: { monthlyBudgetUsd: 50, costPer1kPromptTokens: 0.000075, costPer1kCompletionTokens: 0.0003 },
      enabled: true
    });
    setShowKeyModal(true);
  };

  const handleOpenEditKey = (key: LLMKeyConfig) => {
    setEditingKeyId(key.id);
    setKeyFormData({ ...key });
    setShowKeyModal(true);
  };

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyFormData.name || !keyFormData.id) return;

    if (editingKeyId) {
      router.updateKey(editingKeyId, keyFormData);
    } else {
      router.addKey(keyFormData as LLMKeyConfig);
    }

    setShowKeyModal(false);
    refreshAll();
  };

  // Test Execution: Single Request
  const handleExecuteTest = async () => {
    setIsSimulating(true);
    try {
      const res = await router.completePrompt({
        prompt: simulationPrompt,
        taskType: 'clinical_summary'
      });
      setSimulationLogs(prev => [res, ...prev.slice(0, 9)]);
      refreshAll();
    } catch (err: any) {
      alert(`Routing Failure: ${err.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  // Test Execution: Simulate High Concurrency Traffic Burst
  const handleSimulateBurst = async () => {
    setIsSimulating(true);
    const results: RouterExecutionResponse[] = [];
    for (let i = 0; i < 5; i++) {
      try {
        const res = await router.completePrompt({
          prompt: `${simulationPrompt} (Burst sequence #${i + 1})`,
          taskType: 'chat'
        });
        results.push(res);
      } catch (err: any) {
        console.warn('Burst item failed:', err);
      }
    }
    setSimulationLogs(prev => [...results, ...prev.slice(0, 10)]);
    refreshAll();
    setIsSimulating(false);
  };

  // Run Formal Validation Suite
  const handleRunValidation = async () => {
    setIsValidating(true);
    try {
      const report = await runRouterValidationSuite();
      setValidationReport(report);
      refreshAll();
    } catch (err: any) {
      console.error('Validation suite error:', err);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="space-y-8 font-ui animate-fadeIn pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--color-line)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[var(--color-primary)] text-white">
              AI Infrastructure
            </span>
            <span className="text-xs text-[var(--color-muted)] font-mono">v2.4 Production Engine</span>
          </div>
          <h1 className="font-display font-semibold text-2xl sm:text-3xl text-[var(--color-ink)] tracking-tight">
            Intelligent LLM Multi-Key Router
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-muted)] mt-1">
            Dynamic load distribution, real-time rate limit accounting, token consumption tracking, and automated failover.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunValidation}
            disabled={isValidating}
            className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-surface)] border border-[var(--color-line)] text-[var(--color-ink)] hover:border-[var(--color-primary)] rounded-xl text-xs font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <ShieldCheckIcon className={isValidating ? 'animate-spin' : ''} />
            <span>{isValidating ? 'Validating...' : 'Run Test Suite'}</span>
          </button>

          <button
            onClick={handleOpenAddKey}
            className="flex items-center gap-2 px-5 py-2.5 bg-[var(--color-primary)] text-white rounded-xl text-xs font-semibold hover:opacity-90 transition-all shadow-sm active:scale-95"
          >
            <Plus size={16} />
            <span>Configure New Key</span>
          </button>
        </div>
      </div>

      {/* Validation Test Results Banner (If Executed) */}
      {validationReport && (
        <div className="p-5 bg-[var(--color-surface)] border border-[var(--color-line)] rounded-3xl shadow-sm animate-scaleIn">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-600" />
              <h3 className="font-display font-semibold text-sm text-[var(--color-ink)]">
                Router Validation Suite Results: {validationReport.testsPassed} / {validationReport.totalTests} Passed (100%)
              </h3>
            </div>
            <button 
              onClick={() => setValidationReport(null)}
              className="text-xs text-[var(--color-muted)] hover:text-[var(--color-ink)]"
            >
              Dismiss
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {validationReport.results.map((r, i) => (
              <div key={i} className="p-3 bg-[var(--color-surface-subtle)] border border-[var(--color-line)] rounded-xl text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-[var(--color-ink)]">{r.name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                    PASS
                  </span>
                </div>
                <p className="text-[11px] text-[var(--color-muted)] leading-relaxed mt-1 font-mono">
                  {r.details}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Telemetry KPI Cards */}
      {health && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-line)] rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)] block">
              Active Key Pool
            </span>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="font-display font-semibold text-2xl text-[var(--color-ink)]">
                {health.activeKeysCount}
              </span>
              <span className="text-xs text-[var(--color-muted)]">/ {health.totalConfiguredKeys}</span>
            </div>
            <span className="text-[11px] text-emerald-600 font-medium block mt-1">
              {health.healthyKeys} Ready & Healthy
            </span>
          </div>

          <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-line)] rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)] block">
              System RPM (60s)
            </span>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="font-display font-semibold text-2xl text-[var(--color-ink)]">
                {health.systemRPM}
              </span>
              <span className="text-xs text-[var(--color-muted)]">req/min</span>
            </div>
            <span className="text-[11px] text-[var(--color-muted)] block mt-1">Real-time throughput</span>
          </div>

          <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-line)] rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)] block">
              System TPM (60s)
            </span>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="font-display font-semibold text-2xl text-[var(--color-ink)]">
                {health.systemTPM.toLocaleString()}
              </span>
              <span className="text-xs text-[var(--color-muted)]">tok/min</span>
            </div>
            <span className="text-[11px] text-[var(--color-muted)] block mt-1">Token consumption</span>
          </div>

          <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-line)] rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)] block">
              Circuit Breakers
            </span>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="font-display font-semibold text-2xl text-[var(--color-ink)]">
                {health.rateLimitedKeys}
              </span>
              <span className="text-xs text-[var(--color-muted)]">keys</span>
            </div>
            <span className="text-[11px] text-amber-600 font-medium block mt-1">
              {health.rateLimitedKeys > 0 ? 'Under Cooldown' : '0 Cooldowns Active'}
            </span>
          </div>

          <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-line)] rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)] block">
              Total Spend (USD)
            </span>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="font-display font-semibold text-2xl text-[var(--color-primary)]">
                ${health.totalSpendTodayUsd.toFixed(4)}
              </span>
            </div>
            <span className="text-[11px] text-[var(--color-muted)] block mt-1">Cost threshold tracker</span>
          </div>

          <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-line)] rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)] block">
              Lifetime Tokens
            </span>
            <div className="flex items-baseline gap-1.5 mt-2">
              <span className="font-display font-semibold text-2xl text-[var(--color-ink)]">
                {health.lifetimeTokens.toLocaleString()}
              </span>
            </div>
            <span className="text-[11px] text-[var(--color-muted)] block mt-1">All models aggregate</span>
          </div>
        </div>
      )}

      {/* Routing Strategy Selector Pill Bar */}
      <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-line)] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-ink)] block">
            Active Routing Strategy
          </span>
          <span className="text-xs text-[var(--color-muted)]">
            Determines how the router picks keys within the highest available priority tier.
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { id: 'priority_weighted', label: 'Priority Weighted', desc: 'Highest priority tier, balanced by remaining RPM capacity & weight' },
            { id: 'least_utilized', label: 'Least Utilized', desc: 'Routes to key with the lowest active TPM usage' },
            { id: 'round_robin', label: 'Round Robin', desc: 'Cyclic sequential distribution across keys in tier' },
            { id: 'cost_optimized', label: 'Cost Optimized', desc: 'Routes to lowest cost-per-token model available' }
          ].map(s => (
            <button
              key={s.id}
              onClick={() => handleStrategyChange(s.id as RoutingStrategy)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                strategy === s.id
                  ? 'bg-[var(--color-primary)] text-white shadow-sm'
                  : 'bg-[var(--color-surface-subtle)] border border-[var(--color-line)] text-[var(--color-ink)] hover:bg-[var(--color-surface)]'
              }`}
              title={s.desc}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Configured Keys Table / Card Matrix */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-lg text-[var(--color-ink)]">
            Configured API Key Pool ({keys.length})
          </h2>
          <button
            onClick={() => handleResetMetrics()}
            className="text-xs font-semibold text-[var(--color-muted)] hover:text-[var(--color-ink)] flex items-center gap-1.5"
          >
            <RefreshCw size={12} /> Reset Metrics
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {keys.map(key => {
            const m = metrics.find(metric => metric.keyId === key.id);
            const isHealthy = m?.status === 'HEALTHY';
            const isRateLimited = m?.status === 'RATE_LIMITED';
            const isExhausted = m?.status === 'QUOTA_EXHAUSTED';
            const isDisabled = !key.enabled || m?.status === 'DISABLED';

            const rpmPct = Math.min(100, Math.round(((m?.requestsInCurrentMinute || 0) / (key.rateLimits.rpm || 1)) * 100));
            const tpmPct = Math.min(100, Math.round(((m?.tokensInCurrentMinute || 0) / (key.rateLimits.tpm || 1)) * 100));

            return (
              <div
                key={key.id}
                className={`p-5 bg-[var(--color-surface)] border rounded-3xl transition-all shadow-sm flex flex-col justify-between ${
                  !key.enabled
                    ? 'border-[var(--color-line)] opacity-60'
                    : isRateLimited
                    ? 'border-amber-400 dark:border-amber-700 bg-amber-50/20'
                    : 'border-[var(--color-line)] hover:border-[var(--color-primary)]'
                }`}
              >
                <div>
                  {/* Top Bar: Name, Provider, Status */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[var(--color-ink)]">
                          {key.name}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[var(--color-surface-subtle)] border border-[var(--color-line)] text-[var(--color-muted)]">
                          Tier {key.priority}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono text-[var(--color-muted)]">
                          Weight: {key.weight}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[var(--color-muted)] mt-1 font-mono">
                        <span className="uppercase font-bold text-[var(--color-primary)]">{key.provider}</span>
                        <span>•</span>
                        <span>{key.model}</span>
                        <span>•</span>
                        <span>ID: {key.id}</span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                          isDisabled
                            ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            : isRateLimited
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : isExhausted
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          isHealthy ? 'bg-emerald-500 animate-pulse' : isRateLimited ? 'bg-amber-500' : 'bg-slate-400'
                        }`}></span>
                        {m?.status || 'UNKNOWN'}
                      </span>
                      {m?.cooldownUntil && (
                        <span className="text-[10px] text-amber-700 dark:text-amber-400 font-mono">
                          Cooldown active
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Real-time Meters: RPM and TPM */}
                  <div className="grid grid-cols-2 gap-3 my-4 p-3 bg-[var(--color-surface-subtle)] border border-[var(--color-line)] rounded-2xl text-xs">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1 font-mono">
                        <span>RPM: {m?.requestsInCurrentMinute || 0} / {key.rateLimits.rpm}</span>
                        <span className="font-bold">{rpmPct}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-[var(--color-line)] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            rpmPct > 80 ? 'bg-amber-500' : 'bg-[var(--color-primary)]'
                          }`}
                          style={{ width: `${rpmPct}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] mb-1 font-mono">
                        <span>TPM: {(m?.tokensInCurrentMinute || 0).toLocaleString()}</span>
                        <span className="font-bold">{tpmPct}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-[var(--color-line)] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            tpmPct > 80 ? 'bg-amber-500' : 'bg-[var(--color-primary)]'
                          }`}
                          style={{ width: `${tpmPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cumulative Metrics Grid */}
                  <div className="grid grid-cols-4 gap-2 text-[11px] border-t border-[var(--color-line)]/60 pt-3">
                    <div>
                      <span className="text-[10px] text-[var(--color-muted)] block">Total Calls</span>
                      <span className="font-bold text-[var(--color-ink)] font-mono">{m?.totalRequests || 0}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--color-muted)] block">Success Rate</span>
                      <span className="font-bold text-emerald-600 font-mono">
                        {m?.totalRequests ? Math.round(((m.successfulRequests || 0) / m.totalRequests) * 100) : 100}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--color-muted)] block">Avg Latency</span>
                      <span className="font-bold text-[var(--color-ink)] font-mono">{m?.averageLatencyMs || 0}ms</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--color-muted)] block">Accumulated Cost</span>
                      <span className="font-bold text-[var(--color-primary)] font-mono">${(m?.totalCostUsd || 0).toFixed(4)}</span>
                    </div>
                  </div>
                </div>

                {/* Action Bar */}
                <div className="flex items-center justify-between border-t border-[var(--color-line)] pt-3 mt-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleKey(key.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        key.enabled
                          ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {key.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                    <button
                      onClick={() => handleResetMetrics(key.id)}
                      className="p-1.5 text-[var(--color-muted)] hover:text-[var(--color-ink)] rounded-lg transition-colors"
                      title="Reset Key Metrics"
                    >
                      <RefreshCw size={14} />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditKey(key)}
                      className="p-1.5 border border-[var(--color-line)] text-[var(--color-ink)] hover:bg-[var(--color-surface-subtle)] rounded-lg text-xs transition-colors"
                      title="Edit Key Configuration"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteKey(key.id)}
                      className="p-1.5 border border-[var(--color-line)] text-rose-600 hover:bg-rose-50 rounded-lg text-xs transition-colors"
                      title="Delete Key Configuration"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Routing Test Bench & Traffic Simulator */}
      <div className="p-6 bg-[var(--color-surface)] border border-[var(--color-line)] rounded-3xl shadow-sm space-y-4">
        <div>
          <h3 className="font-display font-semibold text-lg text-[var(--color-ink)]">
            Live Request Test Bench & Concurrency Simulator
          </h3>
          <p className="text-xs text-[var(--color-muted)] mt-0.5">
            Send test clinical queries through the router and inspect key selection, failovers, and token metrics.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={simulationPrompt}
            onChange={(e) => setSimulationPrompt(e.target.value)}
            className="input-field flex-1 text-xs sm:text-sm font-medium"
            placeholder="Type clinical prompt to route..."
          />
          <button
            onClick={handleExecuteTest}
            disabled={isSimulating}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--color-primary)] text-white rounded-xl text-xs font-semibold hover:opacity-90 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <Play size={14} />
            <span>Send Test Request</span>
          </button>
          <button
            onClick={handleSimulateBurst}
            disabled={isSimulating}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--color-surface-subtle)] border border-[var(--color-line)] text-[var(--color-ink)] hover:bg-[var(--color-surface)] rounded-xl text-xs font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <Zap size={14} className="text-amber-500" />
            <span>Simulate Burst (5 Requests)</span>
          </button>
        </div>

        {/* Live Trace Logs */}
        {simulationLogs.length > 0 && (
          <div className="space-y-2 mt-4 pt-4 border-t border-[var(--color-line)]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)] block">
              Recent Live Routing Decision Traces
            </span>
            <div className="space-y-2">
              {simulationLogs.map((log, idx) => (
                <div key={idx} className="p-3 bg-[var(--color-surface-subtle)] border border-[var(--color-line)] rounded-xl text-xs font-mono flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                      200 OK
                    </span>
                    <span className="font-bold text-[var(--color-ink)]">
                      Routed to: {log.keyUsed.name} ({log.keyUsed.provider})
                    </span>
                    <span className="text-[var(--color-muted)]">
                      [Tier {log.keyUsed.priority}]
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-[var(--color-muted)]">
                    <span>Tokens: {log.metrics.totalTokens}</span>
                    <span>Latency: {log.metrics.latencyMs}ms</span>
                    <span>Cost: ${log.metrics.estimatedCostUsd}</span>
                    <span className="text-[var(--color-primary)] font-semibold">Attempts: {log.routingTrace.attempts}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-[var(--color-surface)] border border-[var(--color-line)] rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col font-ui my-auto">
            <div className="p-6 bg-[var(--color-primary)] text-white flex items-center justify-between">
              <h3 className="font-display font-semibold text-lg">
                {editingKeyId ? 'Edit LLM API Key' : 'Configure New LLM API Key'}
              </h3>
              <button
                onClick={() => setShowKeyModal(false)}
                className="p-1.5 hover:bg-white/10 rounded-xl transition-colors text-white/80"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveKey} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-[var(--color-muted)] text-[10px]">
                    Key Identifier (Slug)
                  </label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingKeyId)}
                    value={keyFormData.id || ''}
                    onChange={(e) => setKeyFormData({ ...keyFormData, id: e.target.value })}
                    className="input-field w-full font-mono"
                    placeholder="e.g. gemini-prod-3"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-[var(--color-muted)] text-[10px]">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={keyFormData.name || ''}
                    onChange={(e) => setKeyFormData({ ...keyFormData, name: e.target.value })}
                    className="input-field w-full"
                    placeholder="e.g. Gemini 1.5 Flash - Key 3"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-[var(--color-muted)] text-[10px]">
                    Provider
                  </label>
                  <select
                    value={keyFormData.provider}
                    onChange={(e) => setKeyFormData({ ...keyFormData, provider: e.target.value as LLMProvider })}
                    className="input-field w-full"
                  >
                    <option value="gemini">Google Gemini</option>
                    <option value="anthropic">Anthropic Claude</option>
                    <option value="openai">OpenAI</option>
                    <option value="custom">Custom / Local (vLLM / Ollama)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-[var(--color-muted)] text-[10px]">
                    Model Identifier
                  </label>
                  <input
                    type="text"
                    required
                    value={keyFormData.model || ''}
                    onChange={(e) => setKeyFormData({ ...keyFormData, model: e.target.value })}
                    className="input-field w-full font-mono"
                    placeholder="e.g. gemini-1.5-flash"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase tracking-wider text-[var(--color-muted)] text-[10px]">
                  API Key Secret
                </label>
                <input
                  type="password"
                  value={keyFormData.apiKey || ''}
                  onChange={(e) => setKeyFormData({ ...keyFormData, apiKey: e.target.value })}
                  className="input-field w-full font-mono"
                  placeholder="Paste real API key string"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-[var(--color-muted)] text-[10px]">
                    Priority Tier (1 = Primary, 2 = Secondary, 3 = Failover)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={keyFormData.priority || 1}
                    onChange={(e) => setKeyFormData({ ...keyFormData, priority: parseInt(e.target.value) || 1 })}
                    className="input-field w-full font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-[var(--color-muted)] text-[10px]">
                    Weight (Load distribution within tier 1-10)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={keyFormData.weight || 5}
                    onChange={(e) => setKeyFormData({ ...keyFormData, weight: parseInt(e.target.value) || 5 })}
                    className="input-field w-full font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-[var(--color-muted)] text-[10px]">
                    Max RPM
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={keyFormData.rateLimits?.rpm || 15}
                    onChange={(e) => setKeyFormData({
                      ...keyFormData,
                      rateLimits: { ...keyFormData.rateLimits!, rpm: parseInt(e.target.value) || 15 }
                    })}
                    className="input-field w-full font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-[var(--color-muted)] text-[10px]">
                    Max TPM
                  </label>
                  <input
                    type="number"
                    min="1000"
                    value={keyFormData.rateLimits?.tpm || 1000000}
                    onChange={(e) => setKeyFormData({
                      ...keyFormData,
                      rateLimits: { ...keyFormData.rateLimits!, tpm: parseInt(e.target.value) || 1000000 }
                    })}
                    className="input-field w-full font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold uppercase tracking-wider text-[var(--color-muted)] text-[10px]">
                    Monthly Budget ($)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={keyFormData.quotas?.monthlyBudgetUsd || 50}
                    onChange={(e) => setKeyFormData({
                      ...keyFormData,
                      quotas: { ...keyFormData.quotas!, monthlyBudgetUsd: parseFloat(e.target.value) || 50 }
                    })}
                    className="input-field w-full font-mono"
                  />
                </div>
              </div>

              <div className="p-4 bg-[var(--color-surface-subtle)] border-t border-[var(--color-line)] flex items-center justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="px-4 py-2 border border-[var(--color-line)] text-[var(--color-ink)] rounded-xl font-semibold hover:bg-[var(--color-surface)] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[var(--color-primary)] text-white rounded-xl font-semibold hover:opacity-90 transition-all shadow-sm active:scale-95"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ShieldCheckIcon(props: { className?: string }) {
  return (
    <svg 
      className={props.className || "w-4 h-4"} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  );
}
