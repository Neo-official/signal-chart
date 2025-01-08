import type { Config } from 'drizzle-kit';

import { defineConfig } from "drizzle-kit";
export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: "sqlite",
  // driver: 'durable-sqlite',
  // driver: 'better-sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // dbCredentials: {
  //   url: 'sqlite.db',
  // },
  // strict: true,
  // verbose: true,
} satisfies Config);
