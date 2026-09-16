import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { describePlugin } from "./describe-plugin";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [
      react(),
      tailwindcss(),
      describePlugin({
        apiKey: env.MINIMAX_API_KEY ?? "",
        supabaseUrl: env.VITE_SUPABASE_URL ?? "",
        supabaseKey: env.VITE_SUPABASE_ANON_KEY ?? "",
      }),
    ],
    base: process.env.GITHUB_PAGES === "true" ? "/daddy-gallery/" : "/",
  };
});
