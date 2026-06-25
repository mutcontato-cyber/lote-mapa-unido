//#region src/lib/error-capture.ts
var lastCapturedError;
var TTL_MS = 5e3;
function record(error) {
	lastCapturedError = {
		error,
		at: Date.now()
	};
}
if (typeof globalThis.addEventListener === "function") {
	globalThis.addEventListener("error", (event) => record(event.error ?? event));
	globalThis.addEventListener("unhandledrejection", (event) => record(event.reason));
}
function consumeLastCapturedError() {
	if (!lastCapturedError) return void 0;
	if (Date.now() - lastCapturedError.at > TTL_MS) {
		lastCapturedError = void 0;
		return;
	}
	const { error } = lastCapturedError;
	lastCapturedError = void 0;
	return error;
}
//#endregion
//#region src/lib/error-page.ts
function renderErrorPage() {
	return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>This page didn't load</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #fafafa; color: #111; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
      p { color: #4b5563; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.375rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #111; color: #fff; }
      .secondary { background: #fff; color: #111; border-color: #d1d5db; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>This page didn't load</h1>
      <p>Something went wrong on our end. You can try refreshing or head back home.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Try again</button>
        <a class="secondary" href="/">Go home</a>
      </div>
    </div>
  </body>
</html>`;
}
//#endregion
//#region src/server.ts
var serverEntryPromise;
async function getServerEntry() {
	if (!serverEntryPromise) serverEntryPromise = import("./assets/server-CtEJOu1M.js").then((m) => m.default ?? m);
	return serverEntryPromise;
}
async function normalizeCatastrophicSsrResponse(response) {
	if (response.status < 500) return response;
	if (!(response.headers.get("content-type") ?? "").includes("application/json")) return response;
	const body = await response.clone().text();
	if (!body.includes("\"unhandled\":true") || !body.includes("\"message\":\"HTTPError\"")) return response;
	console.error(consumeLastCapturedError() ?? /* @__PURE__ */ new Error(`h3 swallowed SSR error: ${body}`));
	return new Response(renderErrorPage(), {
		status: 500,
		headers: { "content-type": "text/html; charset=utf-8" }
	});
}
var server_default = { async fetch(request, env, ctx) {
	const url = new URL(request.url);
	if (url.pathname === "/api/aniversariantes" && request.method === "GET") try {
		if (url.searchParams.get("token") !== "minhasenha123") return new Response(JSON.stringify({ error: "Acesso negado" }), {
			status: 401,
			headers: { "content-type": "application/json" }
		});
		const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
		const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
		if (!supabaseUrl || !supabaseKey) throw new Error("Missing env variables.");
		const { createClient } = await import("@supabase/supabase-js");
		const { data: dbData, error: dbErr } = await createClient(supabaseUrl, supabaseKey).rpc("get_dados_aniversario", { secret_token: "senha_do_bot_123" });
		if (dbErr) throw new Error(dbErr.message);
		const configuracoes = dbData.configuracoes || [];
		const mensagensCust = dbData.mensagens_customizadas || [];
		const props = dbData.proprietarios || [];
		const profs = dbData.profiles || [];
		const today = /* @__PURE__ */ new Date();
		today.setHours(today.getHours() - 3);
		const todayDia = today.getDate();
		const todayMes = today.getMonth() + 1;
		const parseBday = (dateStr) => {
			if (!dateStr) return null;
			const clean = dateStr.split("T")[0].trim();
			let p = clean.split("-");
			if (p.length < 2) p = clean.split("/");
			let mes = 0, dia = 0;
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
		};
		let globalMessage = "Olá {nome}! A ADECAF deseja a você um feliz aniversário! Que seu dia seja muito especial, com muita paz e saúde. 🎂🎉";
		const msgRow = configuracoes.find((c) => c.id === "birthday_message");
		if (msgRow) globalMessage = msgRow.valor;
		const customMap = /* @__PURE__ */ new Map();
		mensagensCust.forEach((row) => {
			let numLimpo = row.telefone.replace(/\D/g, "");
			if (!numLimpo.startsWith("55")) numLimpo = "55" + numLimpo;
			customMap.set(numLimpo, row.mensagem);
		});
		const mostrarTodos = url.searchParams.get("mostrar_todos") === "true";
		const aniversariantesHoje = /* @__PURE__ */ new Map();
		(props || []).forEach((c) => {
			const b = parseBday(c.data_nascimento);
			if (b && (mostrarTodos || b.dia === todayDia && b.mes === todayMes)) {
				const wpp = c.whatsapp || c.telefone;
				if (wpp) aniversariantesHoje.set(c.nome.trim().toLowerCase(), {
					nome: c.nome,
					whatsapp: wpp
				});
			}
		});
		(profs || []).forEach((u) => {
			const b = parseBday(u.data_nascimento);
			if (b && (mostrarTodos || b.dia === todayDia && b.mes === todayMes)) {
				const key = u.full_name.trim().toLowerCase();
				if (!aniversariantesHoje.has(key) && u.phone) aniversariantesHoje.set(key, {
					nome: u.full_name,
					whatsapp: u.phone
				});
			}
		});
		const results = [];
		for (const [key, user] of aniversariantesHoje.entries()) {
			const nomeCurto = user.nome.split(" ")[0];
			let numFormatado = user.whatsapp.replace(/\D/g, "");
			if (!numFormatado.startsWith("55")) numFormatado = "55" + numFormatado;
			let mensagemFinal = "";
			let isCustom = false;
			if (customMap.has(numFormatado)) {
				mensagemFinal = customMap.get(numFormatado).replace(/{nome}/g, nomeCurto);
				isCustom = true;
			} else mensagemFinal = globalMessage.replace(/{nome}/g, nomeCurto);
			results.push({
				nome: nomeCurto,
				telefone: numFormatado,
				mensagem: mensagemFinal,
				customizada: isCustom
			});
		}
		return new Response(JSON.stringify(results), { headers: {
			"content-type": "application/json",
			"access-control-allow-origin": "*"
		} });
	} catch (err) {
		return new Response(JSON.stringify({ error: err.message }), {
			status: 500,
			headers: { "content-type": "application/json" }
		});
	}
	if (url.pathname === "/api/apagar-customizada" && request.method === "POST") try {
		if (url.searchParams.get("token") !== "minhasenha123") return new Response(JSON.stringify({ error: "Acesso negado" }), {
			status: 401,
			headers: { "content-type": "application/json" }
		});
		const telefone = (await request.json()).telefone;
		if (!telefone) throw new Error("Telefone não fornecido");
		const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
		const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
		const { createClient } = await import("@supabase/supabase-js");
		await createClient(supabaseUrl, supabaseKey).rpc("apagar_msg_customizada", {
			telefone_alvo: telefone,
			secret_token: "senha_do_bot_123"
		});
		return new Response(JSON.stringify({ success: true }), { headers: {
			"content-type": "application/json",
			"access-control-allow-origin": "*"
		} });
	} catch (err) {
		return new Response(JSON.stringify({ error: err.message }), {
			status: 500,
			headers: { "content-type": "application/json" }
		});
	}
	try {
		return await normalizeCatastrophicSsrResponse(await (await getServerEntry()).fetch(request, env, ctx));
	} catch (error) {
		console.error(error);
		return new Response(renderErrorPage(), {
			status: 500,
			headers: { "content-type": "text/html; charset=utf-8" }
		});
	}
} };
//#endregion
export { server_default as default, renderErrorPage as t };
