import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { STATUS_LABEL, type LoteStatus } from "@/components/lots/lot-tile";
import { QuickSignDialog } from "@/components/lots/quick-sign-dialog";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { fetchLoteamentos, fetchLotes, fetchProprietarios, fetchQuadras, deriveStatus, type Loteamento, type Lote, type Proprietario, type Quadra } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { Search } from "lucide-react";
import { Toaster } from "sonner";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";

const LOTEAMENTO_LOCK_KEY = "adecaf_loteamento_lock"; // mantido apenas como fallback temp

export const Route = createFileRoute("/_authenticated/mapa")({
  head: () => ({ meta: [{ title: "Mapa do Loteamento — ADECAF Rua Digna" }] }),
  validateSearch: (search: Record<string, unknown>): { loteamento?: string } => ({
    loteamento: typeof search.loteamento === "string" ? search.loteamento : undefined,
  }),
  component: MapaPage,
});

function MapaPage() {
  const { loteamento: loteamentoParam } = Route.useSearch();
  const { isStaff, profile, loading: authLoading } = useAuth();

  // Fonte de verdade: perfil do banco > query param > localStorage (fallback)
  const profileLock = profile?.loteamento_id ?? null;
  const lockedId = !isStaff
    ? (profileLock || loteamentoParam || localStorage.getItem(LOTEAMENTO_LOCK_KEY) || null)
    : null;
  const isLocked = !!lockedId;

  // Quando vem via link E ainda nao tem loteamento no perfil, salva no localStorage como temp
  // (será gravado definitivamente no perfil pelo auth.tsx no cadastro)
  useEffect(() => {
    if (loteamentoParam && !isStaff && !profileLock) {
      localStorage.setItem(LOTEAMENTO_LOCK_KEY, loteamentoParam);
    }
    // Se já tem no perfil, limpa o localStorage (não precisa mais)
    if (profileLock) {
      localStorage.removeItem(LOTEAMENTO_LOCK_KEY);
    }
  }, [loteamentoParam, isStaff, profileLock]);

  const [loteamentos, setLoteamentos] = useState<Loteamento[]>([]);
  const [loteamentoId, setLoteamentoId] = useState<string>("");
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [props, setProps] = useState<Proprietario[]>([]);
  const [selected, setSelected] = useState<Lote | null>(null);
  const [q, setQ] = useState("");

  // Aguarda o perfil carregar antes de definir o loteamentoId
  useEffect(() => {
    if (authLoading) return;
    fetchLoteamentos().then((data) => {
      setLoteamentos(data);
      const id = lockedId || (data.length > 0 ? data[0].id : "");
      setLoteamentoId(id);
    });
  }, [authLoading, isStaff, profileLock]);

  async function load(currentId: string) {
    if (!currentId) return;
    const [qs, ls, ps] = await Promise.all([fetchQuadras(currentId), fetchLotes(), fetchProprietarios()]);
    
    // Filtra localmente apenas os lotes e proprietários das quadras deste loteamento
    const qIds = new Set(qs.map(q => q.id));
    const lotesFiltered = ls.filter(l => qIds.has(l.quadra_id));
    const lotesIds = new Set(lotesFiltered.map(l => l.id));
    const propsFiltered = ps.filter(p => lotesIds.has(p.lote_id));
    
    setQuadras(qs);
    setLotes(lotesFiltered);
    setProps(propsFiltered);
  }

  useEffect(() => {
    if (!loteamentoId) return;
    load(loteamentoId);
    const ch = supabase
      .channel("mapa")
      .on("postgres_changes", { event: "*", schema: "public", table: "lotes" }, () => load(loteamentoId))
      .on("postgres_changes", { event: "*", schema: "public", table: "proprietarios" }, () => load(loteamentoId))
      .on("postgres_changes", { event: "*", schema: "public", table: "quadras" }, () => load(loteamentoId))
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [loteamentoId]);

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
  const isHighlighted = (l: Lote, qd: Quadra) => {
    if (!search) return false;
    if (l.numero.toLowerCase().includes(search)) return true;
    if (qd.nome.toLowerCase().includes(search)) return true;
    // Por privacidade, visitantes não podem pesquisar por nome/telefone
    if (!isStaff) return false;
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
    for (const l of lotes) {
      counts[l.status]++;
    }
    return counts;
  }, [lotes]);

  // Soma das frações ocupadas (em "lotes"): cada 100% = 1 lote.
  // Permite contagem fracionária como 3,5 quando meio lote foi cadastrado.
  const ocupadoFracionado = useMemo(() => {
    let sum = 0;
    for (const l of lotes) sum += Number(l.fracao_ocupada ?? 0) / 100;
    return sum;
  }, [lotes]);
  const livreFracionado = Math.max(0, lotes.length - ocupadoFracionado);
  const fmtFrac = (n: number) =>
    Number.isInteger(n) ? String(n) : n.toFixed(1).replace(".", ",");

  const lotesByQuadra = useMemo(() => {
    const m = new Map<string, Lote[]>();
    for (const l of lotes) {
      const arr = m.get(l.quadra_id) ?? [];
      arr.push(l);
      m.set(l.quadra_id, arr);
    }
    for (const arr of m.values()) {
      arr.sort((a, b) => Number(a.numero) - Number(b.numero));
    }
    return m;
  }, [lotes]);

  // Ruas que cercam cada quadra (Norte / Sul / Oeste / Leste), conforme o mapa impresso
  const STREETS: Record<string, { n: string; s: string; w: string; e: string }> = {
    "1": { n: "RUA 1", s: "RUA 10", w: "RUA Tocantins", e: "RUA Paraíba" },
    "2": { n: "RUA 1", s: "RUA 10", w: "RUA Paraíba", e: "RUA 2" },
    "3": { n: "RUA 1", s: "RUA 10", w: "RUA 2", e: "RUA 3" },
    "4": { n: "Av. Araguaia", s: "RUA 11", w: "RUA 4", e: "RUA 5" },
    "5": { n: "Av. Araguaia", s: "RUA 11", w: "RUA 5", e: "RUA 6" },
    "6": { n: "Av. Araguaia", s: "RUA 11", w: "RUA 6", e: "RUA 7" },
    "7": { n: "Av. Araguaia", s: "RUA 11", w: "RUA 7", e: "RUA 8" },
    "8": { n: "Av. Araguaia", s: "RUA 11", w: "RUA 8", e: "(extremo leste)" },
  };
  const ordemSetor1 = ["1", "2", "3"];
  const ordemSetor2 = ["4", "5", "6", "7", "8"];
  const findQ = (nome: string) => quadras.find((q) => q.nome === nome);

  const isMariaRita = loteamentoId === 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const selectedLoteamento = loteamentos.find((l) => l.id === loteamentoId);

  return (
    <AppShell>
      <Toaster position="top-right" richColors />
      <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold tracking-tight">Planta do Loteamento</h1>
              {isLocked ? (
                <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 border border-blue-200">
                  {selectedLoteamento?.nome ?? ""}
                </span>
              ) : (
                <Select value={loteamentoId} onValueChange={setLoteamentoId}>
                  <SelectTrigger className="w-[280px] h-8">
                    <SelectValue placeholder="Selecione um loteamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {loteamentos.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Encontre seu lote no mapa e clique para apoiar o asfaltamento da Rua. Lotes livres em cinza e ocupados em azul.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8 w-64" placeholder="Achar nome, telefone ou lote…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
        </div>

        <Card className="p-4">
          {isStaff ? (
            <div className="flex flex-wrap gap-4 text-sm">
              <Legend status="sem_cadastro" count={totals.sem_cadastro} />
              <Legend status="cadastrado" count={totals.cadastrado} />
              <Legend status="confirmado" count={totals.confirmado} />
            </div>
          ) : (
          <div className="flex flex-wrap gap-4 text-sm">
              <LegendCustom color="var(--status-sem)" label="Lote livre" count={fmtFrac(livreFracionado)} />
              <LegendCustom color="#3b82f6" label="Lote ocupado" count={fmtFrac(ocupadoFracionado)} />
            </div>
          )}
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
              <div><strong className="text-foreground">{fmtFrac(ocupadoFracionado)}</strong> de {lotes.length} lotes já apoiam</div>
              <div className="text-xs">Faltam {fmtFrac(livreFracionado)} para o 100%</div>
            </div>
          </div>
        </Card>

        {quadras.length === 0 && loteamentoId ? (
          <Card className="p-8 text-center text-muted-foreground">
            {lotes.length === 0 ? "Nenhuma quadra cadastrada neste loteamento." : "Carregando o mapa…"}
          </Card>
        ) : null}

        {quadras.length > 0 && isMariaRita ? (
          <div className="space-y-6">
            <SectorHeader title="Setor Sul · Junto à Área Verde" subtitle="Quadras 1 a 3" />
            <div className="space-y-5">
              {ordemSetor1.map((nome) => {
                const qd = findQ(nome);
                if (!qd) return null;
                return (
                  <QuadraCard
                    key={qd.id}
                    quadra={qd}
                    streets={STREETS[nome]}
                    lotes={lotesByQuadra.get(qd.id) ?? []}
                    isHighlighted={(l) => isHighlighted(l, qd)}
                    onLoteClick={setSelected}
                    propsByLote={propsByLote}
                    publicView={!isStaff}
                  />
                );
              })}
            </div>

            <div className="rounded-md border-2 border-dashed border-[oklch(0.55_0.15_140)] bg-[oklch(0.9_0.08_140)] py-4 text-center text-xs font-bold tracking-widest text-[oklch(0.3_0.1_140)]">
              ▬▬▬ ÁREA PÚBLICA MUNICIPAL ▬▬▬
            </div>

            <SectorHeader title="Setor Norte · Av. Araguaia" subtitle="Quadras 4 a 8" />
            <div className="space-y-5">
              {ordemSetor2.map((nome) => {
                const qd = findQ(nome);
                if (!qd) return null;
                return (
                  <QuadraCard
                    key={qd.id}
                    quadra={qd}
                    streets={STREETS[nome]}
                    lotes={lotesByQuadra.get(qd.id) ?? []}
                    isHighlighted={(l) => isHighlighted(l, qd)}
                    onLoteClick={setSelected}
                    propsByLote={propsByLote}
                    publicView={!isStaff}
                  />
                );
              })}
            </div>
          </div>
        ) : null}

        {quadras.length > 0 && !isMariaRita ? (
          <div className="space-y-6">
            <SectorHeader title="Todas as Quadras" subtitle={selectedLoteamento?.nome || ""} />
            <div className="space-y-5">
              {quadras.map((qd) => (
                <QuadraCard
                  key={qd.id}
                  quadra={qd}
                  streets={{ n: "Rua", s: "Rua", w: "Rua", e: "Rua" }}
                  lotes={lotesByQuadra.get(qd.id) ?? []}
                  isHighlighted={(l) => isHighlighted(l, qd)}
                  onLoteClick={setSelected}
                  propsByLote={propsByLote}
                  publicView={!isStaff}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {selected && (
        <QuickSignDialog
          lote={selected}
          quadra={quadras.find((q) => q.id === selected.quadra_id)!}
          proprietarios={propsByLote.get(selected.id) ?? []}
          allProps={props}
          open={!!selected}
          onOpenChange={(v) => !v && setSelected(null)}
          onSaved={() => load(loteamentoId)}
        />
      )}
    </AppShell>
  );
}

function SectorHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex items-baseline justify-between border-b-2 border-primary/30 pb-2">
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      <span className="text-xs text-muted-foreground">{subtitle}</span>
    </div>
  );
}

function QuadraCard({
  quadra,
  lotes,
  streets,
  isHighlighted,
  onLoteClick,
  propsByLote,
  publicView,
}: {
  quadra: Quadra;
  lotes: Lote[];
  streets: { n: string; s: string; w: string; e: string };
  isHighlighted: (l: Lote) => boolean;
  onLoteClick: (l: Lote) => void;
  propsByLote: Map<string, Proprietario[]>;
  publicView?: boolean;
}) {
  // Linha de cima: primeira metade (esq → dir). Linha de baixo: segunda metade (dir → esq).
  const half = Math.ceil(lotes.length / 2);
  const topRow = lotes.slice(0, half);
  const bottomRow = lotes.slice(half);

  return (
    <Card className="p-3 sm:p-4 overflow-x-auto">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <div className="text-sm font-bold rounded-full bg-primary text-primary-foreground w-9 h-9 flex items-center justify-center shadow">
            {quadra.nome.padStart(2, "0")}
          </div>
          <div>
            <div className="text-sm font-bold leading-tight">Quadra {quadra.nome}</div>
            <div className="text-[11px] text-muted-foreground leading-tight">{lotes.length} lotes</div>
          </div>
        </div>
      </div>

      <div className="min-w-max">
        <StreetLabel label={streets.n} direction="h" />
        <div className="grid grid-cols-[auto_1fr_auto] items-stretch gap-0 my-1">
          <StreetLabel label={streets.w} direction="v" />
          <div className="flex flex-col gap-0.5 px-1 py-1 bg-[oklch(0.93_0.05_140)] border-y-2 border-[oklch(0.55_0.12_140)]">
            <Row lotes={topRow} isHighlighted={isHighlighted} onClick={onLoteClick} propsByLote={propsByLote} publicView={publicView} />
            <Row lotes={bottomRow} isHighlighted={isHighlighted} onClick={onLoteClick} propsByLote={propsByLote} publicView={publicView} />
          </div>
          <StreetLabel label={streets.e} direction="v" />
        </div>
        <StreetLabel label={streets.s} direction="h" />
      </div>
    </Card>
  );
}

function StreetLabel({ label, direction }: { label: string; direction: "h" | "v" }) {
  if (direction === "h") {
    return (
      <div className="text-[10px] font-bold tracking-widest text-muted-foreground bg-white border border-dashed border-muted-foreground/40 py-1 px-2 text-center rounded-sm">
        ▬ {label} ▬
      </div>
    );
  }
  return (
    <div
      className="flex items-center justify-center bg-white border border-dashed border-muted-foreground/40 px-1 mx-0 rounded-sm"
      style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
    >
      <span className="text-[10px] font-bold tracking-widest text-muted-foreground whitespace-nowrap py-1">
        {label}
      </span>
    </div>
  );
}

function Row({
  lotes,
  isHighlighted,
  onClick,
  propsByLote,
  publicView,
}: {
  lotes: Lote[];
  isHighlighted: (l: Lote) => boolean;
  onClick: (l: Lote) => void;
  propsByLote: Map<string, Proprietario[]>;
  publicView?: boolean;
}) {
  return (
    <div className="flex gap-0.5">
      {lotes.map((l) => {
        const pr = propsByLote.get(l.id) || [];
        const fracaoFromProps = pr.reduce((acc, p) => acc + Number(p.fracao || 0), 0);
        // Para visitantes (sem acesso a proprietarios), usa a coluna pública fracao_ocupada do lote.
        const fracaoTotal = publicView ? Number(l.fracao_ocupada ?? 0) : fracaoFromProps;
        // No modo público (visitante) o lote só revela se está livre ou ocupado (azul),
        // sem indicar quem cadastrou nem nuances de status. Usamos a coluna status do lote,
        // que já é mantida atualizada, evitando a necessidade de ler dados privados.
        const ocupado = publicView ? fracaoTotal > 0 : pr.length > 0;
        const corBase = publicView
          ? (ocupado ? "#3b82f6" : "var(--status-sem)")
          : `var(--status-${l.status === "sem_cadastro" ? "sem" : l.status})`;
        let bg = corBase;
        if (publicView && fracaoTotal > 0 && fracaoTotal < 99.5) {
          bg = `linear-gradient(180deg, #3b82f6 ${fracaoTotal}%, var(--status-sem) ${fracaoTotal}%)`;
        } else if (!publicView && fracaoTotal > 0 && fracaoTotal < 100) {
          bg = `linear-gradient(90deg, var(--status-${l.status === "sem_cadastro" ? "sem" : l.status}) ${fracaoTotal}%, var(--status-sem) ${fracaoTotal}%)`;
        }

        return (
          <button
            key={l.id}
            onClick={() => {
              if (publicView && fracaoTotal >= 99.5) {
                toast.info("Lote já ocupado", {
                  description: "Este lote já possui cadastro e não pode ser alterado.",
                });
                return;
              }
              onClick(l);
            }}
            title={`Lote ${l.numero}`}
            style={{ background: bg }}
            className={cn(
              "w-6 h-9 sm:w-7 sm:h-11 text-[9px] sm:text-[10px] font-semibold rounded-sm border border-black/10 flex items-center justify-center transition-all hover:scale-110 hover:z-10 hover:shadow-md hover:ring-2 hover:ring-primary",
              isHighlighted(l) && "ring-2 ring-primary ring-offset-1 scale-110 z-10",
              (publicView ? ocupado : (l.status === "confirmado" || l.status === "cadastrado")) ? "text-white" : "text-foreground/80",
            )}
          >
            {l.numero.padStart(2, "0")}
          </button>
        );
      })}
    </div>
  );
}

function Legend({ status, count }: { status: LoteStatus; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-4 h-4 rounded border"
        style={{ background: `var(--status-${status === "sem_cadastro" ? "sem" : status})` }}
      />
      <span className="text-muted-foreground">{STATUS_LABEL[status]}</span>
      <span className="font-semibold">{count}</span>
    </div>
  );
}

function LegendCustom({ color, label, count }: { color: string; label: string; count: number | string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 rounded border" style={{ background: color }} />
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{count}</span>
    </div>
  );
}
