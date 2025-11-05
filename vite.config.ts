import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// IMPORTANT for GitHub Pages: base must be your repo name
export default defineConfig({
  plugins: [react()],
  base: "/beh-screener/"
});
