import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Info, CheckCircle2, MessageCircle, Trash2 } from "lucide-react";
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
  allProps?: Proprietario[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved?: () => void;
}

export function QuickSignDialog({ lote, quadra, proprietarios, allProps = [], open, onOpenChange, onSaved }: Props) {
  const { profile, user, isStaff } = useAuth();
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [chefeCasa, setChefeCasa] = useState(false);
  const [qtdMoradores, setQtdMoradores] = useState<string>("");
  const [outrosMoradores, setOutrosMoradores] = useState<{ nome: string; telefone: string; data_nascimento: string }[]>([]);
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
      setOutrosMoradores([]);
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

  // Já cadastrou neste lote?
  const jaCadastradoAqui = !!user && proprietarios.some((p) => p.telefone === profile?.phone);
  // Já cadastrou em QUALQUER lote no sistema?
  const jaCadastradoGlobal = !!user && allProps.some((p) => p.telefone === profile?.phone);

  async function handleSign() {
    if (!nome.trim() || !telefone.trim()) {
      toast.error("Preencha nome e telefone");
      return;
    }
    if (jaCadastradoGlobal && !isStaff) {
      toast.error("Você já possui um cadastro registrado no sistema. Cada morador só pode preencher uma vez.");
      return;
    }
    const totalRespostas = Object.values(melhorias).filter(v => v !== null).length;
    if (totalRespostas < MELHORIAS_OPCOES.length) {
      toast.error(`Por favor, responda a todas as opções da pesquisa (${totalRespostas}/${MELHORIAS_OPCOES.length}).`);
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
    const qtd = qtdMoradores ? Number(qtdMoradores) : 1;
    if (qtd > 1) {
      const invalido = outrosMoradores.some(
        (m) => !m.nome.trim() || !m.telefone.trim() || !m.data_nascimento.trim(),
      );
      if (invalido) {
        toast.error("Preencha nome, telefone/WhatsApp e data de nascimento de todas as pessoas.");
        return;
      }
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

      // Salvar dados das outras pessoas que moram no lote
      if (outrosMoradores.length > 0) {
        const rows = outrosMoradores.map((m) => ({
          lote_id: lote.id,
          nome: m.nome.trim(),
          telefone: m.telefone.trim(),
          data_nascimento: m.data_nascimento || null,
          created_by: user?.id ?? null,
        }));
        const { error: morErr } = await supabase.from("moradores" as any).insert(rows);
        if (morErr) throw morErr;
      }


      // Constrói a lista completa de moradores para a mensagem
      const todosMoradores = [
        {
          nome: nome.trim(),
          telefone: telefone.trim(),
          data_nascimento: dataNascimento,
        },
        ...outrosMoradores,
      ];
      const formatarData = (iso: string) => {
        if (!iso) return "—";
        const d = new Date(iso + "T00:00:00");
        return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("pt-BR");
      };
      const linhasMoradores = todosMoradores
        .map(
          (m, i) =>
            `${i + 1}. ${m.nome} — ${m.telefone || "—"} — ${formatarData(m.data_nascimento)}`,
        )
        .join("\n");

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
        (qtdMoradores ? `\n🏠 Pessoas na casa: ${qtdMoradores}` : "") +
        `\n\n🏠 Moradores da residência:\n${linhasMoradores}` +
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

  async function excluirProprietario(id: string) {
    if (!confirm("Tem certeza que deseja remover este morador do lote?")) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("proprietarios").delete().eq("id", id);
      if (error) throw error;
      toast.success("Cadastro do lote removido!");
      await recomputeLoteStatus(lote.id);
      onSaved?.();
    } catch (e: any) {
      toast.error(e.message || "Erro ao excluir");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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
            <ul className="text-muted-foreground space-y-2 mt-3">
              {jaApoiam.map((p) => (
                <li key={p.id} className="flex flex-col border-b border-border/50 pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">• {p.nome}{p.fracao && p.fracao !== 100 ? ` (${p.fracao}%)` : ""}</span>
                    {isStaff && (
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => excluirProprietario(p.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  {isStaff && p.melhorias && Object.keys(p.melhorias).length > 0 && (
                    <div className="pl-3 mt-1.5 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-muted-foreground/80">
                      {MELHORIAS_OPCOES.map(m => {
                        const val = (p.melhorias as Record<string, string>)[m.key];
                        if (!val) return null;
                        return (
                          <div key={m.key} className="flex items-center gap-1">
                            <span>{m.label}:</span>
                            <strong className={val === 'sim' ? 'text-green-600' : 'text-red-500/80'}>
                              {val === 'sim' ? 'Precisa' : 'Não'}
                            </strong>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {jaCadastradoGlobal && !isStaff && (
          <Alert variant="destructive">
            <AlertDescription className="text-xs">
              Você já possui um cadastro no sistema. Cada morador só pode preencher 1 vez em apenas um lote.
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

          <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
            <div>
              <Label className="text-xs">Data de nascimento</Label>
              <Input
                type="date"
                value={dataNascimento}
                onChange={(e) => setDataNascimento(e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
              />
            </div>
            <div className="text-xs text-muted-foreground pb-2 whitespace-nowrap">
              {idade !== null ? <span><strong>{idade}</strong> anos</span> : "—"}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 rounded-md border p-2">
              <Checkbox
                id="chefe-casa"
                checked={chefeCasa}
                onCheckedChange={(v) => setChefeCasa(!!v)}
              />
              <label htmlFor="chefe-casa" className="text-xs cursor-pointer leading-tight">
                Sou o <strong>chefe da casa</strong>
              </label>
            </div>
            <div>
              <Label className="text-xs">Pessoas na casa</Label>
              <Input
                type="number"
                min={1}
                max={30}
                value={qtdMoradores}
                onChange={(e) => {
                  const val = e.target.value;
                  setQtdMoradores(val);
                  const count = Math.max(0, Math.min(30, Number(val) || 0));
                  const others = Math.max(0, count - 1);
                  setOutrosMoradores((prev) => {
                    const next = prev.slice(0, others);
                    while (next.length < others) {
                      next.push({ nome: "", telefone: "", data_nascimento: "" });
                    }
                    return next;
                  });
                }}
                placeholder="Ex.: 4"
              />
            </div>
          </div>

          {outrosMoradores.length > 0 && (
            <div className="space-y-3 rounded-md border p-3">
              <Label className="text-xs font-semibold">Dados das outras pessoas que moram na casa</Label>
              <p className="text-[11px] text-muted-foreground -mt-1">
                Nome, telefone/WhatsApp e data de nascimento são obrigatórios.
              </p>
              {outrosMoradores.map((m, i) => (
                <div key={i} className="border rounded-lg p-3 bg-muted/20 space-y-3">
                  <div className="text-sm font-medium">Pessoa {i + 2}</div>
                  <div>
                    <Label className="text-xs">Nome completo *</Label>
                    <Input
                      value={m.nome}
                      onChange={(e) =>
                        setOutrosMoradores((arr) =>
                          arr.map((item, idx) => (idx === i ? { ...item, nome: e.target.value } : item))
                        )
                      }
                      placeholder="Nome completo"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Telefone / WhatsApp *</Label>
                      <Input
                        value={m.telefone}
                        onChange={(e) =>
                          setOutrosMoradores((arr) =>
                            arr.map((item, idx) => (idx === i ? { ...item, telefone: e.target.value } : item))
                          )
                        }
                        placeholder="(62) 9 9999-9999"
                        inputMode="tel"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Data de nascimento *</Label>
                      <Input
                        type="date"
                        value={m.data_nascimento}
                        onChange={(e) =>
                          setOutrosMoradores((arr) =>
                            arr.map((item, idx) =>
                              idx === i ? { ...item, data_nascimento: e.target.value } : item
                            )
                          )
                        }
                        max={new Date().toISOString().slice(0, 10)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2 rounded-md border p-3">
            <Label className="text-xs font-semibold">
              Pesquisa: o que está faltando na nossa rua?
            </Label>
            <p className="text-[11px] text-muted-foreground -mt-1">
              Para cada item, marque se precisa ou não.
            </p>
            <div className="space-y-1.5">
              {MELHORIAS_OPCOES.map((m) => (
                <div key={m.key} className="flex items-center justify-between gap-2 text-xs">
                  <span className="flex-1">{m.label}</span>
                  <RadioGroup
                    value={melhorias[m.key] ?? ""}
                    onValueChange={(v) =>
                      setMelhorias((prev) => ({ ...prev, [m.key]: v as "sim" | "nao" }))
                    }
                    className="flex gap-3"
                  >
                    <div className="flex items-center gap-1">
                      <RadioGroupItem value="sim" id={`${m.key}-sim`} />
                      <label htmlFor={`${m.key}-sim`} className="cursor-pointer">Precisa</label>
                    </div>
                    <div className="flex items-center gap-1">
                      <RadioGroupItem value="nao" id={`${m.key}-nao`} />
                      <label htmlFor={`${m.key}-nao`} className="cursor-pointer">Não</label>
                    </div>
                  </RadioGroup>
                </div>
              ))}
            </div>
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
          <Button onClick={handleSign} disabled={loading || (jaCadastradoGlobal && !isStaff)}>
            {loading ? "Enviando…" : "Confirmar apoio 💚"}
          </Button>
        </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}