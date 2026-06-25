import { t as supabase } from "./client-BJ1L6GXa.js";
import { t as Route } from "./mapa-YWJFa8PF.js";
import { a as fetchQuadras, c as SelectContent, d as SelectValue, f as AppShell, i as fetchProprietarios, l as SelectItem, m as useAuth, n as fetchLoteamentos, o as recomputeLoteStatus, r as fetchLotes, s as Select, t as deriveStatus, u as SelectTrigger } from "./queries-CSD4nrCJ.js";
import { a as ADMIN_NOME, c as waLink, s as ADMIN_WHATSAPP } from "./auth-helpers-H7OrqMdv.js";
import { c as cn, s as Button, t as Card } from "./card-yjQJoboh.js";
import { i as Input, n as AlertDescription, r as Label, t as Alert } from "./alert-C5uUgb5P.js";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, r as DialogDescription, t as Dialog } from "./dialog-BfIUOAVt.js";
import { t as STATUS_LABEL } from "./lot-tile-CoixSPfX.js";
import { t as Checkbox } from "./checkbox-Cl8HuPnG.js";
import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { CheckCircle2, Circle, Info, MessageCircle, Search, Trash2 } from "lucide-react";
import { Toaster, toast } from "sonner";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
//#region src/components/ui/radio-group.tsx
var RadioGroup = React.forwardRef(({ className, ...props }, ref) => {
	return /* @__PURE__ */ jsx(RadioGroupPrimitive.Root, {
		className: cn("grid gap-2", className),
		...props,
		ref
	});
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;
var RadioGroupItem = React.forwardRef(({ className, ...props }, ref) => {
	return /* @__PURE__ */ jsx(RadioGroupPrimitive.Item, {
		ref,
		className: cn("aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50", className),
		...props,
		children: /* @__PURE__ */ jsx(RadioGroupPrimitive.Indicator, {
			className: "flex items-center justify-center",
			children: /* @__PURE__ */ jsx(Circle, { className: "h-3.5 w-3.5 fill-primary" })
		})
	});
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;
//#endregion
//#region src/components/lots/quick-sign-dialog.tsx
var MELHORIAS_OPCOES = [
	{
		key: "asfalto",
		label: "Asfalto"
	},
	{
		key: "esgoto",
		label: "Esgoto"
	},
	{
		key: "agua",
		label: "Água encanada"
	},
	{
		key: "correios",
		label: "Correios / entrega"
	},
	{
		key: "transporte_escolar",
		label: "Transporte escolar"
	},
	{
		key: "coleta_lixo",
		label: "Coleta de lixo"
	},
	{
		key: "molhar_ruas",
		label: "Molhar as ruas (poeira)"
	}
];
function calcularIdade(iso) {
	if (!iso) return null;
	const d = new Date(iso);
	if (isNaN(d.getTime())) return null;
	const hoje = /* @__PURE__ */ new Date();
	let idade = hoje.getFullYear() - d.getFullYear();
	const m = hoje.getMonth() - d.getMonth();
	if (m < 0 || m === 0 && hoje.getDate() < d.getDate()) idade--;
	return idade >= 0 && idade < 130 ? idade : null;
}
function QuickSignDialog({ lote, quadra, proprietarios, allProps = [], open, onOpenChange, onSaved }) {
	const { profile, user, isStaff } = useAuth();
	const [nome, setNome] = useState("");
	const [telefone, setTelefone] = useState("");
	const [dataNascimento, setDataNascimento] = useState("");
	const [chefeCasa, setChefeCasa] = useState(false);
	const [qtdMoradores, setQtdMoradores] = useState("");
	const [outrosMoradores, setOutrosMoradores] = useState([]);
	const [melhorias, setMelhorias] = useState({});
	const [tipoLote, setTipoLote] = useState("inteiro");
	const [loading, setLoading] = useState(false);
	const [confirmado, setConfirmado] = useState(null);
	useEffect(() => {
		if (open && profile) {
			setNome(profile.full_name || "");
			setTelefone(profile.phone || "");
			setDataNascimento(profile.data_nascimento || "");
			setConfirmado(null);
			setChefeCasa(false);
			setQtdMoradores("");
			setOutrosMoradores([]);
			setMelhorias({});
		}
		if (!open) setConfirmado(null);
	}, [open, profile]);
	const idade = calcularIdade(dataNascimento);
	const fracaoOcupada = proprietarios.reduce((s, p) => s + Number(p.fracao || 0), 0);
	const disponivelInteiro = fracaoOcupada === 0;
	const disponivelMeio = fracaoOcupada <= 50;
	useEffect(() => {
		if (open) if (!disponivelInteiro && disponivelMeio) setTipoLote("meio");
		else setTipoLote("inteiro");
	}, [
		open,
		disponivelInteiro,
		disponivelMeio
	]);
	user && proprietarios.some((p) => p.telefone === profile?.phone);
	const jaCadastradoGlobal = !!user && allProps.some((p) => p.telefone === profile?.phone);
	async function handleSign() {
		if (!nome.trim() || !telefone.trim()) {
			toast.error("Preencha nome e telefone");
			return;
		}
		if (jaCadastradoGlobal && !isStaff) {
			toast.error("Você já possui um cadastro registrado no sistema. Cada morador só pode preencher uma vez.");
			return;
		}
		const totalRespostas = Object.values(melhorias).filter((v) => v !== null).length;
		if (totalRespostas < MELHORIAS_OPCOES.length) {
			toast.error(`Por favor, responda a todas as opções da pesquisa (${totalRespostas}/${MELHORIAS_OPCOES.length}).`);
			return;
		}
		if (!disponivelInteiro && !disponivelMeio) {
			toast.error("Este lote já está totalmente ocupado.");
			return;
		}
		if (tipoLote === "inteiro" && !disponivelInteiro) {
			toast.error("Este lote já tem alguém cadastrado. Selecione 'Meio lote'.");
			return;
		}
		if ((qtdMoradores ? Number(qtdMoradores) : 1) > 1) {
			if (outrosMoradores.some((m) => !m.nome.trim() || !m.telefone.trim() || !m.data_nascimento.trim())) {
				toast.error("Preencha nome, telefone/WhatsApp e data de nascimento de todas as pessoas.");
				return;
			}
		}
		setLoading(true);
		try {
			const fracao = tipoLote === "inteiro" ? 100 : 50;
			const situacao = tipoLote === "meio" ? "Meio lote" : null;
			let ip_address = null;
			let geo_country = null;
			let geo_region = null;
			let geo_city = null;
			try {
				const res = await fetch("https://ipwho.is/");
				if (res.ok) {
					const j = await res.json();
					if (j?.success !== false) {
						ip_address = j.ip ?? null;
						geo_country = j.country ?? null;
						geo_region = j.region ?? null;
						geo_city = j.city ?? null;
					}
				}
			} catch {}
			const user_agent = typeof navigator !== "undefined" ? navigator.userAgent : null;
			const { error: insErr } = await supabase.from("proprietarios").insert({
				lote_id: lote.id,
				nome: nome.trim(),
				telefone: telefone.trim(),
				whatsapp: telefone.trim(),
				fracao,
				situacao,
				apoia_asfalto: true,
				assinatura_status: "confirmou",
				data_nascimento: dataNascimento || null,
				chefe_casa: chefeCasa,
				qtd_moradores: qtdMoradores ? Number(qtdMoradores) : null,
				melhorias,
				ip_address,
				user_agent,
				geo_country,
				geo_region,
				geo_city
			});
			if (insErr) throw insErr;
			await recomputeLoteStatus(lote.id);
			if (outrosMoradores.length > 0) {
				const rows = outrosMoradores.map((m) => ({
					lote_id: lote.id,
					nome: m.nome.trim(),
					telefone: m.telefone.trim(),
					data_nascimento: m.data_nascimento || null,
					created_by: user?.id ?? null
				}));
				const { error: morErr } = await supabase.from("moradores").insert(rows);
				if (morErr) throw morErr;
			}
			const todosMoradores = [{
				nome: nome.trim(),
				telefone: telefone.trim(),
				data_nascimento: dataNascimento
			}, ...outrosMoradores];
			const formatarData = (iso) => {
				if (!iso) return "—";
				const d = /* @__PURE__ */ new Date(iso + "T00:00:00");
				return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("pt-BR");
			};
			const linhasMoradores = todosMoradores.map((m, i) => `${i + 1}. ${m.nome} — ${m.telefone || "—"} — ${formatarData(m.data_nascimento)}`).join("\n");
			const linhasMelhorias = MELHORIAS_OPCOES.map((m) => {
				const v = melhorias[m.key];
				if (!v) return null;
				return `• ${m.label}: ${v === "sim" ? "Precisa" : "Não precisa"}`;
			}).filter(Boolean).join("\n");
			setConfirmado({ mensagem: `Olá ${ADMIN_NOME.split(" ")[0]}, sou ${nome.trim()} e estou apoiando o asfaltamento da ADECAF Rua Digna.\n\n📍 Quadra ${quadra.nome} · Lote ${lote.numero}` + (tipoLote === "meio" ? " (meio lote)" : " (lote inteiro)") + `\n📞 Meu contato: ${telefone.trim()}` + (idade !== null ? `\n🎂 Idade: ${idade} anos` : "") + (chefeCasa ? `\n👤 Sou chefe da casa` : "") + (qtdMoradores ? `\n🏠 Pessoas na casa: ${qtdMoradores}` : "") + `\n\n🏠 Moradores da residência:\n${linhasMoradores}` + (linhasMelhorias ? `\n\n📋 Melhorias necessárias na rua:\n${linhasMelhorias}` : "") + `\n\nLi e concordo com o termo de autorização da ADECAF.` });
			onSaved?.();
		} catch (e) {
			toast.error(e?.message ?? "Erro ao registrar apoio");
		} finally {
			setLoading(false);
		}
	}
	function abrirWhatsApp() {
		if (!confirmado) return;
		window.open(waLink(ADMIN_WHATSAPP, confirmado.mensagem), "_blank");
		toast.success("Apoio registrado! 💚 Lote agora está verde no mapa.");
		onOpenChange(false);
	}
	const jaApoiam = proprietarios.filter((p) => p.apoia_asfalto !== false);
	async function excluirProprietario(id) {
		if (!confirm("Tem certeza que deseja remover este morador do lote?")) return;
		setLoading(true);
		try {
			const { error } = await supabase.from("proprietarios").delete().eq("id", id);
			if (error) throw error;
			toast.success("Cadastro do lote removido!");
			await recomputeLoteStatus(lote.id);
			onSaved?.();
		} catch (e) {
			toast.error(e.message || "Erro ao excluir");
		} finally {
			setLoading(false);
		}
	}
	return /* @__PURE__ */ jsx(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ jsxs(DialogContent, {
			className: "max-w-md max-h-[90vh] overflow-y-auto",
			children: [/* @__PURE__ */ jsxs(DialogHeader, { children: [/* @__PURE__ */ jsxs(DialogTitle, { children: [
				"Quadra ",
				quadra.nome,
				" · Lote ",
				lote.numero
			] }), /* @__PURE__ */ jsx(DialogDescription, { children: "Cadastre seu apoio ao asfaltamento da Rua. Em poucos segundos seu lote fica verde no mapa." })] }), confirmado ? /* @__PURE__ */ jsxs("div", {
				className: "space-y-3",
				children: [
					/* @__PURE__ */ jsxs(Alert, {
						className: "border-[var(--status-confirmado)]/40 bg-[var(--status-confirmado)]/5",
						children: [/* @__PURE__ */ jsx(CheckCircle2, { className: "h-4 w-4 text-[var(--status-confirmado)]" }), /* @__PURE__ */ jsxs(AlertDescription, {
							className: "text-sm",
							children: [
								/* @__PURE__ */ jsx("strong", { children: "Apoio registrado!" }),
								" Agora envie a mensagem de confirmação para ",
								ADMIN_NOME,
								" pelo WhatsApp:"
							]
						})]
					}),
					/* @__PURE__ */ jsx("div", {
						className: "rounded-md border bg-muted/40 p-3 text-xs whitespace-pre-line",
						children: confirmado.mensagem
					}),
					/* @__PURE__ */ jsx(DialogFooter, {
						className: "flex-col sm:flex-col gap-2",
						children: /* @__PURE__ */ jsxs(Button, {
							onClick: abrirWhatsApp,
							className: "w-full bg-[#25D366] hover:bg-[#20bd5a] text-white",
							children: [/* @__PURE__ */ jsx(MessageCircle, { className: "h-4 w-4 mr-2" }), "Enviar confirmação no WhatsApp"]
						})
					})
				]
			}) : /* @__PURE__ */ jsxs(Fragment, { children: [
				jaApoiam.length > 0 && /* @__PURE__ */ jsxs("div", {
					className: "rounded-md border bg-muted/40 p-3 text-sm",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "font-medium mb-1 flex items-center gap-1",
						children: [/* @__PURE__ */ jsx(CheckCircle2, { className: "h-4 w-4 text-[var(--status-confirmado)]" }), "Já apoiam este lote:"]
					}), /* @__PURE__ */ jsx("ul", {
						className: "text-muted-foreground space-y-2 mt-3",
						children: jaApoiam.map((p) => /* @__PURE__ */ jsxs("li", {
							className: "flex flex-col border-b border-border/50 pb-2 last:border-0 last:pb-0",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ jsxs("span", {
									className: "font-medium text-foreground",
									children: [
										"• ",
										p.nome,
										p.fracao && p.fracao !== 100 ? ` (${p.fracao}%)` : ""
									]
								}), isStaff && /* @__PURE__ */ jsx(Button, {
									variant: "ghost",
									size: "icon",
									className: "h-6 w-6 text-destructive hover:bg-destructive/10",
									onClick: () => excluirProprietario(p.id),
									children: /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5" })
								})]
							}), isStaff && p.melhorias && Object.keys(p.melhorias).length > 0 && /* @__PURE__ */ jsx("div", {
								className: "pl-3 mt-1.5 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-muted-foreground/80",
								children: MELHORIAS_OPCOES.map((m) => {
									const val = p.melhorias[m.key];
									if (!val) return null;
									return /* @__PURE__ */ jsxs("div", {
										className: "flex items-center gap-1",
										children: [/* @__PURE__ */ jsxs("span", { children: [m.label, ":"] }), /* @__PURE__ */ jsx("strong", {
											className: val === "sim" ? "text-green-600" : "text-red-500/80",
											children: val === "sim" ? "Precisa" : "Não"
										})]
									}, m.key);
								})
							})]
						}, p.id))
					})]
				}),
				jaCadastradoGlobal && !isStaff && /* @__PURE__ */ jsx(Alert, {
					variant: "destructive",
					children: /* @__PURE__ */ jsx(AlertDescription, {
						className: "text-xs",
						children: "Você já possui um cadastro no sistema. Cada morador só pode preencher 1 vez em apenas um lote."
					})
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "space-y-3",
					children: [
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, {
							className: "text-xs",
							children: "Seu nome completo"
						}), /* @__PURE__ */ jsx(Input, {
							value: nome,
							onChange: (e) => setNome(e.target.value),
							placeholder: "Ex.: Maria Silva"
						})] }),
						/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, {
							className: "text-xs",
							children: "Telefone / WhatsApp"
						}), /* @__PURE__ */ jsx(Input, {
							value: telefone,
							onChange: (e) => setTelefone(e.target.value),
							placeholder: "(62) 9 9999-9999",
							inputMode: "tel"
						})] }),
						/* @__PURE__ */ jsxs("div", {
							className: "grid grid-cols-[1fr_auto] gap-2 items-end",
							children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, {
								className: "text-xs",
								children: "Data de nascimento"
							}), /* @__PURE__ */ jsx(Input, {
								type: "date",
								value: dataNascimento,
								onChange: (e) => setDataNascimento(e.target.value),
								max: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)
							})] }), /* @__PURE__ */ jsx("div", {
								className: "text-xs text-muted-foreground pb-2 whitespace-nowrap",
								children: idade !== null ? /* @__PURE__ */ jsxs("span", { children: [/* @__PURE__ */ jsx("strong", { children: idade }), " anos"] }) : "—"
							})]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "grid grid-cols-2 gap-3",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "flex items-center gap-2 rounded-md border p-2",
								children: [/* @__PURE__ */ jsx(Checkbox, {
									id: "chefe-casa",
									checked: chefeCasa,
									onCheckedChange: (v) => setChefeCasa(!!v)
								}), /* @__PURE__ */ jsxs("label", {
									htmlFor: "chefe-casa",
									className: "text-xs cursor-pointer leading-tight",
									children: ["Sou o ", /* @__PURE__ */ jsx("strong", { children: "chefe da casa" })]
								})]
							}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, {
								className: "text-xs",
								children: "Pessoas na casa"
							}), /* @__PURE__ */ jsx(Input, {
								type: "number",
								min: 1,
								max: 30,
								value: qtdMoradores,
								onChange: (e) => {
									const val = e.target.value;
									setQtdMoradores(val);
									const count = Math.max(0, Math.min(30, Number(val) || 0));
									const others = Math.max(0, count - 1);
									setOutrosMoradores((prev) => {
										const next = prev.slice(0, others);
										while (next.length < others) next.push({
											nome: "",
											telefone: "",
											data_nascimento: ""
										});
										return next;
									});
								},
								placeholder: "Ex.: 4"
							})] })]
						}),
						outrosMoradores.length > 0 && /* @__PURE__ */ jsxs("div", {
							className: "space-y-3 rounded-md border p-3",
							children: [
								/* @__PURE__ */ jsx(Label, {
									className: "text-xs font-semibold",
									children: "Dados das outras pessoas que moram na casa"
								}),
								/* @__PURE__ */ jsx("p", {
									className: "text-[11px] text-muted-foreground -mt-1",
									children: "Nome, telefone/WhatsApp e data de nascimento são obrigatórios."
								}),
								outrosMoradores.map((m, i) => /* @__PURE__ */ jsxs("div", {
									className: "border rounded-lg p-3 bg-muted/20 space-y-3",
									children: [
										/* @__PURE__ */ jsxs("div", {
											className: "text-sm font-medium",
											children: ["Pessoa ", i + 2]
										}),
										/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, {
											className: "text-xs",
											children: "Nome completo *"
										}), /* @__PURE__ */ jsx(Input, {
											value: m.nome,
											onChange: (e) => setOutrosMoradores((arr) => arr.map((item, idx) => idx === i ? {
												...item,
												nome: e.target.value
											} : item)),
											placeholder: "Nome completo"
										})] }),
										/* @__PURE__ */ jsxs("div", {
											className: "grid grid-cols-1 sm:grid-cols-2 gap-3",
											children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, {
												className: "text-xs",
												children: "Telefone / WhatsApp *"
											}), /* @__PURE__ */ jsx(Input, {
												value: m.telefone,
												onChange: (e) => setOutrosMoradores((arr) => arr.map((item, idx) => idx === i ? {
													...item,
													telefone: e.target.value
												} : item)),
												placeholder: "(62) 9 9999-9999",
												inputMode: "tel"
											})] }), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, {
												className: "text-xs",
												children: "Data de nascimento *"
											}), /* @__PURE__ */ jsx(Input, {
												type: "date",
												value: m.data_nascimento,
												onChange: (e) => setOutrosMoradores((arr) => arr.map((item, idx) => idx === i ? {
													...item,
													data_nascimento: e.target.value
												} : item)),
												max: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)
											})] })]
										})
									]
								}, i))
							]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "space-y-2 rounded-md border p-3",
							children: [
								/* @__PURE__ */ jsx(Label, {
									className: "text-xs font-semibold",
									children: "Pesquisa: o que está faltando na nossa rua?"
								}),
								/* @__PURE__ */ jsx("p", {
									className: "text-[11px] text-muted-foreground -mt-1",
									children: "Para cada item, marque se precisa ou não."
								}),
								/* @__PURE__ */ jsx("div", {
									className: "space-y-1.5",
									children: MELHORIAS_OPCOES.map((m) => /* @__PURE__ */ jsxs("div", {
										className: "flex items-center justify-between gap-2 text-xs",
										children: [/* @__PURE__ */ jsx("span", {
											className: "flex-1",
											children: m.label
										}), /* @__PURE__ */ jsxs(RadioGroup, {
											value: melhorias[m.key] ?? "",
											onValueChange: (v) => setMelhorias((prev) => ({
												...prev,
												[m.key]: v
											})),
											className: "flex gap-3",
											children: [/* @__PURE__ */ jsxs("div", {
												className: "flex items-center gap-1",
												children: [/* @__PURE__ */ jsx(RadioGroupItem, {
													value: "sim",
													id: `${m.key}-sim`
												}), /* @__PURE__ */ jsx("label", {
													htmlFor: `${m.key}-sim`,
													className: "cursor-pointer",
													children: "Precisa"
												})]
											}), /* @__PURE__ */ jsxs("div", {
												className: "flex items-center gap-1",
												children: [/* @__PURE__ */ jsx(RadioGroupItem, {
													value: "nao",
													id: `${m.key}-nao`
												}), /* @__PURE__ */ jsx("label", {
													htmlFor: `${m.key}-nao`,
													className: "cursor-pointer",
													children: "Não"
												})]
											})]
										})]
									}, m.key))
								})
							]
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "space-y-2 rounded-md border p-3",
							children: [/* @__PURE__ */ jsx(Label, {
								className: "text-xs font-semibold",
								children: "Tipo de cadastro"
							}), /* @__PURE__ */ jsxs(RadioGroup, {
								value: tipoLote,
								onValueChange: (v) => setTipoLote(v),
								children: [/* @__PURE__ */ jsxs("div", {
									className: "flex items-start gap-2",
									children: [/* @__PURE__ */ jsx(RadioGroupItem, {
										value: "inteiro",
										id: "tp-int",
										disabled: !disponivelInteiro,
										className: "mt-0.5"
									}), /* @__PURE__ */ jsxs("label", {
										htmlFor: "tp-int",
										className: `text-xs cursor-pointer ${!disponivelInteiro ? "opacity-50" : ""}`,
										children: [
											/* @__PURE__ */ jsx("strong", { children: "Lote inteiro" }),
											" – sou o único dono / morador deste lote.",
											!disponivelInteiro && /* @__PURE__ */ jsx("span", {
												className: "block text-destructive",
												children: "Indisponível: lote já tem cadastro."
											})
										]
									})]
								}), /* @__PURE__ */ jsxs("div", {
									className: "flex items-start gap-2",
									children: [/* @__PURE__ */ jsx(RadioGroupItem, {
										value: "meio",
										id: "tp-meio",
										disabled: !disponivelMeio,
										className: "mt-0.5"
									}), /* @__PURE__ */ jsxs("label", {
										htmlFor: "tp-meio",
										className: `text-xs cursor-pointer ${!disponivelMeio ? "opacity-50" : ""}`,
										children: [/* @__PURE__ */ jsx("strong", { children: "Meio lote" }), " – este lote foi dividido entre 2 famílias (cada uma cadastra a sua metade)."]
									})]
								})]
							})]
						})
					]
				}),
				/* @__PURE__ */ jsxs(Alert, { children: [/* @__PURE__ */ jsx(Info, { className: "h-4 w-4" }), /* @__PURE__ */ jsxs(AlertDescription, {
					className: "text-xs",
					children: [
						"Ao confirmar, vai abrir o ",
						/* @__PURE__ */ jsx("strong", { children: "WhatsApp" }),
						" para você enviar a mensagem de apoio para ",
						ADMIN_NOME,
						". Seu lote fica verde no mapa."
					]
				})] }),
				/* @__PURE__ */ jsxs(DialogFooter, { children: [/* @__PURE__ */ jsx(Button, {
					variant: "outline",
					onClick: () => onOpenChange(false),
					disabled: loading,
					children: "Cancelar"
				}), /* @__PURE__ */ jsx(Button, {
					onClick: handleSign,
					disabled: loading || jaCadastradoGlobal && !isStaff,
					children: loading ? "Enviando…" : "Confirmar apoio 💚"
				})] })
			] })]
		})
	});
}
//#endregion
//#region src/routes/_authenticated/mapa.tsx?tsr-split=component
var LOTEAMENTO_LOCK_KEY = "adecaf_loteamento_lock";
function MapaPage() {
	const { loteamento: loteamentoParam } = Route.useSearch();
	const { isStaff, profile, loading: authLoading } = useAuth();
	const profileLock = profile?.loteamento_id ?? null;
	const lockedId = !isStaff ? profileLock || loteamentoParam || localStorage.getItem(LOTEAMENTO_LOCK_KEY) || null : null;
	const isLocked = !!lockedId;
	useEffect(() => {
		if (loteamentoParam && !isStaff && !profileLock) localStorage.setItem(LOTEAMENTO_LOCK_KEY, loteamentoParam);
		if (profileLock) localStorage.removeItem(LOTEAMENTO_LOCK_KEY);
	}, [
		loteamentoParam,
		isStaff,
		profileLock
	]);
	const [loteamentos, setLoteamentos] = useState([]);
	const [loteamentoId, setLoteamentoId] = useState("");
	const [quadras, setQuadras] = useState([]);
	const [lotes, setLotes] = useState([]);
	const [props, setProps] = useState([]);
	const [selected, setSelected] = useState(null);
	const [q, setQ] = useState("");
	useEffect(() => {
		if (authLoading) return;
		fetchLoteamentos().then((data) => {
			setLoteamentos(data);
			setLoteamentoId(lockedId || (data.length > 0 ? data[0].id : ""));
		});
	}, [
		authLoading,
		isStaff,
		profileLock
	]);
	async function load(currentId) {
		if (!currentId) return;
		const [qs, ls, ps] = await Promise.all([
			fetchQuadras(currentId),
			fetchLotes(),
			fetchProprietarios()
		]);
		const qIds = new Set(qs.map((q) => q.id));
		const lotesFiltered = ls.filter((l) => qIds.has(l.quadra_id));
		const lotesIds = new Set(lotesFiltered.map((l) => l.id));
		const propsFiltered = ps.filter((p) => lotesIds.has(p.lote_id));
		setQuadras(qs);
		setLotes(lotesFiltered);
		setProps(propsFiltered);
	}
	useEffect(() => {
		if (!loteamentoId) return;
		load(loteamentoId);
		const ch = supabase.channel("mapa").on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "lotes"
		}, () => load(loteamentoId)).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "proprietarios"
		}, () => load(loteamentoId)).on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "quadras"
		}, () => load(loteamentoId)).subscribe();
		return () => {
			supabase.removeChannel(ch);
		};
	}, [loteamentoId]);
	const propsByLote = useMemo(() => {
		const m = /* @__PURE__ */ new Map();
		for (const p of props) {
			const arr = m.get(p.lote_id) ?? [];
			arr.push(p);
			m.set(p.lote_id, arr);
		}
		return m;
	}, [props]);
	const search = q.trim().toLowerCase();
	const isHighlighted = (l, qd) => {
		if (!search) return false;
		if (l.numero.toLowerCase().includes(search)) return true;
		if (qd.nome.toLowerCase().includes(search)) return true;
		return (propsByLote.get(l.id) ?? []).some((p) => p.nome.toLowerCase().includes(search) || (p.telefone ?? "").includes(search) || (p.whatsapp ?? "").includes(search));
	};
	const totals = useMemo(() => {
		const counts = {
			sem_cadastro: 0,
			cadastrado: 0,
			incompleto: 0,
			confirmado: 0,
			pendencia: 0
		};
		for (const l of lotes) {
			const st = deriveStatus(propsByLote.get(l.id) ?? []);
			l.status = st;
			counts[st]++;
		}
		return counts;
	}, [lotes, propsByLote]);
	const lotesByQuadra = useMemo(() => {
		const m = /* @__PURE__ */ new Map();
		for (const l of lotes) {
			const arr = m.get(l.quadra_id) ?? [];
			arr.push(l);
			m.set(l.quadra_id, arr);
		}
		for (const arr of m.values()) arr.sort((a, b) => Number(a.numero) - Number(b.numero));
		return m;
	}, [lotes]);
	const STREETS = {
		"1": {
			n: "RUA 1",
			s: "RUA 10",
			w: "RUA Tocantins",
			e: "RUA Paraíba"
		},
		"2": {
			n: "RUA 1",
			s: "RUA 10",
			w: "RUA Paraíba",
			e: "RUA 2"
		},
		"3": {
			n: "RUA 1",
			s: "RUA 10",
			w: "RUA 2",
			e: "RUA 3"
		},
		"4": {
			n: "Av. Araguaia",
			s: "RUA 11",
			w: "RUA 4",
			e: "RUA 5"
		},
		"5": {
			n: "Av. Araguaia",
			s: "RUA 11",
			w: "RUA 5",
			e: "RUA 6"
		},
		"6": {
			n: "Av. Araguaia",
			s: "RUA 11",
			w: "RUA 6",
			e: "RUA 7"
		},
		"7": {
			n: "Av. Araguaia",
			s: "RUA 11",
			w: "RUA 7",
			e: "RUA 8"
		},
		"8": {
			n: "Av. Araguaia",
			s: "RUA 11",
			w: "RUA 8",
			e: "(extremo leste)"
		}
	};
	const ordemSetor1 = [
		"1",
		"2",
		"3"
	];
	const ordemSetor2 = [
		"4",
		"5",
		"6",
		"7",
		"8"
	];
	const findQ = (nome) => quadras.find((q) => q.nome === nome);
	const isMariaRita = loteamentoId === "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
	const selectedLoteamento = loteamentos.find((l) => l.id === loteamentoId);
	return /* @__PURE__ */ jsxs(AppShell, { children: [
		/* @__PURE__ */ jsx(Toaster, {
			position: "top-right",
			richColors: true
		}),
		/* @__PURE__ */ jsxs("div", {
			className: "mx-auto max-w-7xl px-4 py-6 space-y-6",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "flex flex-col md:flex-row md:items-center justify-between gap-4",
					children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-3 mb-2",
						children: [/* @__PURE__ */ jsx("h1", {
							className: "text-2xl font-bold tracking-tight",
							children: "Planta do Loteamento"
						}), isLocked ? /* @__PURE__ */ jsx("span", {
							className: "inline-flex items-center rounded-full bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 border border-blue-200",
							children: selectedLoteamento?.nome ?? ""
						}) : /* @__PURE__ */ jsxs(Select, {
							value: loteamentoId,
							onValueChange: setLoteamentoId,
							children: [/* @__PURE__ */ jsx(SelectTrigger, {
								className: "w-[280px] h-8",
								children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "Selecione um loteamento" })
							}), /* @__PURE__ */ jsx(SelectContent, { children: loteamentos.map((l) => /* @__PURE__ */ jsx(SelectItem, {
								value: l.id,
								children: l.nome
							}, l.id)) })]
						})]
					}), /* @__PURE__ */ jsx("p", {
						className: "text-sm text-muted-foreground",
						children: "Encontre seu lote no mapa e clique para apoiar o asfaltamento da Rua. Os lotes verdes já apoiam."
					})] }), /* @__PURE__ */ jsx("div", {
						className: "flex items-center gap-2",
						children: /* @__PURE__ */ jsxs("div", {
							className: "relative",
							children: [/* @__PURE__ */ jsx(Search, { className: "absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }), /* @__PURE__ */ jsx(Input, {
								className: "pl-8 w-64",
								placeholder: "Achar nome, telefone ou lote…",
								value: q,
								onChange: (e) => setQ(e.target.value)
							})]
						})
					})]
				}),
				/* @__PURE__ */ jsx(Card, {
					className: "p-4",
					children: /* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap gap-4 text-sm",
						children: [
							/* @__PURE__ */ jsx(Legend, {
								status: "sem_cadastro",
								count: totals.sem_cadastro
							}),
							/* @__PURE__ */ jsx(Legend, {
								status: "cadastrado",
								count: totals.cadastrado
							}),
							/* @__PURE__ */ jsx(Legend, {
								status: "confirmado",
								count: totals.confirmado
							})
						]
					})
				}),
				/* @__PURE__ */ jsx(Card, {
					className: "p-5 bg-gradient-to-r from-primary/10 via-accent/30 to-primary/10 border-primary/30",
					children: /* @__PURE__ */ jsxs("div", {
						className: "flex flex-col md:flex-row md:items-center justify-between gap-3",
						children: [/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h3", {
							className: "font-semibold text-base",
							children: "Sua rua merece asfalto. Sua assinatura faz a diferença!"
						}), /* @__PURE__ */ jsx("p", {
							className: "text-sm text-muted-foreground mt-1",
							children: "Encontre seu lote no mapa, clique nele e cadastre-se. Quanto mais vizinhos participarem, mais força nosso abaixo-assinado terá junto à Prefeitura."
						})] }), /* @__PURE__ */ jsxs("div", {
							className: "text-sm text-muted-foreground md:text-right",
							children: [/* @__PURE__ */ jsxs("div", { children: [
								/* @__PURE__ */ jsx("strong", {
									className: "text-foreground",
									children: totals.confirmado + totals.cadastrado
								}),
								" de ",
								lotes.length,
								" lotes já apoiam"
							] }), /* @__PURE__ */ jsxs("div", {
								className: "text-xs",
								children: [
									"Faltam ",
									lotes.length - (totals.confirmado + totals.cadastrado),
									" para o 100%"
								]
							})]
						})]
					})
				}),
				quadras.length === 0 && loteamentoId ? /* @__PURE__ */ jsx(Card, {
					className: "p-8 text-center text-muted-foreground",
					children: lotes.length === 0 ? "Nenhuma quadra cadastrada neste loteamento." : "Carregando o mapa…"
				}) : null,
				quadras.length > 0 && isMariaRita ? /* @__PURE__ */ jsxs("div", {
					className: "space-y-6",
					children: [
						/* @__PURE__ */ jsx(SectorHeader, {
							title: "Setor Sul · Junto à Área Verde",
							subtitle: "Quadras 1 a 3"
						}),
						/* @__PURE__ */ jsx("div", {
							className: "space-y-5",
							children: ordemSetor1.map((nome) => {
								const qd = findQ(nome);
								if (!qd) return null;
								return /* @__PURE__ */ jsx(QuadraCard, {
									quadra: qd,
									streets: STREETS[nome],
									lotes: lotesByQuadra.get(qd.id) ?? [],
									isHighlighted: (l) => isHighlighted(l, qd),
									onLoteClick: setSelected,
									propsByLote
								}, qd.id);
							})
						}),
						/* @__PURE__ */ jsx("div", {
							className: "rounded-md border-2 border-dashed border-[oklch(0.55_0.15_140)] bg-[oklch(0.9_0.08_140)] py-4 text-center text-xs font-bold tracking-widest text-[oklch(0.3_0.1_140)]",
							children: "▬▬▬ ÁREA PÚBLICA MUNICIPAL ▬▬▬"
						}),
						/* @__PURE__ */ jsx(SectorHeader, {
							title: "Setor Norte · Av. Araguaia",
							subtitle: "Quadras 4 a 8"
						}),
						/* @__PURE__ */ jsx("div", {
							className: "space-y-5",
							children: ordemSetor2.map((nome) => {
								const qd = findQ(nome);
								if (!qd) return null;
								return /* @__PURE__ */ jsx(QuadraCard, {
									quadra: qd,
									streets: STREETS[nome],
									lotes: lotesByQuadra.get(qd.id) ?? [],
									isHighlighted: (l) => isHighlighted(l, qd),
									onLoteClick: setSelected,
									propsByLote
								}, qd.id);
							})
						})
					]
				}) : null,
				quadras.length > 0 && !isMariaRita ? /* @__PURE__ */ jsxs("div", {
					className: "space-y-6",
					children: [/* @__PURE__ */ jsx(SectorHeader, {
						title: "Todas as Quadras",
						subtitle: selectedLoteamento?.nome || ""
					}), /* @__PURE__ */ jsx("div", {
						className: "space-y-5",
						children: quadras.map((qd) => /* @__PURE__ */ jsx(QuadraCard, {
							quadra: qd,
							streets: {
								n: "Rua",
								s: "Rua",
								w: "Rua",
								e: "Rua"
							},
							lotes: lotesByQuadra.get(qd.id) ?? [],
							isHighlighted: (l) => isHighlighted(l, qd),
							onLoteClick: setSelected,
							propsByLote
						}, qd.id))
					})]
				}) : null
			]
		}),
		selected && /* @__PURE__ */ jsx(QuickSignDialog, {
			lote: selected,
			quadra: quadras.find((q) => q.id === selected.quadra_id),
			proprietarios: propsByLote.get(selected.id) ?? [],
			allProps: props,
			open: !!selected,
			onOpenChange: (v) => !v && setSelected(null),
			onSaved: () => load(loteamentoId)
		})
	] });
}
function SectorHeader({ title, subtitle }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "flex items-baseline justify-between border-b-2 border-primary/30 pb-2",
		children: [/* @__PURE__ */ jsx("h2", {
			className: "text-lg font-bold text-foreground",
			children: title
		}), /* @__PURE__ */ jsx("span", {
			className: "text-xs text-muted-foreground",
			children: subtitle
		})]
	});
}
function QuadraCard({ quadra, lotes, streets, isHighlighted, onLoteClick, propsByLote }) {
	const half = Math.ceil(lotes.length / 2);
	const topRow = lotes.slice(0, half);
	const bottomRow = lotes.slice(half);
	return /* @__PURE__ */ jsxs(Card, {
		className: "p-3 sm:p-4 overflow-x-auto",
		children: [/* @__PURE__ */ jsx("div", {
			className: "flex items-center justify-between mb-2 px-1",
			children: /* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ jsx("div", {
					className: "text-sm font-bold rounded-full bg-primary text-primary-foreground w-9 h-9 flex items-center justify-center shadow",
					children: quadra.nome.padStart(2, "0")
				}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsxs("div", {
					className: "text-sm font-bold leading-tight",
					children: ["Quadra ", quadra.nome]
				}), /* @__PURE__ */ jsxs("div", {
					className: "text-[11px] text-muted-foreground leading-tight",
					children: [lotes.length, " lotes"]
				})] })]
			})
		}), /* @__PURE__ */ jsxs("div", {
			className: "min-w-max",
			children: [
				/* @__PURE__ */ jsx(StreetLabel, {
					label: streets.n,
					direction: "h"
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "grid grid-cols-[auto_1fr_auto] items-stretch gap-0 my-1",
					children: [
						/* @__PURE__ */ jsx(StreetLabel, {
							label: streets.w,
							direction: "v"
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "flex flex-col gap-0.5 px-1 py-1 bg-[oklch(0.93_0.05_140)] border-y-2 border-[oklch(0.55_0.12_140)]",
							children: [/* @__PURE__ */ jsx(Row, {
								lotes: topRow,
								isHighlighted,
								onClick: onLoteClick,
								propsByLote
							}), /* @__PURE__ */ jsx(Row, {
								lotes: bottomRow,
								isHighlighted,
								onClick: onLoteClick,
								propsByLote
							})]
						}),
						/* @__PURE__ */ jsx(StreetLabel, {
							label: streets.e,
							direction: "v"
						})
					]
				}),
				/* @__PURE__ */ jsx(StreetLabel, {
					label: streets.s,
					direction: "h"
				})
			]
		})]
	});
}
function StreetLabel({ label, direction }) {
	if (direction === "h") return /* @__PURE__ */ jsxs("div", {
		className: "text-[10px] font-bold tracking-widest text-muted-foreground bg-white border border-dashed border-muted-foreground/40 py-1 px-2 text-center rounded-sm",
		children: [
			"▬ ",
			label,
			" ▬"
		]
	});
	return /* @__PURE__ */ jsx("div", {
		className: "flex items-center justify-center bg-white border border-dashed border-muted-foreground/40 px-1 mx-0 rounded-sm",
		style: {
			writingMode: "vertical-rl",
			textOrientation: "mixed"
		},
		children: /* @__PURE__ */ jsx("span", {
			className: "text-[10px] font-bold tracking-widest text-muted-foreground whitespace-nowrap py-1",
			children: label
		})
	});
}
function Row({ lotes, isHighlighted, onClick, propsByLote }) {
	return /* @__PURE__ */ jsx("div", {
		className: "flex gap-0.5",
		children: lotes.map((l) => {
			const fracaoTotal = (propsByLote.get(l.id) || []).reduce((acc, p) => acc + Number(p.fracao || 0), 0);
			let bg = `var(--status-${l.status === "sem_cadastro" ? "sem" : l.status})`;
			if (fracaoTotal > 0 && fracaoTotal < 100) bg = `linear-gradient(90deg, var(--status-${l.status === "sem_cadastro" ? "sem" : l.status}) ${fracaoTotal}%, var(--status-sem) ${fracaoTotal}%)`;
			return /* @__PURE__ */ jsx("button", {
				onClick: () => onClick(l),
				title: `Lote ${l.numero}`,
				style: { background: bg },
				className: cn("w-6 h-9 sm:w-7 sm:h-11 text-[9px] sm:text-[10px] font-semibold rounded-sm border border-black/10 flex items-center justify-center transition-all hover:scale-110 hover:z-10 hover:shadow-md hover:ring-2 hover:ring-primary", isHighlighted(l) && "ring-2 ring-primary ring-offset-1 scale-110 z-10", l.status === "confirmado" || l.status === "cadastrado" ? "text-white" : "text-foreground/80"),
				children: l.numero.padStart(2, "0")
			}, l.id);
		})
	});
}
function Legend({ status, count }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "flex items-center gap-2",
		children: [
			/* @__PURE__ */ jsx("div", {
				className: "w-4 h-4 rounded border",
				style: { background: `var(--status-${status === "sem_cadastro" ? "sem" : status})` }
			}),
			/* @__PURE__ */ jsx("span", {
				className: "text-muted-foreground",
				children: STATUS_LABEL[status]
			}),
			/* @__PURE__ */ jsx("span", {
				className: "font-semibold",
				children: count
			})
		]
	});
}
//#endregion
export { MapaPage as component };
