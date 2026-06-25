import { i as createServerFn, p as TSS_SERVER_FUNCTION } from "./esm-9EjmF9OT.js";
import { t as getServerFnById } from "./__23tanstack-start-server-fn-resolver-Cn52esXM.js";
import { t as requireSupabaseAuth } from "./auth-middleware-Dpn8S0gM.js";
import { t as supabase } from "./client-BJ1L6GXa.js";
import { a as fetchQuadras, c as SelectContent, d as SelectValue, f as AppShell, l as SelectItem, m as useAuth, n as fetchLoteamentos, p as Badge, r as fetchLotes, s as Select, u as SelectTrigger } from "./queries-CSD4nrCJ.js";
import { c as waLink } from "./auth-helpers-H7OrqMdv.js";
import { a as CardTitle, c as cn, i as CardHeader, n as CardContent, s as Button, t as Card } from "./card-yjQJoboh.js";
import { i as Input, n as AlertDescription, r as Label, t as Alert } from "./alert-C5uUgb5P.js";
import { a as TableHeader, i as TableHead, n as TableBody, o as TableRow, r as TableCell, t as Table } from "./table-DP-6mxSz.js";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, r as DialogDescription, t as Dialog } from "./dialog-BfIUOAVt.js";
import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { isRedirect, useRouter } from "@tanstack/react-router";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { z } from "zod";
import { Cake, ChevronLeft, ChevronRight, Download, Edit, FileSpreadsheet, FileText, KeyRound, MessageCircle, Plus, Search, Trash2, UserX } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Toaster, toast } from "sonner";
//#region node_modules/@tanstack/react-start/dist/esm/useServerFn.js
function useServerFn(serverFn) {
	const router = useRouter();
	return React.useCallback(async (...args) => {
		try {
			const res = await serverFn(...args);
			if (isRedirect(res)) throw res;
			return res;
		} catch (err) {
			if (isRedirect(err)) {
				err.options._fromLocation = router.stores.location.get();
				return router.navigate(router.resolveRedirect(err).options);
			}
			throw err;
		}
	}, [router, serverFn]);
}
//#endregion
//#region node_modules/@tanstack/start-server-core/dist/esm/createSsrRpc.js
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
//#endregion
//#region src/lib/admin.functions.ts
/**
* Gera senha nova para um pedido de reset. Apenas administradores e
* coordenadores podem chamar. Localiza o usuário via e-mail sintético
* (`{telefone}@adecaf.local`), atualiza a senha e marca o pedido como
* atendido. Retorna a senha gerada para o admin enviar via WhatsApp.
*/
var generatePasswordReset = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({ resetId: z.string().uuid() }).parse(d)).handler(createSsrRpc("9880f8335159b0de86437796536ccc78ec65f7113eec5942898d71a407c6027d"));
/**
* Admin pode excluir o cadastro completo de um morador (auth + profile + proprietários).
* Cascata é feita via FK on delete cascade.
*/
var deleteMorador = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({ userId: z.string().uuid() }).parse(d)).handler(createSsrRpc("981ac9ddadec5c91e62824a4d9558c0ab53d0927823b4439320b0767bad2265e"));
/**
* Envia uma mensagem via Evolution API.
* Requer variáveis de ambiente:
* EVOLUTION_API_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE
*/
var sendEvolutionWhatsApp = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
	phone: z.string(),
	message: z.string()
}).parse(d)).handler(createSsrRpc("628e6bfcbd2fe41105d4b117b6102ce1909ee22804902345adbfcfcb76e73630"));
//#endregion
//#region src/components/ui/textarea.tsx
var Textarea = React.forwardRef(({ className, ...props }, ref) => {
	return /* @__PURE__ */ jsx("textarea", {
		className: cn("flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm", className),
		ref,
		...props
	});
});
Textarea.displayName = "Textarea";
//#endregion
//#region src/routes/_authenticated/admin.tsx?tsr-split=component
function AdminPage() {
	const { isAdmin, isStaff, loading } = useAuth();
	const [quadras, setQuadras] = useState([]);
	const [lotes, setLotes] = useState([]);
	const [loteamentos, setLoteamentos] = useState([]);
	const [loteamentoId, setLoteamentoId] = useState("");
	const [novoLoteamentoNome, setNovoLoteamentoNome] = useState("");
	const [novaQuadra, setNovaQuadra] = useState("");
	const [qtdLotes, setQtdLotes] = useState(20);
	const [users, setUsers] = useState([]);
	const [resets, setResets] = useState([]);
	const [cadastros, setCadastros] = useState([]);
	const [globalBdayMessage, setGlobalBdayMessage] = useState("Olá {nome}! A ADECAF deseja a você um feliz aniversário! Que seu dia seja muito especial, com muita paz e saúde. 🎂🎉");
	const [isSavingBdayMessage, setIsSavingBdayMessage] = useState(false);
	const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
	const [customBdayUser, setCustomBdayUser] = useState(null);
	const [customBdayMessage, setCustomBdayMessage] = useState("");
	const [isSavingCustom, setIsSavingCustom] = useState(false);
	const generateResetFn = useServerFn(generatePasswordReset);
	const deleteMoradorFn = useServerFn(deleteMorador);
	useServerFn(sendEvolutionWhatsApp);
	const [bdayModalOpen, setBdayModalOpen] = useState(false);
	const [bdayUser, setBdayUser] = useState(null);
	const [bdayMessage, setBdayMessage] = useState("");
	const [sendingBday, setSendingBday] = useState(false);
	const [editUserOpen, setEditUserOpen] = useState(false);
	const [editUser, setEditUser] = useState(null);
	const [editCadastroOpen, setEditCadastroOpen] = useState(false);
	const [editCadastro, setEditCadastro] = useState(null);
	const [testPhone, setTestPhone] = useState("");
	const [testMessage, setTestMessage] = useState("Teste de integração ADECAF via Evolution API!");
	const [testingWa, setTestingWa] = useState(false);
	const [bdayView, setBdayView] = useState("calendar");
	const [bdaySearch, setBdaySearch] = useState("");
	const [exportLoteamentoId, setExportLoteamentoId] = useState("all");
	const [currentMonth, setCurrentMonth] = useState(/* @__PURE__ */ new Date());
	const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
	const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
	const monthName = currentMonth.toLocaleString("pt-BR", { month: "long" });
	const yearName = currentMonth.getFullYear();
	const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);
	const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
	function parseBday(dateStr) {
		if (!dateStr) return null;
		const clean = dateStr.split("T")[0].trim();
		let p = clean.split("-");
		if (p.length < 2) p = clean.split("/");
		let mes = 0;
		let dia = 0;
		if (p.length === 3) if (p[0].length === 4) {
			mes = Number(p[1]);
			dia = Number(p[2]);
		} else {
			mes = Number(p[1]);
			dia = Number(p[0]);
		}
		else if (p.length === 2) {
			mes = Number(p[1]);
			dia = Number(p[0]);
		}
		if (isNaN(mes) || isNaN(dia) || mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
		return {
			mes,
			dia
		};
	}
	const todosAniversariantes = useMemo(() => {
		const list = [];
		const added = /* @__PURE__ */ new Set();
		cadastros.forEach((c) => {
			const key = c.nome.trim().toLowerCase();
			if (!added.has(key)) {
				added.add(key);
				list.push({
					id: c.id,
					nome: c.nome,
					whatsapp: c.whatsapp || c.telefone || "",
					data_nascimento: c.data_nascimento
				});
			}
		});
		users.forEach((u) => {
			const key = u.full_name.trim().toLowerCase();
			if (!added.has(key)) {
				added.add(key);
				list.push({
					id: u.id,
					nome: u.full_name,
					whatsapp: u.phone,
					data_nascimento: u.data_nascimento
				});
			}
		});
		return list;
	}, [cadastros, users]);
	const monthBirthdaysMap = useMemo(() => {
		const map = /* @__PURE__ */ new Map();
		todosAniversariantes.forEach((c) => {
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
		setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
	}
	function prevMonth() {
		setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
	}
	function formatBdayDate(dateStr) {
		const b = parseBday(dateStr);
		if (!b) return dateStr ? `Erro: ${dateStr}` : "—";
		return `${String(b.dia).padStart(2, "0")}/${String(b.mes).padStart(2, "0")}`;
	}
	function openBdayModal(user) {
		setBdayUser(user);
		const nome = user.nome.split(" ")[0];
		setBdayMessage(globalBdayMessage.replace(/{nome}/g, nome));
		setBdayModalOpen(true);
	}
	async function openScheduleModal(user) {
		if (!user.whatsapp) {
			toast.error("Este usuário não possui WhatsApp cadastrado.");
			return;
		}
		user.nome.split(" ")[0];
		setCustomBdayUser(user);
		let num = user.whatsapp.replace(/\D/g, "");
		if (!num.startsWith("55")) num = "55" + num;
		const { data } = await supabase.from("mensagens_customizadas").select("mensagem").eq("telefone", num).maybeSingle();
		if (data && data.mensagem) setCustomBdayMessage(data.mensagem);
		else setCustomBdayMessage(`Olá {nome}! Temos um presente super especial para o seu próximo aniversário...`);
		setScheduleModalOpen(true);
	}
	async function saveCustomBdayMessage() {
		if (!customBdayUser) return;
		setIsSavingCustom(true);
		try {
			let num = customBdayUser.whatsapp.replace(/\D/g, "");
			if (!num.startsWith("55")) num = "55" + num;
			const { error } = await supabase.from("mensagens_customizadas").upsert({
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
			const { error } = await supabase.from("configuracoes").upsert({
				id: "birthday_message",
				valor: globalBdayMessage
			});
			if (error) {
				console.error(error);
				toast.error("Erro ao salvar mensagem. Você executou o arquivo configuracoes.sql no banco?");
			} else toast.success("Mensagem global de aniversário salva!");
		} catch (err) {
			toast.error("Erro interno ao salvar.");
		} finally {
			setIsSavingBdayMessage(false);
		}
	}
	async function load() {
		const [qs, ls, loteams] = await Promise.all([
			fetchQuadras(),
			fetchLotes(),
			fetchLoteamentos()
		]);
		setQuadras(qs);
		setLotes(ls);
		if (loteams.length > 0 && !loteamentoId) setLoteamentoId(loteams[0].id);
		if (isAdmin) {
			const { data: qdrs } = await supabase.from("quadras").select("*").order("ordem");
			const { data: lts } = await supabase.from("lotes").select("*").order("numero");
			const { data: bdayMsg } = await supabase.from("configuracoes").select("valor").eq("id", "birthday_message").single();
			if (bdayMsg) setGlobalBdayMessage(bdayMsg.valor);
			setLoteamentos(loteams ?? []);
			const { data: profs } = await supabase.from("profiles").select("id, full_name, phone, data_nascimento");
			const { data: roles } = await supabase.from("user_roles").select("user_id, role");
			const map = /* @__PURE__ */ new Map();
			(roles ?? []).forEach((r) => {
				const arr = map.get(r.user_id) ?? [];
				arr.push(r.role);
				map.set(r.user_id, arr);
			});
			setUsers((profs ?? []).map((p) => ({
				...p,
				roles: map.get(p.id) ?? []
			})));
			const { data: rs } = await supabase.from("password_resets").select("*").order("requested_at", { ascending: false });
			setResets(rs ?? []);
			const { data: props } = await supabase.from("proprietarios").select("*, lotes(numero, quadras(nome, loteamento_id))").order("data_cadastro", { ascending: false });
			const rows = (props ?? []).map((p) => ({
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
				geo_city: p.geo_city ?? null
			}));
			const { data: mds } = await supabase.from("moradores").select("*");
			const moradoresByLote = /* @__PURE__ */ new Map();
			mds?.forEach((m) => {
				const arr = moradoresByLote.get(m.lote_id) || [];
				arr.push(m);
				moradoresByLote.set(m.lote_id, arr);
			});
			rows.forEach((r) => {
				r.moradores = moradoresByLote.get(r.lote_id) || [];
			});
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
		setNovaQuadra("");
		const { data: q, error } = await supabase.from("quadras").insert({
			nome,
			ordem: quadras.filter((qd) => qd.loteamento_id === loteamentoId).length,
			loteamento_id: loteamentoId
		}).select().single();
		if (error) {
			toast.error(error.message);
			setNovaQuadra(nome);
			return;
		}
		const lotesPayload = Array.from({ length: qtdLotes }, (_, i) => ({
			quadra_id: q.id,
			numero: String(i + 1)
		}));
		await supabase.from("lotes").insert(lotesPayload);
		toast.success("Quadra criada com lotes");
		load();
	}
	async function removerQuadra(id) {
		if (!confirm("Remover esta quadra e todos os seus lotes?")) return;
		await supabase.from("quadras").delete().eq("id", id);
		load();
	}
	async function criarLoteamento() {
		const nome = novoLoteamentoNome.trim();
		if (!nome) return;
		setNovoLoteamentoNome("");
		const { data: l, error } = await supabase.from("loteamentos").insert({ nome }).select().single();
		if (error) {
			toast.error(error.message);
			setNovoLoteamentoNome(nome);
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
	async function setRole(userId, role) {
		await supabase.from("user_roles").delete().eq("user_id", userId);
		await supabase.from("user_roles").insert({
			user_id: userId,
			role
		});
		toast.success("Papel atualizado");
		load();
	}
	async function gerarSenhaNova(reset) {
		try {
			const res = await generateResetFn({ data: { resetId: reset.id } });
			const msg = `Olá ${res.full_name ?? ""}, aqui é da ADECAF Rua Digna.\n\nSua nova senha é: *${res.senha}*\n\nUse seu telefone (${res.phone}) e essa senha para entrar. Recomendamos trocar depois pedindo nova redefinição.`;
			window.open(waLink(res.phone, msg), "_blank");
			toast.success(`Senha gerada: ${res.senha}`);
			load();
		} catch (e) {
			toast.error(e?.message ?? "Erro ao gerar senha");
		}
	}
	function reabrirWhatsApp(reset) {
		if (!reset.nova_senha) return;
		const msg = `Olá ${reset.full_name ?? ""}, aqui é da ADECAF Rua Digna.\n\nSua nova senha é: *${reset.nova_senha}*\n\nUse seu telefone (${reset.phone}) e essa senha para entrar.`;
		window.open(waLink(reset.phone, msg), "_blank");
	}
	async function excluirReset(id) {
		if (!confirm("Excluir este pedido?")) return;
		await supabase.from("password_resets").delete().eq("id", id);
		load();
	}
	async function saveEditUser() {
		if (!editUser) return;
		try {
			const { error } = await supabase.rpc("admin_update_profile", {
				target_user_id: editUser.id,
				new_full_name: editUser.full_name,
				new_phone: editUser.phone
			});
			if (error) throw error;
			await supabase.from("proprietarios").update({
				telefone: editUser.phone,
				whatsapp: editUser.phone
			}).ilike("nome", editUser.full_name);
			toast.success("Morador atualizado com sucesso!");
			setEditUserOpen(false);
			load();
		} catch (e) {
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
				observacoes: editCadastro.observacoes || null
			}).eq("id", editCadastro.id);
			if (error) throw error;
			toast.success("Cadastro do lote atualizado com sucesso!");
			setEditCadastroOpen(false);
			load();
		} catch (e) {
			toast.error(e.message || "Erro ao atualizar cadastro do lote");
		}
	}
	async function excluirMorador(userId, nome) {
		if (!confirm(`Excluir o cadastro completo de ${nome}? Essa ação não pode ser desfeita.`)) return;
		try {
			await deleteMoradorFn({ data: { userId } });
			toast.success("Cadastro excluído");
			load();
		} catch (e) {
			toast.error(e?.message ?? "Erro ao excluir");
		}
	}
	function formatMelhorias(m) {
		if (!m || typeof m !== "object") return "";
		return Object.entries(m).filter(([, v]) => v === "sim" || v === "nao").map(([k, v]) => `${k}:${v}`).join("; ");
	}
	function rowToObject(r) {
		const moradoresStr = (r.moradores ?? []).map((m) => {
			const partes = [m.nome];
			if (m.data_nascimento) partes.push(`nasc:${m.data_nascimento}`);
			if (m.telefone) partes.push(`tel:${m.telefone}`);
			return partes.join(" / ");
		}).join(" | ");
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
			LocalizacaoIP: [
				r.geo_city,
				r.geo_region,
				r.geo_country
			].filter(Boolean).join(", ")
		};
	}
	function toCSV(rows) {
		if (!rows.length) return "";
		const headers = Object.keys(rows[0]);
		const escape = (v) => {
			const s = String(v ?? "");
			return /[",;\n]/.test(s) ? `"${s.replace(/"/g, "\"\"")}"` : s;
		};
		const lines = [headers.join(";")];
		for (const r of rows) lines.push(headers.map((h) => escape(r[h])).join(";"));
		return "﻿" + lines.join("\n");
	}
	function downloadFile(filename, content, mime = "text/csv;charset=utf-8") {
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
	function baixarUm(r) {
		const csv = toCSV([rowToObject(r)]);
		downloadFile(`cadastro-${r.nome.replace(/[^\w\d-]+/g, "_")}.csv`, csv);
	}
	const cadastrosFiltrados = useMemo(() => {
		if (exportLoteamentoId === "all") return cadastros;
		return cadastros.filter((c) => c.loteamento_id === exportLoteamentoId);
	}, [cadastros, exportLoteamentoId]);
	function baixarTodos() {
		if (!cadastrosFiltrados.length) {
			toast.error("Nenhum cadastro para baixar neste filtro");
			return;
		}
		const csv = toCSV(cadastrosFiltrados.map(rowToObject));
		const data = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
		downloadFile(`cadastros-adecaf-${exportLoteamentoId === "all" ? "Todos" : loteamentos.find((l) => l.id === exportLoteamentoId)?.nome ?? "Filtrado"}-${data}.csv`, csv);
	}
	function baixarTodosPDF() {
		if (!cadastrosFiltrados.length) {
			toast.error("Nenhum cadastro para baixar neste filtro");
			return;
		}
		const doc = new jsPDF("landscape");
		const nomeLot = exportLoteamentoId === "all" ? "Geral" : loteamentos.find((l) => l.id === exportLoteamentoId)?.nome ?? "";
		doc.text(`Cadastros Recebidos - ADECAF ${nomeLot !== "Geral" ? `- ${nomeLot}` : ""}`, 14, 15);
		autoTable(doc, {
			head: [[
				"Nome",
				"Telefone",
				"Quadra/Lote",
				"Tipo",
				"Apoia",
				"Questionário",
				"Moradores",
				"Data",
				"IP",
				"Localização",
				"Navegador"
			]],
			body: cadastrosFiltrados.map((c) => [
				c.nome,
				c.telefone || "—",
				`Q${c.quadra_nome} L${c.lote_numero}`,
				c.fracao === 100 ? "Inteiro" : `${c.fracao}%`,
				c.apoia_asfalto ? "Sim" : c.apoia_asfalto === false ? "Não" : "—",
				formatMelhorias(c.melhorias) || "—",
				(c.moradores ?? []).map((m) => m.nome).join(", ") || "—",
				new Date(c.data_cadastro).toLocaleDateString("pt-BR"),
				c.ip_address || "—",
				[
					c.geo_city,
					c.geo_region,
					c.geo_country
				].filter(Boolean).join(", ") || "—",
				c.user_agent || "—"
			]),
			startY: 20,
			styles: {
				fontSize: 7,
				cellPadding: 2,
				overflow: "linebreak"
			},
			headStyles: {
				fillColor: [
					41,
					128,
					185
				],
				fontSize: 8
			},
			columnStyles: {
				8: { cellWidth: 22 },
				9: { cellWidth: 30 },
				10: { cellWidth: 40 }
			}
		});
		const data = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
		doc.save(`cadastros-adecaf-${data}.pdf`);
	}
	function baixarUmPDF(c) {
		const doc = new jsPDF();
		doc.setFontSize(16);
		doc.text("Ficha de Cadastro - ADECAF", 14, 20);
		doc.setFontSize(10);
		doc.text(`Data de Emissão: ${(/* @__PURE__ */ new Date()).toLocaleString("pt-BR")}`, 14, 26);
		autoTable(doc, {
			body: [
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
				["Localização estimada (IP):", [
					c.geo_city,
					c.geo_region,
					c.geo_country
				].filter(Boolean).join(", ") || "—"],
				["Navegador / Dispositivo:", c.user_agent || "—"]
			],
			startY: 32,
			theme: "grid",
			styles: {
				fontSize: 11,
				cellPadding: 4
			},
			columnStyles: { 0: {
				fontStyle: "bold",
				fillColor: [
					245,
					245,
					245
				],
				cellWidth: 60
			} }
		});
		const moradores = c.moradores ?? [];
		if (moradores.length) {
			const finalY = doc.lastAutoTable?.finalY ?? 32;
			doc.setFontSize(12);
			doc.text("Moradores da Residência", 14, finalY + 10);
			autoTable(doc, {
				startY: finalY + 14,
				head: [[
					"Nome",
					"Data de Nascimento",
					"Telefone"
				]],
				body: moradores.map((m) => [
					m.nome,
					m.data_nascimento ? new Date(m.data_nascimento).toLocaleDateString("pt-BR") : "—",
					m.telefone || "—"
				]),
				styles: {
					fontSize: 10,
					cellPadding: 3
				},
				headStyles: { fillColor: [
					41,
					128,
					185
				] }
			});
		}
		const safe = c.nome.replace(/[^\w\d-]+/g, "_");
		doc.save(`ficha-${safe}.pdf`);
	}
	if (loading) return /* @__PURE__ */ jsx(AppShell, { children: /* @__PURE__ */ jsx("div", {
		className: "mx-auto max-w-3xl px-4 py-12",
		children: /* @__PURE__ */ jsx("p", {
			className: "text-sm text-muted-foreground",
			children: "Carregando acesso administrativo…"
		})
	}) });
	if (!isStaff) return /* @__PURE__ */ jsx(AppShell, { children: /* @__PURE__ */ jsx("div", {
		className: "mx-auto max-w-3xl px-4 py-12",
		children: /* @__PURE__ */ jsx(Alert, { children: /* @__PURE__ */ jsx(AlertDescription, { children: "Apenas administradores e coordenadores podem acessar esta área." }) })
	}) });
	return /* @__PURE__ */ jsxs(AppShell, { children: [/* @__PURE__ */ jsx(Toaster, {
		position: "top-right",
		richColors: true
	}), /* @__PURE__ */ jsxs("div", {
		className: "mx-auto max-w-5xl px-4 py-6 space-y-6",
		children: [
			/* @__PURE__ */ jsx("h1", {
				className: "text-2xl font-bold",
				children: "Administração"
			}),
			isAdmin && /* @__PURE__ */ jsxs(Card, {
				className: "border-amber-300 bg-amber-50/40",
				children: [/* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardTitle, {
					className: "flex items-center gap-2",
					children: [
						/* @__PURE__ */ jsx(KeyRound, { className: "h-5 w-5 text-amber-600" }),
						"Pedidos de senha esquecida",
						resets.filter((r) => r.status === "pendente").length > 0 && /* @__PURE__ */ jsxs(Badge, {
							variant: "destructive",
							children: [resets.filter((r) => r.status === "pendente").length, " pendente(s)"]
						})
					]
				}) }), /* @__PURE__ */ jsxs(CardContent, { children: [resets.length === 0 ? /* @__PURE__ */ jsx("p", {
					className: "text-sm text-muted-foreground",
					children: "Nenhum pedido no momento."
				}) : /* @__PURE__ */ jsxs(Table, { children: [/* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
					/* @__PURE__ */ jsx(TableHead, { children: "Nome" }),
					/* @__PURE__ */ jsx(TableHead, { children: "Telefone" }),
					/* @__PURE__ */ jsx(TableHead, { children: "Pedido em" }),
					/* @__PURE__ */ jsx(TableHead, { children: "Status" }),
					/* @__PURE__ */ jsx(TableHead, {
						className: "text-right",
						children: "Ações"
					})
				] }) }), /* @__PURE__ */ jsx(TableBody, { children: resets.map((r) => /* @__PURE__ */ jsxs(TableRow, { children: [
					/* @__PURE__ */ jsx(TableCell, {
						className: "font-medium",
						children: r.full_name ?? "—"
					}),
					/* @__PURE__ */ jsx(TableCell, { children: r.phone }),
					/* @__PURE__ */ jsx(TableCell, {
						className: "text-xs text-muted-foreground",
						children: new Date(r.requested_at).toLocaleString("pt-BR")
					}),
					/* @__PURE__ */ jsx(TableCell, { children: r.status === "pendente" ? /* @__PURE__ */ jsx(Badge, {
						variant: "destructive",
						children: "Pendente"
					}) : /* @__PURE__ */ jsx(Badge, {
						variant: "secondary",
						children: "Atendido"
					}) }),
					/* @__PURE__ */ jsxs(TableCell, {
						className: "text-right space-x-1",
						children: [r.status === "pendente" ? /* @__PURE__ */ jsxs(Button, {
							size: "sm",
							onClick: () => gerarSenhaNova(r),
							children: [/* @__PURE__ */ jsx(KeyRound, { className: "h-3.5 w-3.5 mr-1" }), "Gerar senha"]
						}) : /* @__PURE__ */ jsxs(Button, {
							size: "sm",
							variant: "outline",
							onClick: () => reabrirWhatsApp(r),
							children: [/* @__PURE__ */ jsx(MessageCircle, { className: "h-3.5 w-3.5 mr-1" }), "Reenviar"]
						}), /* @__PURE__ */ jsx(Button, {
							size: "icon",
							variant: "ghost",
							onClick: () => excluirReset(r.id),
							children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4 text-destructive" })
						})]
					})
				] }, r.id)) })] }), /* @__PURE__ */ jsxs("p", {
					className: "text-xs text-muted-foreground mt-3",
					children: [
						"Ao clicar em ",
						/* @__PURE__ */ jsx("strong", { children: "Gerar senha" }),
						", o sistema cria uma senha aleatória, atualiza o cadastro do morador e abre o WhatsApp para você enviar a senha."
					]
				})] })]
			}),
			isAdmin && /* @__PURE__ */ jsxs(Card, {
				className: "border-pink-300 bg-pink-50/40",
				children: [/* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Mensagem Global de Aniversário" }) }), /* @__PURE__ */ jsxs(CardContent, {
					className: "space-y-4",
					children: [
						/* @__PURE__ */ jsxs("p", {
							className: "text-sm text-pink-800",
							children: [
								"Esta é a mensagem que o robô vai enviar ",
								/* @__PURE__ */ jsx("strong", { children: "automaticamente todos os dias às 08h da manhã" }),
								". Use ",
								/* @__PURE__ */ jsx("code", {
									className: "bg-pink-100 px-1 rounded",
									children: "{nome}"
								}),
								" no texto onde quiser que o primeiro nome da pessoa seja inserido."
							]
						}),
						/* @__PURE__ */ jsx(Textarea, {
							value: globalBdayMessage,
							onChange: (e) => setGlobalBdayMessage(e.target.value),
							className: "min-h-[120px] bg-white border-pink-200"
						}),
						/* @__PURE__ */ jsx(Button, {
							onClick: saveGlobalBdayMessage,
							disabled: isSavingBdayMessage,
							className: "bg-pink-600 hover:bg-pink-700 text-white",
							children: isSavingBdayMessage ? "Salvando..." : "Salvar Mensagem"
						})
					]
				})]
			}),
			isAdmin && /* @__PURE__ */ jsxs(Card, {
				className: "border-pink-300 bg-pink-50/40",
				children: [/* @__PURE__ */ jsxs(CardHeader, {
					className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2",
					children: [/* @__PURE__ */ jsxs(CardTitle, {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ jsx(Cake, { className: "h-5 w-5 text-pink-600" }), "Aniversariantes"]
					}), /* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-2 bg-pink-100 p-1 rounded-md",
						children: [/* @__PURE__ */ jsx(Button, {
							variant: bdayView === "calendar" ? "default" : "ghost",
							size: "sm",
							onClick: () => setBdayView("calendar"),
							className: bdayView === "calendar" ? "bg-pink-600 text-white hover:bg-pink-700" : "text-pink-600 hover:text-pink-700 hover:bg-pink-200",
							children: "Calendário"
						}), /* @__PURE__ */ jsx(Button, {
							variant: bdayView === "list" ? "default" : "ghost",
							size: "sm",
							onClick: () => setBdayView("list"),
							className: bdayView === "list" ? "bg-pink-600 text-white hover:bg-pink-700" : "text-pink-600 hover:text-pink-700 hover:bg-pink-200",
							children: "Lista Completa"
						})]
					})]
				}), /* @__PURE__ */ jsx(CardContent, { children: bdayView === "calendar" ? /* @__PURE__ */ jsxs(Fragment, { children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex items-center justify-between mb-4 mt-2",
						children: [
							/* @__PURE__ */ jsxs(Button, {
								variant: "outline",
								size: "sm",
								onClick: prevMonth,
								children: [/* @__PURE__ */ jsx(ChevronLeft, { className: "h-4 w-4 mr-1" }), " Anterior"]
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "font-semibold text-lg capitalize",
								children: [
									monthName,
									" ",
									yearName
								]
							}),
							/* @__PURE__ */ jsxs(Button, {
								variant: "outline",
								size: "sm",
								onClick: nextMonth,
								children: ["Próximo ", /* @__PURE__ */ jsx(ChevronRight, { className: "h-4 w-4 ml-1" })]
							})
						]
					}),
					/* @__PURE__ */ jsx("div", {
						className: "grid grid-cols-7 gap-1 sm:gap-2 mb-2",
						children: [
							"Dom",
							"Seg",
							"Ter",
							"Qua",
							"Qui",
							"Sex",
							"Sáb"
						].map((day) => /* @__PURE__ */ jsx("div", {
							className: "text-center text-sm font-medium text-muted-foreground",
							children: day
						}, day))
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "grid grid-cols-7 gap-1 sm:gap-2",
						children: [blanks.map((b) => /* @__PURE__ */ jsx("div", { className: "min-h-[80px] p-2 rounded-md bg-transparent" }, `blank-${b}`)), days.map((d) => {
							const bdays = monthBirthdaysMap.get(d);
							const isToday = (/* @__PURE__ */ new Date()).getDate() === d && (/* @__PURE__ */ new Date()).getMonth() === currentMonth.getMonth() && (/* @__PURE__ */ new Date()).getFullYear() === currentMonth.getFullYear();
							return /* @__PURE__ */ jsxs("div", {
								className: `min-h-[80px] sm:min-h-[100px] border rounded-md p-1 sm:p-2 flex flex-col ${isToday ? "border-pink-400 bg-pink-100/50" : "bg-card"}`,
								children: [/* @__PURE__ */ jsx("div", {
									className: `text-xs sm:text-sm font-semibold mb-1 ${isToday ? "text-pink-600" : "text-muted-foreground"}`,
									children: d
								}), /* @__PURE__ */ jsx("div", {
									className: "flex flex-col gap-1 overflow-y-auto max-h-[80px]",
									children: bdays?.map((b) => /* @__PURE__ */ jsx("div", {
										onClick: () => openBdayModal(b),
										className: "text-[10px] sm:text-xs bg-pink-500 hover:bg-pink-600 text-white rounded px-1 py-0.5 cursor-pointer truncate",
										title: `Enviar mensagem para ${b.nome}`,
										children: b.nome.split(" ")[0]
									}, b.id))
								})]
							}, `${currentMonth.getMonth()}-${d}`);
						})]
					})
				] }) : /* @__PURE__ */ jsxs("div", {
					className: "space-y-4 mt-2",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ jsx(Search, { className: "h-4 w-4 text-muted-foreground" }), /* @__PURE__ */ jsx(Input, {
							placeholder: "Buscar aniversariante pelo nome...",
							value: bdaySearch,
							onChange: (e) => setBdaySearch(e.target.value),
							className: "max-w-sm"
						})]
					}), /* @__PURE__ */ jsx("div", {
						className: "max-h-[400px] overflow-y-auto rounded-md border",
						children: /* @__PURE__ */ jsxs(Table, { children: [/* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
							/* @__PURE__ */ jsx(TableHead, { children: "Dia/Mês" }),
							/* @__PURE__ */ jsx(TableHead, { children: "Nome" }),
							/* @__PURE__ */ jsx(TableHead, { children: "WhatsApp" }),
							/* @__PURE__ */ jsx(TableHead, {
								className: "text-right",
								children: "Ação"
							})
						] }) }), /* @__PURE__ */ jsxs(TableBody, { children: [todosAniversariantes.filter((c) => (c.nome || "").toLowerCase().includes(bdaySearch.toLowerCase())).sort((a, b) => {
							const bA = parseBday(a.data_nascimento);
							const bB = parseBday(b.data_nascimento);
							if (!bA && !bB) return 0;
							if (!bA) return 1;
							if (!bB) return -1;
							return bA.mes - bB.mes || bA.dia - bB.dia;
						}).map((c) => /* @__PURE__ */ jsxs(TableRow, { children: [
							/* @__PURE__ */ jsx(TableCell, {
								className: "font-semibold text-pink-600",
								children: formatBdayDate(c.data_nascimento)
							}),
							/* @__PURE__ */ jsx(TableCell, {
								className: "font-medium",
								children: c.nome
							}),
							/* @__PURE__ */ jsx(TableCell, { children: c.whatsapp || "—" }),
							/* @__PURE__ */ jsx(TableCell, {
								className: "text-right",
								children: /* @__PURE__ */ jsxs(Button, {
									size: "sm",
									variant: "outline",
									className: "border-pink-200 text-pink-700 hover:bg-pink-100",
									onClick: () => openScheduleModal(c),
									children: [/* @__PURE__ */ jsx(Cake, { className: "h-3.5 w-3.5 mr-1" }), "Mensagem VIP"]
								})
							})
						] }, c.id)), todosAniversariantes.filter((c) => (c.nome || "").toLowerCase().includes(bdaySearch.toLowerCase())).length === 0 && /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, {
							colSpan: 4,
							className: "text-center py-4 text-muted-foreground",
							children: "Nenhum morador encontrado com esse nome."
						}) })] })] })
					})]
				}) })]
			}),
			/* @__PURE__ */ jsx(Dialog, {
				open: scheduleModalOpen,
				onOpenChange: setScheduleModalOpen,
				children: /* @__PURE__ */ jsxs(DialogContent, {
					className: "sm:max-w-[425px]",
					children: [
						/* @__PURE__ */ jsxs(DialogHeader, { children: [/* @__PURE__ */ jsx(DialogTitle, { children: "Agendar Mensagem Especial" }), /* @__PURE__ */ jsxs(DialogDescription, { children: [
							"A mensagem abaixo será enviada AUTOMATICAMENTE para ",
							/* @__PURE__ */ jsx("strong", { children: customBdayUser?.nome }),
							" no próximo aniversário dele(a). Após ser enviada, essa mensagem será apagada e no ano seguinte ele(a) voltará a receber a mensagem padrão."
						] })] }),
						/* @__PURE__ */ jsx("div", {
							className: "grid gap-4 py-4",
							children: /* @__PURE__ */ jsx(Textarea, {
								className: "min-h-[150px]",
								value: customBdayMessage,
								onChange: (e) => setCustomBdayMessage(e.target.value),
								placeholder: "Digite o cupom ou recado especial..."
							})
						}),
						/* @__PURE__ */ jsxs(DialogFooter, { children: [/* @__PURE__ */ jsx(Button, {
							variant: "outline",
							onClick: () => setScheduleModalOpen(false),
							children: "Cancelar"
						}), /* @__PURE__ */ jsx(Button, {
							onClick: saveCustomBdayMessage,
							disabled: isSavingCustom,
							children: isSavingCustom ? "Salvando..." : "Agendar Mensagem"
						})] })
					]
				})
			}),
			isAdmin && /* @__PURE__ */ jsxs(Card, { children: [/* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs("div", {
				className: "flex flex-col md:flex-row md:items-center justify-between gap-4",
				children: [/* @__PURE__ */ jsxs(CardTitle, {
					className: "flex items-center gap-2",
					children: [
						/* @__PURE__ */ jsx(FileSpreadsheet, { className: "h-5 w-5 text-primary" }),
						"Cadastros enviados",
						/* @__PURE__ */ jsx(Badge, {
							variant: "secondary",
							children: cadastrosFiltrados.length
						})
					]
				}), /* @__PURE__ */ jsxs("div", {
					className: "flex flex-wrap items-center gap-2",
					children: [
						/* @__PURE__ */ jsxs(Select, {
							value: exportLoteamentoId,
							onValueChange: setExportLoteamentoId,
							children: [/* @__PURE__ */ jsx(SelectTrigger, {
								className: "w-[180px] h-8 text-xs",
								children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Todos os Loteamentos" })
							}), /* @__PURE__ */ jsxs(SelectContent, { children: [/* @__PURE__ */ jsx(SelectItem, {
								value: "all",
								children: "Todos os Loteamentos"
							}), loteamentos.map((l) => /* @__PURE__ */ jsx(SelectItem, {
								value: l.id,
								children: l.nome
							}, l.id))] })]
						}),
						/* @__PURE__ */ jsxs(Button, {
							size: "sm",
							onClick: baixarTodos,
							disabled: !cadastrosFiltrados.length,
							children: [/* @__PURE__ */ jsx(Download, { className: "h-4 w-4 mr-1" }), "Baixar (CSV)"]
						}),
						/* @__PURE__ */ jsxs(Button, {
							size: "sm",
							variant: "outline",
							onClick: baixarTodosPDF,
							disabled: !cadastrosFiltrados.length,
							children: [/* @__PURE__ */ jsx(FileText, { className: "h-4 w-4 mr-1 text-red-500" }), "Baixar (PDF)"]
						})
					]
				})]
			}) }), /* @__PURE__ */ jsxs(CardContent, { children: [cadastrosFiltrados.length === 0 ? /* @__PURE__ */ jsx("p", {
				className: "text-sm text-muted-foreground",
				children: "Nenhum cadastro recebido para este loteamento ainda."
			}) : /* @__PURE__ */ jsx("div", {
				className: "overflow-x-auto",
				children: /* @__PURE__ */ jsxs(Table, { children: [/* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
					/* @__PURE__ */ jsx(TableHead, { children: "Data" }),
					/* @__PURE__ */ jsx(TableHead, { children: "Nome" }),
					/* @__PURE__ */ jsx(TableHead, { children: "Telefone" }),
					/* @__PURE__ */ jsx(TableHead, { children: "Quadra / Lote" }),
					/* @__PURE__ */ jsx(TableHead, { children: "Apoia" }),
					/* @__PURE__ */ jsx(TableHead, { children: "IP / Localização" }),
					/* @__PURE__ */ jsx(TableHead, {
						className: "text-right",
						children: "Ações"
					})
				] }) }), /* @__PURE__ */ jsx(TableBody, { children: cadastrosFiltrados.map((c) => /* @__PURE__ */ jsxs(TableRow, { children: [
					/* @__PURE__ */ jsx(TableCell, {
						className: "text-xs text-muted-foreground whitespace-nowrap",
						children: new Date(c.data_cadastro).toLocaleDateString("pt-BR")
					}),
					/* @__PURE__ */ jsx(TableCell, {
						className: "font-medium",
						children: c.nome
					}),
					/* @__PURE__ */ jsx(TableCell, {
						className: "whitespace-nowrap",
						children: c.telefone ?? "—"
					}),
					/* @__PURE__ */ jsxs(TableCell, {
						className: "whitespace-nowrap",
						children: [
							c.quadra_nome,
							" / ",
							c.lote_numero,
							c.fracao !== 100 && /* @__PURE__ */ jsxs(Badge, {
								variant: "outline",
								className: "ml-2",
								children: [
									"Metade (",
									c.fracao,
									"%)"
								]
							})
						]
					}),
					/* @__PURE__ */ jsx(TableCell, { children: c.apoia_asfalto === true ? /* @__PURE__ */ jsx(Badge, {
						className: "bg-green-600",
						children: "Sim"
					}) : c.apoia_asfalto === false ? /* @__PURE__ */ jsx(Badge, {
						variant: "destructive",
						children: "Não"
					}) : /* @__PURE__ */ jsx(Badge, {
						variant: "outline",
						children: "—"
					}) }),
					/* @__PURE__ */ jsx(TableCell, {
						className: "text-xs",
						children: c.ip_address ? /* @__PURE__ */ jsxs("div", {
							className: "space-y-0.5",
							children: [
								/* @__PURE__ */ jsx("div", {
									className: "font-mono",
									children: c.ip_address
								}),
								/* @__PURE__ */ jsx("div", {
									className: "text-muted-foreground",
									children: [
										c.geo_city,
										c.geo_region,
										c.geo_country
									].filter(Boolean).join(", ") || "—"
								}),
								c.user_agent && /* @__PURE__ */ jsx("div", {
									className: "text-muted-foreground truncate max-w-[220px]",
									title: c.user_agent,
									children: c.user_agent
								})
							]
						}) : /* @__PURE__ */ jsx("span", {
							className: "text-muted-foreground",
							children: "—"
						})
					}),
					/* @__PURE__ */ jsx(TableCell, {
						className: "text-right",
						children: /* @__PURE__ */ jsxs("div", {
							className: "flex justify-end gap-1",
							children: [
								/* @__PURE__ */ jsx(Button, {
									size: "icon",
									variant: "ghost",
									onClick: () => {
										setEditCadastro({ ...c });
										setEditCadastroOpen(true);
									},
									title: "Editar ficha do lote",
									children: /* @__PURE__ */ jsx(Edit, { className: "h-4 w-4 text-blue-500" })
								}),
								/* @__PURE__ */ jsx(Button, {
									size: "icon",
									variant: "ghost",
									onClick: () => baixarUmPDF(c),
									title: "Baixar Ficha Individual (PDF)",
									children: /* @__PURE__ */ jsx(FileText, { className: "h-4 w-4 text-red-500" })
								}),
								/* @__PURE__ */ jsx(Button, {
									size: "icon",
									variant: "ghost",
									onClick: () => baixarUm(c),
									title: "Baixar Planilha Individual (CSV)",
									children: /* @__PURE__ */ jsx(FileSpreadsheet, { className: "h-4 w-4 text-emerald-600" })
								})
							]
						})
					})
				] }, c.id)) })] })
			}), /* @__PURE__ */ jsx("p", {
				className: "text-xs text-muted-foreground mt-3",
				children: "Os cadastros são gravados automaticamente assim que o morador confirma o lote. Os arquivos CSV podem ser abertos no Excel ou Google Planilhas."
			})] })] }),
			/* @__PURE__ */ jsxs(Card, { children: [/* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Configurar Loteamentos e Quadras" }) }), /* @__PURE__ */ jsxs(CardContent, {
				className: "space-y-6",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "space-y-3 border-b border-border pb-6",
					children: [
						/* @__PURE__ */ jsx(Label, { children: "Loteamento selecionado para edição" }),
						/* @__PURE__ */ jsxs("div", {
							className: "flex flex-col gap-3",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "flex flex-col sm:flex-row sm:items-center gap-2",
								children: [/* @__PURE__ */ jsxs(Select, {
									value: loteamentoId,
									onValueChange: setLoteamentoId,
									children: [/* @__PURE__ */ jsx(SelectTrigger, {
										className: "w-full sm:w-[350px]",
										children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Selecione um loteamento..." })
									}), /* @__PURE__ */ jsx(SelectContent, { children: loteamentos.map((l) => /* @__PURE__ */ jsx(SelectItem, {
										value: l.id,
										children: l.nome
									}, l.id)) })]
								}), loteamentoId && /* @__PURE__ */ jsx(Button, {
									variant: "outline",
									size: "icon",
									onClick: excluirLoteamento,
									title: "Excluir Loteamento selecionado",
									children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4 text-destructive" })
								})]
							}), loteamentoId && (() => {
								const selectedLot = loteamentos.find((l) => l.id === loteamentoId);
								const shareLink = `${typeof window !== "undefined" ? window.location.origin : ""}/mapa?loteamento=${loteamentoId}`;
								return /* @__PURE__ */ jsxs("div", {
									className: "rounded-lg border border-blue-200 bg-blue-50/60 p-3 space-y-2",
									children: [
										/* @__PURE__ */ jsxs("p", {
											className: "text-xs font-semibold text-blue-700",
											children: ["🔗 Link de Divulgação — ", selectedLot?.nome]
										}),
										/* @__PURE__ */ jsx("p", {
											className: "text-[11px] text-blue-600/80",
											children: "Envie este link para os moradores. Quem acessar por aqui só poderá ver e preencher lotes deste loteamento, sem opção de troca."
										}),
										/* @__PURE__ */ jsxs("div", {
											className: "flex items-center gap-2",
											children: [/* @__PURE__ */ jsx("code", {
												className: "flex-1 text-[11px] bg-white border border-blue-200 rounded px-2 py-1.5 font-mono text-blue-900 break-all",
												children: shareLink
											}), /* @__PURE__ */ jsx(Button, {
												size: "sm",
												variant: "outline",
												className: "shrink-0 border-blue-300 text-blue-700 hover:bg-blue-100",
												onClick: () => {
													navigator.clipboard.writeText(shareLink);
													toast.success("Link copiado!");
												},
												children: "Copiar"
											})]
										})
									]
								});
							})()]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "flex flex-col sm:flex-row gap-2 pt-2",
							children: [/* @__PURE__ */ jsx(Input, {
								value: novoLoteamentoNome,
								onChange: (e) => setNovoLoteamentoNome(e.target.value),
								placeholder: "Nome de um NOVO loteamento",
								className: "sm:w-[250px]"
							}), /* @__PURE__ */ jsxs(Button, {
								onClick: criarLoteamento,
								variant: "secondary",
								children: [/* @__PURE__ */ jsx(Plus, { className: "h-4 w-4 mr-1" }), " Criar Loteamento"]
							})]
						})
					]
				}), loteamentoId && /* @__PURE__ */ jsxs("div", {
					className: "space-y-4 pt-2",
					children: [
						/* @__PURE__ */ jsx("h3", {
							className: "font-semibold text-lg",
							children: "Quadras deste loteamento"
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "grid grid-cols-1 sm:grid-cols-[1fr_140px_auto] gap-3 items-end",
							children: [
								/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "Nome / número da nova quadra" }), /* @__PURE__ */ jsx(Input, {
									value: novaQuadra,
									onChange: (e) => setNovaQuadra(e.target.value),
									placeholder: "Ex.: 01, A, Quadra 5"
								})] }),
								/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, { children: "Quantidade de lotes" }), /* @__PURE__ */ jsx(Input, {
									type: "number",
									min: 1,
									value: qtdLotes,
									onChange: (e) => setQtdLotes(Number(e.target.value))
								})] }),
								/* @__PURE__ */ jsxs(Button, {
									onClick: criarQuadra,
									children: [/* @__PURE__ */ jsx(Plus, { className: "h-4 w-4 mr-1" }), "Adicionar"]
								})
							]
						}),
						/* @__PURE__ */ jsxs(Table, { children: [/* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
							/* @__PURE__ */ jsx(TableHead, { children: "Quadra" }),
							/* @__PURE__ */ jsx(TableHead, { children: "Lotes" }),
							/* @__PURE__ */ jsx(TableHead, {})
						] }) }), /* @__PURE__ */ jsxs(TableBody, { children: [quadras.filter((q) => q.loteamento_id === loteamentoId).map((q) => /* @__PURE__ */ jsxs(TableRow, { children: [
							/* @__PURE__ */ jsx(TableCell, {
								className: "font-medium",
								children: q.nome
							}),
							/* @__PURE__ */ jsx(TableCell, { children: lotes.filter((l) => l.quadra_id === q.id).length }),
							/* @__PURE__ */ jsx(TableCell, {
								className: "text-right",
								children: /* @__PURE__ */ jsx(Button, {
									variant: "ghost",
									size: "icon",
									onClick: () => removerQuadra(q.id),
									children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4 text-destructive" })
								})
							})
						] }, q.id)), quadras.filter((q) => q.loteamento_id === loteamentoId).length === 0 ? /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, {
							colSpan: 3,
							className: "text-center text-muted-foreground py-4",
							children: "Nenhuma quadra cadastrada neste loteamento."
						}) }) : null] })] })
					]
				})]
			})] }),
			isAdmin && /* @__PURE__ */ jsxs(Card, { children: [/* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardTitle, { children: "Moradores cadastrados" }) }), /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs(Table, { children: [/* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [
				/* @__PURE__ */ jsx(TableHead, { children: "Nome" }),
				/* @__PURE__ */ jsx(TableHead, { children: "Telefone" }),
				/* @__PURE__ */ jsx(TableHead, { children: "Papel atual" }),
				/* @__PURE__ */ jsx(TableHead, { children: "Alterar Papel" }),
				/* @__PURE__ */ jsx(TableHead, {
					className: "text-right",
					children: "Ações"
				})
			] }) }), /* @__PURE__ */ jsx(TableBody, { children: users.map((u) => /* @__PURE__ */ jsxs(TableRow, { children: [
				/* @__PURE__ */ jsx(TableCell, {
					className: "font-medium",
					children: u.full_name
				}),
				/* @__PURE__ */ jsx(TableCell, { children: u.phone }),
				/* @__PURE__ */ jsx(TableCell, { children: u.roles.length === 0 ? /* @__PURE__ */ jsx(Badge, {
					variant: "outline",
					children: "visitante"
				}) : u.roles.map((r) => /* @__PURE__ */ jsx(Badge, {
					className: "mr-1",
					children: r
				}, r)) }),
				/* @__PURE__ */ jsx(TableCell, { children: /* @__PURE__ */ jsxs(Select, {
					onValueChange: (v) => setRole(u.id, v),
					children: [/* @__PURE__ */ jsx(SelectTrigger, {
						className: "w-44",
						children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Definir papel" })
					}), /* @__PURE__ */ jsxs(SelectContent, { children: [
						/* @__PURE__ */ jsx(SelectItem, {
							value: "admin",
							children: "Administrador"
						}),
						/* @__PURE__ */ jsx(SelectItem, {
							value: "coordenador",
							children: "Coordenador"
						}),
						/* @__PURE__ */ jsx(SelectItem, {
							value: "visitante",
							children: "Visitante"
						})
					] })]
				}) }),
				/* @__PURE__ */ jsx(TableCell, {
					className: "text-right",
					children: /* @__PURE__ */ jsxs("div", {
						className: "flex justify-end gap-1",
						children: [/* @__PURE__ */ jsx(Button, {
							size: "icon",
							variant: "ghost",
							onClick: () => {
								setEditUser({
									id: u.id,
									full_name: u.full_name,
									phone: u.phone
								});
								setEditUserOpen(true);
							},
							title: "Editar cadastro",
							children: /* @__PURE__ */ jsx(Edit, { className: "h-4 w-4 text-blue-500" })
						}), /* @__PURE__ */ jsx(Button, {
							size: "icon",
							variant: "ghost",
							onClick: () => excluirMorador(u.id, u.full_name),
							title: "Excluir cadastro",
							children: /* @__PURE__ */ jsx(UserX, { className: "h-4 w-4 text-destructive" })
						})]
					})
				})
			] }, u.id)) })] }) })] }),
			/* @__PURE__ */ jsx(Dialog, {
				open: editUserOpen,
				onOpenChange: setEditUserOpen,
				children: /* @__PURE__ */ jsxs(DialogContent, { children: [
					/* @__PURE__ */ jsxs(DialogHeader, { children: [/* @__PURE__ */ jsx(DialogTitle, { children: "Editar Morador" }), /* @__PURE__ */ jsx(DialogDescription, { children: "Altere as informações do usuário abaixo." })] }),
					/* @__PURE__ */ jsxs("div", {
						className: "space-y-4 py-4",
						children: [/* @__PURE__ */ jsxs("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ jsx(Label, { children: "Nome Completo" }), /* @__PURE__ */ jsx(Input, {
								value: editUser?.full_name || "",
								onChange: (e) => setEditUser((prev) => prev ? {
									...prev,
									full_name: e.target.value
								} : null)
							})]
						}), /* @__PURE__ */ jsxs("div", {
							className: "space-y-2",
							children: [/* @__PURE__ */ jsx(Label, { children: "Telefone / WhatsApp" }), /* @__PURE__ */ jsx(Input, {
								value: editUser?.phone || "",
								onChange: (e) => setEditUser((prev) => prev ? {
									...prev,
									phone: e.target.value
								} : null)
							})]
						})]
					}),
					/* @__PURE__ */ jsxs(DialogFooter, { children: [/* @__PURE__ */ jsx(Button, {
						variant: "outline",
						onClick: () => setEditUserOpen(false),
						children: "Cancelar"
					}), /* @__PURE__ */ jsx(Button, {
						onClick: saveEditUser,
						children: "Salvar Alterações"
					})] })
				] })
			}),
			/* @__PURE__ */ jsx(Dialog, {
				open: editCadastroOpen,
				onOpenChange: setEditCadastroOpen,
				children: /* @__PURE__ */ jsxs(DialogContent, {
					className: "max-w-2xl max-h-[90vh] overflow-y-auto",
					children: [
						/* @__PURE__ */ jsxs(DialogHeader, { children: [/* @__PURE__ */ jsx(DialogTitle, { children: "Editar Ficha de Cadastro Completa" }), /* @__PURE__ */ jsx(DialogDescription, { children: "Alterar as informações registradas na ficha de lote deste proprietário. Isso afeta o módulo de Aniversários e as informações do Mapa." })] }),
						/* @__PURE__ */ jsxs("div", {
							className: "grid grid-cols-1 md:grid-cols-2 gap-4 py-4",
							children: [
								/* @__PURE__ */ jsxs("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ jsx(Label, { children: "Nome Completo" }), /* @__PURE__ */ jsx(Input, {
										value: editCadastro?.nome || "",
										onChange: (e) => setEditCadastro((prev) => prev ? {
											...prev,
											nome: e.target.value
										} : null)
									})]
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ jsx(Label, { children: "CPF" }), /* @__PURE__ */ jsx(Input, {
										value: editCadastro?.cpf || "",
										onChange: (e) => setEditCadastro((prev) => prev ? {
											...prev,
											cpf: e.target.value
										} : null)
									})]
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ jsx(Label, { children: "Telefone / WhatsApp" }), /* @__PURE__ */ jsx(Input, {
										value: editCadastro?.telefone || "",
										onChange: (e) => setEditCadastro((prev) => prev ? {
											...prev,
											telefone: e.target.value
										} : null)
									})]
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ jsx(Label, { children: "Data de Nascimento" }), /* @__PURE__ */ jsx(Input, {
										type: "date",
										value: editCadastro?.data_nascimento || "",
										onChange: (e) => setEditCadastro((prev) => prev ? {
											...prev,
											data_nascimento: e.target.value
										} : null)
									})]
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ jsx(Label, { children: "Quantidade de Moradores na Casa" }), /* @__PURE__ */ jsx(Input, {
										type: "number",
										min: "1",
										value: editCadastro?.qtd_moradores || "",
										onChange: (e) => setEditCadastro((prev) => prev ? {
											...prev,
											qtd_moradores: Number(e.target.value)
										} : null)
									})]
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "space-y-2",
									children: [/* @__PURE__ */ jsx(Label, { children: "Fração do Lote (%)" }), /* @__PURE__ */ jsx(Input, {
										type: "number",
										min: "0",
										max: "100",
										value: editCadastro?.fracao || 100,
										onChange: (e) => setEditCadastro((prev) => prev ? {
											...prev,
											fracao: Number(e.target.value)
										} : null)
									})]
								}),
								/* @__PURE__ */ jsxs("div", {
									className: "space-y-2 md:col-span-2",
									children: [/* @__PURE__ */ jsx(Label, { children: "Endereço e Observações" }), /* @__PURE__ */ jsx(Textarea, {
										value: editCadastro?.observacoes || "",
										onChange: (e) => setEditCadastro((prev) => prev ? {
											...prev,
											observacoes: e.target.value
										} : null),
										placeholder: "Anotações sobre a casa, pendências, etc."
									})]
								})
							]
						}),
						/* @__PURE__ */ jsxs(DialogFooter, { children: [/* @__PURE__ */ jsx(Button, {
							variant: "outline",
							onClick: () => setEditCadastroOpen(false),
							children: "Cancelar"
						}), /* @__PURE__ */ jsx(Button, {
							onClick: saveEditCadastro,
							children: "Salvar Alterações"
						})] })
					]
				})
			})
		]
	})] });
}
//#endregion
export { AdminPage as component };
