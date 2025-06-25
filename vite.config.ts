import path from "node:path"
import { fileURLToPath } from "node:url"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv, type Plugin } from "vite"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// package.json에서 version 읽기
import pkg from "./package.json"

// HTML Transform Plugin
const htmlTransformPlugin = (): Plugin => ({
  name: "html-transform",
  transformIndexHtml(html) {
    return html.replace("%VITE_APP_VERSION%", pkg.version)
  },
})

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), "")

  return {
    plugins: [react(), htmlTransformPlugin()],
    base: env.VITE_BASE_PATH || "/",
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
    server: {
      host: "0.0.0.0",
      allowedHosts: ["fe.gyuha.com", "localhost", "127.0.0.1", ".gyuha.com"],
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      outDir: "docs",
    },
  }
})
