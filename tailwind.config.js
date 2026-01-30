/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nexus: {
          bg: {
            primary: 'var(--color-bg-primary)',
            secondary: 'var(--color-bg-secondary)',
            tertiary: 'var(--color-bg-tertiary)',
            glass: 'var(--color-bg-glass)'
          },
          fg: {
            primary: 'var(--color-fg-primary)',
            secondary: 'var(--color-fg-secondary)',
            muted: 'var(--color-fg-muted)'
          },
          accent: 'var(--color-accent)',
          border: 'var(--color-border)'
        }
      }
    },
  },
  plugins: [],
}

