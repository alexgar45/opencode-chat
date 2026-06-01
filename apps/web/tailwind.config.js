/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0b0d10",
          soft: "#11141a",
          card: "#161a22",
          hover: "#1d222c",
        },
        border: {
          DEFAULT: "#232934",
          strong: "#2d3441",
        },
        ink: {
          DEFAULT: "#e6e9ef",
          soft: "#aab0bd",
          mute: "#6b7280",
        },
        accent: {
          DEFAULT: "#7c5cff",
          soft: "#5b3df0",
        },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Inter",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};
