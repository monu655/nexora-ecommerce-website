/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#12151C', soft: '#3A404D', muted: '#6B7280' },
        line: { DEFAULT: '#E5E7EB', strong: '#D1D5DB' },
        surface: { DEFAULT: '#FFFFFF', sunken: '#F6F7F9', raised: '#FBFCFD' },
        brand: { 50: '#EEF1FE', 100: '#DCE2FD', 500: '#3352E8', 600: '#1B39C9', 700: '#152EA6', 900: '#0F1F6E' },
        positive: { 50: '#ECFDF5', 500: '#0E7A5F', 700: '#075E4A' },
        caution: { 50: '#FFF8EB', 500: '#B45309' },
        critical: { 50: '#FEF2F2', 500: '#C0392B' },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Inter Tight"', 'Inter', 'sans-serif'],
      },
      fontSize: {
        'display-lg': ['3.25rem', { lineHeight: '1.04', letterSpacing: '-0.035em', fontWeight: '600' }],
        display: ['2.5rem', { lineHeight: '1.08', letterSpacing: '-0.03em', fontWeight: '600' }],
        title: ['1.5rem', { lineHeight: '1.25', letterSpacing: '-0.02em', fontWeight: '600' }],
      },
      boxShadow: {
        card: '0 1px 2px rgba(18,21,28,0.04), 0 1px 3px rgba(18,21,28,0.06)',
        lift: '0 8px 24px -6px rgba(18,21,28,0.12), 0 2px 6px rgba(18,21,28,0.06)',
        panel: '0 24px 60px -18px rgba(18,21,28,0.28)',
      },
      borderRadius: { xl: '0.875rem', '2xl': '1.125rem' },
      keyframes: {
        'slide-in': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'none' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: { 'slide-in': 'slide-in .22s cubic-bezier(.2,.8,.3,1)' },
    },
  },
  plugins: [],
};
