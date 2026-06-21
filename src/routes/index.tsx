import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ADECAF Rua Digna" },
      { name: "description", content: "Plataforma da Associação ADECAF para o abaixo-assinado pelo asfaltamento da rua." },
    ],
  }),
  component: IndexRedirect,
});

function IndexRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/mapa", replace: true });
  }, [navigate]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Carregando…</p>
    </div>
  );
}
