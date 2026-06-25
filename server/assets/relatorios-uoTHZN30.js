import { a as fetchQuadras, c as SelectContent, d as SelectValue, f as AppShell, i as fetchProprietarios, l as SelectItem, m as useAuth, n as fetchLoteamentos, r as fetchLotes, s as Select, u as SelectTrigger } from "./queries-CSD4nrCJ.js";
import { a as CardTitle, i as CardHeader, n as CardContent, s as Button, t as Card } from "./card-yjQJoboh.js";
import { t as STATUS_LABEL } from "./lot-tile-CoixSPfX.js";
import { useEffect, useState } from "react";
import { Navigate } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { FileDown, FileSpreadsheet } from "lucide-react";
//#region src/routes/_authenticated/relatorios.tsx?tsr-split=component
function Relatorios() {
	const { isStaff, loading } = useAuth();
	const [quadras, setQuadras] = useState([]);
	const [lotes, setLotes] = useState([]);
	const [props, setProps] = useState([]);
	const [loteamentos, setLoteamentos] = useState([]);
	const [loteamentoId, setLoteamentoId] = useState("");
	useEffect(() => {
		fetchLoteamentos().then((data) => {
			setLoteamentos(data);
			if (data.length > 0 && !loteamentoId) setLoteamentoId(data[0].id);
		});
	}, []);
	useEffect(() => {
		if (!loteamentoId) return;
		Promise.all([
			fetchQuadras(loteamentoId),
			fetchLotes(),
			fetchProprietarios()
		]).then(([qs, ls, ps]) => {
			const qIds = new Set(qs.map((q) => q.id));
			const lotesFiltered = ls.filter((l) => qIds.has(l.quadra_id));
			const lotesIds = new Set(lotesFiltered.map((l) => l.id));
			const propsFiltered = ps.filter((p) => lotesIds.has(p.lote_id));
			setQuadras(qs);
			setLotes(lotesFiltered);
			setProps(propsFiltered);
		});
	}, [loteamentoId]);
	if (!loading && !isStaff) return /* @__PURE__ */ jsx(Navigate, { to: "/mapa" });
	const quadraName = (id) => quadras.find((q) => q.id === id)?.nome ?? "?";
	const loteInfo = (id) => {
		const l = lotes.find((x) => x.id === id);
		return l ? {
			quadra: quadraName(l.quadra_id),
			numero: l.numero,
			status: l.status
		} : {
			quadra: "?",
			numero: "?",
			status: "sem_cadastro"
		};
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
				Responsável: p.responsavel_cadastro ?? ""
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
				"Adesão %": ls.length ? Math.round(ls.filter((l) => l.status !== "sem_cadastro").length / ls.length * 100) : 0
			};
		});
	}
	async function exportXLSX(rows, filename, sheet) {
		const XLSX = await import("xlsx");
		const ws = XLSX.utils.json_to_sheet(rows);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, sheet);
		XLSX.writeFile(wb, filename);
	}
	async function exportPDF(rows, filename, title) {
		const { default: jsPDF } = await import("jspdf");
		const autoTable = (await import("jspdf-autotable")).default;
		const doc = new jsPDF({ orientation: "landscape" });
		doc.setFontSize(14);
		doc.text("ADECAF Rua Digna — " + title, 14, 15);
		if (rows.length) autoTable(doc, {
			head: [Object.keys(rows[0])],
			body: rows.map((r) => Object.values(r).map((v) => v == null ? "" : String(v))),
			startY: 22,
			styles: { fontSize: 8 }
		});
		doc.save(filename);
	}
	const reports = [
		{
			id: "prop",
			title: "Lista de proprietários",
			get: rowsProprietarios
		},
		{
			id: "ap",
			title: "Lista de apoiadores",
			get: rowsApoiadores
		},
		{
			id: "pend",
			title: "Lista de pendências",
			get: rowsPendencias
		},
		{
			id: "qd",
			title: "Relatório por quadra",
			get: rowsPorQuadra
		}
	];
	return /* @__PURE__ */ jsx(AppShell, { children: /* @__PURE__ */ jsxs("div", {
		className: "mx-auto max-w-5xl px-4 py-6 space-y-6",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4",
			children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h1", {
				className: "text-2xl font-bold",
				children: "Relatórios"
			}), /* @__PURE__ */ jsx("p", {
				className: "text-sm text-muted-foreground",
				children: "Exporte os dados em PDF ou Excel."
			})] }), /* @__PURE__ */ jsxs(Select, {
				value: loteamentoId,
				onValueChange: setLoteamentoId,
				children: [/* @__PURE__ */ jsx(SelectTrigger, {
					className: "w-full sm:w-[280px]",
					children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Selecione um loteamento" })
				}), /* @__PURE__ */ jsx(SelectContent, { children: loteamentos.map((l) => /* @__PURE__ */ jsx(SelectItem, {
					value: l.id,
					children: l.nome
				}, l.id)) })]
			})]
		}), /* @__PURE__ */ jsx("div", {
			className: "grid sm:grid-cols-2 gap-4",
			children: reports.map((r) => /* @__PURE__ */ jsxs(Card, { children: [/* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, {
				className: "text-base",
				children: r.title
			}) }), /* @__PURE__ */ jsxs(CardContent, {
				className: "flex gap-2",
				children: [/* @__PURE__ */ jsxs(Button, {
					variant: "outline",
					onClick: () => exportPDF(r.get(), `${r.id}.pdf`, r.title),
					children: [/* @__PURE__ */ jsx(FileDown, { className: "h-4 w-4 mr-2" }), " PDF"]
				}), /* @__PURE__ */ jsxs(Button, {
					onClick: () => exportXLSX(r.get(), `${r.id}.xlsx`, r.title),
					children: [/* @__PURE__ */ jsx(FileSpreadsheet, { className: "h-4 w-4 mr-2" }), " Excel"]
				})]
			})] }, r.id))
		})]
	}) });
}
//#endregion
export { Relatorios as component };
