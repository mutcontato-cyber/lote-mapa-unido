import { createFileRoute } from "@tanstack/react-router";
import { Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchLotes, fetchProprietarios, fetchQuadras, fetchLoteamentos, type Lote, type Proprietario, type Quadra, type Loteamento } from "@/lib/queries";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Map as MapIcon, CheckCircle2, AlertTriangle, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — ADECAF Rua Digna" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { isStaff, loading } = useAuth();
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [props, setProps] = useState<Proprietario[]>([]);
  const [loteamentos, setLoteamentos] = useState<Loteamento[]>([]);
  const [loteamentoId, setLoteamentoId] = useState<string>("");

  useEffect(() => {
    fetchLoteamentos().then((data) => {
      setLoteamentos(data);
      if (data.length > 0 && !loteamentoId) {
        setLoteamentoId(data[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (!loteamentoId) return;
    Promise.all([fetchQuadras(loteamentoId), fetchLotes(), fetchProprietarios()]).then(([qs, ls, ps]) => {
      const qIds = new Set(qs.map(q => q.id));
      const lotesFiltered = ls.filter(l => qIds.has(l.quadra_id));
      const lotesIds = new Set(lotesFiltered.map(l => l.id));
      const propsFiltered = ps.filter(p => lotesIds.has(p.lote_id));
      
      setQuadras(qs);
      setLotes(lotesFiltered);
      setProps(propsFiltered);
    });
  }, [loteamentoId]);

  if (!loading && !isStaff) return <Navigate to="/mapa" />;

  const totalLotes = lotes.length;
  const semCadastro = lotes.filter((l) => l.status === "sem_cadastro").length;
  const apoiadores = props.filter(
    (p) => p.apoia_asfalto === true || p.assinatura_status === "confirmou" || p.assinatura_status === "assinou",
  ).length;
  const totalProprietarios = props.length;
  const adesao = totalLotes ? Math.round(((totalLotes - semCadastro) / totalLotes) * 100) : 0;

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Visão geral da campanha de asfaltamento.</p>
          </div>
          
          <Select value={loteamentoId} onValueChange={setLoteamentoId}>
            <SelectTrigger className="w-full sm:w-[280px]">
              <SelectValue placeholder="Selecione um loteamento" />
            </SelectTrigger>
            <SelectContent>
              {loteamentos.map((l) => (
                <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Stat icon={MapIcon} label="Total de lotes" value={totalLotes} />
          <Stat icon={Users} label="Proprietários" value={totalProprietarios} />
          <Stat icon={CheckCircle2} label="Apoiadores" value={apoiadores} accent />
          <Stat icon={AlertTriangle} label="Sem cadastro" value={semCadastro} />
          <Stat icon={TrendingUp} label="Adesão" value={`${adesao}%`} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Adesão geral</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Progress value={adesao} />
            <p className="text-xs text-muted-foreground">{totalLotes - semCadastro} de {totalLotes} lotes com algum cadastro.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Relatório por quadra</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quadra</TableHead>
                  <TableHead>Lotes</TableHead>
                  <TableHead>Cadastrados</TableHead>
                  <TableHead>Apoiadores</TableHead>
                  <TableHead>Adesão</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quadras.map((q) => {
                  const ls = lotes.filter((l) => l.quadra_id === q.id);
                  const cad = ls.filter((l) => l.status !== "sem_cadastro").length;
                  const idsLotes = new Set(ls.map((l) => l.id));
                  const ap = props.filter((p) => idsLotes.has(p.lote_id) && (p.apoia_asfalto === true || p.assinatura_status === "confirmou" || p.assinatura_status === "assinou")).length;
                  const pct = ls.length ? Math.round((cad / ls.length) * 100) : 0;
                  return (
                    <TableRow key={q.id}>
                      <TableCell className="font-medium">{q.nome}</TableCell>
                      <TableCell>{ls.length}</TableCell>
                      <TableCell>{cad}</TableCell>
                      <TableCell>{ap}</TableCell>
                      <TableCell>{pct}%</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function Stat({ icon: Icon, label, value, accent }: { icon: any; label: string; value: any; accent?: boolean }) {
  return (
    <Card className={accent ? "border-primary/40 bg-primary/5" : ""}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <Icon className="h-4 w-4" />
          {label}
        </div>
        <div className="text-2xl font-bold mt-1">{value}</div>
      </CardContent>
    </Card>
  );
}