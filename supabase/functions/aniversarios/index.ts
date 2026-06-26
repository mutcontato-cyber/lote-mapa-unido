import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const EVOLUTION_URL = Deno.env.get("EVOLUTION_API_URL")!;
const EVOLUTION_KEY = Deno.env.get("EVOLUTION_API_KEY")!;
const EVOLUTION_INSTANCE = Deno.env.get("EVOLUTION_INSTANCE")!;

function brTodayMMDD(): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(new Date());
  const month = parts.find((p) => p.type === "month")!.value;
  const day = parts.find((p) => p.type === "day")!.value;
  return `${month}-${day}`;
}

function onlyDigits(s: string): string {
  return (s || "").replace(/\D/g, "");
}

function normalizePhone(raw: string): string | null {
  let d = onlyDigits(raw);
  if (!d) return null;
  if (d.length === 11 || d.length === 10) d = "55" + d; // BR sem código país
  if (d.length < 12 || d.length > 14) return null;
  return d;
}

async function sendWhatsapp(phone: string, message: string) {
  const url = `${EVOLUTION_URL.replace(/\/$/, "")}/message/sendText/${EVOLUTION_INSTANCE}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: EVOLUTION_KEY,
    },
    body: JSON.stringify({ number: phone, text: message }),
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, body: text };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    // mensagem padrão
    const { data: cfg } = await supabase
      .from("configuracoes")
      .select("valor")
      .eq("id", "birthday_message")
      .maybeSingle();
    const defaultMessage =
      cfg?.valor ??
      "Olá {nome}! Feliz aniversário! 🎂";

    // mensagens customizadas por telefone
    const { data: customRows } = await supabase
      .from("mensagens_customizadas")
      .select("telefone, mensagem");
    const customByPhone = new Map<string, string>();
    for (const r of customRows ?? []) {
      const p = normalizePhone(r.telefone);
      if (p) customByPhone.set(p, r.mensagem);
    }

    const today = brTodayMMDD();

    type Person = { nome: string; telefone: string; data_nascimento: string; origem: string };
    const aniversariantes: Person[] = [];

    const { data: profs } = await supabase
      .from("profiles")
      .select("full_name, phone, data_nascimento")
      .not("data_nascimento", "is", null);
    for (const p of profs ?? []) {
      if (!p.data_nascimento || !p.phone) continue;
      const mmdd = String(p.data_nascimento).slice(5, 10);
      if (mmdd === today) {
        aniversariantes.push({
          nome: p.full_name ?? "",
          telefone: p.phone,
          data_nascimento: p.data_nascimento,
          origem: "profile",
        });
      }
    }

    const { data: props } = await supabase
      .from("proprietarios")
      .select("nome, whatsapp, telefone, data_nascimento")
      .not("data_nascimento", "is", null);
    for (const p of props ?? []) {
      if (!p.data_nascimento) continue;
      const phone = p.whatsapp || p.telefone;
      if (!phone) continue;
      const mmdd = String(p.data_nascimento).slice(5, 10);
      if (mmdd === today) {
        aniversariantes.push({
          nome: p.nome ?? "",
          telefone: phone,
          data_nascimento: p.data_nascimento,
          origem: "proprietario",
        });
      }
    }

    const { data: mors } = await supabase
      .from("moradores")
      .select("nome, whatsapp, data_nascimento")
      .not("data_nascimento", "is", null);
    for (const p of mors ?? []) {
      if (!p.data_nascimento || !p.whatsapp) continue;
      const mmdd = String(p.data_nascimento).slice(5, 10);
      if (mmdd === today) {
        aniversariantes.push({
          nome: p.nome ?? "",
          telefone: p.whatsapp,
          data_nascimento: p.data_nascimento,
          origem: "morador",
        });
      }
    }

    const enviados: Array<{ telefone: string; nome: string; status: number; ok: boolean }> = [];
    const seen = new Set<string>();

    for (const a of aniversariantes) {
      const phone = normalizePhone(a.telefone);
      if (!phone || seen.has(phone)) continue;
      seen.add(phone);

      const template = customByPhone.get(phone) ?? defaultMessage;
      const message = template.replaceAll("{nome}", a.nome || "");
      const res = await sendWhatsapp(phone, message);
      enviados.push({ telefone: phone, nome: a.nome, status: res.status, ok: res.ok });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        data: today,
        total_aniversariantes: aniversariantes.length,
        total_enviados: enviados.length,
        enviados,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});