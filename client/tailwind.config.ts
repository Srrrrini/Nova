import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif']
      },
      colors: {
        slate: {
          950: '#0f172a'
        }
      }
    }
  },
  plugins: []
} satisfies Config;
