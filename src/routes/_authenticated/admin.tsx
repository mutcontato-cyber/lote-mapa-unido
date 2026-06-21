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
import { fetchQuadras, fetchLotes, type Quadra, type Lote } from "@/lib/queries";
import { useAuth, type AppRole } from "@/hooks/use-auth";
import { Trash2, Plus, KeyRound, MessageCircle, UserX, Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { generatePasswordReset, deleteMorador } from "@/lib/admin.functions";
import { ADMIN_NOME, waLink } from "@/lib/admin-config";

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
  melhorias: any;
  data_cadastro: string;
  lote_numero: string;
  quadra_nome: string;
}

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Administração — ADECAF Rua Digna" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin, isStaff, loading } = useAuth();
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [novaQuadra, setNovaQuadra] = useState("");
  const [qtdLotes, setQtdLotes] = useState(20);
  const [users, setUsers] = useState<{ id: string; full_name: string; phone: string; roles: AppRole[] }[]>([]);
  const [resets, setResets] = useState<PasswordReset[]>([]);
  const [cadastros, setCadastros] = useState<CadastroRow[]>([]);

  const generateResetFn = useServerFn(generatePasswordReset);
  const deleteMoradorFn = useServerFn(deleteMorador);

  async function load() {
    const [qs, ls] = await Promise.all([fetchQuadras(), fetchLotes()]);
    setQuadras(qs);
    setLotes(ls);
    if (isAdmin) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name, phone");
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
        .select("*, lotes(numero, quadras(nome))")
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
      }));
      setCadastros(rows);
    }
  }

  useEffect(() => {
    load();
  }, [isAdmin]);

  async function criarQuadra() {
    if (!novaQuadra.trim()) return;
    const { data: q, error } = await supabase
      .from("quadras")
      .insert({ nome: novaQuadra.trim(), ordem: quadras.length })
      .select()
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    const lotesPayload = Array.from({ length: qtdLotes }, (_, i) => ({
      quadra_id: q!.id,
      numero: String(i + 1),
    }));
    await supabase.from("lotes").insert(lotesPayload);
    setNovaQuadra("");
    toast.success("Quadra criada com lotes");
    load();
  }

  async function removerQuadra(id: string) {
    if (!confirm("Remover esta quadra e todos os seus lotes?")) return;
    await supabase.from("quadras").delete().eq("id", id);
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

  function formatMelhorias(m: any): string {
    if (!m || typeof m !== "object") return "";
    return Object.entries(m)
      .filter(([, v]) => v === "sim" || v === "nao")
      .map(([k, v]) => `${k}:${v}`)
      .join("; ");
  }

  function rowToObject(r: CadastroRow) {
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

  function baixarTodos() {
    if (!cadastros.length) {
      toast.error("Nenhum cadastro para baixar");
      return;
    }
    const csv = toCSV(cadastros.map(rowToObject));
    const data = new Date().toISOString().slice(0, 10);
    downloadFile(`cadastros-adecaf-${data}.csv`, csv);
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2 flex-wrap">
                <span className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                  Cadastros enviados
                  <Badge variant="secondary">{cadastros.length}</Badge>
                </span>
                <Button size="sm" onClick={baixarTodos} disabled={!cadastros.length}>
                  <Download className="h-4 w-4 mr-1" />
                  Baixar todos (CSV)
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cadastros.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum cadastro recebido ainda.</p>
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
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cadastros.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(c.data_cadastro).toLocaleDateString("pt-BR")}
                          </TableCell>
                          <TableCell className="font-medium">{c.nome}</TableCell>
                          <TableCell className="whitespace-nowrap">{c.telefone ?? "—"}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            {c.quadra_nome} / {c.lote_numero}
                            {c.fracao < 1 && (
                              <Badge variant="outline" className="ml-2">
                                {Math.round(c.fracao * 100)}%
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
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" onClick={() => baixarUm(c)}>
                              <Download className="h-3.5 w-3.5 mr-1" />
                              Baixar
                            </Button>
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
            <CardTitle>Configurar mapa do loteamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px_auto] gap-3 items-end">
              <div>
                <Label>Nome / número da quadra</Label>
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
                {quadras.map((q) => (
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
              </TableBody>
            </Table>
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
                    <TableHead>Alterar</TableHead>
                    <TableHead className="text-right">Excluir</TableHead>
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
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => excluirMorador(u.id, u.full_name)}
                          title="Excluir cadastro"
                        >
                          <UserX className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}