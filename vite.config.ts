import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// IMPORTANT: Replace REPO_NAME with your repository name (case-sensitive)
export default defineConfig({
  plugins: [react()],
  base: "/beh-screener/",
});