import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { STATUS_LABEL, type LoteStatus } from "@/components/lots/lot-tile";
import { QuickSignDialog } from "@/components/lots/quick-sign-dialog";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { fetchLotes, fetchProprietarios, fetchQuadras, type Lote, type Proprietario, type Quadra } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { Search } from "lucide-react";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";

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
  const isHighlighted = (l: Lote, qd: Quadra) => {
    if (!search) return false;
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

  return (
    <AppShell>
      <Toaster position="top-right" richColors />
      <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Residencial Maria Rita — Planta do Loteamento</h1>
            <p className="text-sm text-muted-foreground">
              Encontre seu lote no mapa e clique para apoiar o asfaltamento da Rua. Os lotes verdes já apoiam.
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
          <div className="flex flex-wrap gap-4 text-sm">
            <Legend status="sem_cadastro" count={totals.sem_cadastro} />
            <Legend status="cadastrado" count={totals.cadastrado} />
            <Legend status="confirmado" count={totals.confirmado} />
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
              <div className="text-xs">Faltam {lotes.length - (totals.confirmado + totals.cadastrado)} para o 100%</div>
            </div>
          </div>
        </Card>

        {quadras.length === 0 && (
          <Card className="p-8 text-center text-muted-foreground">
            Carregando o mapa…
          </Card>
        )}

        {quadras.length > 0 && (
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
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {selected && (
        <QuickSignDialog
          lote={selected}
          quadra={quadras.find((q) => q.id === selected.quadra_id)!}
          proprietarios={propsByLote.get(selected.id) ?? []}
          open={!!selected}
          onOpenChange={(v) => !v && setSelected(null)}
          onSaved={load}
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
}: {
  quadra: Quadra;
  lotes: Lote[];
  streets: { n: string; s: string; w: string; e: string };
  isHighlighted: (l: Lote) => boolean;
  onLoteClick: (l: Lote) => void;
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
            <Row lotes={topRow} isHighlighted={isHighlighted} onClick={onLoteClick} />
            <Row lotes={bottomRow} isHighlighted={isHighlighted} onClick={onLoteClick} />
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
}: {
  lotes: Lote[];
  isHighlighted: (l: Lote) => boolean;
  onClick: (l: Lote) => void;
}) {
  return (
    <div className="flex gap-0.5">
      {lotes.map((l) => (
        <button
          key={l.id}
          onClick={() => onClick(l)}
          title={`Lote ${l.numero}`}
          style={{ background: `var(--status-${l.status === "sem_cadastro" ? "sem" : l.status})` }}
          className={cn(
            "w-6 h-9 sm:w-7 sm:h-11 text-[9px] sm:text-[10px] font-semibold rounded-sm border border-black/10 flex items-center justify-center transition-all hover:scale-110 hover:z-10 hover:shadow-md hover:ring-2 hover:ring-primary",
            isHighlighted(l) && "ring-2 ring-primary ring-offset-1 scale-110 z-10",
            (l.status === "confirmado" || l.status === "cadastrado") ? "text-white" : "text-foreground/80",
          )}
        >
          {l.numero.padStart(2, "0")}
        </button>
      ))}
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
