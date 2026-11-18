import React from 'react';
import { OlmeraWordmark } from '../brand/OlmeraWordmark';

export interface MedicareWaveLoaderProps {
  /** Visual presentation mode */
  variant?: 'fullscreen' | 'card' | 'inline' | 'button' | 'overlay';
  /** Primary loading message */
  text?: string;
  /** Secondary subtitle message (only in fullscreen or card) */
  subtitle?: string;
  /** Size scaling for inline/card */
  size?: 'sm' | 'md' | 'lg';
  /** Additional custom class names */
  className?: string;
}

export function MedicareWaveLoader({
  variant = 'card',
  text,
  subtitle,
  size = 'md',
  className = ''
}: MedicareWaveLoaderProps) {
  // SVG Dimensions based on size
  const dimensions = {
    sm: { width: 100, height: 28, strokeWidth: 2 },
    md: { width: 140, height: 38, strokeWidth: 2.5 },
    lg: { width: 180, height: 48, strokeWidth: 3 }
  }[size];

  // Authentic clinical ECG Heartbeat waveform path
  // Baseline (25) -> P wave (21) -> Q dip (28) -> R peak (4) -> S dip (44) -> T wave (18) -> Baseline (25)
  const ecgPath = 'M 0,25 L 24,25 Q 29,25 32,20 Q 35,16 38,25 L 48,25 L 52,28 L 57,4 L 63,44 L 68,20 L 72,25 L 80,25 Q 86,18 92,25 L 120,25';

  // SVG Wave Element
  const waveSvg = (
    <div className="relative inline-flex items-center justify-center animate-heartbeat">
      <svg
        viewBox="0 0 120 48"
        width={dimensions.width}
        height={dimensions.height}
        className="overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="medicare-wave-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
            <stop offset="45%" stopColor="var(--color-primary)" stopOpacity="0.8" />
            <stop offset="55%" stopColor="var(--color-accent)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.9" />
          </linearGradient>
          <filter id="wave-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Faint static clinical track line */}
        <path
          d={ecgPath}
          stroke="var(--color-line)"
          strokeWidth={dimensions.strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.5"
        />

        {/* Animated dynamic pulse line tracing the heartbeat */}
        <path
          d={ecgPath}
          stroke="url(#medicare-wave-grad)"
          strokeWidth={dimensions.strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-ecg-dash"
          filter="url(#wave-glow)"
        />

        {/* Pulsing Cardiac Beacon at the R-Peak */}
        <circle
          cx="57"
          cy="4"
          r="3"
          fill="var(--color-accent)"
          className="animate-beacon-glow"
        />
        <circle
          cx="57"
          cy="4"
          r="1.5"
          fill="#FFFFFF"
        />
      </svg>
    </div>
  );

  // Variant: Button (Ultra compact for buttons)
  if (variant === 'button') {
    return (
      <span className={`inline-flex items-center gap-2 ${className}`} role="status">
        <svg
          viewBox="0 0 120 48"
          width="48"
          height="18"
          fill="none"
          className="overflow-visible"
        >
          <path
            d={ecgPath}
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-ecg-dash"
          />
        </svg>
        {text && <span className="text-xs font-semibold">{text}</span>}
      </span>
    );
  }

  // Variant: Inline (Compact horizontal status)
  if (variant === 'inline') {
    return (
      <div className={`inline-flex items-center gap-3 ${className}`} role="status">
        {waveSvg}
        {text && (
          <span className="text-xs font-medium text-[var(--color-muted)] font-ui">
            {text}
          </span>
        )}
      </div>
    );
  }

  // Variant: Fullscreen (Entire page loading & transitions)
  if (variant === 'fullscreen') {
    return (
      <div 
        className={`min-h-screen w-full bg-[var(--color-bg)] flex flex-col items-center justify-center p-6 transition-colors duration-300 relative ${className}`}
        role="status"
        aria-live="polite"
      >
        <div className="flex flex-col items-center gap-6 max-w-sm text-center">
          {/* Brand Wordmark */}
          <OlmeraWordmark className="h-9 w-auto" />

          {/* Heartbeat Wave */}
          <div className="py-2">
            {waveSvg}
          </div>

          {/* Text and status */}
          <div className="space-y-1.5">
            <h3 className="font-display font-semibold text-base text-[var(--color-ink)]">
              {text || 'Connecting Clinical Network'}
            </h3>
            <p className="text-xs text-[var(--color-muted)] font-ui leading-relaxed">
              {subtitle || 'Syncing biometric telemetry, records, and clinical services...'}
            </p>
          </div>

          {/* Subtle pulsating status pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-surface)] border border-[var(--color-line)] shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-ping"></span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-primary)] font-ui">
              Live Medical Telemetry
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Variant: Modal / Action Overlay
  if (variant === 'overlay') {
    return (
      <div 
        className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn ${className}`}
        role="status"
        aria-live="polite"
      >
        <div className="card p-8 bg-[var(--color-surface)] border border-[var(--color-line)] shadow-xl flex flex-col items-center gap-4 max-w-xs text-center rounded-2xl">
          {waveSvg}
          <div className="space-y-1">
            <p className="font-semibold text-sm text-[var(--color-ink)] font-ui">
              {text || 'Processing Clinical Request'}
            </p>
            <p className="text-xs text-[var(--color-muted)] font-ui">
              {subtitle || 'Please hold a moment...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Default Variant: Card (Sections, dashboards, tables)
  return (
    <div 
      className={`py-12 px-6 flex flex-col items-center justify-center text-center gap-4 card bg-[var(--color-surface)]/60 border border-[var(--color-line)] rounded-2xl ${className}`}
      role="status"
      aria-live="polite"
    >
      {waveSvg}
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-primary)] font-ui">
          {text || 'Syncing Clinical Data...'}
        </p>
        {subtitle && (
          <p className="text-xs text-[var(--color-muted)] font-ui max-w-sm">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

export default MedicareWaveLoader;
