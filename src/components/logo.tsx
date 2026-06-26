import { cn } from "@/lib/utils";

export function AdecafLogo({ className }: { className?: string }) {
  return (
    <img
      src="/logo-adecaf.png"
      alt="ADECAF — Associação de Desenvolvimento, Cultura e Assistência Familiar"
      className={cn("object-contain", className)}
    />
  );
}