import { json } from '@tanstack/react-start';
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { createClient } from '@supabase/supabase-js';

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

export const APIRoute = createAPIFileRoute('/api/aniversarios')({
  GET: async ({ request }) => {
    // 1. Verificar senha de segurança passada na URL (para ninguém rodar isso sem querer)
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    if (token !== "minhasenha123") {
      return json({ error: "Acesso negado." }, { status: 401 });
    }

    try {
      const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      const evoUrl = process.env.EVOLUTION_API_URL;
      const evoKey = process.env.EVOLUTION_API_KEY;
      const evoInstance = process.env.EVOLUTION_INSTANCE;

      const botEmail = process.env.BOT_EMAIL;
      const botPassword = process.env.BOT_PASSWORD;

      if (!supabaseUrl || !supabaseKey || !botEmail || !botPassword) {
        throw new Error("Missing env variables");
      }

      const supabase = createClient(supabaseUrl!, supabaseKey!);

      // Faz login como admin para passar do RLS
      const { error: authErr } = await supabase.auth.signInWithPassword({
        email: botEmail,
        password: botPassword
      });

      if (authErr) throw new Error("Falha no login do bot: " + authErr.message);

      const today = new Date();
      // Fuso horário BR
      today.setHours(today.getHours() - 3); 
      const todayDia = today.getDate();
      const todayMes = today.getMonth() + 1;

      let globalMessage = "Olá {nome}! A ADECAF deseja a você um feliz aniversário! Que seu dia seja muito especial, com muita paz e saúde. 🎂🎉";
      const { data: config } = await supabase.from('configuracoes').select('valor').eq('id', 'birthday_message').single();
      if (config && config.valor) {
        globalMessage = config.valor;
      }

      const { data: props } = await supabase.from('proprietarios').select('id, nome, whatsapp, telefone, data_nascimento');
      const { data: profs } = await supabase.from('profiles').select('id, full_name, phone, data_nascimento');

      const aniversariantesHoje = new Map<string, { nome: string, whatsapp: string }>();

      (props || []).forEach(c => {
        const b = parseBday(c.data_nascimento);
        if (b && b.dia === todayDia && b.mes === todayMes) {
          const wpp = c.whatsapp || c.telefone;
          if (wpp) aniversariantesHoje.set(c.nome.trim().toLowerCase(), { nome: c.nome, whatsapp: wpp });
        }
      });

      (profs || []).forEach(u => {
        const b = parseBday(u.data_nascimento);
        if (b && b.dia === todayDia && b.mes === todayMes) {
          const key = u.full_name.trim().toLowerCase();
          if (!aniversariantesHoje.has(key) && u.phone) {
            aniversariantesHoje.set(key, { nome: u.full_name, whatsapp: u.phone });
          }
        }
      });

      if (aniversariantesHoje.size === 0) {
        return json({ message: "Nenhum aniversariante hoje." });
      }

      const results = [];

      for (const [key, user] of aniversariantesHoje.entries()) {
        const nomeCurto = user.nome.split(" ")[0];
        const mensagemFinal = globalMessage.replace(/{nome}/g, nomeCurto);

        const numeroOriginal = user.whatsapp;
        let numFormatado = numeroOriginal.replace(/\D/g, "");
        if (!numFormatado.startsWith("55")) numFormatado = "55" + numFormatado;

        try {
          const res = await fetch(`${evoUrl}/message/sendText/${evoInstance}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': evoKey!
            },
            body: JSON.stringify({
              number: numFormatado,
              text: mensagemFinal
            })
          });
          if (!res.ok) {
            results.push({ user: nomeCurto, status: "error", code: res.status });
          } else {
            results.push({ user: nomeCurto, status: "success" });
          }
        } catch (err: any) {
          results.push({ user: nomeCurto, status: "error", error: err.message });
        }
      }

      return json({ message: "Processado com sucesso", results });

    } catch (err: any) {
      return json({ error: err.message }, { status: 500 });
    }
  },
});
