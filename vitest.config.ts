import { defineConfig } from "vitest/config"
import path from "path"
import fs from "fs"

// Automatically load .env.local if present
const envLocalPath = path.resolve(__dirname, ".env.local")
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, "utf-8")
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith("#")) {
      const eqIdx = trimmed.indexOf("=")
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim()
        const value = trimmed.slice(eqIdx + 1).trim()
        if (!process.env[key]) {
          process.env[key] = value
        }
      }
    }
  }
}

export default defineConfig({
  test: {
    include: ["**/*.{test,spec,eval}.?(c|m)[jt]s?(x)"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/.next/**"],
    testTimeout: 90000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
})
