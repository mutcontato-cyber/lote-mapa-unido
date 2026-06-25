import { i as createServerFn, p as TSS_SERVER_FUNCTION } from "./esm-9EjmF9OT.js";
import { t as requireSupabaseAuth } from "./auth-middleware-Dpn8S0gM.js";
import { z } from "zod";
//#region node_modules/@tanstack/start-server-core/dist/esm/createServerRpc.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
//#endregion
//#region src/lib/admin.functions.ts?tss-serverfn-split
function generatePassword() {
	const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
	const digits = "23456789";
	let s = "";
	for (let i = 0; i < 4; i++) s += letters[Math.floor(Math.random() * 24)];
	for (let i = 0; i < 4; i++) s += digits[Math.floor(Math.random() * 8)];
	return s;
}
/**
* Gera senha nova para um pedido de reset. Apenas administradores e
* coordenadores podem chamar. Localiza o usuário via e-mail sintético
* (`{telefone}@adecaf.local`), atualiza a senha e marca o pedido como
* atendido. Retorna a senha gerada para o admin enviar via WhatsApp.
*/
var generatePasswordReset_createServerFn_handler = createServerRpc({
	id: "9880f8335159b0de86437796536ccc78ec65f7113eec5942898d71a407c6027d",
	name: "generatePasswordReset",
	filename: "src/lib/admin.functions.ts"
}, (opts) => generatePasswordReset.__executeServer(opts));
var generatePasswordReset = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({ resetId: z.string().uuid() }).parse(d)).handler(generatePasswordReset_createServerFn_handler, async ({ data, context }) => {
	const { supabase, userId } = context;
	const { data: isAdmin } = await supabase.rpc("has_role", {
		_user_id: userId,
		_role: "admin"
	});
	const { data: isCoord } = await supabase.rpc("has_role", {
		_user_id: userId,
		_role: "coordenador"
	});
	if (!isAdmin && !isCoord) throw new Error("Apenas administradores podem redefinir senhas.");
	const { data: reset, error: rErr } = await supabase.from("password_resets").select("*").eq("id", data.resetId).maybeSingle();
	if (rErr) throw rErr;
	if (!reset) throw new Error("Pedido não encontrado.");
	if (reset.status === "atendido") throw new Error("Este pedido já foi atendido.");
	const { supabaseAdmin } = await import("./client.server-D1oHePJa.js");
	const email = `${reset.phone}@adecaf.local`;
	const { data: list, error: lErr } = await supabaseAdmin.auth.admin.listUsers();
	if (lErr) throw lErr;
	const target = list.users.find((u) => u.email?.toLowerCase() === email);
	if (!target) throw new Error(`Não encontrei um cadastro com o telefone ${reset.phone}. Verifique se o morador realmente fez cadastro.`);
	const novaSenha = generatePassword();
	const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(target.id, { password: novaSenha });
	if (updErr) throw updErr;
	const { error: upErr } = await supabase.from("password_resets").update({
		status: "atendido",
		nova_senha: novaSenha,
		fulfilled_at: (/* @__PURE__ */ new Date()).toISOString(),
		fulfilled_by: userId,
		user_id: target.id
	}).eq("id", data.resetId);
	if (upErr) throw upErr;
	return {
		senha: novaSenha,
		phone: reset.phone,
		full_name: reset.full_name
	};
});
var deleteMorador_createServerFn_handler = createServerRpc({
	id: "981ac9ddadec5c91e62824a4d9558c0ab53d0927823b4439320b0767bad2265e",
	name: "deleteMorador",
	filename: "src/lib/admin.functions.ts"
}, (opts) => deleteMorador.__executeServer(opts));
var deleteMorador = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({ userId: z.string().uuid() }).parse(d)).handler(deleteMorador_createServerFn_handler, async ({ data, context }) => {
	const { supabase, userId } = context;
	const { data: isAdmin } = await supabase.rpc("has_role", {
		_user_id: userId,
		_role: "admin"
	});
	if (!isAdmin) throw new Error("Apenas administradores podem excluir cadastros.");
	const { supabaseAdmin } = await import("./client.server-D1oHePJa.js");
	const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
	if (error) throw error;
	return { ok: true };
});
var sendEvolutionWhatsApp_createServerFn_handler = createServerRpc({
	id: "628e6bfcbd2fe41105d4b117b6102ce1909ee22804902345adbfcfcb76e73630",
	name: "sendEvolutionWhatsApp",
	filename: "src/lib/admin.functions.ts"
}, (opts) => sendEvolutionWhatsApp.__executeServer(opts));
var sendEvolutionWhatsApp = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((d) => z.object({
	phone: z.string(),
	message: z.string()
}).parse(d)).handler(sendEvolutionWhatsApp_createServerFn_handler, async ({ data, context }) => {
	const { supabase, userId } = context;
	const { data: isAdmin } = await supabase.rpc("has_role", {
		_user_id: userId,
		_role: "admin"
	});
	const { data: isCoord } = await supabase.rpc("has_role", {
		_user_id: userId,
		_role: "coordenador"
	});
	if (!isAdmin && !isCoord) throw new Error("Apenas administradores e coordenadores podem enviar mensagens.");
	const apiUrl = process.env.EVOLUTION_API_URL;
	const apiKey = process.env.EVOLUTION_API_KEY;
	const instance = process.env.EVOLUTION_INSTANCE;
	if (!apiUrl || !apiKey || !instance) throw new Error("Evolution API não está configurada no servidor (.env ausente).");
	let number = data.phone.replace(/\D/g, "");
	if (number.length === 11 || number.length === 10) number = "55" + number;
	const endpoint = `${apiUrl}/message/sendText/${instance}`;
	const reqData = {
		number,
		text: data.message,
		options: {
			delay: 1200,
			presence: "composing"
		}
	};
	process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
	const response = await fetch(endpoint, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"apikey": apiKey
		},
		body: JSON.stringify(reqData)
	});
	if (!response.ok) {
		const err = await response.text();
		throw new Error(`Falha no envio da mensagem Evolution API: ${err}`);
	}
	return { ok: true };
});
//#endregion
export { deleteMorador_createServerFn_handler, generatePasswordReset_createServerFn_handler, sendEvolutionWhatsApp_createServerFn_handler };
