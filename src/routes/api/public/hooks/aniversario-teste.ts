import { createFileRoute } from '@tanstack/react-router';

const json = (data: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers || {}) },
  });

async function enviar(numero: string, nome: string) {
  const evoUrl = process.env.EVOLUTION_API_URL;
  const evoKey = process.env.EVOLUTION_API_KEY;
  const evoInstance = process.env.EVOLUTION_INSTANCE;
  if (!evoUrl || !evoKey || !evoInstance) throw new Error('Missing Evolution env');

  let numFormatado = numero.replace(/\D/g, '');
  if (!numFormatado.startsWith('55')) numFormatado = '55' + numFormatado;

  const texto = `Olá ${nome}! 🎂🎉 A ADECAF deseja a você um feliz aniversário! Que seu dia seja muito especial, com muita paz e saúde.\n\n_(Esta é uma mensagem de TESTE do bot de aniversário)_`;

  const res = await fetch(`${evoUrl}/message/sendText/${evoInstance}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: evoKey },
    body: JSON.stringify({ number: numFormatado, text: texto }),
  });
  const body = await res.text();
  return { status: res.status, ok: res.ok, body, numero: numFormatado };
}

export const Route = createFileRoute('/api/public/hooks/aniversario-teste')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const numero = url.searchParams.get('numero') || '5511949043711';
          const nome = url.searchParams.get('nome') || 'Amigo(a)';
          const out = await enviar(numero, nome);
          return json({ ...out });
        } catch (err: any) {
          return json({ ok: false, error: err?.message || String(err) }, { status: 500 });
        }
      },
    },
  },
});
