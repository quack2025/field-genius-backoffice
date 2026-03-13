/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#e6edf5",
          100: "#ccdaeb",
          500: "#003366",
          600: "#002b57",
          700: "#002347",
        },
      },
    },
  },
  plugins: [],
};
