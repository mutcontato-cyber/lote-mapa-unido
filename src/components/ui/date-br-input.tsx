import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Campo de data digitável no formato brasileiro DD/MM/AAAA.
 * - `value` é sempre ISO (YYYY-MM-DD) ou "" (compatível com o resto do app/DB).
 * - `onChange` devolve ISO ou "" quando a data ainda não está completa/válida.
 * - Aceita digitação livre, faz máscara automática (25/06/1990) e valida ano/mês/dia.
 */
export interface DateBRInputProps
  extends Omit<React.ComponentProps<"input">, "value" | "onChange" | "type"> {
  value?: string | null;
  onChange?: (isoValue: string) => void;
}

function isoToBr(iso?: string | null): string {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return "";
  return `${m[3]}/${m[2]}/${m[1]}`;
}

function brToIso(br: string): string {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(br);
  if (!m) return "";
  const d = Number(m[1]);
  const mo = Number(m[2]);
  const y = Number(m[3]);
  if (mo < 1 || mo > 12) return "";
  if (d < 1 || d > 31) return "";
  if (y < 1900 || y > 2100) return "";
  const dt = new Date(`${m[3]}-${m[2]}-${m[1]}T00:00:00`);
  if (isNaN(dt.getTime())) return "";
  // Verifica se a data existe (ex.: 31/02 não)
  if (dt.getFullYear() !== y || dt.getMonth() + 1 !== mo || dt.getDate() !== d) return "";
  return `${m[3]}-${m[2]}-${m[1]}`;
}

function maskBR(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 8);
  const p1 = digits.slice(0, 2);
  const p2 = digits.slice(2, 4);
  const p3 = digits.slice(4, 8);
  let out = p1;
  if (digits.length >= 3) out += "/" + p2;
  if (digits.length >= 5) out += "/" + p3;
  return out;
}

export const DateBRInput = React.forwardRef<HTMLInputElement, DateBRInputProps>(
  ({ value, onChange, className, placeholder = "dd/mm/aaaa", ...props }, ref) => {
    const [text, setText] = React.useState<string>(() => isoToBr(value));

    // Sincroniza quando o `value` externo muda (ex.: restauração de rascunho).
    React.useEffect(() => {
      const fromOutside = isoToBr(value);
      if (fromOutside !== brToIso(text) ? true : false) {
        // Só sobrescreve se realmente mudou para evitar perder digitação parcial
        if (fromOutside && fromOutside !== text) setText(fromOutside);
        if (!value && text && brToIso(text)) setText("");
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const masked = maskBR(e.target.value);
      setText(masked);
      const iso = brToIso(masked);
      onChange?.(iso);
    }

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        autoComplete="bday"
        placeholder={placeholder}
        value={text}
        onChange={handleChange}
        maxLength={10}
        className={cn(className)}
        {...props}
      />
    );
  },
);
DateBRInput.displayName = "DateBRInput";