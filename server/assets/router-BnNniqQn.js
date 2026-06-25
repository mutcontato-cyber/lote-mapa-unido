import { t as Route$9 } from "./auth-nhhV_ZNS.js";
import { t as supabase } from "./client-BJ1L6GXa.js";
import { t as Route$10 } from "./mapa-YWJFa8PF.js";
import { useEffect } from "react";
import { HeadContent, Link, Outlet, Scripts, createFileRoute, createRootRouteWithContext, createRouter, lazyRouteComponent, redirect, useRouter } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { createClient } from "@supabase/supabase-js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
//#region src/styles.css?url
var styles_default = "/assets/styles-CbrWFBbZ.css";
//#endregion
//#region src/lib/lovable-error-reporting.ts
function reportLovableError(error, context = {}) {
	if (typeof window === "undefined") return;
	window.__lovableEvents?.captureException?.(error, {
		source: "react_error_boundary",
		route: window.location.pathname,
		...context
	}, {
		mechanism: "react_error_boundary",
		handled: false,
		severity: "error"
	});
}
//#endregion
//#region src/routes/__root.tsx
function NotFoundComponent() {
	return /* @__PURE__ */ jsx("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ jsxs("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ jsx("h1", {
					className: "text-7xl font-bold text-foreground",
					children: "404"
				}),
				/* @__PURE__ */ jsx("h2", {
					className: "mt-4 text-xl font-semibold text-foreground",
					children: "Page not found"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "The page you're looking for doesn't exist or has been moved."
				}),
				/* @__PURE__ */ jsx("div", {
					className: "mt-6",
					children: /* @__PURE__ */ jsx(Link, {
						to: "/",
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Go home"
					})
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	useEffect(() => {
		reportLovableError(error, { boundary: "tanstack_root_error_component" });
	}, [error]);
	return /* @__PURE__ */ jsx("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ jsxs("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ jsx("h1", {
					className: "text-xl font-semibold tracking-tight text-foreground",
					children: "This page didn't load"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Something went wrong on our end. You can try refreshing or head back home."
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [/* @__PURE__ */ jsx("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Try again"
					}), /* @__PURE__ */ jsx("a", {
						href: "/",
						className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
						children: "Go home"
					})]
				})
			]
		})
	});
}
var Route$8 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "ADECAF Rua Digna" },
			{
				name: "description",
				content: "Plataforma da Associação ADECAF para organizar o abaixo-assinado de asfaltamento."
			},
			{
				name: "author",
				content: "ADECAF"
			},
			{
				property: "og:title",
				content: "ADECAF Rua Digna"
			},
			{
				property: "og:description",
				content: "Plataforma da Associação ADECAF para organizar o abaixo-assinado de asfaltamento."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary"
			},
			{
				name: "twitter:site",
				content: "@Lovable"
			}
		],
		links: [{
			rel: "stylesheet",
			href: styles_default
		}, {
			rel: "icon",
			type: "image/png",
			href: "/__l5e/assets-v1/40afd089-b793-49cc-8219-4b8bfdc661f8/favicon-adecaf.png"
		}]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ jsxs("html", {
		lang: "pt-BR",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ jsx("head", { children: /* @__PURE__ */ jsx(HeadContent, {}) }), /* @__PURE__ */ jsxs("body", {
			suppressHydrationWarning: true,
			children: [children, /* @__PURE__ */ jsx(Scripts, {})]
		})]
	});
}
function RootComponent() {
	const { queryClient } = Route$8.useRouteContext();
	return /* @__PURE__ */ jsx(QueryClientProvider, {
		client: queryClient,
		children: /* @__PURE__ */ jsx(Outlet, {})
	});
}
//#endregion
//#region src/routes/reset-password.tsx
var $$splitComponentImporter$5 = () => import("./reset-password-DxE9eICo.js");
var Route$7 = createFileRoute("/reset-password")({
	head: () => ({ meta: [{ title: "Trocar senha — ADECAF Rua Digna" }, {
		name: "description",
		content: "Tela segura para trocar a senha do acesso administrativo da ADECAF."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
//#endregion
//#region src/routes/_authenticated/route.tsx
var $$splitComponentImporter$4 = () => import("./route-Di7iQBCH.js");
var Route$6 = createFileRoute("/_authenticated")({
	ssr: false,
	beforeLoad: async ({ location }) => {
		const { data, error } = await supabase.auth.getUser();
		if (error || !data.user) throw redirect({
			to: "/auth",
			search: location.search
		});
		return { user: data.user };
	},
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
//#endregion
//#region src/routes/index.tsx
var $$splitComponentImporter$3 = () => import("./routes-DvXvMiWv.js");
var Route$5 = createFileRoute("/")({
	head: () => ({ meta: [{ title: "ADECAF Rua Digna" }, {
		name: "description",
		content: "Plataforma da Associação ADECAF para o abaixo-assinado pelo asfaltamento da rua."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
//#endregion
//#region src/routes/_authenticated/relatorios.tsx
var $$splitComponentImporter$2 = () => import("./relatorios-uoTHZN30.js");
var Route$4 = createFileRoute("/_authenticated/relatorios")({
	head: () => ({ meta: [{ title: "Relatórios — ADECAF Rua Digna" }] }),
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
//#endregion
//#region src/routes/_authenticated/dashboard.tsx
var $$splitComponentImporter$1 = () => import("./dashboard-C7Ty05gG.js");
var Route$3 = createFileRoute("/_authenticated/dashboard")({
	head: () => ({ meta: [{ title: "Dashboard — ADECAF Rua Digna" }] }),
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
//#endregion
//#region src/routes/_authenticated/admin.tsx
var $$splitComponentImporter = () => import("./admin-QE0bAn7k.js");
var Route$2 = createFileRoute("/_authenticated/admin")({
	head: () => ({ meta: [{ title: "Administração — ADECAF Rua Digna" }] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
//#region src/routes/api/public/hooks/aniversarios.ts
var json$1 = (data, init) => new Response(JSON.stringify(data), {
	...init,
	headers: {
		"content-type": "application/json",
		...init?.headers || {}
	}
});
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
async function executar() {
	const supabaseUrl = process.env.SUPABASE_URL;
	const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
	const evoUrl = process.env.EVOLUTION_API_URL;
	const evoKey = process.env.EVOLUTION_API_KEY;
	const evoInstance = process.env.EVOLUTION_INSTANCE;
	if (!supabaseUrl || !serviceKey) throw new Error("Missing Supabase env");
	if (!evoUrl || !evoKey || !evoInstance) throw new Error("Missing Evolution env");
	const supabase = createClient(supabaseUrl, serviceKey, { auth: {
		persistSession: false,
		autoRefreshToken: false
	} });
	const now = /* @__PURE__ */ new Date(Date.now() - 10800 * 1e3);
	const todayDia = now.getUTCDate();
	const todayMes = now.getUTCMonth() + 1;
	let globalMessage = "Olá {nome}! A ADECAF deseja a você um feliz aniversário! Que seu dia seja muito especial, com muita paz e saúde. 🎂🎉";
	const { data: config } = await supabase.from("configuracoes").select("valor").eq("id", "birthday_message").maybeSingle();
	if (config?.valor) globalMessage = config.valor;
	const { data: props } = await supabase.from("proprietarios").select("id, nome, whatsapp, telefone, data_nascimento");
	const { data: profs } = await supabase.from("profiles").select("id, full_name, phone, data_nascimento");
	const { data: mors } = await supabase.from("moradores").select("id, nome, telefone, data_nascimento");
	const aniversariantes = /* @__PURE__ */ new Map();
	(props || []).forEach((c) => {
		const b = parseBday(c.data_nascimento);
		if (b && b.dia === todayDia && b.mes === todayMes) {
			const wpp = c.whatsapp || c.telefone;
			if (wpp) aniversariantes.set(c.nome.trim().toLowerCase(), {
				nome: c.nome,
				whatsapp: wpp
			});
		}
	});
	(profs || []).forEach((u) => {
		const b = parseBday(u.data_nascimento);
		if (b && b.dia === todayDia && b.mes === todayMes) {
			const key = (u.full_name || "").trim().toLowerCase();
			if (key && !aniversariantes.has(key) && u.phone) aniversariantes.set(key, {
				nome: u.full_name,
				whatsapp: u.phone
			});
		}
	});
	(mors || []).forEach((m) => {
		const b = parseBday(m.data_nascimento);
		if (b && b.dia === todayDia && b.mes === todayMes) {
			const key = (m.nome || "").trim().toLowerCase();
			if (key && !aniversariantes.has(key) && m.telefone) aniversariantes.set(key, {
				nome: m.nome,
				whatsapp: m.telefone
			});
		}
	});
	const results = [];
	for (const [, user] of aniversariantes.entries()) {
		const nomeCurto = user.nome.split(" ")[0];
		let numFormatado = user.whatsapp.replace(/\D/g, "");
		if (!numFormatado.startsWith("55")) numFormatado = "55" + numFormatado;
		let mensagemFinal = globalMessage.replace(/{nome}/g, nomeCurto);
		const { data: custom } = await supabase.from("mensagens_customizadas").select("mensagem").eq("telefone", numFormatado).maybeSingle();
		if (custom?.mensagem) mensagemFinal = custom.mensagem.replace(/{nome}/g, nomeCurto);
		try {
			const res = await fetch(`${evoUrl}/message/sendText/${evoInstance}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					apikey: evoKey
				},
				body: JSON.stringify({
					number: numFormatado,
					text: mensagemFinal
				})
			});
			const txt = await res.text();
			if (!res.ok) results.push({
				user: nomeCurto,
				status: "error",
				code: res.status,
				body: txt
			});
			else {
				results.push({
					user: nomeCurto,
					status: "success"
				});
				if (custom?.mensagem) await supabase.from("mensagens_customizadas").delete().eq("telefone", numFormatado);
			}
		} catch (err) {
			results.push({
				user: nomeCurto,
				status: "error",
				error: err?.message
			});
		}
	}
	return {
		date: `${String(todayDia).padStart(2, "0")}/${String(todayMes).padStart(2, "0")}`,
		total: aniversariantes.size,
		results
	};
}
var Route$1 = createFileRoute("/api/public/hooks/aniversarios")({ server: { handlers: {
	GET: async () => {
		try {
			return json$1({
				ok: true,
				...await executar()
			});
		} catch (err) {
			return json$1({
				ok: false,
				error: err?.message || String(err)
			}, { status: 500 });
		}
	},
	POST: async () => {
		try {
			return json$1({
				ok: true,
				...await executar()
			});
		} catch (err) {
			return json$1({
				ok: false,
				error: err?.message || String(err)
			}, { status: 500 });
		}
	}
} } });
//#endregion
//#region src/routes/api/public/hooks/aniversario-teste.ts
var json = (data, init) => new Response(JSON.stringify(data), {
	...init,
	headers: {
		"content-type": "application/json",
		...init?.headers || {}
	}
});
async function enviar(numero, nome) {
	const evoUrl = process.env.EVOLUTION_API_URL;
	const evoKey = process.env.EVOLUTION_API_KEY;
	const evoInstance = process.env.EVOLUTION_INSTANCE;
	if (!evoUrl || !evoKey || !evoInstance) throw new Error("Missing Evolution env");
	let numFormatado = numero.replace(/\D/g, "");
	if (!numFormatado.startsWith("55")) numFormatado = "55" + numFormatado;
	const texto = `Olá ${nome}! 🎂🎉 A ADECAF deseja a você um feliz aniversário! Que seu dia seja muito especial, com muita paz e saúde.\n\n_(Esta é uma mensagem de TESTE do bot de aniversário)_`;
	const res = await fetch(`${evoUrl}/message/sendText/${evoInstance}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			apikey: evoKey
		},
		body: JSON.stringify({
			number: numFormatado,
			text: texto
		})
	});
	const body = await res.text();
	return {
		status: res.status,
		ok: res.ok,
		body,
		numero: numFormatado
	};
}
var Route = createFileRoute("/api/public/hooks/aniversario-teste")({ server: { handlers: { GET: async ({ request }) => {
	try {
		const url = new URL(request.url);
		return json({ ...await enviar(url.searchParams.get("numero") || "5511949043711", url.searchParams.get("nome") || "Amigo(a)") });
	} catch (err) {
		return json({
			ok: false,
			error: err?.message || String(err)
		}, { status: 500 });
	}
} } } });
//#endregion
//#region src/routeTree.gen.ts
var ResetPasswordRoute = Route$7.update({
	id: "/reset-password",
	path: "/reset-password",
	getParentRoute: () => Route$8
});
var AuthRoute = Route$9.update({
	id: "/auth",
	path: "/auth",
	getParentRoute: () => Route$8
});
var AuthenticatedRouteRoute = Route$6.update({
	id: "/_authenticated",
	getParentRoute: () => Route$8
});
var IndexRoute = Route$5.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$8
});
var AuthenticatedRelatoriosRoute = Route$4.update({
	id: "/relatorios",
	path: "/relatorios",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedMapaRoute = Route$10.update({
	id: "/mapa",
	path: "/mapa",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedDashboardRoute = Route$3.update({
	id: "/dashboard",
	path: "/dashboard",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedAdminRoute = Route$2.update({
	id: "/admin",
	path: "/admin",
	getParentRoute: () => AuthenticatedRouteRoute
});
var ApiPublicHooksAniversariosRoute = Route$1.update({
	id: "/api/public/hooks/aniversarios",
	path: "/api/public/hooks/aniversarios",
	getParentRoute: () => Route$8
});
var ApiPublicHooksAniversarioTesteRoute = Route.update({
	id: "/api/public/hooks/aniversario-teste",
	path: "/api/public/hooks/aniversario-teste",
	getParentRoute: () => Route$8
});
var AuthenticatedRouteRouteChildren = {
	AuthenticatedAdminRoute,
	AuthenticatedDashboardRoute,
	AuthenticatedMapaRoute,
	AuthenticatedRelatoriosRoute
};
var rootRouteChildren = {
	IndexRoute,
	AuthenticatedRouteRoute: AuthenticatedRouteRoute._addFileChildren(AuthenticatedRouteRouteChildren),
	AuthRoute,
	ResetPasswordRoute,
	ApiPublicHooksAniversarioTesteRoute,
	ApiPublicHooksAniversariosRoute
};
var routeTree = Route$8._addFileChildren(rootRouteChildren)._addFileTypes();
//#endregion
//#region src/router.tsx
var getRouter = () => {
	return createRouter({
		routeTree,
		context: { queryClient: new QueryClient() },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { getRouter };
