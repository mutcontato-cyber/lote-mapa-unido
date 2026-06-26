// @ts-nocheck
import { corsHeaders, json } from "../_shared/cors.ts";

async function enviar(numero: string, nome: string) {
  const evoUrl = Deno.env.get("EVOLUTION_API_URL");
  const evoKey = Deno.env.get("EVOLUTION_API_KEY");
  const evoInstance = Deno.env.get("EVOLUTION_INSTANCE");
  if (!evoUrl || !evoKey || !evoInstance) throw new Error("Missing Evolution env");

  let numFormatado = String(numero).replace(/\D/g, "");
  if (!numFormatado.startsWith("55")) numFormatado = "55" + numFormatado;

  const nomeCurto = (nome || "Amigo(a)").split(" ")[0];
  const texto = `Olá ${nomeCurto}! Mensagem de teste do bot de aniversários da ADECAF 🎂🎉`;

  const res = await fetch(`${evoUrl}/message/sendText/${evoInstance}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: evoKey },
    body: JSON.stringify({ number: numFormatado, text: texto }),
  });
  const body = await res.text();
  return { status: res.status, ok: res.ok, body, numero: numFormatado };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const url = new URL(req.url);
    const numero = url.searchParams.get("numero") || "5511949043711";
    const nome = url.searchParams.get("nome") || "Amigo(a)";
    const out = await enviar(numero, nome);
    return json({ ...out });
  } catch (err: any) {
    return json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
});