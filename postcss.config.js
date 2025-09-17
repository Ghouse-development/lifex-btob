// postcss.config.js
export default {
  plugins: {
    // 使っている場合のみ：ネスティングは Tailwind より前
    'tailwindcss/nesting': {},
    tailwindcss: {},
    autoprefixer: {},
  },
}