import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdecafLogo } from "@/components/logo";
import { supabase } from "@/integrations/supabase/client";
import { traduzirErro } from "@/lib/translate-error";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Trocar senha — ADECAF Rua Digna" },
      { name: "description", content: "Tela segura para trocar a senha do acesso administrativo da ADECAF." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleUpdatePassword() {
    setErr(null);
    if (password.length < 6) {
      setErr("A nova senha precisa ter ao menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setErr("As senhas não conferem.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      setPassword("");
      setConfirm("");
    } catch (e: any) {
      setErr(traduzirErro(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/30 p-4">
      <Card className="w-full max-w-md shadow-xl border-primary/20">
        <CardHeader className="text-center space-y-2">
          <AdecafLogo className="mx-auto h-32 md:h-40 w-auto" />
          <CardTitle className="text-2xl">Trocar senha</CardTitle>
          <CardDescription>Defina uma nova senha para voltar ao acesso administrativo.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {done ? (
            <>
              <Alert className="border-primary/30 bg-primary/10 text-primary">
                <AlertDescription>Senha alterada. Agora entre novamente no acesso admin.</AlertDescription>
              </Alert>
              <Button className="w-full" onClick={() => navigate({ to: "/auth" })}>
                Voltar para entrar
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="password">Nova senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Confirmar senha</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Digite novamente"
                />
              </div>
              <Button className="w-full" disabled={loading} onClick={handleUpdatePassword}>
                {loading ? "Salvando…" : "Salvar nova senha"}
              </Button>
            </>
          )}
          {err && (
            <Alert variant="destructive">
              <AlertDescription>{err}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}