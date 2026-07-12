import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Soft neutral page base
        bone: {
          50: "#faf9f5",
          100: "#f4f2ec",
          200: "#eae6dc",
        },
        // Warm near-black ink
        ink: {
          900: "#171310",
          800: "#241d17",
          700: "#3a3128",
          600: "#544838",
          500: "#6f6152",
          400: "#8f8071",
        },
        // Danger accents
        heat: {
          safe: "#1f9e7a",
          caution: "#e0a80d",
          high: "#f2760c",
          extreme: "#e23a25",
          cancel: "#7f1d1d",
        },
        breeze: {
          400: "#2bb7ad",
          500: "#12a196",
          600: "#0c7f77",
        },
        // Soft colorful card fills (edmo / maggie style blocks)
        card: {
          sun: "#ffe6a8",
          coral: "#ffd6c7",
          mint: "#c4f0dc",
          sky: "#cfe6ff",
          lilac: "#e6ddff",
          cream: "#fff6e9",
        },
        console: "#100e0b",
      },
      fontFamily: {
        display: ["var(--font-display)", "Impact", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        tightest: "-0.03em",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        float: "float 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
