import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Split heavy vendor libs into separate chunks so the initial route
        // doesn't have to parse/execute code it doesn't yet need. This reduces
        // "unused JavaScript" on first load without changing any behavior.
        manualChunks: (id) => {
          if (!id.includes("node_modules")) return;
          if (id.includes("framer-motion")) return "vendor-motion";
          if (id.includes("@supabase")) return "vendor-supabase";
          if (id.includes("@radix-ui")) return "vendor-radix";
          if (id.includes("@tanstack")) return "vendor-query";
          // Note: do NOT split recharts/d3 into a separate chunk — their
          // internal circular deps break when isolated, causing
          // "Cannot access 'P' before initialization" at runtime.
          if (id.includes("embla-carousel")) return "vendor-carousel";
          if (id.includes("date-fns") || id.includes("react-day-picker")) return "vendor-date";
          if (id.includes("lucide-react")) return "vendor-icons";
          if (id.includes("react-hook-form") || id.includes("zod") || id.includes("@hookform"))
            return "vendor-forms";
          if (id.includes("react-router")) return "vendor-router";
          if (id.includes("react-dom") || /[\\/]react[\\/]/.test(id)) return "vendor-react";
        },
      },
    },
  },
}));
