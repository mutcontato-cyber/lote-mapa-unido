import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      const loteamento =
        typeof (location.search as Record<string, unknown>)?.loteamento === "string"
          ? ((location.search as Record<string, string>).loteamento as string)
          : undefined;
      throw redirect({ to: "/auth", search: { loteamento } });
    }
    return { user: data.user };
  },
  component: () => <Outlet />,
});