import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { LotTile, STATUS_LABEL, type LoteStatus } from "@/components/lots/lot-tile";
import { LotSheet } from "@/components/lots/lot-sheet";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { fetchLotes, fetchProprietarios, fetchQuadras, type Lote, type Proprietario, type Quadra } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { Search } from "lucide-react";
import { Toaster } from "sonner";

export const Route = createFileRoute("/_authenticated/mapa")({
  head: () => ({ meta: [{ title: "Mapa do Loteamento — ADECAF Rua Digna" }] }),
  component: MapaPage,
});

function MapaPage() {
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [props, setProps] = useState<Proprietario[]>([]);
  const [selected, setSelected] = useState<Lote | null>(null);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  async function load() {
    const [qs, ls, ps] = await Promise.all([fetchQuadras(), fetchLotes(), fetchProprietarios()]);
    setQuadras(qs);
    setLotes(ls);
    setProps(ps);
  }

  useEffect(() => {
    load();
    const ch = supabase
      .channel("mapa")
      .on("postgres_changes", { event: "*", schema: "public", table: "lotes" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "proprietarios" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "quadras" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const propsByLote = useMemo(() => {
    const m = new Map<string, Proprietario[]>();
    for (const p of props) {
      const arr = m.get(p.lote_id) ?? [];
      arr.push(p);
      m.set(p.lote_id, arr);
    }
    return m;
  }, [props]);

  const search = q.trim().toLowerCase();
  const matchesSearch = (l: Lote, qd: Quadra) => {
    if (!search) return true;
    if (l.numero.toLowerCase().includes(search)) return true;
    if (qd.nome.toLowerCase().includes(search)) return true;
    const pp = propsByLote.get(l.id) ?? [];
    return pp.some(
      (p) =>
        p.nome.toLowerCase().includes(search) ||
        (p.telefone ?? "").includes(search) ||
        (p.whatsapp ?? "").includes(search),
    );
  };

  const totals = useMemo(() => {
    const counts: Record<LoteStatus, number> = {
      sem_cadastro: 0,
      cadastrado: 0,
      incompleto: 0,
      confirmado: 0,
      pendencia: 0,
    };
    for (const l of lotes) counts[l.status]++;
    return counts;
  }, [lotes]);

  return (
    <AppShell>
      <Toaster position="top-right" richColors />
      <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mapa do Loteamento</h1>
            <p className="text-sm text-muted-foreground">
              Clique em um lote para cadastrar ou editar proprietários e o status do abaixo-assinado.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8 w-64" placeholder="Buscar nome, telefone, lote…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {(Object.keys(STATUS_LABEL) as LoteStatus[]).map((k) => (
                  <SelectItem key={k} value={k}>{STATUS_LABEL[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className="p-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <Legend status="sem_cadastro" count={totals.sem_cadastro} />
            <Legend status="cadastrado" count={totals.cadastrado} />
            <Legend status="incompleto" count={totals.incompleto} />
            <Legend status="confirmado" count={totals.confirmado} />
            <Legend status="pendencia" count={totals.pendencia} />
          </div>
        </Card>

        <Card className="p-5 bg-gradient-to-r from-primary/10 via-accent/30 to-primary/10 border-primary/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-base">Sua rua merece asfalto. Sua assinatura faz a diferença!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Encontre seu lote no mapa, clique nele e cadastre-se. Quanto mais vizinhos
                participarem, mais força nosso abaixo-assinado terá junto à Prefeitura.
              </p>
            </div>
            <div className="text-sm text-muted-foreground md:text-right">
              <div><strong className="text-foreground">{totals.confirmado + totals.cadastrado}</strong> de {lotes.length} lotes já apoiam</div>
              <div className="text-xs">Faltam {totals.sem_cadastro} para o 100%</div>
            </div>
          </div>
        </Card>

        {quadras.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground">
            Nenhuma quadra cadastrada ainda. Vá em <strong>Administração</strong> para criar quadras e lotes.
          </Card>
        )}

        <div className="space-y-6">
          {quadras.map((qd) => {
            const ls = lotes
              .filter((l) => l.quadra_id === qd.id)
              .filter((l) => statusFilter === "all" || l.status === statusFilter)
              .filter((l) => matchesSearch(l, qd));
            if (ls.length === 0) return null;
            return (
              <Card key={qd.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold">Quadra {qd.nome}</h2>
                  <span className="text-xs text-muted-foreground">{ls.length} lote(s)</span>
                </div>
                <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
                  {ls.map((l) => {
                    const pp = propsByLote.get(l.id) ?? [];
                    const fr = pp.map((p) => ({
                      fracao: Number(p.fracao),
                      status: (p.apoia_asfalto === false
                        ? "pendencia"
                        : p.assinatura_status === "confirmou" || p.assinatura_status === "assinou"
                          ? "confirmado"
                          : "cadastrado") as LoteStatus,
                    }));
                    const total = fr.reduce((s, x) => s + x.fracao, 0);
                    if (total < 100) fr.push({ fracao: 100 - total, status: "sem_cadastro" });
                    return (
                      <LotTile
                        key={l.id}
                        numero={l.numero}
                        status={l.status}
                        fracoes={fr.length > 1 ? fr : undefined}
                        onClick={() => setSelected(l)}
                      />
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {selected && (
        <LotSheet
          lote={selected}
          quadra={quadras.find((q) => q.id === selected.quadra_id)!}
          open={!!selected}
          onOpenChange={(v) => !v && setSelected(null)}
          onSaved={load}
        />
      )}
    </AppShell>
  );
}

function Legend({ status, count }: { status: LoteStatus; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 rounded" style={{ background: `var(--status-${status.replace("_cadastro", "").replace("sem", "sem")})` }} />
      <span className="text-muted-foreground">{STATUS_LABEL[status]}</span>
      <span className="font-semibold">{count}</span>
    </div>
  );
}