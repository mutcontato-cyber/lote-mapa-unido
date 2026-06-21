import { cn } from "@/lib/utils";

export type LoteStatus = "sem_cadastro" | "cadastrado" | "incompleto" | "confirmado" | "pendencia";

export interface LotTileProps {
  numero: string;
  status: LoteStatus;
  fracoes?: { fracao: number; status: LoteStatus }[];
  onClick?: () => void;
  selected?: boolean;
}

const COLOR: Record<LoteStatus, string> = {
  sem_cadastro: "var(--status-sem)",
  cadastrado: "var(--status-cadastrado)",
  incompleto: "var(--status-incompleto)",
  confirmado: "var(--status-confirmado)",
  pendencia: "var(--status-pendencia)",
};

const FG: Record<LoteStatus, string> = {
  sem_cadastro: "var(--status-sem-foreground)",
  cadastrado: "var(--status-cadastrado-foreground)",
  incompleto: "var(--status-incompleto-foreground)",
  confirmado: "var(--status-confirmado-foreground)",
  pendencia: "var(--status-pendencia-foreground)",
};

export function LotTile({ numero, status, fracoes, onClick, selected }: LotTileProps) {
  // Build a vertical gradient that visualizes proprietor fractions
  let bg: string;
  if (fracoes && fracoes.length > 1) {
    const stops: string[] = [];
    let acc = 0;
    for (const f of fracoes) {
      const start = acc;
      acc += f.fracao;
      stops.push(`${COLOR[f.status]} ${start}% ${acc}%`);
    }
    bg = `linear-gradient(180deg, ${stops.join(", ")})`;
  } else {
    bg = COLOR[status];
  }

  return (
    <button
      onClick={onClick}
      style={{ background: bg, color: FG[status] }}
      className={cn(
        "relative aspect-square rounded-md border text-xs font-semibold flex items-center justify-center shadow-sm transition-all hover:scale-105 hover:shadow-md hover:z-10",
        selected && "ring-2 ring-primary ring-offset-2",
      )}
      title={`Lote ${numero}`}
    >
      <span className="bg-black/20 text-white px-1.5 py-0.5 rounded">{numero}</span>
    </button>
  );
}

export const STATUS_LABEL: Record<LoteStatus, string> = {
  sem_cadastro: "Sem cadastro",
  cadastrado: "Cadastrado",
  incompleto: "Cadastro incompleto",
  confirmado: "Confirmou apoio",
  pendencia: "Pendência",
};