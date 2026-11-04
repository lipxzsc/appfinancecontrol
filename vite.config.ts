// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";

// Only public connection settings belong in the browser. Configure each host
// explicitly instead of silently connecting to another deployment's backend.
const publicEnv = loadEnv(process.env.NODE_ENV === "production" ? "production" : "development", process.cwd(), "VITE_");
const publicConnection = {
  "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(
    process.env.VITE_SUPABASE_URL || publicEnv.VITE_SUPABASE_URL || "",
  ),
  "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY || publicEnv.VITE_SUPABASE_PUBLISHABLE_KEY || "",
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
