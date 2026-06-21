import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchLotes, fetchProprietarios, fetchQuadras, type Lote, type Proprietario, type Quadra } from "@/lib/queries";
import { FileSpreadsheet, FileDown } from "lucide-react";
import { STATUS_LABEL } from "@/components/lots/lot-tile";

export const Route = createFileRoute("/_authenticated/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios — ADECAF Rua Digna" }] }),
  component: Relatorios,
});

function Relatorios() {
  const [quadras, setQuadras] = useState<Quadra[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [props, setProps] = useState<Proprietario[]>([]);

  useEffect(() => {
    Promise.all([fetchQuadras(), fetchLotes(), fetchProprietarios()]).then(([q, l, p]) => {
      setQuadras(q);
      setLotes(l);
      setProps(p);
    });
  }, []);

  const quadraName = (id: string) => quadras.find((q) => q.id === id)?.nome ?? "?";
  const loteInfo = (id: string) => {
    const l = lotes.find((x) => x.id === id);
    return l ? { quadra: quadraName(l.quadra_id), numero: l.numero, status: l.status } : { quadra: "?", numero: "?", status: "sem_cadastro" as const };
  };

  function rowsProprietarios() {
    return props.map((p) => {
      const li = loteInfo(p.lote_id);
      return {
        Quadra: li.quadra,
        Lote: li.numero,
        "Status do lote": STATUS_LABEL[li.status],
        "Fração %": p.fracao,
        Nome: p.nome,
        CPF: p.cpf ?? "",
        Telefone: p.telefone ?? "",
        WhatsApp: p.whatsapp ?? "",
        "E-mail": p.email ?? "",
        Endereço: p.endereco ?? "",
        "Apoia asfaltamento": p.apoia_asfalto === true ? "Sim" : p.apoia_asfalto === false ? "Não" : "—",
        "Status assinatura": p.assinatura_status,
        Cadastro: p.data_cadastro,
        Responsável: p.responsavel_cadastro ?? "",
      };
    });
  }

  function rowsApoiadores() {
    return rowsProprietarios().filter((r) => r["Apoia asfaltamento"] === "Sim" || r["Status assinatura"] === "confirmou" || r["Status assinatura"] === "assinou");
  }

  function rowsPendencias() {
    return rowsProprietarios().filter((r) => r["Apoia asfaltamento"] === "Não" || r["Status do lote"] === STATUS_LABEL.pendencia || r["Status do lote"] === STATUS_LABEL.incompleto);
  }

  function rowsPorQuadra() {
    return quadras.map((q) => {
      const ls = lotes.filter((l) => l.quadra_id === q.id);
      const idsLotes = new Set(ls.map((l) => l.id));
      const ap = props.filter((p) => idsLotes.has(p.lote_id) && (p.apoia_asfalto === true || p.assinatura_status === "confirmou" || p.assinatura_status === "assinou")).length;
      return {
        Quadra: q.nome,
        Lotes: ls.length,
        Cadastrados: ls.filter((l) => l.status !== "sem_cadastro").length,
        Apoiadores: ap,
        "Adesão %": ls.length ? Math.round((ls.filter((l) => l.status !== "sem_cadastro").length / ls.length) * 100) : 0,
      };
    });
  }

  async function exportXLSX(rows: any[], filename: string, sheet: string) {
    const XLSX = await import("xlsx");
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheet);
    XLSX.writeFile(wb, filename);
  }

  async function exportPDF(rows: any[], filename: string, title: string) {
    const { default: jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text("ADECAF Rua Digna — " + title, 14, 15);
    if (rows.length) {
      const head = [Object.keys(rows[0])];
      const body = rows.map((r) => Object.values(r).map((v) => (v == null ? "" : String(v))));
      autoTable(doc, { head, body, startY: 22, styles: { fontSize: 8 } });
    }
    doc.save(filename);
  }

  const reports = [
    { id: "prop", title: "Lista de proprietários", get: rowsProprietarios },
    { id: "ap", title: "Lista de apoiadores", get: rowsApoiadores },
    { id: "pend", title: "Lista de pendências", get: rowsPendencias },
    { id: "qd", title: "Relatório por quadra", get: rowsPorQuadra },
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Relatórios</h1>
          <p className="text-sm text-muted-foreground">Exporte os dados em PDF ou Excel.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {reports.map((r) => (
            <Card key={r.id}>
              <CardHeader>
                <CardTitle className="text-base">{r.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button variant="outline" onClick={() => exportPDF(r.get(), `${r.id}.pdf`, r.title)}>
                  <FileDown className="h-4 w-4 mr-2" /> PDF
                </Button>
                <Button onClick={() => exportXLSX(r.get(), `${r.id}.xlsx`, r.title)}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" /> Excel
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}