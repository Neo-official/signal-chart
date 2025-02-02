import type { Config } from "tailwindcss";
import { nextui } from "@nextui-org/theme";
import { NextUIPluginConfig } from "@nextui-org/theme/dist/types";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
            "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
  darkMode: "class",
  plugins: [nextui({
    defaultTheme: "light",
    // defaultExtendTheme: "dark",
    themes: {
      "dark": {
        extend: "dark", // <- inherit default values from dark theme
        colors: {
          background: "#1A1A2E", // رنگ پس‌زمینه تیره
          foreground: "#EAEAEA", // رنگ متن روشن
          primary: {
            50: "#BBDEFB", // رنگ‌های اصلی جدید
            100: "#90CAF9",
            200: "#64B5F6",
            300: "#42A5F5",
            400: "#2196F3",
            500: "#1976D2",
            600: "#1565C0",
            700: "#0D47A1",
            800: "#0B3D91",
            900: "#0A2C6D",
            DEFAULT: "#2196F3", // رنگ پیش‌فرض
            foreground: "#EAEAEA", // رنگ متن
          },
          focus: "#64B5F6", // رنگ تمرکز
        },
        layout: {
          disabledOpacity: "0.5",
          radius: {
            small: "8px",
            medium: "10px",
            large: "12px",
          },
          borderWidth: {
            small: "1px",
            medium: "2px",
            large: "3px",
          },
        },
      },
      "light": {
        extend: "light", // <- inherit default values from light theme
        colors: {
          background: "#E3F2FD", // رنگ پس‌زمینه روشن
          foreground: "#0D1B2A", // رنگ متن تیره
          primary: {
            50: "#BBDEFB", // رنگ‌های اصلی جدید
            100: "#90CAF9",
            200: "#64B5F6",
            300: "#42A5F5",
            400: "#2196F3",
            500: "#1976D2",
            600: "#1565C0",
            700: "#0D47A1",
            800: "#0B3D91",
            900: "#0A2C6D",
            DEFAULT: "#2196F3", // رنگ پیش‌فرض
            foreground: "#0D1B2A", // رنگ متن
          },
          focus: "#64B5F6", // رنگ تمرکز
        },
        layout: {
          disabledOpacity: "0.5", // تغییر شفافیت
          radius: {
            small: "8px",
            medium: "10px",
            large: "12px",
          },
          borderWidth: {
            small: "1px",
            medium: "2px",
            large: "3px",
          },
        },
      }
    },
  } as NextUIPluginConfig)],
};
export default config;
