import { t as supabase } from "./client-BJ1L6GXa.js";
import { n as signOut } from "./auth-helpers-H7OrqMdv.js";
import { c as cn, o as AdecafLogo, s as Button } from "./card-yjQJoboh.js";
import * as React from "react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { cva } from "class-variance-authority";
import { Check, ChevronDown, ChevronUp, FileText, LayoutDashboard, LogOut, MapPin, Menu, Settings } from "lucide-react";
import * as SelectPrimitive from "@radix-ui/react-select";
//#region src/hooks/use-auth.ts
function useAuth() {
	const [session, setSession] = useState(null);
	const [user, setUser] = useState(null);
	const [profile, setProfile] = useState(null);
	const [roles, setRoles] = useState([]);
	const [loading, setLoading] = useState(true);
	const [initialFetchDone, setInitialFetchDone] = useState(false);
	useEffect(() => {
		const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
			setSession(s);
			setUser(s?.user ?? null);
		});
		supabase.auth.getSession().then(({ data }) => {
			setSession(data.session);
			setUser(data.session?.user ?? null);
			if (!data.session?.user) setLoading(false);
			setInitialFetchDone(true);
		});
		return () => sub.subscription.unsubscribe();
	}, []);
	useEffect(() => {
		if (!initialFetchDone) return;
		if (!user) {
			setProfile(null);
			setRoles([]);
			setLoading(false);
			return;
		}
		let active = true;
		setLoading(true);
		(async () => {
			const [{ data: p }, { data: r }] = await Promise.all([supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(), supabase.from("user_roles").select("role").eq("user_id", user.id)]);
			if (!active) return;
			setProfile(p ?? null);
			setRoles((r ?? []).map((x) => x.role));
			setLoading(false);
		})();
		return () => {
			active = false;
		};
	}, [user]);
	const isAdmin = roles.includes("admin");
	return {
		session,
		user,
		profile,
		roles,
		isAdmin,
		isStaff: isAdmin || roles.includes("coordenador"),
		loading
	};
}
//#endregion
//#region src/components/ui/badge.tsx
var badgeVariants = cva("inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", {
	variants: { variant: {
		default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
		secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
		destructive: "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
		outline: "text-foreground"
	} },
	defaultVariants: { variant: "default" }
});
function Badge({ className, variant, ...props }) {
	return /* @__PURE__ */ jsx("div", {
		className: cn(badgeVariants({ variant }), className),
		...props
	});
}
//#endregion
//#region src/components/app-shell.tsx
var NAV = [
	{
		to: "/mapa",
		label: "Mapa",
		icon: MapPin
	},
	{
		to: "/dashboard",
		label: "Dashboard",
		icon: LayoutDashboard,
		adminOnly: true
	},
	{
		to: "/relatorios",
		label: "Relatórios",
		icon: FileText,
		adminOnly: true
	},
	{
		to: "/admin",
		label: "Administração",
		icon: Settings,
		adminOnly: true
	}
];
function AppShell({ children }) {
	const { profile, isAdmin, isStaff, loading } = useAuth();
	const nav = useNavigate();
	const path = useRouterState({ select: (s) => s.location.pathname });
	const [open, setOpen] = useState(false);
	async function handleSignOut() {
		localStorage.removeItem("adecaf_loteamento_lock");
		await signOut();
		nav({ to: "/auth" });
	}
	const visibleNav = NAV.filter((n) => !n.adminOnly || !loading && isStaff);
	return /* @__PURE__ */ jsxs("div", {
		className: "min-h-screen flex flex-col bg-background",
		children: [
			/* @__PURE__ */ jsxs("header", {
				className: "sticky top-0 z-30 border-b bg-card/80 backdrop-blur",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "mx-auto max-w-7xl flex items-center gap-3 px-4 h-16",
					children: [
						/* @__PURE__ */ jsx(Button, {
							variant: "ghost",
							size: "icon",
							className: "md:hidden",
							onClick: () => setOpen((v) => !v),
							children: /* @__PURE__ */ jsx(Menu, { className: "h-5 w-5" })
						}),
						/* @__PURE__ */ jsx(Link, {
							to: "/mapa",
							className: "flex items-center",
							children: /* @__PURE__ */ jsx(AdecafLogo, { className: "h-6 md:h-7 w-auto" })
						}),
						/* @__PURE__ */ jsx("nav", {
							className: "hidden md:flex items-center gap-1 ml-6",
							children: visibleNav.map((n) => {
								const active = path === n.to || n.to !== "/" && path.startsWith(n.to);
								return /* @__PURE__ */ jsxs(Link, {
									to: n.to,
									className: cn("px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors", active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"),
									children: [/* @__PURE__ */ jsx(n.icon, { className: "h-4 w-4" }), n.label]
								}, n.to);
							})
						}),
						/* @__PURE__ */ jsxs("div", {
							className: "ml-auto flex items-center gap-3",
							children: [/* @__PURE__ */ jsxs("div", {
								className: "hidden sm:flex items-center gap-2 text-sm",
								children: [
									/* @__PURE__ */ jsx("span", {
										className: "text-muted-foreground",
										children: "Olá,"
									}),
									/* @__PURE__ */ jsx("span", {
										className: "font-medium",
										children: loading ? "Carregando…" : profile?.full_name ?? "…"
									}),
									loading ? null : isAdmin ? /* @__PURE__ */ jsx(Badge, { children: "Admin" }) : isStaff ? /* @__PURE__ */ jsx(Badge, {
										variant: "secondary",
										children: "Coordenador"
									}) : /* @__PURE__ */ jsx(Badge, {
										variant: "outline",
										children: "Visitante"
									})
								]
							}), /* @__PURE__ */ jsx(Button, {
								variant: "ghost",
								size: "icon",
								onClick: handleSignOut,
								title: "Sair",
								children: /* @__PURE__ */ jsx(LogOut, { className: "h-4 w-4" })
							})]
						})
					]
				}), open && /* @__PURE__ */ jsx("div", {
					className: "md:hidden border-t bg-card",
					children: /* @__PURE__ */ jsx("div", {
						className: "flex flex-col p-2",
						children: visibleNav.map((n) => /* @__PURE__ */ jsxs(Link, {
							to: n.to,
							onClick: () => setOpen(false),
							className: "px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 hover:bg-muted",
							children: [/* @__PURE__ */ jsx(n.icon, { className: "h-4 w-4" }), n.label]
						}, n.to))
					})
				})]
			}),
			/* @__PURE__ */ jsx("main", {
				className: "flex-1",
				children
			}),
			/* @__PURE__ */ jsx("footer", {
				className: "border-t py-4 text-center text-xs text-muted-foreground",
				children: "ADECAF Rua Digna · Plataforma de organização do abaixo-assinado de asfaltamento"
			})
		]
	});
}
//#endregion
//#region src/components/ui/select.tsx
var Select = SelectPrimitive.Root;
var SelectValue = SelectPrimitive.Value;
var SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs(SelectPrimitive.Trigger, {
	ref,
	className: cn("flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background cursor-pointer data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1", className),
	...props,
	children: [children, /* @__PURE__ */ jsx(SelectPrimitive.Icon, {
		asChild: true,
		children: /* @__PURE__ */ jsx(ChevronDown, { className: "h-4 w-4 opacity-50" })
	})]
}));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;
var SelectScrollUpButton = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(SelectPrimitive.ScrollUpButton, {
	ref,
	className: cn("flex cursor-default items-center justify-center py-1", className),
	...props,
	children: /* @__PURE__ */ jsx(ChevronUp, { className: "h-4 w-4" })
}));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;
var SelectScrollDownButton = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(SelectPrimitive.ScrollDownButton, {
	ref,
	className: cn("flex cursor-default items-center justify-center py-1", className),
	...props,
	children: /* @__PURE__ */ jsx(ChevronDown, { className: "h-4 w-4" })
}));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;
var SelectContent = React.forwardRef(({ className, children, position = "popper", ...props }, ref) => /* @__PURE__ */ jsx(SelectPrimitive.Portal, { children: /* @__PURE__ */ jsxs(SelectPrimitive.Content, {
	ref,
	className: cn("relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-select-content-transform-origin)", position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1", className),
	position,
	...props,
	children: [
		/* @__PURE__ */ jsx(SelectScrollUpButton, {}),
		/* @__PURE__ */ jsx(SelectPrimitive.Viewport, {
			className: cn("p-1", position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"),
			children
		}),
		/* @__PURE__ */ jsx(SelectScrollDownButton, {})
	]
}) }));
SelectContent.displayName = SelectPrimitive.Content.displayName;
var SelectLabel = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(SelectPrimitive.Label, {
	ref,
	className: cn("px-2 py-1.5 text-sm font-semibold", className),
	...props
}));
SelectLabel.displayName = SelectPrimitive.Label.displayName;
var SelectItem = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs(SelectPrimitive.Item, {
	ref,
	className: cn("relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className),
	...props,
	children: [/* @__PURE__ */ jsx("span", {
		className: "absolute right-2 flex h-3.5 w-3.5 items-center justify-center",
		children: /* @__PURE__ */ jsx(SelectPrimitive.ItemIndicator, { children: /* @__PURE__ */ jsx(Check, { className: "h-4 w-4" }) })
	}), /* @__PURE__ */ jsx(SelectPrimitive.ItemText, { children })]
}));
SelectItem.displayName = SelectPrimitive.Item.displayName;
var SelectSeparator = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(SelectPrimitive.Separator, {
	ref,
	className: cn("-mx-1 my-1 h-px bg-muted", className),
	...props
}));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;
//#endregion
//#region src/lib/queries.ts
async function fetchLoteamentos() {
	const { data, error } = await supabase.from("loteamentos").select("*").order("nome");
	if (error) throw error;
	return data;
}
async function fetchQuadras(loteamentoId) {
	let query = supabase.from("quadras").select("*").order("ordem").order("nome");
	if (loteamentoId) query = query.eq("loteamento_id", loteamentoId);
	const { data, error } = await query;
	if (error) throw error;
	return data;
}
async function fetchLotes() {
	const { data, error } = await supabase.from("lotes").select("*").order("numero");
	if (error) throw error;
	return data;
}
async function fetchProprietarios() {
	const { data, error } = await supabase.from("proprietarios").select("*");
	if (error) throw error;
	return data;
}
/**
* Recompute lot status from its proprietarios and persist.
*/
function deriveStatus(props) {
	if (!props.length) return "sem_cadastro";
	const total = props.reduce((s, p) => s + Number(p.fracao), 0);
	if (props.some((p) => p.apoia_asfalto === false)) return "pendencia";
	if (props.some((p) => p.assinatura_status === "confirmou" || p.assinatura_status === "assinou")) return "confirmado";
	if (total < 99.5) return "incompleto";
	if (props.some((p) => !p.nome || !p.telefone)) return "incompleto";
	return "cadastrado";
}
async function recomputeLoteStatus(loteId) {
	const { data: props } = await supabase.from("proprietarios").select("*").eq("lote_id", loteId);
	const status = deriveStatus(props ?? []);
	await supabase.rpc("update_lote_status", {
		p_lote_id: loteId,
		p_status: status
	});
	return status;
}
//#endregion
export { fetchQuadras as a, SelectContent as c, SelectValue as d, AppShell as f, fetchProprietarios as i, SelectItem as l, useAuth as m, fetchLoteamentos as n, recomputeLoteStatus as o, Badge as p, fetchLotes as r, Select as s, deriveStatus as t, SelectTrigger as u };
