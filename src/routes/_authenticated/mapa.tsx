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

  const norteLayout: { quadra?: string; rua?: string }[] = [
    { rua: "RUA 4" },
    { quadra: "4" },
    { rua: "RUA 5" },
    { quadra: "5" },
    { rua: "RUA 6" },
    { quadra: "6" },
    { rua: "RUA 7" },
    { quadra: "7" },
    { rua: "RUA 8" },
    { quadra: "8" },
  ];
  const sulLayout: { quadra?: string; rua?: string; label?: string }[] = [
    { label: "ÁREA VERDE" },
    { rua: "RUA Tocantins" },
    { quadra: "1" },
    { rua: "RUA Paraíba" },
    { quadra: "2" },
    { rua: "RUA 2" },
    { quadra: "3" },
    { rua: "RUA 3" },
  ];
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
          <div className="rounded-xl border bg-[oklch(0.95_0.04_140)] p-4 sm:p-6 overflow-x-auto">
            <StreetBar label="AV. ARAGUAIA" emphasis />
            <div className="flex items-stretch gap-0 justify-center min-w-max py-1">
              {norteLayout.map((it, i) => {
                if (it.rua) return <StreetVertical key={i} label={it.rua} />;
                const qd = findQ(it.quadra!);
                if (!qd) return null;
                return (
                  <QuadraBlock
                    key={qd.id}
                    quadra={qd}
                    lotes={lotesByQuadra.get(qd.id) ?? []}
                    isHighlighted={(l) => isHighlighted(l, qd)}
                    onLoteClick={setSelected}
                  />
                );
              })}
            </div>
            <StreetBar label="RUA 11" />

            <div className="my-3 text-center text-[10px] font-semibold tracking-wider text-muted-foreground italic">
              ÁREA PÚBLICA MUNICIPAL
            </div>

            <StreetBar label="RUA 1" />
            <div className="flex items-stretch gap-0 justify-center min-w-max py-1">
              {sulLayout.map((it, i) => {
                if (it.label) return <AreaLabel key={i} label={it.label} />;
                if (it.rua) return <StreetVertical key={i} label={it.rua} />;
                const qd = findQ(it.quadra!);
                if (!qd) return null;
                return (
                  <QuadraBlock
                    key={qd.id}
                    quadra={qd}
                    lotes={lotesByQuadra.get(qd.id) ?? []}
                    isHighlighted={(l) => isHighlighted(l, qd)}
                    onLoteClick={setSelected}
                  />
                );
              })}
            </div>
            <StreetBar label="RUA 10" />

            <div className="text-[10px] font-semibold tracking-wider text-muted-foreground mt-2 text-center italic">
              SETOR ELIZIARIO
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

function QuadraBlock({
  quadra,
  lotes,
  isHighlighted,
  onLoteClick,
}: {
  quadra: Quadra;
  lotes: Lote[];
  isHighlighted: (l: Lote) => boolean;
  onLoteClick: (l: Lote) => void;
}) {
  // Two rows mimicking the printed layout: bottom row right→left, top row left→right
  const half = Math.ceil(lotes.length / 2);
  const topRow = lotes.slice(0, half);
  const bottomRow = lotes.slice(half).reverse();

  return (
    <div className="flex flex-col items-center gap-1 rounded-md border-2 border-[oklch(0.55_0.12_140)] bg-[oklch(0.92_0.05_140)] p-2 shrink-0">
      <div className="flex flex-col gap-0.5">
        <Row lotes={topRow} isHighlighted={isHighlighted} onClick={onLoteClick} />
        <Row lotes={bottomRow} isHighlighted={isHighlighted} onClick={onLoteClick} />
      </div>
      <div className="text-[10px] font-bold rounded-full bg-white border-2 border-[oklch(0.45_0.12_140)] w-7 h-7 flex items-center justify-center mt-1">
        {quadra.nome.padStart(2, "0")}
      </div>
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