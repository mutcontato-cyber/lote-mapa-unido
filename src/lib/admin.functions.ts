import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function generatePassword(): string {
  // Senha legível: 4 letras maiúsculas + 4 dígitos (ex: HNPF8421)
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "23456789";
  let s = "";
  for (let i = 0; i < 4; i++) s += letters[Math.floor(Math.random() * letters.length)];
  for (let i = 0; i < 4; i++) s += digits[Math.floor(Math.random() * digits.length)];
  return s;
}

/**
 * Gera senha nova para um pedido de reset. Apenas administradores e
 * coordenadores podem chamar. Localiza o usuário via e-mail sintético
 * (`{telefone}@adecaf.local`), atualiza a senha e marca o pedido como
 * atendido. Retorna a senha gerada para o admin enviar via WhatsApp.
 */
export const generatePasswordReset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ resetId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // 1. Caller deve ser staff
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    const { data: isCoord } = await supabase.rpc("has_role", { _user_id: userId, _role: "coordenador" });
    if (!isAdmin && !isCoord) {
      throw new Error("Apenas administradores podem redefinir senhas.");
    }

    // 2. Busca o pedido
    const { data: reset, error: rErr } = await supabase
      .from("password_resets")
      .select("*")
      .eq("id", data.resetId)
      .maybeSingle();
    if (rErr) throw rErr;
    if (!reset) throw new Error("Pedido não encontrado.");
    if (reset.status === "atendido") throw new Error("Este pedido já foi atendido.");

    // 3. Acessa admin client (service role) para alterar a senha
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const email = `${reset.phone}@adecaf.local`;

    // localiza usuário por email
    const { data: list, error: lErr } = await supabaseAdmin.auth.admin.listUsers();
    if (lErr) throw lErr;
    const target = list.users.find((u) => u.email?.toLowerCase() === email);
    if (!target) {
      throw new Error(
        `Não encontrei um cadastro com o telefone ${reset.phone}. Verifique se o morador realmente fez cadastro.`,
      );
    }

    const novaSenha = generatePassword();

    const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(target.id, {
      password: novaSenha,
    });
    if (updErr) throw updErr;

    // 4. Marca o pedido como atendido
    const { error: upErr } = await supabase
      .from("password_resets")
      .update({
        status: "atendido",
        nova_senha: novaSenha,
        fulfilled_at: new Date().toISOString(),
        fulfilled_by: userId,
        user_id: target.id,
      })
      .eq("id", data.resetId);
    if (upErr) throw upErr;

    return { senha: novaSenha, phone: reset.phone, full_name: reset.full_name };
  });

/**
 * Admin pode excluir o cadastro completo de um morador (auth + profile + proprietários).
 * Cascata é feita via FK on delete cascade.
 */
export const deleteMorador = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Apenas administradores podem excluir cadastros.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw error;
    return { ok: true };
  });