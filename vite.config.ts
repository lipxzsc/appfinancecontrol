// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";

// Browser-safe publishable settings only; access is protected by row-level rules.
// Published builds may lack host variables, so these public fallbacks prevent a blank app.
const FALLBACK_URL = "https://znsdugspwsikudnfspsu.supabase.co";
const FALLBACK_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpuc2R1Z3Nwd3Npa3VkbmZzcHN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0ODYzOTMsImV4cCI6MjA5ODA2MjM5M30.ke74hB7u0bhk5QnSBo3jy4qdEFgXMIq-HSN8dh75HnQ";
const publicEnv = loadEnv(process.env.NODE_ENV === "production" ? "production" : "development", process.cwd(), "VITE_");
const publicConnection = {
  "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
    process.env.VITE_SUPABASE_URL || publicEnv.VITE_SUPABASE_URL || FALLBACK_URL,
  ),
  "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY || publicEnv.VITE_SUPABASE_PUBLISHABLE_KEY || FALLBACK_KEY,
  ),
};

export default defineConfig({
  vite: {
    define: publicConnection,
    environments: { client: { define: publicConnection } },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // Netlify sets NETLIFY=true during its builds; everywhere else keep the default target.
  ...(process.env.NETLIFY ? { nitro: { preset: "netlify" } } : {}),
});
