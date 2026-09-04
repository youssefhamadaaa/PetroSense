/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Base surfaces
        bg: '#141B22',
        surface: '#1E2831',
        border: '#2F3D49',

        // Brand
        primary: '#E8821E', // flame
        flame: '#E8821E',
        accent: '#F2A93B', // amber
        amber: '#F2A93B',
        teal: '#2A8F9C',
        'teal-light': '#4BB8C4',

        // Text
        text: '#E8EEF2',
        muted: '#8A99A6',

        // Status
        normal: '#3BA55D',
        warning: '#F2A93B',
        critical: '#E4572E',
      },
      borderRadius: {
        card: '14px',
        input: '10px',
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      fontVariantNumeric: {
        tabular: 'tabular-nums',
      },
    },
  },
  plugins: [],
}
