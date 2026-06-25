import { t as supabase } from "./client-BJ1L6GXa.js";
import { a as CardTitle, i as CardHeader, n as CardContent, o as AdecafLogo, r as CardDescription, s as Button, t as Card } from "./card-yjQJoboh.js";
import { i as Input, n as AlertDescription, r as Label, t as Alert } from "./alert-C5uUgb5P.js";
import { t as traduzirErro } from "./translate-error-BbjTUCt4.js";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
//#region src/routes/reset-password.tsx?tsr-split=component
function ResetPasswordPage() {
	const navigate = useNavigate();
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [loading, setLoading] = useState(false);
	const [err, setErr] = useState(null);
	const [done, setDone] = useState(false);
	async function handleUpdatePassword() {
		setErr(null);
		if (password.length < 6) {
			setErr("A nova senha precisa ter ao menos 6 caracteres.");
			return;
		}
		if (password !== confirm) {
			setErr("As senhas não conferem.");
			return;
		}
		setLoading(true);
		try {
			const { error } = await supabase.auth.updateUser({ password });
			if (error) throw error;
			setDone(true);
			setPassword("");
			setConfirm("");
		} catch (e) {
			setErr(traduzirErro(e));
		} finally {
			setLoading(false);
		}
	}
	return /* @__PURE__ */ jsx("div", {
		className: "min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/30 p-4",
		children: /* @__PURE__ */ jsxs(Card, {
			className: "w-full max-w-md shadow-xl border-primary/20",
			children: [/* @__PURE__ */ jsxs(CardHeader, {
				className: "text-center space-y-2",
				children: [
					/* @__PURE__ */ jsx(AdecafLogo, { className: "mx-auto h-16 md:h-20 w-auto" }),
					/* @__PURE__ */ jsx(CardTitle, {
						className: "text-2xl",
						children: "Trocar senha"
					}),
					/* @__PURE__ */ jsx(CardDescription, { children: "Defina uma nova senha para voltar ao acesso administrativo." })
				]
			}), /* @__PURE__ */ jsxs(CardContent, {
				className: "space-y-4",
				children: [done ? /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(Alert, {
					className: "border-primary/30 bg-primary/10 text-primary",
					children: /* @__PURE__ */ jsx(AlertDescription, { children: "Senha alterada. Agora entre novamente no acesso admin." })
				}), /* @__PURE__ */ jsx(Button, {
					className: "w-full",
					onClick: () => navigate({ to: "/auth" }),
					children: "Voltar para entrar"
				})] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
					/* @__PURE__ */ jsxs("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ jsx(Label, {
							htmlFor: "password",
							children: "Nova senha"
						}), /* @__PURE__ */ jsx(Input, {
							id: "password",
							type: "password",
							value: password,
							onChange: (e) => setPassword(e.target.value),
							placeholder: "Mínimo 6 caracteres"
						})]
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ jsx(Label, {
							htmlFor: "confirm",
							children: "Confirmar senha"
						}), /* @__PURE__ */ jsx(Input, {
							id: "confirm",
							type: "password",
							value: confirm,
							onChange: (e) => setConfirm(e.target.value),
							placeholder: "Digite novamente"
						})]
					}),
					/* @__PURE__ */ jsx(Button, {
						className: "w-full",
						disabled: loading,
						onClick: handleUpdatePassword,
						children: loading ? "Salvando…" : "Salvar nova senha"
					})
				] }), err && /* @__PURE__ */ jsx(Alert, {
					variant: "destructive",
					children: /* @__PURE__ */ jsx(AlertDescription, { children: err })
				})]
			})]
		})
	});
}
//#endregion
export { ResetPasswordPage as component };
