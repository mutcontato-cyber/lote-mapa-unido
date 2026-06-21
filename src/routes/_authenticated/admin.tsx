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
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Administração — ADECAF Rua Digna" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { isAdmin, isStaff } = useAuth();
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [novaQuadra, setNovaQuadra] = useState("");
  const [qtdLotes, setQtdLotes] = useState(20);
  const [users, setUsers] = useState<{ id: string; full_name: string; phone: string; roles: AppRole[] }[]>([]);

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
              <CardTitle>Usuários e papéis</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Papel atual</TableHead>
                    <TableHead>Alterar</TableHead>
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