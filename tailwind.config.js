/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'var(--color-primary)',
          'primary-hover': 'var(--color-primary-hover)',
          accent: 'var(--color-accent)',
          'accent-hover': 'var(--color-accent-hover)',
          mist: 'var(--color-mist)',
          bg: 'var(--color-bg)',
          surface: 'var(--color-surface)',
          'surface-subtle': 'var(--color-surface-subtle)',
          ink: 'var(--color-ink)',
          muted: 'var(--color-muted)',
          line: 'var(--color-line)',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Fraunces', 'Georgia', 'serif'],
        sans: ['var(--font-ui)', 'Instrument Sans', 'system-ui', 'sans-serif'],
        ui: ['var(--font-ui)', 'Instrument Sans', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: 'var(--radius-card)',
        btn: 'var(--radius-btn)',
      },
    },
  },
  plugins: [],
};
