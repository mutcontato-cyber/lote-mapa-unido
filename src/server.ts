import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const url = new URL(request.url);
    
    // Rota GET para listar os aniversariantes do dia
    if (url.pathname === "/api/aniversariantes" && request.method === "GET") {
      try {
        const token = url.searchParams.get("token");
        if (token !== "minhasenha123") {
          return new Response(JSON.stringify({ error: "Acesso negado" }), { status: 401, headers: { 'content-type': 'application/json' }});
        }

        const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

        if (!supabaseUrl || !supabaseKey) {
          throw new Error("Missing env variables.");
        }

        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Chama a nossa rota pública do banco de dados passando a senha SQL
        const { data: dbData, error: dbErr } = await supabase.rpc('get_dados_aniversario', { secret_token: 'senha_do_bot_123' });
        if (dbErr) throw new Error(dbErr.message);

        const configuracoes = dbData.configuracoes || [];
        const mensagensCust = dbData.mensagens_customizadas || [];
        const props = dbData.proprietarios || [];
        const profs = dbData.profiles || [];

        const today = new Date();
        today.setHours(today.getHours() - 3); 
        const todayDia = today.getDate();
        const todayMes = today.getMonth() + 1;

        const parseBday = (dateStr: string | null | undefined) => {
          if (!dateStr) return null;
          const clean = dateStr.split('T')[0].trim();
          let p = clean.split('-');
          if (p.length < 2) p = clean.split('/');
          let mes = 0, dia = 0;
          if (p.length === 3) {
            if (p[0].length === 4) { mes = Number(p[1]); dia = Number(p[2]); }
            else { mes = Number(p[1]); dia = Number(p[0]); }
          } else if (p.length === 2) {
            mes = Number(p[1]); dia = Number(p[0]);
          }
          if (isNaN(mes) || isNaN(dia) || mes < 1 || mes > 12 || dia < 1 || dia > 31) return null;
          return { mes, dia };
        };

        let globalMessage = "Olá {nome}! A ADECAF deseja a você um feliz aniversário! Que seu dia seja muito especial, com muita paz e saúde. 🎂🎉";
        const msgRow = configuracoes.find((c: any) => c.id === 'birthday_message');
        if (msgRow) globalMessage = msgRow.valor;

        const customMap = new Map();
        mensagensCust.forEach((row: any) => {
          let numLimpo = row.telefone.replace(/\D/g, "");
          if (!numLimpo.startsWith("55")) numLimpo = "55" + numLimpo;
          customMap.set(numLimpo, row.mensagem);
        });

        const mostrarTodos = url.searchParams.get("mostrar_todos") === "true";

        const aniversariantesHoje = new Map<string, { nome: string, whatsapp: string }>();

        (props || []).forEach((c: any) => {
          const b = parseBday(c.data_nascimento);
          if (b && (mostrarTodos || (b.dia === todayDia && b.mes === todayMes))) {
            const wpp = c.whatsapp || c.telefone;
            if (wpp) aniversariantesHoje.set(c.nome.trim().toLowerCase(), { nome: c.nome, whatsapp: wpp });
          }
        });

        (profs || []).forEach((u: any) => {
          const b = parseBday(u.data_nascimento);
          if (b && (mostrarTodos || (b.dia === todayDia && b.mes === todayMes))) {
            const key = u.full_name.trim().toLowerCase();
            if (!aniversariantesHoje.has(key) && u.phone) {
              aniversariantesHoje.set(key, { nome: u.full_name, whatsapp: u.phone });
            }
          }
        });

        const results = [];
        for (const [key, user] of aniversariantesHoje.entries()) {
          const nomeCurto = user.nome.split(" ")[0];
          let numFormatado = user.whatsapp.replace(/\D/g, "");
          if (!numFormatado.startsWith("55")) numFormatado = "55" + numFormatado;

          let mensagemFinal = "";
          let isCustom = false;

          if (customMap.has(numFormatado)) {
            mensagemFinal = customMap.get(numFormatado).replace(/{nome}/g, nomeCurto);
            isCustom = true;
          } else {
            mensagemFinal = globalMessage.replace(/{nome}/g, nomeCurto);
          }

          results.push({
            nome: nomeCurto,
            telefone: numFormatado,
            mensagem: mensagemFinal,
            customizada: isCustom
          });
        }

        return new Response(JSON.stringify(results), { headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' }});

      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'content-type': 'application/json' }});
      }
    }

    // Rota POST para apagar mensagem customizada
    if (url.pathname === "/api/apagar-customizada" && request.method === "POST") {
      try {
        const token = url.searchParams.get("token");
        if (token !== "minhasenha123") {
          return new Response(JSON.stringify({ error: "Acesso negado" }), { status: 401, headers: { 'content-type': 'application/json' }});
        }
        
        const body = await request.json();
        const telefone = body.telefone;

        if (!telefone) throw new Error("Telefone não fornecido");

        const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl!, supabaseKey!);

        await supabase.rpc('apagar_msg_customizada', { telefone_alvo: telefone, secret_token: 'senha_do_bot_123' });

        return new Response(JSON.stringify({ success: true }), { headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' }});
      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'content-type': 'application/json' }});
      }
    }

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
