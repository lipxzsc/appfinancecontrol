import { createFileRoute, redirect } from "@tanstack/react-router";

// Keep older /index links working after moving the dashboard to /.
export const Route = createFileRoute("/index_")({
  beforeLoad: () => {
    throw redirect({ to: "/", replace: true });
  },
});