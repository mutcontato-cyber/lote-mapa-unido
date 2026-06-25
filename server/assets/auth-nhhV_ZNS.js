import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
//#region src/routes/auth.tsx
var $$splitComponentImporter = () => import("./auth-Cd1TW5hv.js");
var Route = createFileRoute("/auth")({
	head: () => ({ meta: [{ title: "Entrar — ADECAF Rua Digna" }, {
		name: "description",
		content: "Acesso à plataforma da Associação ADECAF para o abaixo-assinado de asfaltamento."
	}] }),
	validateSearch: (search) => ({ loteamento: search.loteamento }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
