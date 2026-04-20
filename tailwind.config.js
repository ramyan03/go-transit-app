/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#F4F6F4",
        surface: "#FFFFFF",
        "go-green": "#00853F",
        "go-green-dark": "#006830",
        "go-green-light": "#E8F5EE",
        warning: "#E07B00",
        "warning-bg": "#FFF4E5",
        danger: "#C41230",
        "danger-bg": "#FDECEA",
        "text-primary": "#1A2E1F",
        "text-secondary": "#5A7A63",
        border: "#D8E8DC",
      },
    },
  },
  plugins: [],
};
