import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import autoprefixer from "autoprefixer";
import tailwindcss from "tailwindcss";
import { qrcode } from "vite-plugin-qrcode";

// Falls back to sensible defaults so the app runs the same on any host
// (local, Firebase, Netlify, Replit, ...) — a platform only needs to set
// PORT/BASE_PATH if it wants something other than these.
const DEFAULT_PORT = 8080;
const DEFAULT_BASE_PATH = "/";

const rawPort = process.env.PORT;
const port = rawPort ? Number(rawPort) : DEFAULT_PORT;

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH || DEFAULT_BASE_PATH;

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    runtimeErrorOverlay(),
    qrcode(), // prints a scannable QR code for the LAN URL on `pnpm dev` — no-op outside dev (apply: 'serve')
  ],
  css: {
    postcss: {
      plugins: [autoprefixer(), tailwindcss()],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
