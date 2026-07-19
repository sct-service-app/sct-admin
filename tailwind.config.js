/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Цвета взяты 1:1 из мокапов SCT
        brandBlue: '#1F5FAF',
        brandBlueDark: '#184A88',
        // navy* — тёмные оттенки для хедера/футера (из обновлённого дизайна)
        navy: '#0A1B3D',
        navyDeep: '#061536',
        brandYellow: '#F2C94C',
        brandOrange: '#F97316',
        surfaceLight: '#F7F8FA',
        surfaceMuted: '#EEF1F4',
        borderLight: '#D9DEE5',
        textPrimary: '#18202A',
        textSecondary: '#4B5968',
        successBg: '#EAF8F0',
        successText: '#1D7F4D',
      },
      borderRadius: {
        sct: '16px',
        'sct-lg': '24px',
        'sct-xl': '32px',
      },
      boxShadow: {
        sct: '0 4px 18px rgba(24, 32, 42, 0.06)',
        'sct-soft': '0 2px 8px rgba(24, 32, 42, 0.04)',
        'soft-blue': '0 16px 40px -18px rgba(31, 95, 175, 0.28)',
        'soft-card': '0 12px 30px -18px rgba(24, 32, 42, 0.14)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        sct: '1200px',
        'sct-wide': '1400px',
        'sct-admin': '1600px',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fade: 'fadeIn 0.4s ease-out forwards',
      },
    },
  },
  plugins: [],
}
