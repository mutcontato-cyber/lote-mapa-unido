import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
//#region src/routes/_authenticated/mapa.tsx
var $$splitComponentImporter = () => import("./mapa-Cow7ebEn.js");
var Route = createFileRoute("/_authenticated/mapa")({
	head: () => ({ meta: [{ title: "Mapa do Loteamento — ADECAF Rua Digna" }] }),
	validateSearch: (search) => ({ loteamento: search.loteamento }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
