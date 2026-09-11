import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import fs from "fs"
import path from "path"

// Custom plugin for Cloudflare Pages:
// Clones index.html as 404.html in dist so direct deep-link hits gracefully fall back to the SPA
function cloudflareSpaFallback() {
  return {
    name: "cloudflare-spa-fallback",
    closeBundle() {
      const distDir = path.resolve(import.meta.dirname, "dist")
      const indexPath = path.join(distDir, "index.html")
      const fallbackPath = path.join(distDir, "404.html")
      if (fs.existsSync(indexPath)) {
        fs.copyFileSync(indexPath, fallbackPath)
        console.log("✓ Cloudflare Pages 404.html SPA fallback generated")
      }
    },
  }
}

export default defineConfig({
  base: "/",
  plugins: [
    react(),
    tailwindcss(),
    cloudflareSpaFallback(),
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) {
            return "vendor"
          }
        },
      },
    },
  },
})
