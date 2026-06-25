import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { jsx } from "react/jsx-runtime";
//#region src/routes/index.tsx?tsr-split=component
function IndexRedirect() {
	const navigate = useNavigate();
	useEffect(() => {
		navigate({
			to: "/mapa",
			replace: true
		});
	}, [navigate]);
	return /* @__PURE__ */ jsx("div", {
		className: "min-h-screen flex items-center justify-center bg-background",
		children: /* @__PURE__ */ jsx("p", {
			className: "text-sm text-muted-foreground",
			children: "Carregando…"
		})
	});
}
//#endregion
export { IndexRedirect as component };
