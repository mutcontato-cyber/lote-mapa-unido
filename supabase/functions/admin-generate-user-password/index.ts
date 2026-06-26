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
    const callerId = userData.user.id;

    const { data: isAdmin } = await userClient.rpc("has_role", { _user_id: callerId, _role: "admin" });
    const { data: isCoord } = await userClient.rpc("has_role", { _user_id: callerId, _role: "coordenador" });
    if (!isAdmin && !isCoord) return json({ error: "Apenas administradores podem gerar senhas." }, { status: 403 });

    const { userId } = await req.json();
    if (!userId) return json({ error: "userId obrigatório" }, { status: 400 });

    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

    const novaSenha = generatePassword();
    const { data: updated, error: updErr } = await admin.auth.admin.updateUserById(userId, { password: novaSenha });
    if (updErr) throw updErr;

    const { data: profile } = await admin
      .from("profiles")
      .select("full_name, phone")
      .eq("id", userId)
      .maybeSingle();

    return json({
      senha: novaSenha,
      phone: profile?.phone ?? updated?.user?.email ?? "",
      full_name: profile?.full_name ?? "",
    });
  } catch (e: any) {
    return json({ error: e?.message || String(e) }, { status: 500 });
  }
});