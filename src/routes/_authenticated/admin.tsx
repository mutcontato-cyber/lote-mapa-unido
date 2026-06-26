import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { fetchQuadras, fetchLotes, fetchLoteamentos, type Quadra, type Lote, type Loteamento } from "@/lib/queries";
import { useAuth, type AppRole } from "@/hooks/use-auth";
import { Trash2, Plus, KeyRound, MessageCircle, UserX, Download, FileSpreadsheet, FileText, Edit, Send, Info, Calendar as CalendarIcon, List as ListIcon, Cake, ChevronLeft, ChevronRight, Search } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";
import { Toaster } from "sonner";
// Edge Functions chamadas via supabase.functions.invoke
async function invokeEdge<T = unknown>(name: string, body: unknown): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body: body as Record<string, unknown> });
  if (error) {
    // Tenta extrair mensagem mais clara do corpo do erro
    let msg = error.message;
    try {
      const ctx: any = (error as any).context;
      if (ctx?.body) {
        const txt = typeof ctx.body === "string" ? ctx.body : await new Response(ctx.body).text();
        const j = JSON.parse(txt);
        if (j?.error) msg = j.error;
      }
    } catch { /* noop */ }
    throw new Error(msg);
  }
  if (data && typeof data === "object" && "error" in (data as any) && (data as any).error) {
    throw new Error((data as any).error);
  }
  return data as T;
}
import { ADMIN_NOME, waLink } from "@/lib/admin-config";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useMemo } from "react";

interface PasswordReset {
  id: string;
  user_id: string | null;
  phone: string;
  full_name: string | null;
  status: string;
  nova_senha: string | null;
  requested_at: string;
  fulfilled_at: string | null;
}

interface CadastroRow {
  id: string;
  nome: string;
  telefone: string | null;
  whatsapp: string | null;
  cpf: string | null;
  email: string | null;
  endereco: string | null;
  data_nascimento: string | null;
  chefe_casa: boolean | null;
  qtd_moradores: number | null;
  fracao: number;
  apoia_asfalto: boolean | null;
  assinatura_status: string;
  situacao: string | null;
  observacoes: string | null;
  melhorias: any | null;
  loteamento_id: string;
  data_cadastro: string;
  lote_numero: string;
  quadra_nome: string;
  lote_id: string;
  moradores?: MoradorRow[];
  ip_address?: string | null;
  user_agent?: string | null;
  geo_country?: string | null;
  geo_region?: string | null;
  geo_city?: string | null;
}

