import { supabase } from "@/integrations/supabase/client";
import type { LoteStatus } from "@/components/lots/lot-tile";

export interface Loteamento {
  id: string;
  nome: string;
  descricao: string | null;
}

export interface Quadra {
  id: string;
  loteamento_id: string;
  nome: string;
  ordem: number;
  observacoes: string | null;
}

export interface Lote {
  id: string;
  quadra_id: string;
  numero: string;
  status: LoteStatus;
  observacoes: string | null;
  fracao_ocupada?: number;
}

export interface Proprietario {
  id: string;
  lote_id: string;
  fracao: number;
  nome: string;
  cpf: string | null;
  telefone: string | null;
  whatsapp: string | null;
  email: string | null;
  endereco: string | null;
  situacao: string | null;
  apoia_asfalto: boolean | null;
  assinatura_status: "nao_contatado" | "contatado" | "confirmou" | "assinou";
  data_cadastro: string;
  responsavel_cadastro: string | null;
  observacoes: string | null;
  melhorias: Record<string, string> | null;
}

export async function fetchLoteamentos() {
  const { data, error } = await supabase
    .from("loteamentos")
    .select("*")
    .order("nome");
  if (error) throw error;
  return data as Loteamento[];
}

export async function fetchQuadras(loteamentoId?: string) {
  let query = supabase.from("quadras").select("*").order("ordem").order("nome");
  if (loteamentoId) {
    query = query.eq("loteamento_id", loteamentoId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data as Quadra[];
}

export async function fetchLotes() {
  const { data, error } = await supabase
    .from("lotes")
    .select("*")
    .order("numero");
  if (error) throw error;
  return data as Lote[];
}

export async function fetchProprietarios() {
  const { data, error } = await supabase.from("proprietarios").select("*");
  if (error) throw error;
  return data as Proprietario[];
}

/**
 * Recompute lot status from its proprietarios and persist.
 */
export function deriveStatus(props: Proprietario[]): LoteStatus {
  if (!props.length) return "sem_cadastro";
  const total = props.reduce((s, p) => s + Number(p.fracao), 0);
  if (props.some((p) => p.apoia_asfalto === false)) return "pendencia";
  if (props.some((p) => p.assinatura_status === "confirmou" || p.assinatura_status === "assinou"))
    return "confirmado";
  if (total < 99.5) return "incompleto";
  if (props.some((p) => !p.nome || !p.telefone)) return "incompleto";
  return "cadastrado";
}

export async function recomputeLoteStatus(loteId: string) {
  const { data: props } = await supabase.from("proprietarios").select("*").eq("lote_id", loteId);
  const status = deriveStatus((props ?? []) as Proprietario[]);
  await supabase.from('lotes').update({ status }).eq('id', loteId);
  return status;
}