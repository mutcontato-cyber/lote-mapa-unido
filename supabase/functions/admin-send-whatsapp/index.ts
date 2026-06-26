// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, json } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Não autorizado" }, { status: 401 });

    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;

    const userClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Sessão inválida" }, { status: 401 });
    const uid = userData.user.id;

    const { data: isAdmin } = await userClient.rpc("has_role", { _user_id: uid, _role: "admin" });
    const { data: isCoord } = await userClient.rpc("has_role", { _user_id: uid, _role: "coordenador" });
    if (!isAdmin && !isCoord) return json({ error: "Apenas administradores e coordenadores podem enviar mensagens." }, { status: 403 });

    const { phone, message } = await req.json();
    if (!phone || !message) return json({ error: "phone e message obrigatórios" }, { status: 400 });

    const apiUrl = Deno.env.get("EVOLUTION_API_URL");
    const apiKey = Deno.env.get("EVOLUTION_API_KEY");
    const instance = Deno.env.get("EVOLUTION_INSTANCE");
    if (!apiUrl || !apiKey || !instance) return json({ error: "Evolution API não está configurada." }, { status: 500 });

    let number = String(phone).replace(/\D/g, "");
    if (number.length === 11 || number.length === 10) number = "55" + number;

    const resp = await fetch(`${apiUrl}/message/sendText/${instance}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: apiKey },
      body: JSON.stringify({
        number,
        text: message,
        options: { delay: 1200, presence: "composing" },
      }),
    });
    if (!resp.ok) {
      const err = await resp.text();
      return json({ error: `Falha no envio: ${err}` }, { status: 502 });
    }
    return json({ ok: true });
  } catch (e: any) {
    return json({ error: e?.message || String(e) }, { status: 500 });
  }
});