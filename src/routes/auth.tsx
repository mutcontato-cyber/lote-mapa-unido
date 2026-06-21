import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { signInWithPhoneName, signUpWithPhoneName } from "@/lib/auth-helpers";
import { supabase } from "@/integrations/supabase/client";
import { MapPin } from "lucide-react";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar — ADECAF Rua Digna" },
      { name: "description", content: "Acesso à plataforma da Associação ADECAF para o abaixo-assinado de asfaltamento." },
    ],
  }),
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/" });
  },
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handle(action: "in" | "up") {
    setErr(null);
    setLoading(true);
    try {
      if (!phone.trim() || !name.trim()) throw new Error("Informe telefone e nome.");
      if (action === "up") await signUpWithPhoneName(phone, name);
      else await signInWithPhoneName(phone, name);
      navigate({ to: "/" });
    } catch (e: any) {
      setErr(e?.message ?? "Falha ao autenticar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/30 p-4">
      <Card className="w-full max-w-md shadow-xl border-primary/20">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
            <MapPin className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl">ADECAF Rua Digna</CardTitle>
          <CardDescription>
            Plataforma da Associação de Moradores para o abaixo-assinado pelo asfaltamento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="in" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="in">Entrar</TabsTrigger>
              <TabsTrigger value="up">Cadastrar</TabsTrigger>
            </TabsList>
            <TabsContent value="in" className="space-y-4 mt-4">
              <Field label="Telefone" value={phone} onChange={setPhone} placeholder="(00) 00000-0000" />
              <Field label="Nome completo" value={name} onChange={setName} placeholder="Maria Silva" />
              <Button className="w-full" disabled={loading} onClick={() => handle("in")}>
                {loading ? "Entrando…" : "Entrar"}
              </Button>
            </TabsContent>
            <TabsContent value="up" className="space-y-4 mt-4">
              <Field label="Telefone" value={phone} onChange={setPhone} placeholder="(00) 00000-0000" />
              <Field label="Nome completo" value={name} onChange={setName} placeholder="Maria Silva" />
              <Button className="w-full" disabled={loading} onClick={() => handle("up")}>
                {loading ? "Criando conta…" : "Criar conta"}
              </Button>
              <p className="text-xs text-muted-foreground">
                O primeiro usuário cadastrado se torna Administrador automaticamente.
              </p>
            </TabsContent>
          </Tabs>
          {err && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{err}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}