import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// `npm run build` writes the website to dist/, which GitHub Actions uploads to oneKampus.
export default defineConfig({ plugins: [react()] });
