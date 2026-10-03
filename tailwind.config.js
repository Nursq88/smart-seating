/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        milk: '#F6F4EF',
        ink: '#1E1D1B',
        graphite: '#34322F',
        bronze: { DEFAULT: '#A6764F', soft: '#F3E9DF', deep: '#8A5F3D' },
        sage: '#7F9479',
        sand: '#C8AE84',
        stone: {
          50: '#FAF9F6',
          100: '#F2EFE9',
          200: '#E7E3DA',
          300: '#D6D1C6',
          400: '#A9A398',
          500: '#7C776E',
          600: '#5B5751',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        // Instrument Serif has no Cyrillic; Cormorant covers Russian and Kazakh letters.
        serif: ['"Instrument Serif"', '"Cormorant Garamond"', 'Georgia', 'serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(30,29,27,0.04), 0 10px 28px -16px rgba(30,29,27,0.14)',
        lift: '0 2px 4px rgba(30,29,27,0.04), 0 24px 48px -20px rgba(30,29,27,0.22)',
      },
      keyframes: {
        'fade-up': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'none' } },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'scale-in': { from: { opacity: '0', transform: 'translateY(8px) scale(0.98)' }, to: { opacity: '1', transform: 'none' } },
        'slide-in': { from: { transform: 'translateX(24px)', opacity: '0' }, to: { transform: 'none', opacity: '1' } },
        shake: { '25%': { transform: 'translateX(-6px)' }, '75%': { transform: 'translateX(6px)' } },
      },
      animation: {
        'fade-up': 'fade-up 0.45s cubic-bezier(0.2,0.7,0.2,1) both',
        'fade-in': 'fade-in 0.3s ease both',
        'scale-in': 'scale-in 0.3s cubic-bezier(0.2,0.7,0.2,1) both',
        'slide-in': 'slide-in 0.35s cubic-bezier(0.2,0.7,0.2,1) both',
      },
    },
  },
  plugins: [],
}
