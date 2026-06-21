import logoAsset from "@/assets/logo-adecaf.jpg.asset.json";
import { cn } from "@/lib/utils";

export function AdecafLogo({ className }: { className?: string }) {
  return (
    <img
      src={logoAsset.url}
      alt="ADECAF — Associação de Desenvolvimento, Cultura e Assistência Familiar"
      className={cn("object-contain", className)}
    />
  );
}