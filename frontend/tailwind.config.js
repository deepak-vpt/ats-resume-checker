/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#0b132b",
          card: "#1c2541",
          cardHover: "#232f55",
          primary: "#4f46e5",
          primaryHover: "#4338ca"
        }
      }
    },
  },
  plugins: [],
}
