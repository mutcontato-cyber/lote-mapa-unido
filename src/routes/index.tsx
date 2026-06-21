import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "ADECAF Rua Digna" },
      { name: "description", content: "Plataforma da Associação ADECAF para o abaixo-assinado pelo asfaltamento da rua." },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/mapa" });
    throw redirect({ to: "/auth" });
  },
  component: () => null,
});
