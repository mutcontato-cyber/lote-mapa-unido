import { a as fetchQuadras, c as SelectContent, d as SelectValue, f as AppShell, i as fetchProprietarios, l as SelectItem, m as useAuth, n as fetchLoteamentos, r as fetchLotes, s as Select, u as SelectTrigger } from "./queries-CSD4nrCJ.js";
import { a as CardTitle, c as cn, i as CardHeader, n as CardContent, t as Card } from "./card-yjQJoboh.js";
import { a as TableHeader, i as TableHead, n as TableBody, o as TableRow, r as TableCell, t as Table } from "./table-DP-6mxSz.js";
import * as React from "react";
import { useEffect, useState } from "react";
import { Navigate } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { AlertTriangle, CheckCircle2, Map, TrendingUp, Users } from "lucide-react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
//#region src/components/ui/progress.tsx
var Progress = React.forwardRef(({ className, value, ...props }, ref) => /* @__PURE__ */ jsx(ProgressPrimitive.Root, {
	ref,
	className: cn("relative h-2 w-full overflow-hidden rounded-full bg-primary/20", className),
	...props,
	children: /* @__PURE__ */ jsx(ProgressPrimitive.Indicator, {
		className: "h-full w-full flex-1 bg-primary transition-all",
		style: { transform: `translateX(-${100 - (value || 0)}%)` }
	})
}));
Progress.displayName = ProgressPrimitive.Root.displayName;
//#endregion
//#region src/routes/_authenticated/dashboard.tsx?tsr-split=component
function Dashboard() {
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
	const totalLotes = lotes.length;
	const semCadastro = lotes.filter((l) => l.status === "sem_cadastro").length;
	const apoiadores = props.filter((p) => p.apoia_asfalto === true || p.assinatura_status === "confirmou" || p.assinatura_status === "assinou").length;
	const totalProprietarios = props.length;
	const adesao = totalLotes ? Math.round((totalLotes - semCadastro) / totalLotes * 100) : 0;
	return /* @__PURE__ */ jsx(AppShell, { children: /* @__PURE__ */ jsxs("div", {
		className: "mx-auto max-w-7xl px-4 py-6 space-y-6",
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4",
				children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h1", {
					className: "text-2xl font-bold",
					children: "Dashboard"
				}), /* @__PURE__ */ jsx("p", {
					className: "text-sm text-muted-foreground",
					children: "Visão geral da campanha de asfaltamento."
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
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "grid grid-cols-2 md:grid-cols-5 gap-4",
				children: [
					/* @__PURE__ */ jsx(Stat, {
						icon: Map,
						label: "Total de lotes",
						value: totalLotes
					}),
					/* @__PURE__ */ jsx(Stat, {
						icon: Users,
						label: "Proprietários",
						value: totalProprietarios
					}),
					/* @__PURE__ */ jsx(Stat, {
						icon: CheckCircle2,
						label: "Apoiadores",
						value: apoiadores,
						accent: true
					}),
					/* @__PURE__ */ jsx(Stat, {
						icon: AlertTriangle,
						label: "Sem cadastro",
						value: semCadastro
					}),
					/* @__PURE__ */ jsx(Stat, {
						icon: TrendingUp,
						label: "Adesão",
						value: `${adesao}%`
					})
				]
			}),
			/* @__PURE__ */ jsxs(Card, { children: [/* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Adesão geral" }) }), /* @__PURE__ */ jsxs(CardContent, {
				className: "space-y-2",
				children: [/* @__PURE__ */ jsx(Progress, { value: adesao }), /* @__PURE__ */ jsxs("p", {
					className: "text-xs text-muted-foreground",
					children: [
						totalLotes - semCadastro,
						" de ",
						totalLotes,
						" lotes com algum cadastro."
					]
				})]
			})] }),
			/* @__PURE__ */ jsxs(Card, { children: [/* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Relatório por quadra" }) }), /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs(Table, { children: [/* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
				/* @__PURE__ */ jsx(TableHead, { children: "Quadra" }),
				/* @__PURE__ */ jsx(TableHead, { children: "Lotes" }),
				/* @__PURE__ */ jsx(TableHead, { children: "Cadastrados" }),
				/* @__PURE__ */ jsx(TableHead, { children: "Apoiadores" }),
				/* @__PURE__ */ jsx(TableHead, { children: "Adesão" })
			] }) }), /* @__PURE__ */ jsx(TableBody, { children: quadras.map((q) => {
				const ls = lotes.filter((l) => l.quadra_id === q.id);
				const cad = ls.filter((l) => l.status !== "sem_cadastro").length;
				const idsLotes = new Set(ls.map((l) => l.id));
				const ap = props.filter((p) => idsLotes.has(p.lote_id) && (p.apoia_asfalto === true || p.assinatura_status === "confirmou" || p.assinatura_status === "assinou")).length;
				const pct = ls.length ? Math.round(cad / ls.length * 100) : 0;
				return /* @__PURE__ */ jsxs(TableRow, { children: [
					/* @__PURE__ */ jsx(TableCell, {
						className: "font-medium",
						children: q.nome
					}),
					/* @__PURE__ */ jsx(TableCell, { children: ls.length }),
					/* @__PURE__ */ jsx(TableCell, { children: cad }),
					/* @__PURE__ */ jsx(TableCell, { children: ap }),
					/* @__PURE__ */ jsxs(TableCell, { children: [pct, "%"] })
				] }, q.id);
			}) })] }) })] })
		]
	}) });
}
function Stat({ icon: Icon, label, value, accent }) {
	return /* @__PURE__ */ jsx(Card, {
		className: accent ? "border-primary/40 bg-primary/5" : "",
		children: /* @__PURE__ */ jsxs(CardContent, {
			className: "p-4",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-2 text-muted-foreground text-xs",
				children: [/* @__PURE__ */ jsx(Icon, { className: "h-4 w-4" }), label]
			}), /* @__PURE__ */ jsx("div", {
				className: "text-2xl font-bold mt-1",
				children: value
			})]
		})
	});
}
//#endregion
export { Dashboard as component };
