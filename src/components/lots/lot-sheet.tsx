import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { recomputeLoteStatus, type Lote, type Proprietario, type Quadra } from "@/lib/queries";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { LotTile, STATUS_LABEL } from "./lot-tile";

interface Props {
  lote: Lote;
  quadra: Quadra;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved?: () => void;
}

const empty = (loteId: string): Partial<Proprietario> => ({
  lote_id: loteId,
  fracao: 100,
  nome: "",
  apoia_asfalto: null,
  assinatura_status: "nao_contatado",
});

interface Morador {
  id?: string;
  lote_id: string;
  nome: string;
  data_nascimento: string | null;
  telefone: string | null;
  created_by?: string | null;
}

const emptyMorador = (loteId: string): Morador => ({
  lote_id: loteId,
  nome: "",
  data_nascimento: null,
  telefone: null,
});

export function LotSheet({ lote, quadra, open, onOpenChange, onSaved }: Props) {
  const { isStaff, profile, user } = useAuth();
  const [props, setProps] = useState<Partial<Proprietario>[]>([]);
  const [moradores, setMoradores] = useState<Morador[]>([]);
  const [removedMoradoresIds, setRemovedMoradoresIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [obs, setObs] = useState(lote.observacoes ?? "");

  useEffect(() => {
    if (!open) return;
    setObs(lote.observacoes ?? "");
    setRemovedMoradoresIds([]);
    (async () => {
      const { data } = await supabase.from("proprietarios").select("*").eq("lote_id", lote.id);
      setProps((data as Proprietario[]) ?? []);
      const { data: mds } = await supabase
        .from("moradores" as any)
        .select("*")
        .eq("lote_id", lote.id)
        .order("created_at", { ascending: true });
      setMoradores(((mds as unknown) as Morador[]) ?? []);
    })();
  }, [open, lote.id, lote.observacoes]);

  const total = props.reduce((s, p) => s + Number(p.fracao ?? 0), 0);

  function update(i: number, patch: Partial<Proprietario>) {
    setProps((arr) => arr.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }

  function add() {
    const remaining = Math.max(0, 100 - total);
    setProps((arr) => [...arr, { ...empty(lote.id), fracao: remaining || 50 }]);
  }

  async function remove(i: number) {
    const p = props[i];
    if (p.id) await supabase.from("proprietarios").delete().eq("id", p.id);
    setProps((arr) => arr.filter((_, idx) => idx !== i));
  }

  async function save() {
    if (total > 100.01) {
      toast.error("A soma das frações não pode passar de 100%");
      return;
    }
    setLoading(true);
    try {
      if (isStaff) {
        for (const p of props) {
          if (!p.nome || !p.nome.trim()) continue;
          const payload = {
            lote_id: lote.id,
            fracao: Number(p.fracao ?? 100),
            nome: p.nome.trim(),
            cpf: p.cpf ?? null,
            telefone: p.telefone ?? null,
            whatsapp: p.whatsapp ?? null,
            email: p.email ?? null,
            endereco: p.endereco ?? null,
            situacao: p.situacao ?? null,
            apoia_asfalto: p.apoia_asfalto ?? null,
            assinatura_status: p.assinatura_status ?? "nao_contatado",
            responsavel_cadastro: p.responsavel_cadastro ?? profile?.full_name ?? null,
            observacoes: p.observacoes ?? null,
          };
          if (p.id) {
            await supabase.from("proprietarios").update(payload).eq("id", p.id);
          } else {
            await supabase.from("proprietarios").insert(payload);
          }
        }
        await supabase.from("lotes").update({ observacoes: obs || null }).eq("id", lote.id);
        await recomputeLoteStatus(lote.id);
      }

      // Moradores podem ser cadastrados por qualquer usuário autenticado
      for (const id of removedMoradoresIds) {
        await supabase.from("moradores" as any).delete().eq("id", id);
      }
      for (const m of moradores) {
        if (!m.nome.trim()) continue;
        const payload: any = {
          lote_id: lote.id,
          nome: m.nome.trim(),
          data_nascimento: m.data_nascimento || null,
          telefone: m.telefone || null,
        };
        if (m.id) {
          await supabase.from("moradores" as any).update(payload).eq("id", m.id);
        } else {
          await supabase.from("moradores" as any).insert({ ...payload, created_by: user?.id ?? null });
        }
      }
      toast.success("Cadastro salvo");
      onSaved?.();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  function addMorador() {
    setMoradores((arr) => [...arr, emptyMorador(lote.id)]);
  }
  function updateMorador(i: number, patch: Partial<Morador>) {
    setMoradores((arr) => arr.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));
  }
  function removeMorador(i: number) {
    const m = moradores[i];
    if (m.id) setRemovedMoradoresIds((arr) => [...arr, m.id!]);
    setMoradores((arr) => arr.filter((_, idx) => idx !== i));
  }

  const fracoesPreview = props
    .filter((p) => Number(p.fracao ?? 0) > 0)
    .map((p) => ({
      fracao: Number(p.fracao),
      status: (p.apoia_asfalto === false
        ? "pendencia"
        : p.assinatura_status === "confirmou" || p.assinatura_status === "assinou"
          ? "confirmado"
          : p.nome
            ? "cadastrado"
            : "sem_cadastro") as any,
    }));
  const remaining = 100 - total;
  if (remaining > 0.5) fracoesPreview.push({ fracao: remaining, status: "sem_cadastro" });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>Quadra {quadra.nome} · Lote {lote.numero}</span>
            <Badge variant="outline">{STATUS_LABEL[lote.status]}</Badge>
          </DialogTitle>
          <DialogDescription>
            Frações do lote, dados dos proprietários e situação no abaixo-assinado.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4">
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Pré-visualização</div>
            <div className="w-32 h-32">
              <LotTile numero={lote.numero} status={lote.status} fracoes={fracoesPreview} />
            </div>
            <div className="text-xs text-muted-foreground">Total: {total.toFixed(0)}%</div>
          </div>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Importante:</strong> O cadastro online <strong>não substitui</strong> a assinatura física do
              abaixo-assinado. Seu cadastro serve apenas para organização da associação. A assinatura oficial
              deverá ser realizada presencialmente.
            </AlertDescription>
          </Alert>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Proprietários (frações)</h3>
            {isStaff && (
              <Button size="sm" variant="outline" onClick={add}>
                <Plus className="h-4 w-4 mr-1" /> Adicionar fração
              </Button>
            )}
          </div>
          {props.length === 0 && (
            <div className="text-sm text-muted-foreground italic border rounded-md p-4 text-center">
              Nenhum proprietário cadastrado. {isStaff && "Clique em \"Adicionar fração\" para começar."}
            </div>
          )}
          {props.map((p, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3 bg-muted/30">
              <div className="grid grid-cols-1 md:grid-cols-[100px_1fr_auto] gap-3 items-end">
                <div>
                  <Label className="text-xs">Fração %</Label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={p.fracao ?? 100}
                    onChange={(e) => update(i, { fracao: Number(e.target.value) })}
                    disabled={!isStaff}
                  />
                </div>
                <div>
                  <Label className="text-xs">Nome completo *</Label>
                  <Input
                    value={p.nome ?? ""}
                    onChange={(e) => update(i, { nome: e.target.value })}
                    disabled={!isStaff}
                  />
                </div>
                {isStaff && (
                  <Button variant="ghost" size="icon" onClick={() => remove(i)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Field label="CPF (opcional)" value={p.cpf ?? ""} onChange={(v) => update(i, { cpf: v })} disabled={!isStaff} />
                <Field label="Telefone" value={p.telefone ?? ""} onChange={(v) => update(i, { telefone: v })} disabled={!isStaff} />
                <Field label="WhatsApp" value={p.whatsapp ?? ""} onChange={(v) => update(i, { whatsapp: v })} disabled={!isStaff} />
                <Field label="E-mail" value={p.email ?? ""} onChange={(v) => update(i, { email: v })} disabled={!isStaff} />
                <Field label="Endereço atual" value={p.endereco ?? ""} onChange={(v) => update(i, { endereco: v })} disabled={!isStaff} />
                <Field label="Situação do lote" value={p.situacao ?? ""} onChange={(v) => update(i, { situacao: v })} disabled={!isStaff} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Apoia o asfaltamento?</Label>
                  <Select
                    value={p.apoia_asfalto === null || p.apoia_asfalto === undefined ? "" : String(p.apoia_asfalto)}
                    onValueChange={(v) => update(i, { apoia_asfalto: v === "" ? null : v === "true" })}
                    disabled={!isStaff}
                  >
                    <SelectTrigger><SelectValue placeholder="Não respondeu" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Sim</SelectItem>
                      <SelectItem value="false">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Status da assinatura presencial</Label>
                  <Select
                    value={p.assinatura_status ?? "nao_contatado"}
                    onValueChange={(v) => update(i, { assinatura_status: v as any })}
                    disabled={!isStaff}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nao_contatado">Não contatado</SelectItem>
                      <SelectItem value="contatado">Contatado</SelectItem>
                      <SelectItem value="confirmou">Confirmou apoio</SelectItem>
                      <SelectItem value="assinou">Assinatura presencial realizada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs">Observações</Label>
                <Textarea
                  rows={2}
                  value={p.observacoes ?? ""}
                  onChange={(e) => update(i, { observacoes: e.target.value })}
                  disabled={!isStaff}
                />
              </div>
            </div>
          ))}
        </div>

        <div>
          <Label className="text-xs">Observações do lote</Label>
          <Textarea rows={2} value={obs} onChange={(e) => setObs(e.target.value)} disabled={!isStaff} />
        </div>

        <div className="space-y-3 border-t pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Moradores da residência</h3>
              <p className="text-xs text-muted-foreground">
                Cadastre todos os moradores que vivem neste lote (nome, data de nascimento e telefone).
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={addMorador}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar morador
            </Button>
          </div>
          {moradores.length === 0 && (
            <div className="text-sm text-muted-foreground italic border rounded-md p-4 text-center">
              Nenhum morador cadastrado. Clique em "Adicionar morador" para começar.
            </div>
          )}
          {moradores.map((m, i) => (
            <div key={m.id ?? `new-${i}`} className="border rounded-lg p-3 bg-muted/20">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_180px_auto] gap-3 items-end">
                <div>
                  <Label className="text-xs">Nome completo *</Label>
                  <Input
                    value={m.nome}
                    onChange={(e) => updateMorador(i, { nome: e.target.value })}
                    placeholder="Nome do morador"
                  />
                </div>
                <div>
                  <Label className="text-xs">Data de nascimento</Label>
                  <Input
                    type="date"
                    value={m.data_nascimento ?? ""}
                    onChange={(e) => updateMorador(i, { data_nascimento: e.target.value || null })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Telefone</Label>
                  <Input
                    value={m.telefone ?? ""}
                    onChange={(e) => updateMorador(i, { telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeMorador(i)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          <Button onClick={save} disabled={loading}>
            {loading ? "Salvando…" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value, onChange, disabled }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} />
    </div>
  );
}