import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "../admin-dist",
  },
  server: {
    proxy: {
      "/auth": "http://localhost:3000",
      "/admin": "http://localhost:3000",
    },
  },
});
