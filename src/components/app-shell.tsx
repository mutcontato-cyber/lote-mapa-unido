import { ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { signOut } from "@/lib/auth-helpers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard, MapPin, FileText, LogOut, Settings, Menu } from "lucide-react";
import { AdecafLogo } from "@/components/logo";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/mapa", label: "Mapa", icon: MapPin },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, adminOnly: true },
  { to: "/relatorios", label: "Relatórios", icon: FileText, adminOnly: true },
  { to: "/admin", label: "Administração", icon: Settings, adminOnly: true },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { profile, isAdmin, isStaff, loading } = useAuth();
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    nav({ to: "/auth" });
  }

  const visibleNav = NAV.filter((n) => !n.adminOnly || (!loading && isAdmin));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-30 border-b bg-card/80 backdrop-blur">
        <div className="mx-auto max-w-7xl flex items-center gap-3 px-4 h-16">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen((v) => !v)}>
            <Menu className="h-5 w-5" />
          </Button>
          <Link to="/mapa" className="flex items-center gap-2">
            <AdecafLogo className="h-10 w-10" />
            <div className="leading-tight">
              <div className="font-semibold">ADECAF</div>
              <div className="text-xs text-muted-foreground -mt-0.5">Rua Digna</div>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-1 ml-6">
            {visibleNav.map((n) => {
              const active = path === n.to || (n.to !== "/" && path.startsWith(n.to));
              return (
                <Link
                  key={n.to}
                  to={n.to as any}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors",
                    active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  )}
                >
                  <n.icon className="h-4 w-4" />
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Olá,</span>
              <span className="font-medium">{loading ? "Carregando…" : profile?.full_name ?? "…"}</span>
              {loading ? null : isAdmin ? (
                <Badge>Admin</Badge>
              ) : isStaff ? (
                <Badge variant="secondary">Coordenador</Badge>
              ) : (
                <Badge variant="outline">Visitante</Badge>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sair">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {open && (
          <div className="md:hidden border-t bg-card">
            <div className="flex flex-col p-2">
              {visibleNav.map((n) => (
                <Link
                  key={n.to}
                  to={n.to as any}
                  onClick={() => setOpen(false)}
                  className="px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-muted"
                >
                  <n.icon className="h-4 w-4" />
                  {n.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t py-4 text-center text-xs text-muted-foreground">
        ADECAF Rua Digna · Plataforma de organização do abaixo-assinado de asfaltamento
      </footer>
    </div>
  );
}