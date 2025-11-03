/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3B82F6', // Bright blue
          light: '#60A5FA',
          dark: '#2563EB'
        },
        secondary: {
          DEFAULT: '#10B981', // Emerald green
          light: '#34D399',
          dark: '#059669'
        },
        accent: {
          DEFAULT: '#8B5CF6', // Purple
          light: '#A78BFA',
          dark: '#7C3AED'
        },
        success: {
          DEFAULT: '#22C55E', // Green
          light: '#4ADE80',
          dark: '#16A34A'
        },
        warning: {
          DEFAULT: '#F59E0B', // Amber
          light: '#FBBF24',
          dark: '#D97706'
        },
        error: {
          DEFAULT: '#EF4444', // Red
          light: '#F87171',
          dark: '#DC2626'
        },
        info: {
          DEFAULT: '#0EA5E9', // Sky blue
          light: '#38BDF8',
          dark: '#0284C7'
        },
        background: {
          DEFAULT: '#F9FAFB',
          alt: '#F3F4F6'
        },
        surface: {
          DEFAULT: '#FFFFFF',
          alt: '#F9FAFB'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 4px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.1)',
        dropdown: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      }
    },
  },
  plugins: [],
};