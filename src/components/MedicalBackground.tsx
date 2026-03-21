import React from 'react';

export const MedicalBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-20 dark:opacity-10">
      {/* Heartbeat line */}
      <svg className="absolute top-1/4 left-0 w-full h-32 text-blue-500 animate-pulse" viewBox="0 0 1000 100" preserveAspectRatio="none">
        <path d="M0 50 L100 50 L120 20 L140 80 L160 50 L300 50 L320 10 L340 90 L360 50 L1000 50" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>

      {/* Floating Pills */}
      <div className="absolute top-10 left-10 w-8 h-16 bg-blue-400 rounded-full rotate-45 animate-bounce" style={{ animationDuration: '4s' }}></div>
      <div className="absolute top-1/2 right-20 w-6 h-12 bg-emerald-400 rounded-full -rotate-12 animate-bounce" style={{ animationDuration: '6s' }}></div>
      <div className="absolute bottom-20 left-1/4 w-10 h-20 bg-blue-300 rounded-full rotate-90 animate-pulse"></div>

      {/* Medical Symbols (Plus) */}
      <div className="absolute top-1/3 right-1/4 text-blue-200 dark:text-blue-800">
        <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M12 5V19M5 12H19" />
        </svg>
      </div>
      
      <div className="absolute bottom-1/3 left-20 text-emerald-200 dark:text-emerald-800">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M12 5V19M5 12H19" />
        </svg>
      </div>

      {/* Soft Gradients */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-100 dark:bg-blue-900/20 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-100 dark:bg-emerald-900/20 rounded-full blur-3xl opacity-50"></div>
    </div>
  );
};
