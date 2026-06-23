import logoAsset from "@/assets/logo-adecaf.png.asset.json";
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