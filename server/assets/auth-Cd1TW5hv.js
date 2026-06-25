import { t as Route } from "./auth-nhhV_ZNS.js";
import { t as supabase } from "./client-BJ1L6GXa.js";
import { a as ADMIN_NOME, c as waLink, i as ADMIN_EMAIL, o as ADMIN_PHONE, r as signUpWithPhonePassword, s as ADMIN_WHATSAPP, t as signInWithPhonePassword } from "./auth-helpers-H7OrqMdv.js";
import { a as CardTitle, i as CardHeader, n as CardContent, o as AdecafLogo, r as CardDescription, s as Button, t as Card } from "./card-yjQJoboh.js";
import { i as Input, n as AlertDescription, r as Label, t as Alert } from "./alert-C5uUgb5P.js";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, r as DialogDescription, t as Dialog } from "./dialog-BfIUOAVt.js";
import { t as Checkbox } from "./checkbox-Cl8HuPnG.js";
import { t as traduzirErro } from "./translate-error-BbjTUCt4.js";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/lib/termo.ts
var TERMO_TITULO = "TERMO DE AUTORIZAÇÃO ELETRÔNICA";
var TERMO_TEXTO = `Ao selecionar a opção "Li e Concordo" e concluir meu cadastro no aplicativo ADECAF Rua Digna, declaro que sou morador(a), proprietário(a) ou possuidor(a) de imóvel na comunidade atendida pela mobilização.

Autorizo a ADECAF – Associação de Desenvolvimento e Cultura Assistência Familiar a coletar, armazenar e utilizar os dados por mim fornecidos exclusivamente para fins de organização comunitária e representação dos interesses dos moradores junto aos órgãos públicos competentes, especialmente em ações relacionadas à solicitação de pavimentação asfáltica, infraestrutura urbana e demais melhorias para a comunidade.

Declaro que as informações fornecidas são verdadeiras e de minha responsabilidade.

Estou ciente de que:

• Meu cadastro tem finalidade exclusivamente comunitária e organizacional;
• A ADECAF poderá utilizar os dados para elaboração de relatórios, estatísticas, listas de apoiadores e documentos destinados aos órgãos públicos;
• A ADECAF poderá entrar em contato comigo para assuntos relacionados à mobilização;
• Este aceite eletrônico não substitui eventual assinatura presencial em abaixo-assinado ou outros documentos que venham a ser exigidos pelos órgãos competentes;
• Posso solicitar a atualização ou correção dos meus dados a qualquer momento.

Ao clicar em "Li e Concordo", considero este termo aceito de forma livre, informada e voluntária.

Data e hora do aceite: Registradas automaticamente pelo sistema.`;
var TERMO_CHECKBOX = "Li e concordo com o Termo de Autorização da ADECAF para utilização dos meus dados na mobilização comunitária por melhorias e asfaltamento das vias.";
//#endregion
//#region src/routes/auth.tsx?tsr-split=component
function AuthPage() {
	const navigate = useNavigate();
	const { loteamento: loteamentoParam } = Route.useSearch();
	const [phone, setPhone] = useState("");
	const [name, setName] = useState("");
	const [password, setPassword] = useState("");
	const [dataNascimento, setDataNascimento] = useState("");
	const [aceiteTermo, setAceiteTermo] = useState(false);
	const [showTermo, setShowTermo] = useState(false);
	const [loading, setLoading] = useState(false);
	const [msg, setMsg] = useState(null);
	const [err, setErr] = useState(null);
	const [mode, setMode] = useState("signup");
	const [adminLogin, setAdminLogin] = useState(false);
	async function handleSignIn() {
		setErr(null);
		setMsg(null);
		setLoading(true);
		try {
			if (!phone.trim() || !password.trim()) throw new Error("Informe telefone e senha.");
			const { user } = await signInWithPhonePassword(phone, password);
			let dest = "/mapa";
			if (user) {
				const [{ data: isAdmin }, { data: isCoord }] = await Promise.all([supabase.rpc("has_role", {
					_user_id: user.id,
					_role: "admin"
				}), supabase.rpc("has_role", {
					_user_id: user.id,
					_role: "coordenador"
				})]);
				if (isAdmin || isCoord) dest = "/admin";
			}
			if (adminLogin && dest !== "/admin") {
				await supabase.auth.signOut();
				throw new Error("Esse cadastro não tem acesso de administrador.");
			}
			if (loteamentoParam && dest === "/mapa") navigate({
				to: "/mapa",
				search: { loteamento: loteamentoParam }
			});
			else navigate({ to: dest });
		} catch (e) {
			setErr(traduzirErro(e));
		} finally {
			setLoading(false);
		}
	}
	async function handleAdminPasswordEmail() {
		setErr(null);
		setMsg(null);
		setLoading(true);
		try {
			const { error } = await supabase.auth.resetPasswordForEmail(ADMIN_EMAIL, { redirectTo: `${window.location.origin}/reset-password` });
			if (error) throw error;
			setMsg(`Enviamos um link de troca de senha para ${ADMIN_EMAIL}.`);
		} catch (e) {
			setErr(traduzirErro(e));
		} finally {
			setLoading(false);
		}
	}
	async function handleSignUp() {
		setErr(null);
		setMsg(null);
		if (!phone.trim() || !name.trim() || !password.trim()) {
			setErr("Preencha nome, telefone e senha.");
			return;
		}
		if (!dataNascimento) {
			setErr("Informe sua data de nascimento.");
			return;
		}
		if (password.length < 6) {
			setErr("A senha precisa ter ao menos 6 caracteres.");
			return;
		}
		if (!aceiteTermo) {
			setErr("Você precisa ler e aceitar o Termo de Autorização para continuar.");
			return;
		}
		setLoading(true);
		try {
			const loteamentoId = loteamentoParam || localStorage.getItem("adecaf_loteamento_lock") || void 0;
			await signUpWithPhonePassword(phone, name, password, TERMO_TEXTO, dataNascimento, loteamentoId);
			if (loteamentoId) localStorage.removeItem("adecaf_loteamento_lock");
			if (loteamentoParam) navigate({
				to: "/mapa",
				search: { loteamento: loteamentoParam }
			});
			else navigate({ to: "/mapa" });
		} catch (e) {
			setErr(traduzirErro(e));
		} finally {
			setLoading(false);
		}
	}
	const recoveryHref = waLink(ADMIN_WHATSAPP, `Olá ${ADMIN_NOME}, esqueci minha senha do app ADECAF Rua Digna. Meu nome: _____ / Telefone do cadastro: _____`);
	return /* @__PURE__ */ jsxs("div", {
		className: "min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/30 p-4",
		children: [/* @__PURE__ */ jsxs(Card, {
			className: "w-full max-w-md shadow-xl border-primary/20",
			children: [/* @__PURE__ */ jsxs(CardHeader, {
				className: "text-center space-y-2",
				children: [
					/* @__PURE__ */ jsx(AdecafLogo, { className: "mx-auto h-16 md:h-20 w-auto" }),
					/* @__PURE__ */ jsx(CardTitle, {
						className: "text-2xl",
						children: "ADECAF Rua Digna"
					}),
					/* @__PURE__ */ jsx(CardDescription, { children: "Plataforma da Associação de Moradores para o abaixo-assinado pelo asfaltamento." })
				]
			}), /* @__PURE__ */ jsxs(CardContent, { children: [
				mode === "signin" ? /* @__PURE__ */ jsxs("div", {
					className: "space-y-4 mt-2",
					children: [
						/* @__PURE__ */ jsx(Field, {
							label: "Telefone",
							value: phone,
							onChange: setPhone,
							placeholder: "(00) 00000-0000"
						}),
						/* @__PURE__ */ jsx(Field, {
							label: "Senha",
							value: password,
							onChange: setPassword,
							placeholder: "Sua senha",
							type: "password"
						}),
						adminLogin && /* @__PURE__ */ jsx("p", {
							className: "text-xs font-medium text-primary",
							children: "Acesso administrativo"
						}),
						adminLogin ? /* @__PURE__ */ jsx("button", {
							type: "button",
							onClick: handleAdminPasswordEmail,
							disabled: loading,
							className: "block text-left text-xs text-muted-foreground -mt-2 underline-offset-2 hover:text-foreground hover:underline disabled:opacity-60",
							children: "Enviar link para trocar senha no e-mail do admin"
						}) : /* @__PURE__ */ jsxs("p", {
							className: "text-xs text-muted-foreground -mt-2",
							children: [
								"Esqueceu a senha?",
								" ",
								/* @__PURE__ */ jsx("a", {
									href: recoveryHref,
									target: "_blank",
									rel: "noreferrer",
									className: "text-primary underline font-medium",
									children: "Fale com o administrador no WhatsApp"
								}),
								" ",
								"que ele gera uma nova para você."
							]
						}),
						/* @__PURE__ */ jsx(Button, {
							className: "w-full",
							disabled: loading,
							onClick: handleSignIn,
							children: loading ? "Entrando…" : "Entrar"
						}),
						/* @__PURE__ */ jsx("button", {
							type: "button",
							className: "block w-full text-center text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline",
							onClick: () => {
								setErr(null);
								setMsg(null);
								setAdminLogin(false);
								setMode("signup");
							},
							children: "← Voltar para o cadastro"
						})
					]
				}) : /* @__PURE__ */ jsxs("div", {
					className: "space-y-3 mt-2",
					children: [
						/* @__PURE__ */ jsx(Field, {
							label: "Nome completo",
							value: name,
							onChange: setName,
							placeholder: "Maria Silva"
						}),
						/* @__PURE__ */ jsx(Field, {
							label: "Telefone / WhatsApp",
							value: phone,
							onChange: setPhone,
							placeholder: "(62) 9 9999-9999"
						}),
						/* @__PURE__ */ jsx(Field, {
							label: "Data de nascimento",
							value: dataNascimento,
							onChange: setDataNascimento,
							type: "date"
						}),
						/* @__PURE__ */ jsx(Field, {
							label: "Crie uma senha",
							value: password,
							onChange: setPassword,
							placeholder: "Mínimo 6 caracteres",
							type: "password"
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "flex items-start gap-2 rounded-md border bg-muted/40 p-3",
							children: [/* @__PURE__ */ jsx(Checkbox, {
								id: "termo",
								checked: aceiteTermo,
								onCheckedChange: (v) => setAceiteTermo(v === true),
								className: "mt-0.5"
							}), /* @__PURE__ */ jsxs("label", {
								htmlFor: "termo",
								className: "text-xs leading-snug cursor-pointer",
								children: [
									TERMO_CHECKBOX,
									" ",
									/* @__PURE__ */ jsx("button", {
										type: "button",
										className: "text-primary underline font-medium",
										onClick: (e) => {
											e.preventDefault();
											setShowTermo(true);
										},
										children: "Ler termo completo"
									})
								]
							})]
						}),
						/* @__PURE__ */ jsx(Button, {
							className: "w-full",
							disabled: loading,
							onClick: handleSignUp,
							children: loading ? "Criando conta…" : "Criar conta"
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "pt-2 border-t mt-2 space-y-2 text-center",
							children: [
								/* @__PURE__ */ jsx("p", {
									className: "text-xs text-muted-foreground",
									children: "Já tem cadastro?"
								}),
								/* @__PURE__ */ jsx(Button, {
									type: "button",
									variant: "outline",
									className: "w-full",
									onClick: () => {
										setErr(null);
										setMsg(null);
										setAdminLogin(false);
										setMode("signin");
									},
									children: "Entrar"
								}),
								/* @__PURE__ */ jsx("button", {
									type: "button",
									onClick: async () => {
										setErr(null);
										setMsg(null);
										await supabase.auth.signOut();
										setAdminLogin(true);
										setPhone(ADMIN_PHONE);
										setPassword("");
										setMode("signin");
									},
									className: "text-[11px] text-muted-foreground/60 hover:text-foreground underline-offset-2 hover:underline mt-1",
									children: "acesso admin"
								})
							]
						})
					]
				}),
				err && /* @__PURE__ */ jsx(Alert, {
					variant: "destructive",
					className: "mt-4",
					children: /* @__PURE__ */ jsx(AlertDescription, { children: err })
				}),
				msg && /* @__PURE__ */ jsx(Alert, {
					className: "mt-4 border-primary/30 bg-primary/10 text-primary",
					children: /* @__PURE__ */ jsx(AlertDescription, { children: msg })
				})
			] })]
		}), /* @__PURE__ */ jsx(Dialog, {
			open: showTermo,
			onOpenChange: setShowTermo,
			children: /* @__PURE__ */ jsxs(DialogContent, {
				className: "max-w-2xl max-h-[85vh] overflow-y-auto",
				children: [
					/* @__PURE__ */ jsxs(DialogHeader, { children: [/* @__PURE__ */ jsx(DialogTitle, { children: TERMO_TITULO }), /* @__PURE__ */ jsx(DialogDescription, { children: "Leia com atenção antes de aceitar." })] }),
					/* @__PURE__ */ jsx("div", {
						className: "text-sm whitespace-pre-line leading-relaxed text-foreground",
						children: TERMO_TEXTO
					}),
					/* @__PURE__ */ jsx(DialogFooter, { children: /* @__PURE__ */ jsx(Button, {
						onClick: () => {
							setAceiteTermo(true);
							setShowTermo(false);
						},
						children: "Li e Concordo"
					}) })
				]
			})
		})]
	});
}
function Field({ label, value, onChange, placeholder, type = "text" }) {
	return /* @__PURE__ */ jsxs("div", {
		className: "space-y-1.5",
		children: [/* @__PURE__ */ jsx(Label, {
			className: "text-xs",
			children: label
		}), /* @__PURE__ */ jsx(Input, {
			type,
			value,
			onChange: (e) => onChange(e.target.value),
			placeholder
		})]
	});
}
//#endregion
export { AuthPage as component };
