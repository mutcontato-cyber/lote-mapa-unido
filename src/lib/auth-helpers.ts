import { supabase } from "@/integrations/supabase/client";

// Sanitize phone -> digits only
export function normalizePhone(phone: string) {
  return phone.replace(/\D/g, "");
}

// Convert phone+name into a deterministic email/password pair so we can
// reuse Supabase auth without exposing the user to email/password UI.
function credsFor(phone: string, name: string) {
  const p = normalizePhone(phone);
  const slug = name.trim().toLowerCase().replace(/\s+/g, ".").replace(/[^a-z0-9.]/g, "");
  return {
    email: `${p}@adecaf.local`,
    password: `${p}#${slug || "user"}#adecaf`,
  };
}

export async function signUpWithPhoneName(phone: string, name: string) {
  const { email, password } = credsFor(phone, name);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name.trim(), phone: normalizePhone(phone) },
      emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
    },
  });
  if (error) throw error;
  return data;
}

export async function signInWithPhoneName(phone: string, name: string) {
  const { email, password } = credsFor(phone, name);
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  await supabase.auth.signOut();
}