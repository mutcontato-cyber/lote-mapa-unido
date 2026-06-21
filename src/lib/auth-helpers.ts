import { supabase } from "@/integrations/supabase/client";

// Sanitize phone -> digits only
export function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

// O usuário entra com telefone + senha. O telefone é convertido em um
// e-mail sintético (`{telefone}@adecaf.local`) só para usar a auth do
// Supabase, mas a senha é a que o próprio morador escolheu.
export function emailForPhone(phone: string) {
  return `${normalizePhone(phone)}@adecaf.local`;
}

export async function signUpWithPhonePassword(
  phone: string,
  name: string,
  password: string,
  termoTexto?: string,
  dataNascimento?: string,
) {
  const email = emailForPhone(phone);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name.trim(),
        phone: normalizePhone(phone),
        data_nascimento: dataNascimento || "",
      },
      emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
    },
  });
  if (error) throw error;

  // Registra aceite do termo no profile
  if (data.user && termoTexto) {
    await supabase
      .from("profiles")
      .update({
        aceite_termo_at: new Date().toISOString(),
        aceite_termo_texto: termoTexto,
        ...(dataNascimento ? { data_nascimento: dataNascimento } : {}),
      })
      .eq("id", data.user.id);
  }
  return data;
}

export async function signInWithPhonePassword(phone: string, password: string) {
  const email = emailForPhone(phone);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function requestPasswordReset(phone: string, fullName: string) {
  const { error } = await supabase.from("password_resets").insert({
    phone: normalizePhone(phone),
    full_name: fullName.trim() || null,
    status: "pendente",
  });
  if (error) throw error;
}

export async function signOut() {
  await supabase.auth.signOut();
}