import { createFileRoute, Outlet } from "@tanstack/react-router";

// Modo de teste: acesso aberto, sem exigência de cadastro/login.
export const Route = createFileRoute("/_authenticated")({
  component: () => <Outlet />,
});