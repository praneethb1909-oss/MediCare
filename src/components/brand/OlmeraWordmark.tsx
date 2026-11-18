import React from 'react';
import wordmarkDark from '../../../brand/assets/wordmark.svg';
import wordmarkLight from '../../../brand/assets/wordmark-light-on-dark.svg';

interface OlmeraWordmarkProps {
  className?: string;
  variant?: 'auto' | 'light' | 'dark';
}

export function OlmeraWordmark({ className = 'h-7 w-auto', variant = 'auto' }: OlmeraWordmarkProps) {
  if (variant === 'light') {
    // Light text on dark background
    return <img src={wordmarkLight} alt="Olmera" className={`${className} block`} />;
  }
  if (variant === 'dark') {
    // Dark text on light background
    return <img src={wordmarkDark} alt="Olmera" className={`${className} block`} />;
  }

  // Auto: switches automatically with document 'dark' class
  return (
    <div className="inline-flex items-center">
      <img src={wordmarkDark} alt="Olmera" className={`${className} block dark:hidden`} />
      <img src={wordmarkLight} alt="Olmera" className={`${className} hidden dark:block`} />
    </div>
  );
}
