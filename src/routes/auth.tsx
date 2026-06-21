import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  signInWithPhonePassword,
  signUpWithPhonePassword,
} from "@/lib/auth-helpers";
import { supabase } from "@/integrations/supabase/client";
import { TERMO_TITULO, TERMO_TEXTO, TERMO_CHECKBOX } from "@/lib/termo";
import { ADMIN_WHATSAPP, ADMIN_NOME, waLink } from "@/lib/admin-config";
import { AdecafLogo } from "@/components/logo";
import { traduzirErro } from "@/lib/translate-error";

export const Route = createFileRoute("/auth")({
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
  const [password, setPassword] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [aceiteTermo, setAceiteTermo] = useState(false);
  const [showTermo, setShowTermo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [mode, setMode] = useState<"signup" | "signin">("signup");

  async function handleSignIn() {
    setErr(null);
    setLoading(true);
    try {
      if (!phone.trim() || !password.trim()) throw new Error("Informe telefone e senha.");
      await signInWithPhonePassword(phone, password);
      navigate({ to: "/mapa" });
    } catch (e: any) {
      setErr(traduzirErro(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp() {
    setErr(null);
    if (!phone.trim() || !name.trim() || !password.trim()) {
      setErr("Preencha nome, telefone e senha.");
      return;
    }
    if (!dataNascimento) {
      setErr("Informe sua data de nascimento.");
      return;
    }
    if (password.length < 6) {
      setErr("A senha precisa ter ao menos 6 caracteres.");
      return;
    }
    if (!aceiteTermo) {
      setErr("Você precisa ler e aceitar o Termo de Autorização para continuar.");
      return;
    }
    setLoading(true);
    try {
      await signUpWithPhonePassword(phone, name, password, TERMO_TEXTO, dataNascimento);
      navigate({ to: "/mapa" });
    } catch (e: any) {
      setErr(traduzirErro(e));
    } finally {
      setLoading(false);
    }
  }

  const recoveryMsg = `Olá ${ADMIN_NOME}, esqueci minha senha do app ADECAF Rua Digna. Meu nome: _____ / Telefone do cadastro: _____`;
  const recoveryHref = waLink(ADMIN_WHATSAPP, recoveryMsg);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/30 p-4">
      <Card className="w-full max-w-md shadow-xl border-primary/20">
        <CardHeader className="text-center space-y-2">
          <AdecafLogo className="mx-auto h-20 w-auto" />
          <CardTitle className="text-2xl">ADECAF Rua Digna</CardTitle>
          <CardDescription>
            Plataforma da Associação de Moradores para o abaixo-assinado pelo asfaltamento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mode === "signin" ? (
            <div className="space-y-4 mt-2">
              <Field label="Telefone" value={phone} onChange={setPhone} placeholder="(00) 00000-0000" />
              <Field label="Senha" value={password} onChange={setPassword} placeholder="Sua senha" type="password" />
              <p className="text-xs text-muted-foreground -mt-2">
                Esqueceu a senha?{" "}
                <a
                  href={recoveryHref}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline font-medium"
                >
                  Fale com o administrador no WhatsApp
                </a>{" "}
                que ele gera uma nova para você.
              </p>
              <Button className="w-full" disabled={loading} onClick={handleSignIn}>
                {loading ? "Entrando…" : "Entrar"}
              </Button>
              <button
                type="button"
                className="block w-full text-center text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                onClick={() => {
                  setErr(null);
                  setMode("signup");
                }}
              >
                ← Voltar para o cadastro
              </button>
            </div>
          ) : (
            <div className="space-y-3 mt-2">
              <Field label="Nome completo" value={name} onChange={setName} placeholder="Maria Silva" />
              <Field label="Telefone / WhatsApp" value={phone} onChange={setPhone} placeholder="(62) 9 9999-9999" />
              <Field
                label="Data de nascimento"
                value={dataNascimento}
                onChange={setDataNascimento}
                type="date"
              />
              <Field label="Crie uma senha" value={password} onChange={setPassword} placeholder="Mínimo 6 caracteres" type="password" />

              <div className="flex items-start gap-2 rounded-md border bg-muted/40 p-3">
                <Checkbox
                  id="termo"
                  checked={aceiteTermo}
                  onCheckedChange={(v) => setAceiteTermo(v === true)}
                  className="mt-0.5"
                />
                <label htmlFor="termo" className="text-xs leading-snug cursor-pointer">
                  {TERMO_CHECKBOX}{" "}
                  <button
                    type="button"
                    className="text-primary underline font-medium"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowTermo(true);
                    }}
                  >
                    Ler termo completo
                  </button>
                </label>
              </div>

              <Button className="w-full" disabled={loading} onClick={handleSignUp}>
                {loading ? "Criando conta…" : "Criar conta"}
              </Button>

              <div className="pt-2 border-t mt-2 space-y-2 text-center">
                <p className="text-xs text-muted-foreground">Já tem cadastro?</p>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setErr(null);
                    setMode("signin");
                  }}
                >
                  Entrar
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setErr(null);
                    setMode("signin");
                  }}
                  className="text-[11px] text-muted-foreground/60 hover:text-foreground underline-offset-2 hover:underline mt-1"
                >
                  acesso admin
                </button>
              </div>
            </div>
          )}
          {err && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{err}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Dialog open={showTermo} onOpenChange={setShowTermo}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{TERMO_TITULO}</DialogTitle>
            <DialogDescription>Leia com atenção antes de aceitar.</DialogDescription>
          </DialogHeader>
          <div className="text-sm whitespace-pre-line leading-relaxed text-foreground">
            {TERMO_TEXTO}
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setAceiteTermo(true);
                setShowTermo(false);
              }}
            >
              Li e Concordo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}