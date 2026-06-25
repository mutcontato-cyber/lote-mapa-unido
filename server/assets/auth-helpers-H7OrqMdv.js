import { t as supabase } from "./client-BJ1L6GXa.js";
//#region src/lib/admin-config.ts
var ADMIN_WHATSAPP = "5562981873363";
var ADMIN_PHONE = "62981873363";
var ADMIN_EMAIL = "mutcontato@gmail.com";
var ADMIN_NOME = "Magno (Presidente ADECAF)";
function waLink(numero, mensagem) {
	return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}
//#endregion
//#region src/lib/auth-helpers.ts
function normalizePhone(phone) {
	return phone.replace(/\D/g, "");
}
function emailForPhone(phone) {
	const normalized = normalizePhone(phone);
	if (normalized === "62981873363") return ADMIN_EMAIL;
	return `${normalized}@adecaf.local`;
}
async function signUpWithPhonePassword(phone, name, password, termoTexto, dataNascimento, loteamentoId) {
	const email = emailForPhone(phone);
	const { data, error } = await supabase.auth.signUp({
		email,
		password,
		options: {
			data: {
				full_name: name.trim(),
				phone: normalizePhone(phone),
				data_nascimento: dataNascimento || ""
			},
			emailRedirectTo: typeof window !== "undefined" ? window.location.origin : void 0
		}
	});
	if (error) throw error;
	if (data.user) await supabase.from("profiles").update({
		...termoTexto ? {
			aceite_termo_at: (/* @__PURE__ */ new Date()).toISOString(),
			aceite_termo_texto: termoTexto
		} : {},
		...dataNascimento ? { data_nascimento: dataNascimento } : {},
		...loteamentoId ? { loteamento_id: loteamentoId } : {}
	}).eq("id", data.user.id);
	return data;
}
async function signInWithPhonePassword(phone, password) {
	const email = emailForPhone(phone);
	const { data, error } = await supabase.auth.signInWithPassword({
		email,
		password
	});
	if (error) throw error;
	return data;
}
async function signOut() {
	await supabase.auth.signOut();
}
//#endregion
export { ADMIN_NOME as a, waLink as c, ADMIN_EMAIL as i, signOut as n, ADMIN_PHONE as o, signUpWithPhonePassword as r, ADMIN_WHATSAPP as s, signInWithPhonePassword as t };
