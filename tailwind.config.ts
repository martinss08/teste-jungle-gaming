import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#110907',
        foreground: '#f8ead6',
        card: '#21120d',
        muted: '#3a2218',
        border: '#4b2b1d',
        primary: '#d98238',
        primarySoft: '#f4b36f',
        secondary: '#19392d',
        success: '#7ccf8b',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'ui-sans-serif', 'system-ui'],
      },
      boxShadow: {
        glow: '0 24px 80px rgba(217, 130, 56, 0.18)',
      },
    },
  },
  plugins: [],
}

export default config
