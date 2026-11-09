import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        jireh: {
          navy: "#0A2540",
          navyLight: "#12385E",
          cyan: "#00B4D8",
          cyanDark: "#0096C7",
          ice: "#E0F7FA",
          bg: "#F8FAFC",
          gold: "#F59E0B",
          emerald: "#10B981",
        },
      },
      boxShadow: {
        card: "0 10px 30px -5px rgba(10, 37, 64, 0.08), 0 4px 12px -2px rgba(0, 180, 216, 0.06)",
        floating: "0 20px 40px -10px rgba(10, 37, 64, 0.18)",
      },
    },
  },
  plugins: [],
};
export default config;
