/* @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors')

module.exports = {
  content: ["./js/**/*.js", "./templates/**/*.html"],
  theme: {
    extend: {
      backgroundColor: ['even'],
    },
    fontFamily: {
      "sans": ["Fredoka", "ui-sans-serif"]
    },
    colors: {
      custom_bg_light: "#2f2944",
      custom_bg_regular: "#241e3a",
      custom_bg_dark: "#1d1830",
      custom_bg_alt: "#3a344e",
      custom_bg_hover: "#342e49",
      
      custom_text: "#d4d3da",
      custom_text_alt: "#afaeb8",
      
      custom_accent_1: "#ae3e8f",
      custom_accent_2: "#8f0bdf",
      
      transparent: 'transparent',
      current: 'currentColor',
      black: colors.black,
      white: colors.white,
      gray: colors.gray,
      red: colors.red,
      green: colors.green,
      emerald: colors.emerald,
      purple: colors.purple,
      indigo: colors.indigo,
      yellow: colors.amber,
      pink: colors.pink,
      fuchsia: colors.fuchsia,
      teal: colors.teal,
    }
  },
  plugins: [],
}
