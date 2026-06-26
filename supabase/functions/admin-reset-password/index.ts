// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";

function generatePassword(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "23456789";
  let s = "";
  for (let i = 0; i < 4; i++) s += letters[Math.floor(Math.random() * letters.length)];
  for (let i = 0; i < 4; i++) s += digits[Math.floor(Math.random() * digits.length)];
  return s;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Não autorizado" }, { status: 401 });

    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Sessão inválida" }, { status: 401 });
    const userId = userData.user.id;

    const { data: isAdmin } = await userClient.rpc("has_role", { _user_id: userId, _role: "admin" });
    const { data: isCoord } = await userClient.rpc("has_role", { _user_id: userId, _role: "coordenador" });
    if (!isAdmin && !isCoord) return json({ error: "Apenas administradores podem redefinir senhas." }, { status: 403 });

    const { resetId } = await req.json();
    if (!resetId) return json({ error: "resetId obrigatório" }, { status: 400 });

    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

    const { data: reset, error: rErr } = await admin
      .from("password_resets")
      .select("*")
      .eq("id", resetId)
      .maybeSingle();
    if (rErr) throw rErr;
    if (!reset) return json({ error: "Pedido não encontrado." }, { status: 404 });
    if (reset.status === "atendido") return json({ error: "Este pedido já foi atendido." }, { status: 400 });

    const email = `${reset.phone}@adecaf.local`;
    const { data: list, error: lErr } = await admin.auth.admin.listUsers();
    if (lErr) throw lErr;
    const target = list.users.find((u: any) => u.email?.toLowerCase() === email);
    if (!target) {
      return json(
        { error: `Não encontrei um cadastro com o telefone ${reset.phone}. Verifique se o morador realmente fez cadastro.` },
        { status: 404 },
      );
    }

    const novaSenha = generatePassword();
    const { error: updErr } = await admin.auth.admin.updateUserById(target.id, { password: novaSenha });
    if (updErr) throw updErr;

    const { error: upErr } = await admin
      .from("password_resets")
      .update({
        status: "atendido",
        nova_senha: novaSenha,
        fulfilled_at: new Date().toISOString(),
        fulfilled_by: userId,
        user_id: target.id,
      })
      .eq("id", resetId);
    if (upErr) throw upErr;

    return json({ senha: novaSenha, phone: reset.phone, full_name: reset.full_name });
  } catch (e: any) {
    return json({ error: e?.message || String(e) }, { status: 500 });
  }
});