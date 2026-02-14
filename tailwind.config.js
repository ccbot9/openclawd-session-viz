/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        user: '#3B82F6',
        thinking: '#8B5CF6',
        tool: '#F59E0B',
        result: '#10B981',
        assistant: '#6B7280',
        error: '#EF4444',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
