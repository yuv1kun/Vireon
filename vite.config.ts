import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
// Component tagger removed

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    // Custom plugins can be added here
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
