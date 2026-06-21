import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Info, CheckCircle2, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Lote, Quadra, Proprietario } from "@/lib/queries";
import { recomputeLoteStatus } from "@/lib/queries";
import { useAuth } from "@/hooks/use-auth";
import { ADMIN_WHATSAPP, ADMIN_NOME, waLink } from "@/lib/admin-config";

const MELHORIAS_OPCOES: { key: string; label: string }[] = [
  { key: "asfalto", label: "Asfalto" },
  { key: "esgoto", label: "Esgoto" },
  { key: "agua", label: "Água encanada" },
  { key: "correios", label: "Correios / entrega" },
  { key: "transporte_escolar", label: "Transporte escolar" },
  { key: "coleta_lixo", label: "Coleta de lixo" },
  { key: "molhar_ruas", label: "Molhar as ruas (poeira)" },
];

function calcularIdade(iso: string): number | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const hoje = new Date();
  let idade = hoje.getFullYear() - d.getFullYear();
  const m = hoje.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < d.getDate())) idade--;
  return idade >= 0 && idade < 130 ? idade : null;
}

interface Props {
  lote: Lote;
  quadra: Quadra;
  proprietarios: Proprietario[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved?: () => void;
}

export function QuickSignDialog({ lote, quadra, proprietarios, open, onOpenChange, onSaved }: Props) {
  const { profile, user, isStaff } = useAuth();
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [chefeCasa, setChefeCasa] = useState(false);
  const [qtdMoradores, setQtdMoradores] = useState<string>("");
  const [melhorias, setMelhorias] = useState<Record<string, "sim" | "nao" | null>>({});
  const [tipoLote, setTipoLote] = useState<"inteiro" | "meio">("inteiro");
  const [loading, setLoading] = useState(false);
  const [confirmado, setConfirmado] = useState<{ mensagem: string } | null>(null);

  // Auto-preencher com dados do morador quando abrir o dialog
  useEffect(() => {
    if (open && profile) {
      setNome(profile.full_name || "");
      setTelefone(profile.phone || "");
      setDataNascimento((profile as any).data_nascimento || "");
      setConfirmado(null);
      setChefeCasa(false);
      setQtdMoradores("");
      setMelhorias({});
    }
    if (!open) {
      setConfirmado(null);
    }
  }, [open, profile]);
  const idade = calcularIdade(dataNascimento);


  // Quanto já está ocupado neste lote
  const fracaoOcupada = proprietarios.reduce((s, p) => s + Number(p.fracao || 0), 0);
  const disponivelInteiro = fracaoOcupada === 0;
  const disponivelMeio = fracaoOcupada <= 50;

  // Se só sobra meio lote, força a opção
  useEffect(() => {
    if (open) {
      if (!disponivelInteiro && disponivelMeio) setTipoLote("meio");
      else setTipoLote("inteiro");
    }
  }, [open, disponivelInteiro, disponivelMeio]);

  // Já cadastrou neste lote? (mesmo user_id no profile e mesmo telefone)
  const jaCadastradoAqui = !!user && proprietarios.some((p) => p.telefone === profile?.phone);

  async function handleSign() {
    if (!nome.trim() || !telefone.trim()) {
      toast.error("Preencha nome e telefone");
      return;
    }
    if (!disponivelInteiro && !disponivelMeio) {
      toast.error("Este lote já está totalmente ocupado.");
      return;
    }
    if (tipoLote === "inteiro" && !disponivelInteiro) {
      toast.error("Este lote já tem alguém cadastrado. Selecione 'Meio lote'.");
      return;
    }
    setLoading(true);
    try {
      const fracao = tipoLote === "inteiro" ? 100 : 50;
      const situacao = tipoLote === "meio" ? "Meio lote" : null;

      const { error: insErr } = await supabase.from("proprietarios").insert({
        lote_id: lote.id,
        nome: nome.trim(),
        telefone: telefone.trim(),
        whatsapp: telefone.trim(),
        fracao,
        situacao,
        apoia_asfalto: true,
        assinatura_status: "confirmou",
        data_nascimento: dataNascimento || null,
        chefe_casa: chefeCasa,
        qtd_moradores: qtdMoradores ? Number(qtdMoradores) : null,
        melhorias,
      });
      if (insErr) throw insErr;

      // recompute lot status (vai ficar verde)
      await recomputeLoteStatus(lote.id);

      // Mensagem para o morador enviar pro admin
      const linhasMelhorias = MELHORIAS_OPCOES
        .map((m) => {
          const v = melhorias[m.key];
          if (!v) return null;
          return `• ${m.label}: ${v === "sim" ? "Precisa" : "Não precisa"}`;
        })
        .filter(Boolean)
        .join("\n");

      const mensagem =
        `Olá ${ADMIN_NOME.split(" ")[0]}, sou ${nome.trim()} e estou apoiando o asfaltamento da ADECAF Rua Digna.\n\n` +
        `📍 Quadra ${quadra.nome} · Lote ${lote.numero}` +
        (tipoLote === "meio" ? " (meio lote)" : " (lote inteiro)") +
        `\n📞 Meu contato: ${telefone.trim()}` +
        (idade !== null ? `\n🎂 Idade: ${idade} anos` : "") +
        (chefeCasa ? `\n👤 Sou chefe da casa` : "") +
        (qtdMoradores ? `\n🏠 Moradores na casa: ${qtdMoradores}` : "") +
        (linhasMelhorias ? `\n\n📋 Melhorias necessárias na rua:\n${linhasMelhorias}` : "") +
        `\n\nLi e concordo com o termo de autorização da ADECAF.`;

      setConfirmado({ mensagem });
      onSaved?.();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao registrar apoio");
    } finally {
      setLoading(false);
    }
  }

  function abrirWhatsApp() {
    if (!confirmado) return;
    window.open(waLink(ADMIN_WHATSAPP, confirmado.mensagem), "_blank");
    toast.success("Apoio registrado! 💚 Lote agora está verde no mapa.");
    onOpenChange(false);
  }

  const jaApoiam = proprietarios.filter((p) => p.apoia_asfalto !== false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Quadra {quadra.nome} · Lote {lote.numero}
          </DialogTitle>
          <DialogDescription>
            Cadastre seu apoio ao asfaltamento da Rua. Em poucos segundos seu lote fica verde no mapa.
          </DialogDescription>
        </DialogHeader>

        {confirmado ? (
          <div className="space-y-3">
            <Alert className="border-[var(--status-confirmado)]/40 bg-[var(--status-confirmado)]/5">
              <CheckCircle2 className="h-4 w-4 text-[var(--status-confirmado)]" />
              <AlertDescription className="text-sm">
                <strong>Apoio registrado!</strong> Agora envie a mensagem de confirmação para {ADMIN_NOME} pelo WhatsApp:
              </AlertDescription>
            </Alert>
            <div className="rounded-md border bg-muted/40 p-3 text-xs whitespace-pre-line">
              {confirmado.mensagem}
            </div>
            <DialogFooter className="flex-col sm:flex-col gap-2">
              <Button onClick={abrirWhatsApp} className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white">
                <MessageCircle className="h-4 w-4 mr-2" />
                Enviar confirmação no WhatsApp
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => onOpenChange(false)}>
                Fechar (enviar depois)
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
        {jaApoiam.length > 0 && (
          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            <div className="font-medium mb-1 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-[var(--status-confirmado)]" />
              Já apoiam este lote:
            </div>
            <ul className="text-muted-foreground space-y-0.5">
              {jaApoiam.map((p) => (
                <li key={p.id}>• {p.nome}{p.fracao && p.fracao !== 100 ? ` (${p.fracao}%)` : ""}</li>
              ))}
            </ul>
          </div>
        )}

        {jaCadastradoAqui && (
          <Alert variant="destructive">
            <AlertDescription className="text-xs">
              Você já tem cadastro neste lote.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Seu nome completo</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Maria Silva" />
          </div>
          <div>
            <Label className="text-xs">Telefone / WhatsApp</Label>
            <Input
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(62) 9 9999-9999"
              inputMode="tel"
            />
          </div>

          <div className="space-y-2 rounded-md border p-3">
            <Label className="text-xs font-semibold">Tipo de cadastro</Label>
            <RadioGroup value={tipoLote} onValueChange={(v) => setTipoLote(v as "inteiro" | "meio")}>
              <div className="flex items-start gap-2">
                <RadioGroupItem value="inteiro" id="tp-int" disabled={!disponivelInteiro} className="mt-0.5" />
                <label htmlFor="tp-int" className={`text-xs cursor-pointer ${!disponivelInteiro ? "opacity-50" : ""}`}>
                  <strong>Lote inteiro</strong> – sou o único dono / morador deste lote.
                  {!disponivelInteiro && <span className="block text-destructive">Indisponível: lote já tem cadastro.</span>}
                </label>
              </div>
              <div className="flex items-start gap-2">
                <RadioGroupItem value="meio" id="tp-meio" disabled={!disponivelMeio} className="mt-0.5" />
                <label htmlFor="tp-meio" className={`text-xs cursor-pointer ${!disponivelMeio ? "opacity-50" : ""}`}>
                  <strong>Meio lote</strong> – este lote foi dividido entre 2 famílias (cada uma cadastra a sua metade).
                </label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Ao confirmar, vai abrir o <strong>WhatsApp</strong> para você enviar a mensagem de
            apoio para {ADMIN_NOME}. Seu lote fica verde no mapa.
          </AlertDescription>
        </Alert>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSign} disabled={loading || jaCadastradoAqui}>
            {loading ? "Enviando…" : "Confirmar apoio 💚"}
          </Button>
        </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}