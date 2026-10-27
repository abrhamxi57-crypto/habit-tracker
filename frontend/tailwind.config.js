/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        hf: {
          bg:         '#0f1115',
          surface:    '#1a1d22',
          surface2:   '#21252d',
          border:     '#2a2f38',
          inactive:   '#1f232a',
          accent:     '#b78af7',
          'accent-soft': '#d7c2ff',
          text:       '#f4f4f5',
          muted:      '#a0a4aa',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'accent-glow': '0 0 12px -2px rgba(183,138,247,0.45)',
        'accent-glow-sm': '0 0 8px -3px rgba(183,138,247,0.35)',
        'cell-glow': '0 0 6px rgba(183,138,247,0.5)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
        '4xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