interface MoradorRow {
  id: string;
  lote_id: string;
  nome: string;
  data_nascimento: string | null;
  telefone: string | null;
}

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Administração — ADECAF Rua Digna" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin, isStaff, loading } = useAuth();
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loteamentos, setLoteamentos] = useState<Loteamento[]>([]);
  const [loteamentoId, setLoteamentoId] = useState<string>("");
  const [novoLoteamentoNome, setNovoLoteamentoNome] = useState("");
  const [novaQuadra, setNovaQuadra] = useState("");
  const [qtdLotes, setQtdLotes] = useState(20);
  const [users, setUsers] = useState<{ id: string; full_name: string; phone: string; data_nascimento: string | null; roles: AppRole[] }[]>([]);
  const [resets, setResets] = useState<PasswordReset[]>([]);
  const [cadastros, setCadastros] = useState<CadastroRow[]>([]);
  const [globalBdayMessage, setGlobalBdayMessage] = useState("Olá {nome}! A ADECAF deseja a você um feliz aniversário! Que seu dia seja muito especial, com muita paz e saúde. 🎂🎉");
  const [isSavingBdayMessage, setIsSavingBdayMessage] = useState(false);

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [customBdayUser, setCustomBdayUser] = useState<{nome: string, whatsapp: string} | null>(null);
  const [customBdayMessage, setCustomBdayMessage] = useState("");
  const [isSavingCustom, setIsSavingCustom] = useState(false);

  const generateResetFn = (args: { data: { resetId: string } }) =>
    invokeEdge<{ senha: string; phone: string; full_name: string }>(
      "admin-reset-password",
      args.data,
    );
  const deleteMoradorFn = (args: { data: { userId: string } }) =>
    invokeEdge<{ ok: true }>("admin-delete-morador", args.data);
  const generateUserPasswordFn = (args: { data: { userId: string } }) =>
    invokeEdge<{ senha: string; phone: string; full_name: string }>(
      "admin-generate-user-password",
      args.data,
    );
  const sendEvolutionFn = (args: { data: { phone: string; message: string } }) =>
    invokeEdge<{ ok: true }>("admin-send-whatsapp", args.data);

  const [bdayModalOpen, setBdayModalOpen] = useState(false);
  const [bdayUser, setBdayUser] = useState<{ id?: string; nome: string; whatsapp: string } | null>(null);
  const [bdayMessage, setBdayMessage] = useState("");
  const [sendingBday, setSendingBday] = useState(false);

  const [editUserOpen, setEditUserOpen] = useState(false);
  const [editUser, setEditUser] = useState<{ id: string; full_name: string; phone: string } | null>(null);

  const [editCadastroOpen, setEditCadastroOpen] = useState(false);
  const [editCadastro, setEditCadastro] = useState<CadastroRow | null>(null);

  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("Teste de integração ADECAF via Evolution API!");
  const [testingWa, setTestingWa] = useState(false);

  const [bdayView, setBdayView] = useState<"calendar" | "list">("calendar");
  const [bdaySearch, setBdaySearch] = useState("");
  const [exportLoteamentoId, setExportLoteamentoId] = useState<string>("all");
  
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const monthName = currentMonth.toLocaleString("pt-BR", { month: "long" });
  const yearName = currentMonth.getFullYear();

  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  function parseBday(dateStr: string | null | undefined): { mes: number, dia: number } | null {
    if (!dateStr) return null;
    const clean = dateStr.split('T')[0].trim();
    let p = clean.split('-');
    if (p.length < 2) p = clean.split('/');
    
    let mes = 0;
    let dia = 0;

    if (p.length === 3) {
      if (p[0].length === 4) { mes = Number(p[1]); dia = Number(p[2]); } // YYYY-MM-DD
      else { mes = Number(p[1]); dia = Number(p[0]); } // DD-MM-YYYY
    } else if (p.length === 2) {
      mes = Number(p[1]); dia = Number(p[0]); // DD-MM
    }

    if (isNaN(mes) || isNaN(dia) || mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
    
    return { mes, dia };
  }

  const todosAniversariantes = useMemo(() => {
    const list: { id: string; nome: string; whatsapp: string; data_nascimento: string | null }[] = [];
    const added = new Set<string>();

    cadastros.forEach(c => {
      const key = c.nome.trim().toLowerCase();
      if (!added.has(key)) {
        added.add(key);
        list.push({ id: c.id, nome: c.nome, whatsapp: c.whatsapp || c.telefone || "", data_nascimento: c.data_nascimento });
      }
    });

    users.forEach(u => {
      const key = u.full_name.trim().toLowerCase();
      if (!added.has(key)) {
        added.add(key);
        list.push({ id: u.id, nome: u.full_name, whatsapp: u.phone, data_nascimento: u.data_nascimento });
      }
    });

    return list;
  }, [cadastros, users]);

  const monthBirthdaysMap = useMemo(() => {
    const map = new Map<number, typeof todosAniversariantes>();
    todosAniversariantes.forEach(c => {
      const b = parseBday(c.data_nascimento);
      if (!b) return;
      if (b.mes === currentMonth.getMonth() + 1) {
        const arr = map.get(b.dia) || [];
        arr.push(c);
        map.set(b.dia, arr);
      }
    });
    return map;
  }, [todosAniversariantes, currentMonth]);

  function nextMonth() {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }
  
  function prevMonth() {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }

  function formatBdayDate(dateStr: string | null | undefined) {
    const b = parseBday(dateStr);
    if (!b) return dateStr ? `Erro: ${dateStr}` : "—";
    return `${String(b.dia).padStart(2, '0')}/${String(b.mes).padStart(2, '0')}`;
  }

  function openBdayModal(user: { id: string; nome: string; whatsapp: string }) {
    setBdayUser(user as any); // hack temporario pois CadastroRow tem mais props, mas só usamos nome/whatsapp no envio
    const nome = user.nome.split(" ")[0]; // primeiro nome
    setBdayMessage(globalBdayMessage.replace(/{nome}/g, nome));
    setBdayModalOpen(true);
  }

  async function openScheduleModal(user: { nome: string; whatsapp: string }) {
    if (!user.whatsapp) {
      toast.error("Este usuário não possui WhatsApp cadastrado.");
      return;
    }
    const nome = user.nome.split(" ")[0];
    setCustomBdayUser(user);
    
    let num = user.whatsapp.replace(/\D/g, "");
    if (!num.startsWith("55")) num = "55" + num;
    
    // Buscar no banco se já tem
    const { data } = await supabase.from('mensagens_customizadas').select('mensagem').eq('telefone', num).maybeSingle();
    
    if (data && data.mensagem) {
      setCustomBdayMessage(data.mensagem);
    } else {
      setCustomBdayMessage(`Olá {nome}! Temos um presente super especial para o seu próximo aniversário...`);
    }
    
    setScheduleModalOpen(true);
  }

  async function saveCustomBdayMessage() {
    if (!customBdayUser) return;
    setIsSavingCustom(true);
    try {
      let num = customBdayUser.whatsapp.replace(/\D/g, "");
      if (!num.startsWith("55")) num = "55" + num;

      const { error } = await supabase.from('mensagens_customizadas').upsert({ 
        telefone: num, 
        mensagem: customBdayMessage 
      });

      if (error) throw error;
      toast.success("Mensagem especial agendada para o próximo aniversário!");
      setScheduleModalOpen(false);
    } catch (err) {
      toast.error("Erro ao agendar a mensagem customizada.");
    } finally {
      setIsSavingCustom(false);
    }
  }

  async function saveGlobalBdayMessage() {
    setIsSavingBdayMessage(true);
    try {
      const { error } = await supabase.from('configuracoes').upsert({ id: 'birthday_message', valor: globalBdayMessage });
      if (error) {
        console.error(error);
        toast.error("Erro ao salvar mensagem. Você executou o arquivo configuracoes.sql no banco?");
      } else {
        toast.success("Mensagem global de aniversário salva!");
      }
    } catch (err) {
      toast.error("Erro interno ao salvar.");
    } finally {
      setIsSavingBdayMessage(false);
    }
  }

  async function sendBdayWhatsApp() {
    if (!bdayUser || !bdayUser.whatsapp) {
      toast.error("Usuário não possui WhatsApp cadastrado.");
      return;
    }
    setSendingBday(true);
    try {
      await sendEvolutionFn({ data: { phone: bdayUser.whatsapp, message: bdayMessage } });
      toast.success("Mensagem de feliz aniversário enviada com sucesso!");
      setBdayModalOpen(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao enviar WhatsApp.");
    } finally {
      setSendingBday(false);
    }
  }

  async function testWhatsApp() {
    if (!testPhone.trim() || !testMessage.trim()) {
      toast.error("Preencha o telefone e a mensagem.");
      return;
    }
    setTestingWa(true);
    try {
      await sendEvolutionFn({ data: { phone: testPhone, message: testMessage } });
      toast.success("Mensagem de teste enviada com sucesso!");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao enviar WhatsApp.");
    } finally {
      setTestingWa(false);
    }
  }

  async function load() {
    const [qs, ls, loteams] = await Promise.all([fetchQuadras(), fetchLotes(), fetchLoteamentos()]);
    setQuadras(qs);
    setLotes(ls);
    
    if (loteams.length > 0 && !loteamentoId) {
      setLoteamentoId(loteams[0].id);
    }

    if (isAdmin) {
      const { data: qdrs } = await supabase.from("quadras").select("*").order("ordem");
      const { data: lts } = await supabase.from("lotes").select("*").order("numero");

      const { data: bdayMsg } = await supabase.from('configuracoes').select('valor').eq('id', 'birthday_message').single();
      if (bdayMsg) {
        setGlobalBdayMessage(bdayMsg.valor);
      }

      setLoteamentos(loteams ?? []);
      const { data: profs } = await supabase.from("profiles").select("id, full_name, phone, data_nascimento");
      const { data: roles } = await supabase.from("user_roles").select("user_id, role");
      const map = new Map<string, AppRole[]>();
      (roles ?? []).forEach((r: any) => {
        const arr = map.get(r.user_id) ?? [];
        arr.push(r.role);
        map.set(r.user_id, arr);
      });
      setUsers((profs ?? []).map((p: any) => ({ ...p, roles: map.get(p.id) ?? [] })));

      const { data: rs } = await supabase
        .from("password_resets")
        .select("*")
        .order("requested_at", { ascending: false });
      setResets((rs as PasswordReset[]) ?? []);

      const { data: props } = await supabase
        .from("proprietarios")
        .select("*, lotes(numero, quadras(nome, loteamento_id))")
        .order("data_cadastro", { ascending: false });
      const rows: CadastroRow[] = (props ?? []).map((p: any) => ({
        id: p.id,
        nome: p.nome,
        telefone: p.telefone,
        whatsapp: p.whatsapp,
        cpf: p.cpf,
        email: p.email,
        endereco: p.endereco,
        data_nascimento: p.data_nascimento,
        chefe_casa: p.chefe_casa,
        qtd_moradores: p.qtd_moradores,
        fracao: Number(p.fracao),
        apoia_asfalto: p.apoia_asfalto,
        assinatura_status: p.assinatura_status,
        situacao: p.situacao,
        observacoes: p.observacoes,
        melhorias: p.melhorias,
        data_cadastro: p.data_cadastro,
        lote_numero: p.lotes?.numero ?? "",
        quadra_nome: p.lotes?.quadras?.nome ?? "",
        loteamento_id: p.lotes?.quadras?.loteamento_id ?? "",
        lote_id: p.lote_id,
        ip_address: p.ip_address ?? null,
        user_agent: p.user_agent ?? null,
        geo_country: p.geo_country ?? null,
        geo_region: p.geo_region ?? null,
        geo_city: p.geo_city ?? null,
      }));

      const { data: mds } = await supabase.from("moradores" as any).select("*");
      const moradoresByLote = new Map<string, MoradorRow[]>();
      ((mds as unknown) as MoradorRow[] | null)?.forEach((m) => {
        const arr = moradoresByLote.get(m.lote_id) || [];
        arr.push(m);
        moradoresByLote.set(m.lote_id, arr);
      });
      rows.forEach((r) => { r.moradores = moradoresByLote.get(r.lote_id) || []; });

      setCadastros(rows);
    }
  }

  useEffect(() => {
    load();
  }, [isAdmin]);

  async function criarQuadra() {
    const nome = novaQuadra.trim();
    if (!nome || !loteamentoId) {
      toast.error("Selecione um loteamento e digite o nome da quadra");
      return;
    }
    setNovaQuadra(""); // previne duplo clique

    const { data: q, error } = await supabase
      .from("quadras")
      .insert({ nome: nome, ordem: quadras.filter(qd => qd.loteamento_id === loteamentoId).length, loteamento_id: loteamentoId })
      .select()
      .single();
    if (error) {
      toast.error(error.message);
      setNovaQuadra(nome); // restaura em caso de erro
      return;
    }
    const lotesPayload = Array.from({ length: qtdLotes }, (_, i) => ({
      quadra_id: q!.id,
      numero: String(i + 1),
    }));
    await supabase.from("lotes").insert(lotesPayload);
    toast.success("Quadra criada com lotes");
    load();
  }

  async function removerQuadra(id: string) {
    if (!confirm("Remover esta quadra e todos os seus lotes?")) return;
    await supabase.from("quadras").delete().eq("id", id);
    load();
  }

  async function criarLoteamento() {
    const nome = novoLoteamentoNome.trim();
    if (!nome) return;
    setNovoLoteamentoNome(""); // previne duplo clique

    const { data: l, error } = await supabase
      .from("loteamentos")
      .insert({ nome: nome })
      .select()
      .single();
    if (error) {
      toast.error(error.message);
      setNovoLoteamentoNome(nome); // restaura em caso de erro
      return;
    }
    setLoteamentoId(l.id);
    toast.success("Loteamento criado com sucesso!");
    load();
  }

  async function excluirLoteamento() {
    if (!loteamentoId) return;
    if (!confirm("AVISO: Excluir este loteamento? Só será possível se todas as quadras dele já tiverem sido apagadas primeiro.")) return;
    
    const { error } = await supabase.from("loteamentos").delete().eq("id", loteamentoId);
    if (error) {
      toast.error("Erro ao excluir: " + error.message);
      return;
    }
    
    toast.success("Loteamento excluído.");
    setLoteamentoId("");
    load();
  }

  async function setRole(userId: string, role: AppRole) {
    await supabase.from("user_roles").delete().eq("user_id", userId);
    await supabase.from("user_roles").insert({ user_id: userId, role });
    toast.success("Papel atualizado");
    load();
  }

  async function gerarSenhaNova(reset: PasswordReset) {
    try {
      const res = await generateResetFn({ data: { resetId: reset.id } });
      const msg =
        `Olá ${res.full_name ?? ""}, aqui é da ADECAF Rua Digna.\n\n` +
        `Sua nova senha é: *${res.senha}*\n\n` +
        `Use seu telefone (${res.phone}) e essa senha para entrar. Recomendamos trocar depois pedindo nova redefinição.`;
      // Abre WhatsApp do morador para o admin enviar a senha
      window.open(waLink(res.phone, msg), "_blank");
      toast.success(`Senha gerada: ${res.senha}`);
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao gerar senha");
    }
  }

  function reabrirWhatsApp(reset: PasswordReset) {
    if (!reset.nova_senha) return;
    const msg =
      `Olá ${reset.full_name ?? ""}, aqui é da ADECAF Rua Digna.\n\n` +
      `Sua nova senha é: *${reset.nova_senha}*\n\n` +
      `Use seu telefone (${reset.phone}) e essa senha para entrar.`;
    window.open(waLink(reset.phone, msg), "_blank");
  }

  async function excluirReset(id: string) {
    if (!confirm("Excluir este pedido?")) return;
    await supabase.from("password_resets").delete().eq("id", id);
    load();
  }

  async function saveEditUser() {
    if (!editUser) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: editUser.full_name, phone: editUser.phone })
        .eq('id', editUser.id);
      if (error) throw error;

      // Sincroniza o número atualizado para a ficha do lote (que alimenta os aniversários)
      await supabase.from("proprietarios").update({
        telefone: editUser.phone,
        whatsapp: editUser.phone
      }).ilike("nome", editUser.full_name);

      toast.success("Morador atualizado com sucesso!");
      setEditUserOpen(false);
      load();
    } catch (e: any) {
      toast.error(e.message || "Erro ao atualizar morador");
    }
  }

  async function saveEditCadastro() {
    if (!editCadastro) return;
    try {
      const { error } = await supabase.from("proprietarios").update({
        nome: editCadastro.nome,
        telefone: editCadastro.telefone,
        whatsapp: editCadastro.telefone,
        data_nascimento: editCadastro.data_nascimento || null,
        cpf: editCadastro.cpf || null,
        qtd_moradores: editCadastro.qtd_moradores || null,
        fracao: editCadastro.fracao || 100,
        observacoes: editCadastro.observacoes || null,
      }).eq("id", editCadastro.id);
      if (error) throw error;
      toast.success("Cadastro do lote atualizado com sucesso!");
      setEditCadastroOpen(false);
      load();
    } catch (e: any) {
      toast.error(e.message || "Erro ao atualizar cadastro do lote");
    }
  }

  async function excluirMorador(userId: string, nome: string) {
    if (!confirm(`Excluir o cadastro completo de ${nome}? Essa ação não pode ser desfeita.`)) return;
    try {
      await deleteMoradorFn({ data: { userId } });
      toast.success("Cadastro excluído");
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao excluir");
    }
  }

  async function excluirCadastroEnviado(c: CadastroRow) {
    if (!confirm(`Excluir o cadastro de ${c.nome} (Quadra ${c.quadra_nome} / Lote ${c.lote_numero})? Essa ação não pode ser desfeita.`)) return;
    try {
      const { error: delErr } = await supabase.from("proprietarios").delete().eq("id", c.id);
      if (delErr) throw delErr;

      // Se nenhum outro proprietário sobrar para este lote, volta status para sem_cadastro
      const { data: restantes } = await supabase
        .from("proprietarios")
        .select("id")
        .eq("lote_id", c.lote_id)
        .limit(1);
      if (!restantes || restantes.length === 0) {
        await supabase.from("lotes").update({ status: "sem_cadastro" }).eq("id", c.lote_id);
      }

      toast.success("Cadastro excluído com sucesso");
      load();
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao excluir cadastro");
    }
  }

  const [senhaGeradaOpen, setSenhaGeradaOpen] = useState(false);
  const [senhaGerada, setSenhaGerada] = useState<{ senha: string; phone: string; full_name: string } | null>(null);

  async function gerarSenhaUsuario(userId: string, nome: string) {
    if (!confirm(`Gerar uma nova senha para ${nome}? A senha antiga deixará de funcionar.`)) return;
    try {
      const res = await generateUserPasswordFn({ data: { userId } });
      setSenhaGerada(res);
      setSenhaGeradaOpen(true);
      toast.success("Nova senha gerada");
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao gerar senha");
    }
  }

  function formatMelhorias(m: any): string {
    if (!m || typeof m !== "object") return "";
    return Object.entries(m)
      .filter(([, v]) => v === "sim" || v === "nao")
      .map(([k, v]) => `${k}:${v}`)
      .join("; ");
  }

  function rowToObject(r: CadastroRow) {
    const moradoresStr = (r.moradores ?? [])
      .map((m) => {
        const partes = [m.nome];
        if (m.data_nascimento) partes.push(`nasc:${m.data_nascimento}`);
        if (m.telefone) partes.push(`tel:${m.telefone}`);
        return partes.join(" / ");
      })
      .join(" | ");
    return {
      Nome: r.nome,
      Telefone: r.telefone ?? "",
      WhatsApp: r.whatsapp ?? "",
      CPF: r.cpf ?? "",
      Email: r.email ?? "",
      Endereco: r.endereco ?? "",
      DataNascimento: r.data_nascimento ?? "",
      ChefeCasa: r.chefe_casa ? "Sim" : r.chefe_casa === false ? "Nao" : "",
      QtdMoradores: r.qtd_moradores ?? "",
      Quadra: r.quadra_nome,
      Lote: r.lote_numero,
      Fracao: r.fracao,
      ApoiaAsfalto: r.apoia_asfalto ? "Sim" : r.apoia_asfalto === false ? "Nao" : "",
      AssinaturaStatus: r.assinatura_status,
      Situacao: r.situacao ?? "",
      Melhorias: formatMelhorias(r.melhorias),
      Observacoes: r.observacoes ?? "",
      DataCadastro: new Date(r.data_cadastro).toLocaleString("pt-BR"),
      Moradores: moradoresStr,
      IP: r.ip_address ?? "",
      Navegador: r.user_agent ?? "",
      LocalizacaoIP: [r.geo_city, r.geo_region, r.geo_country].filter(Boolean).join(", "),
    };
  }

  function toCSV(rows: Record<string, any>[]): string {
    if (!rows.length) return "";
    const headers = Object.keys(rows[0]);
    const escape = (v: any) => {
      const s = String(v ?? "");
      return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [headers.join(";")];
    for (const r of rows) lines.push(headers.map((h) => escape(r[h])).join(";"));
    return "\ufeff" + lines.join("\n");
  }

  function downloadFile(filename: string, content: string, mime = "text/csv;charset=utf-8") {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function baixarUm(r: CadastroRow) {
    const csv = toCSV([rowToObject(r)]);
    const safe = r.nome.replace(/[^\w\d-]+/g, "_");
    downloadFile(`cadastro-${safe}.csv`, csv);
  }

  // --- FILTRO DE EXPORTAÇÃO ---
  const cadastrosFiltrados = useMemo(() => {
    if (exportLoteamentoId === "all") return cadastros;
    return cadastros.filter(c => c.loteamento_id === exportLoteamentoId);
  }, [cadastros, exportLoteamentoId]);

  function baixarTodos() {
    if (!cadastrosFiltrados.length) {
      toast.error("Nenhum cadastro para baixar neste filtro");
      return;
    }
    const csv = toCSV(cadastrosFiltrados.map(rowToObject));
    const data = new Date().toISOString().slice(0, 10);
    const nomeLot = exportLoteamentoId === "all" ? "Todos" : (loteamentos.find(l => l.id === exportLoteamentoId)?.nome ?? "Filtrado");
    downloadFile(`cadastros-adecaf-${nomeLot}-${data}.csv`, csv);
  }

  function baixarTodosPDF() {
    if (!cadastrosFiltrados.length) {
      toast.error("Nenhum cadastro para baixar neste filtro");
      return;
    }
    const doc = new jsPDF("landscape");
    const nomeLot = exportLoteamentoId === "all" ? "Geral" : (loteamentos.find(l => l.id === exportLoteamentoId)?.nome ?? "");
    doc.text(`Cadastros Recebidos - ADECAF ${nomeLot !== "Geral" ? `- ${nomeLot}` : ""}`, 14, 15);
    
    const head = [["Nome", "Telefone", "Quadra/Lote", "Tipo", "Apoia", "Questionário", "Moradores", "Data", "IP", "Localização", "Navegador"]];
    const body = cadastrosFiltrados.map(c => [
      c.nome,
      c.telefone || "—",
      `Q${c.quadra_nome} L${c.lote_numero}`,
      c.fracao === 100 ? "Inteiro" : `${c.fracao}%`,
      c.apoia_asfalto ? "Sim" : c.apoia_asfalto === false ? "Não" : "—",
      formatMelhorias(c.melhorias) || "—",
      (c.moradores ?? []).map(m => m.nome).join(", ") || "—",
      new Date(c.data_cadastro).toLocaleDateString("pt-BR"),
      c.ip_address || "—",
      [c.geo_city, c.geo_region, c.geo_country].filter(Boolean).join(", ") || "—",
      c.user_agent || "—",
    ]);

    autoTable(doc, {
      head,
      body,
      startY: 20,
      styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak' },
      headStyles: { fillColor: [41, 128, 185], fontSize: 8 },
      columnStyles: {
        8: { cellWidth: 22 },
        9: { cellWidth: 30 },
        10: { cellWidth: 40 },
      },
    });
    
    const data = new Date().toISOString().slice(0, 10);
    doc.save(`cadastros-adecaf-${data}.pdf`);
  }

  function baixarUmPDF(c: CadastroRow) {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Ficha de Cadastro - ADECAF", 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Data de Emissão: ${new Date().toLocaleString("pt-BR")}`, 14, 26);
    
    const data = [
      ["Nome Completo:", c.nome],
      ["Telefone / WhatsApp:", c.telefone || c.whatsapp || "—"],
      ["CPF:", c.cpf || "—"],
      ["Data de Nascimento:", c.data_nascimento ? new Date(c.data_nascimento).toLocaleDateString("pt-BR") : "—"],
      ["Endereço Atual:", c.endereco || "—"],
      ["Quadra / Lote:", `Quadra ${c.quadra_nome} - Lote ${c.lote_numero}`],
      ["Tipo de Lote:", c.fracao === 100 ? "Lote Inteiro (100%)" : `${c.fracao}% (Metade)`],
      ["Qtd. de Moradores:", c.qtd_moradores ? String(c.qtd_moradores) : "—"],
      ["Apoia Asfalto:", c.apoia_asfalto ? "Sim" : c.apoia_asfalto === false ? "Não" : "—"],
      ["Respostas do Questionário:", formatMelhorias(c.melhorias) || "—"],
      ["Observações:", c.observacoes || "—"],
      ["Data de Cadastro:", new Date(c.data_cadastro).toLocaleString("pt-BR")],
      ["IP do Dispositivo:", c.ip_address || "—"],
      ["Localização estimada (IP):", [c.geo_city, c.geo_region, c.geo_country].filter(Boolean).join(", ") || "—"],
      ["Navegador / Dispositivo:", c.user_agent || "—"],
    ];

    autoTable(doc, {
      body: data,
      startY: 32,
      theme: 'grid',
      styles: { fontSize: 11, cellPadding: 4 },
      columnStyles: { 0: { fontStyle: 'bold', fillColor: [245, 245, 245], cellWidth: 60 } }
    });

    const moradores = c.moradores ?? [];
    if (moradores.length) {
      const finalY = (doc as any).lastAutoTable?.finalY ?? 32;
      doc.setFontSize(12);
      doc.text("Moradores da Residência", 14, finalY + 10);
      autoTable(doc, {
        startY: finalY + 14,
        head: [["Nome", "Data de Nascimento", "Telefone"]],
        body: moradores.map((m) => [
          m.nome,
          m.data_nascimento ? new Date(m.data_nascimento).toLocaleDateString("pt-BR") : "—",
          m.telefone || "—",
        ]),
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [41, 128, 185] },
      });
    }

    const safe = c.nome.replace(/[^\w\d-]+/g, "_");
    doc.save(`ficha-${safe}.pdf`);
  }

  if (loading) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl px-4 py-12">
          <p className="text-sm text-muted-foreground">Carregando acesso administrativo…</p>
        </div>
      </AppShell>
    );
  }

  if (!isStaff) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl px-4 py-12">
          <Alert>
            <AlertDescription>
              Apenas administradores e coordenadores podem acessar esta área.
            </AlertDescription>
          </Alert>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Toaster position="top-right" richColors />
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        <h1 className="text-2xl font-bold">Administração</h1>

        {isAdmin && (
          <Card className="border-amber-300 bg-amber-50/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-amber-600" />
                Pedidos de senha esquecida
                {resets.filter((r) => r.status === "pendente").length > 0 && (
                  <Badge variant="destructive">{resets.filter((r) => r.status === "pendente").length} pendente(s)</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {resets.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum pedido no momento.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Pedido em</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resets.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.full_name ?? "—"}</TableCell>
                        <TableCell>{r.phone}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(r.requested_at).toLocaleString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          {r.status === "pendente" ? (
                            <Badge variant="destructive">Pendente</Badge>
                          ) : (
                            <Badge variant="secondary">Atendido</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          {r.status === "pendente" ? (
                            <Button size="sm" onClick={() => gerarSenhaNova(r)}>
                              <KeyRound className="h-3.5 w-3.5 mr-1" />
                              Gerar senha
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => reabrirWhatsApp(r)}>
                              <MessageCircle className="h-3.5 w-3.5 mr-1" />
                              Reenviar
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" onClick={() => excluirReset(r.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <p className="text-xs text-muted-foreground mt-3">
                Ao clicar em <strong>Gerar senha</strong>, o sistema cria uma senha aleatória, atualiza o cadastro do morador e abre o WhatsApp para você enviar a senha.
              </p>
            </CardContent>
          </Card>
        )}

        {isAdmin && (
          <Card className="border-pink-300 bg-pink-50/40">
            <CardHeader>
              <CardTitle>Mensagem Global de Aniversário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-pink-800">
                Esta é a mensagem que o robô vai enviar <strong>automaticamente todos os dias às 08h da manhã</strong>. Use <code className="bg-pink-100 px-1 rounded">{"{nome}"}</code> no texto onde quiser que o primeiro nome da pessoa seja inserido.
              </p>
              <Textarea 
                value={globalBdayMessage}
                onChange={(e) => setGlobalBdayMessage(e.target.value)}
                className="min-h-[120px] bg-white border-pink-200"
              />
              <Button onClick={saveGlobalBdayMessage} disabled={isSavingBdayMessage} className="bg-pink-600 hover:bg-pink-700 text-white">
                {isSavingBdayMessage ? "Salvando..." : "Salvar Mensagem"}
              </Button>
            </CardContent>
          </Card>
        )}

        {isAdmin && (
          <Card className="border-pink-300 bg-pink-50/40">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
              <CardTitle className="flex items-center gap-2">
                <Cake className="h-5 w-5 text-pink-600" />
                Aniversariantes
              </CardTitle>
              <div className="flex items-center gap-2 bg-pink-100 p-1 rounded-md">
                <Button 
                  variant={bdayView === "calendar" ? "default" : "ghost"} 
                  size="sm" 
                  onClick={() => setBdayView("calendar")}
                  className={bdayView === "calendar" ? "bg-pink-600 text-white hover:bg-pink-700" : "text-pink-600 hover:text-pink-700 hover:bg-pink-200"}
                >
                  Calendário
                </Button>
                <Button 
                  variant={bdayView === "list" ? "default" : "ghost"} 
                  size="sm" 
                  onClick={() => setBdayView("list")}
                  className={bdayView === "list" ? "bg-pink-600 text-white hover:bg-pink-700" : "text-pink-600 hover:text-pink-700 hover:bg-pink-200"}
                >
                  Lista Completa
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {bdayView === "calendar" ? (
                <>
                  <div className="flex items-center justify-between mb-4 mt-2">
                    <Button variant="outline" size="sm" onClick={prevMonth}>
                      <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                    </Button>
                    <div className="font-semibold text-lg capitalize">{monthName} {yearName}</div>
                    <Button variant="outline" size="sm" onClick={nextMonth}>
                      Próximo <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                      <div key={day} className="text-center text-sm font-medium text-muted-foreground">{day}</div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1 sm:gap-2">
                    {blanks.map(b => (
                      <div key={`blank-${b}`} className="min-h-[80px] p-2 rounded-md bg-transparent"></div>
                    ))}
                    {days.map(d => {
                      const bdays = monthBirthdaysMap.get(d);
                      const isToday = new Date().getDate() === d && new Date().getMonth() === currentMonth.getMonth() && new Date().getFullYear() === currentMonth.getFullYear();
                      
                      return (
                        <div key={`${currentMonth.getMonth()}-${d}`} className={`min-h-[80px] sm:min-h-[100px] border rounded-md p-1 sm:p-2 flex flex-col ${isToday ? 'border-pink-400 bg-pink-100/50' : 'bg-card'}`}>
                          <div className={`text-xs sm:text-sm font-semibold mb-1 ${isToday ? 'text-pink-600' : 'text-muted-foreground'}`}>{d}</div>
                          <div className="flex flex-col gap-1 overflow-y-auto max-h-[80px]">
                            {bdays?.map(b => (
                              <div 
                                key={b.id} 
                                onClick={() => openBdayModal(b)}
                                className="text-[10px] sm:text-xs bg-pink-500 hover:bg-pink-600 text-white rounded px-1 py-0.5 cursor-pointer truncate"
                                title={`Enviar mensagem para ${b.nome}`}
                              >
                                {b.nome.split(" ")[0]}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="space-y-4 mt-2">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Buscar aniversariante pelo nome..." 
                      value={bdaySearch} 
                      onChange={(e) => setBdaySearch(e.target.value)} 
                      className="max-w-sm"
                    />
                  </div>
                  <div className="max-h-[400px] overflow-y-auto rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Dia/Mês</TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead>WhatsApp</TableHead>
                          <TableHead className="text-right">Ação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {todosAniversariantes
                          .filter(c => (c.nome || "").toLowerCase().includes(bdaySearch.toLowerCase()))
                          .sort((a, b) => {
                             const bA = parseBday(a.data_nascimento);
                             const bB = parseBday(b.data_nascimento);
                             if (!bA && !bB) return 0;
                             if (!bA) return 1;
                             if (!bB) return -1;
                             return bA.mes - bB.mes || bA.dia - bB.dia;
                          })
                          .map((c) => (
                            <TableRow key={c.id}>
                              <TableCell className="font-semibold text-pink-600">
                                {formatBdayDate(c.data_nascimento)}
                              </TableCell>
                              <TableCell className="font-medium">{c.nome}</TableCell>
                              <TableCell>{c.whatsapp || "—"}</TableCell>
                              <TableCell className="text-right">
                                <Button size="sm" variant="outline" className="border-pink-200 text-pink-700 hover:bg-pink-100" onClick={() => openScheduleModal(c)}>
                                  <Cake className="h-3.5 w-3.5 mr-1" />
                                  Mensagem VIP
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        {todosAniversariantes.filter(c => (c.nome || "").toLowerCase().includes(bdaySearch.toLowerCase())).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                              Nenhum morador encontrado com esse nome.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Modal para agendar mensagem customizada */}
        <Dialog open={scheduleModalOpen} onOpenChange={setScheduleModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Agendar Mensagem Especial</DialogTitle>
              <DialogDescription>
                A mensagem abaixo será enviada AUTOMATICAMENTE para <strong>{customBdayUser?.nome}</strong> no próximo aniversário dele(a). Após ser enviada, essa mensagem será apagada e no ano seguinte ele(a) voltará a receber a mensagem padrão.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Textarea
                className="min-h-[150px]"
                value={customBdayMessage}
                onChange={(e) => setCustomBdayMessage(e.target.value)}
                placeholder="Digite o cupom ou recado especial..."
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setScheduleModalOpen(false)}>Cancelar</Button>
              <Button onClick={saveCustomBdayMessage} disabled={isSavingCustom}>
                {isSavingCustom ? "Salvando..." : "Agendar Mensagem"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>


        {isAdmin && (
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                  Cadastros enviados
                  <Badge variant="secondary">{cadastrosFiltrados.length}</Badge>
                </CardTitle>
                
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={exportLoteamentoId} onValueChange={setExportLoteamentoId}>
                    <SelectTrigger className="w-[180px] h-8 text-xs">
                      <SelectValue placeholder="Todos os Loteamentos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Loteamentos</SelectItem>
                      {loteamentos.map((l) => (
                        <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button size="sm" onClick={baixarTodos} disabled={!cadastrosFiltrados.length}>
                    <Download className="h-4 w-4 mr-1" />
                    Baixar (CSV)
                  </Button>
                  <Button size="sm" variant="outline" onClick={baixarTodosPDF} disabled={!cadastrosFiltrados.length}>
                    <FileText className="h-4 w-4 mr-1 text-red-500" />
                    Baixar (PDF)
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {cadastrosFiltrados.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum cadastro recebido para este loteamento ainda.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Quadra / Lote</TableHead>
                        <TableHead>Apoia</TableHead>
                        <TableHead>IP / Localização</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cadastrosFiltrados.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(c.data_cadastro).toLocaleDateString("pt-BR")}
                          </TableCell>
                          <TableCell className="font-medium">{c.nome}</TableCell>
                          <TableCell className="whitespace-nowrap">{c.telefone ?? "—"}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            {c.quadra_nome} / {c.lote_numero}
                            {c.fracao !== 100 && (
                              <Badge variant="outline" className="ml-2">
                                Metade ({c.fracao}%)
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {c.apoia_asfalto === true ? (
                              <Badge className="bg-green-600">Sim</Badge>
                            ) : c.apoia_asfalto === false ? (
                              <Badge variant="destructive">Não</Badge>
                            ) : (
                              <Badge variant="outline">—</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-xs">
                            {c.ip_address ? (
                              <div className="space-y-0.5">
                                <div className="font-mono">{c.ip_address}</div>
                                <div className="text-muted-foreground">
                                  {[c.geo_city, c.geo_region, c.geo_country].filter(Boolean).join(", ") || "—"}
                                </div>
                                {c.user_agent && (
                                  <div className="text-muted-foreground truncate max-w-[220px]" title={c.user_agent}>
                                    {c.user_agent}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button size="icon" variant="ghost" onClick={() => { setEditCadastro({ ...c }); setEditCadastroOpen(true); }} title="Editar ficha do lote">
                                <Edit className="h-4 w-4 text-blue-500" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => baixarUmPDF(c)} title="Baixar Ficha Individual (PDF)">
                                <FileText className="h-4 w-4 text-red-500" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => baixarUm(c)} title="Baixar Planilha Individual (CSV)">
                                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-3">
                Os cadastros são gravados automaticamente assim que o morador confirma o lote. Os arquivos CSV podem ser abertos no Excel ou Google Planilhas.
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Configurar Loteamentos e Quadras</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3 border-b border-border pb-6">
              <Label>Loteamento selecionado para edição</Label>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <Select value={loteamentoId} onValueChange={setLoteamentoId}>
                    <SelectTrigger className="w-full sm:w-[350px]">
                      <SelectValue placeholder="Selecione um loteamento..." />
                    </SelectTrigger>
                    <SelectContent>
                      {loteamentos.map((l) => (
                        <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {loteamentoId && (
                    <Button variant="outline" size="icon" onClick={excluirLoteamento} title="Excluir Loteamento selecionado">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>

                {loteamentoId && (() => {
                  const selectedLot = loteamentos.find(l => l.id === loteamentoId);
                  const shareLink = `${typeof window !== "undefined" ? window.location.origin : ""}/mapa?loteamento=${loteamentoId}`;
                  return (
                    <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-3 space-y-2">
                      <p className="text-xs font-semibold text-blue-700">
                        🔗 Link de Divulgação — {selectedLot?.nome}
                      </p>
                      <p className="text-[11px] text-blue-600/80">
                        Envie este link para os moradores. Quem acessar por aqui só poderá ver e preencher lotes deste loteamento, sem opção de troca.
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-[11px] bg-white border border-blue-200 rounded px-2 py-1.5 font-mono text-blue-900 break-all">
                          {shareLink}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0 border-blue-300 text-blue-700 hover:bg-blue-100"
                          onClick={() => { navigator.clipboard.writeText(shareLink); toast.success("Link copiado!"); }}
                        >
                          Copiar
                        </Button>
                      </div>
                    </div>
                  );
                })()}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <Input 
                  value={novoLoteamentoNome} 
                  onChange={(e) => setNovoLoteamentoNome(e.target.value)} 
                  placeholder="Nome de um NOVO loteamento" 
                  className="sm:w-[250px]"
                />
                <Button onClick={criarLoteamento} variant="secondary">
                  <Plus className="h-4 w-4 mr-1" /> Criar Loteamento
                </Button>
              </div>
            </div>

            {loteamentoId && (
              <div className="space-y-4 pt-2">
                <h3 className="font-semibold text-lg">Quadras deste loteamento</h3>
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px_auto] gap-3 items-end">
                  <div>
                    <Label>Nome / número da nova quadra</Label>
                    <Input value={novaQuadra} onChange={(e) => setNovaQuadra(e.target.value)} placeholder="Ex.: 01, A, Quadra 5" />
                  </div>
                  <div>
                    <Label>Quantidade de lotes</Label>
                    <Input type="number" min={1} value={qtdLotes} onChange={(e) => setQtdLotes(Number(e.target.value))} />
                  </div>
                  <Button onClick={criarQuadra}><Plus className="h-4 w-4 mr-1" />Adicionar</Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Quadra</TableHead>
                      <TableHead>Lotes</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quadras.filter(q => q.loteamento_id === loteamentoId).map((q) => (
                      <TableRow key={q.id}>
                        <TableCell className="font-medium">{q.nome}</TableCell>
                        <TableCell>{lotes.filter((l) => l.quadra_id === q.id).length}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => removerQuadra(q.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {quadras.filter(q => q.loteamento_id === loteamentoId).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
                          Nenhuma quadra cadastrada neste loteamento.
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>Moradores cadastrados</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Papel atual</TableHead>
                    <TableHead>Alterar Papel</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.full_name}</TableCell>
                      <TableCell>{u.phone}</TableCell>
                      <TableCell>
                        {u.roles.length === 0 ? <Badge variant="outline">visitante</Badge> : u.roles.map((r) => <Badge key={r} className="mr-1">{r}</Badge>)}
                      </TableCell>
                      <TableCell>
                        <Select onValueChange={(v) => setRole(u.id, v as AppRole)}>
                          <SelectTrigger className="w-44"><SelectValue placeholder="Definir papel" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Administrador</SelectItem>
                            <SelectItem value="coordenador">Coordenador</SelectItem>
                            <SelectItem value="visitante">Visitante</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setEditUser({ id: u.id, full_name: u.full_name, phone: u.phone });
                              setEditUserOpen(true);
                            }}
                            title="Editar cadastro"
                          >
                            <Edit className="h-4 w-4 text-blue-500" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => excluirMorador(u.id, u.full_name)}
                            title="Excluir cadastro"
                          >
                            <UserX className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Dialog open={editUserOpen} onOpenChange={setEditUserOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Morador</DialogTitle>
              <DialogDescription>Altere as informações do usuário abaixo.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input
                  value={editUser?.full_name || ""}
                  onChange={(e) => setEditUser(prev => prev ? { ...prev, full_name: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone / WhatsApp</Label>
                <Input
                  value={editUser?.phone || ""}
                  onChange={(e) => setEditUser(prev => prev ? { ...prev, phone: e.target.value } : null)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditUserOpen(false)}>Cancelar</Button>
              <Button onClick={saveEditUser}>Salvar Alterações</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={editCadastroOpen} onOpenChange={setEditCadastroOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Ficha de Cadastro Completa</DialogTitle>
              <DialogDescription>
                Alterar as informações registradas na ficha de lote deste proprietário. Isso afeta o módulo de Aniversários e as informações do Mapa.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label>Nome Completo</Label>
                <Input
                  value={editCadastro?.nome || ""}
                  onChange={(e) => setEditCadastro(prev => prev ? { ...prev, nome: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label>CPF</Label>
                <Input
                  value={editCadastro?.cpf || ""}
                  onChange={(e) => setEditCadastro(prev => prev ? { ...prev, cpf: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone / WhatsApp</Label>
                <Input
                  value={editCadastro?.telefone || ""}
                  onChange={(e) => setEditCadastro(prev => prev ? { ...prev, telefone: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label>Data de Nascimento</Label>
                <Input
                  type="date"
                  value={editCadastro?.data_nascimento || ""}
                  onChange={(e) => setEditCadastro(prev => prev ? { ...prev, data_nascimento: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label>Quantidade de Moradores na Casa</Label>
                <Input
                  type="number"
                  min="1"
                  value={editCadastro?.qtd_moradores || ""}
                  onChange={(e) => setEditCadastro(prev => prev ? { ...prev, qtd_moradores: Number(e.target.value) } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label>Fração do Lote (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={editCadastro?.fracao || 100}
                  onChange={(e) => setEditCadastro(prev => prev ? { ...prev, fracao: Number(e.target.value) } : null)}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Endereço e Observações</Label>
                <Textarea
                  value={editCadastro?.observacoes || ""}
                  onChange={(e) => setEditCadastro(prev => prev ? { ...prev, observacoes: e.target.value } : null)}
                  placeholder="Anotações sobre a casa, pendências, etc."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditCadastroOpen(false)}>Cancelar</Button>
              <Button onClick={saveEditCadastro}>Salvar Alterações</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </AppShell>
  );
}