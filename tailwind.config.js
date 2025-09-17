/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx,html}",
    "./public/**/*.html",
  ],
  safelist: [
    // Grid and Layout
    'grid','grid-cols-1','md:grid-cols-2','lg:grid-cols-2','xl:grid-cols-3',
    'sm:grid-cols-2','lg:grid-cols-3',
    'gap-4','gap-6','rounded-lg','rounded-2xl','rounded-xl',
    // Shadows
    'shadow','shadow-md','shadow-lg','shadow-xl','shadow-card','shadow-hover','shadow-soft',
    // Spacing
    'p-4','p-6','p-8','px-4','px-6','py-3','py-8','py-10','mb-1','mb-3','mb-8',
    // Typography
    'text-sm','text-lg','text-xl','text-2xl','text-3xl','md:text-3xl',
    'font-semibold','font-bold',
    'text-gray-500','text-gray-600','text-gray-700','text-gray-900',
    'hover:text-gray-900','hover:text-primary-600','group-hover:text-primary-600',
    // Background
    'bg-white','bg-gray-50','bg-gray-100','hover:bg-gray-50',
    'bg-primary-100','text-primary-800',
    // Borders
    'border','border-b','border-gray-100','border-gray-200',
    // Flexbox
    'flex','items-center','justify-between','space-x-4','space-x-6',
    // Sizing
    'max-w-7xl','mx-auto','w-full','h-16','h-auto','max-w-[720px]',
    // Transitions
    'hover:shadow-md','hover:shadow-lg','hover:-translate-y-1','transform',
    'transition','transition-all','transition-colors','duration-300',
    // Group
    'group','block',
    // Position
    'relative','absolute','inset-0','z-0','z-10','overflow-hidden',
    // Opacity
    'opacity-5'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e'
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827'
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d'
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309'
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c'
        }
      },
      fontFamily: {
        'sans': ['Noto Sans JP', 'system-ui', 'sans-serif']
      },
      screens: {
        'xs': '360px'
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }
    },
  },
  plugins: [],
}