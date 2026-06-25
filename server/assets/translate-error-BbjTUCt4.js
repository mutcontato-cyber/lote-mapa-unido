//#region src/lib/translate-error.ts
function traduzirErro(e) {
	const msg = (e?.message ?? String(e ?? "")).toLowerCase();
	if (msg.includes("invalid login credentials")) return "Telefone ou senha incorretos.";
	if (msg.includes("user already registered") || msg.includes("already been registered")) return "Já existe uma conta com este telefone. Faça login.";
	if (msg.includes("password should be at least")) return "A senha precisa ter ao menos 6 caracteres.";
	if (msg.includes("password is known to be weak") || msg.includes("pwned")) return "Escolha uma senha diferente.";
	if (msg.includes("email rate limit") || msg.includes("rate limit")) return "Muitas tentativas. Aguarde alguns segundos e tente novamente.";
	if (msg.includes("network")) return "Sem conexão. Verifique sua internet.";
	if (msg.includes("invalid email")) return "Telefone inválido.";
	if (msg.includes("anonymous sign-ins are disabled")) return "Cadastro temporariamente indisponível.";
	if (msg.includes("signup") && msg.includes("disabled")) return "Cadastro desativado no momento.";
	return e?.message ?? "Ocorreu um erro. Tente novamente.";
}
//#endregion
export { traduzirErro as t };
