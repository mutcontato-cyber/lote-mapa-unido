// Configurações fixas da associação
export const ADMIN_WHATSAPP = "5562981873363"; // Magno – Presidente ADECAF
export const ADMIN_NOME = "Magno (Presidente ADECAF)";

export function waLink(numero: string, mensagem: string) {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}