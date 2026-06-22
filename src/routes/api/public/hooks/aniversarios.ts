import { createFileRoute } from '@tanstack/react-router';
import { createClient } from '@supabase/supabase-js';

const json = (data: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers || {}) },
  });

function parseBday(dateStr: string | null | undefined) {
  if (!dateStr) return null;
  const clean = dateStr.split('T')[0].trim();
  let p = clean.split('-');
  if (p.length < 2) p = clean.split('/');

  let mes = 0;
  let dia = 0;

  if (p.length === 3) {
    if (p[0].length === 4) { mes = Number(p[1]); dia = Number(p[2]); }
    else { mes = Number(p[1]); dia = Number(p[0]); }
  } else if (p.length === 2) {
    mes = Number(p[1]); dia = Number(p[0]);
  }

  if (isNaN(mes) || isNaN(dia) || mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
  return { mes, dia };
}

async function executar() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const evoUrl = process.env.EVOLUTION_API_URL;
  const evoKey = process.env.EVOLUTION_API_KEY;
  const evoInstance = process.env.EVOLUTION_INSTANCE;

  if (!supabaseUrl || !serviceKey) throw new Error('Missing Supabase env');
  if (!evoUrl || !evoKey || !evoInstance) throw new Error('Missing Evolution env');

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Data atual em Brasília (UTC-3)
  const now = new Date(Date.now() - 3 * 60 * 60 * 1000);
  const todayDia = now.getUTCDate();
  const todayMes = now.getUTCMonth() + 1;

  let globalMessage =
    'Olá {nome}! A ADECAF deseja a você um feliz aniversário! Que seu dia seja muito especial, com muita paz e saúde. 🎂🎉';
  const { data: config } = await supabase
    .from('configuracoes')
    .select('valor')
    .eq('id', 'birthday_message')
    .maybeSingle();
  if (config?.valor) globalMessage = config.valor as string;

  const { data: props } = await supabase
    .from('proprietarios')
    .select('id, nome, whatsapp, telefone, data_nascimento');
  const { data: profs } = await supabase
    .from('profiles')
    .select('id, full_name, phone, data_nascimento');

  const aniversariantes = new Map<string, { nome: string; whatsapp: string }>();

  (props || []).forEach((c: any) => {
    const b = parseBday(c.data_nascimento);
    if (b && b.dia === todayDia && b.mes === todayMes) {
      const wpp = c.whatsapp || c.telefone;
      if (wpp) aniversariantes.set(c.nome.trim().toLowerCase(), { nome: c.nome, whatsapp: wpp });
    }
  });

  (profs || []).forEach((u: any) => {
    const b = parseBday(u.data_nascimento);
    if (b && b.dia === todayDia && b.mes === todayMes) {
      const key = (u.full_name || '').trim().toLowerCase();
      if (key && !aniversariantes.has(key) && u.phone) {
        aniversariantes.set(key, { nome: u.full_name, whatsapp: u.phone });
      }
    }
  });

  const results: any[] = [];

  for (const [, user] of aniversariantes.entries()) {
    const nomeCurto = user.nome.split(' ')[0];

    let numFormatado = user.whatsapp.replace(/\D/g, '');
    if (!numFormatado.startsWith('55')) numFormatado = '55' + numFormatado;

    // Procura mensagem customizada para este número
    let mensagemFinal = globalMessage.replace(/{nome}/g, nomeCurto);
    const { data: custom } = await supabase
      .from('mensagens_customizadas')
      .select('mensagem')
      .eq('telefone', numFormatado)
      .maybeSingle();
    if (custom?.mensagem) {
      mensagemFinal = (custom.mensagem as string).replace(/{nome}/g, nomeCurto);
    }

    try {
      const res = await fetch(`${evoUrl}/message/sendText/${evoInstance}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: evoKey },
        body: JSON.stringify({ number: numFormatado, text: mensagemFinal }),
      });
      const txt = await res.text();
      if (!res.ok) {
        results.push({ user: nomeCurto, status: 'error', code: res.status, body: txt });
      } else {
        results.push({ user: nomeCurto, status: 'success' });
        // Apaga mensagem customizada após uso (uso único)
        if (custom?.mensagem) {
          await supabase.from('mensagens_customizadas').delete().eq('telefone', numFormatado);
        }
      }
    } catch (err: any) {
      results.push({ user: nomeCurto, status: 'error', error: err?.message });
    }
  }

  return {
    date: `${String(todayDia).padStart(2, '0')}/${String(todayMes).padStart(2, '0')}`,
    total: aniversariantes.size,
    results,
  };
}

export const Route = createFileRoute('/api/public/hooks/aniversarios')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const out = await executar();
          return json({ ok: true, ...out });
        } catch (err: any) {
          return json({ ok: false, error: err?.message || String(err) }, { status: 500 });
        }
      },
      POST: async () => {
        try {
          const out = await executar();
          return json({ ok: true, ...out });
        } catch (err: any) {
          return json({ ok: false, error: err?.message || String(err) }, { status: 500 });
        }
      },
    },
  },
});