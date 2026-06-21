import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Lote, Quadra, Proprietario } from "@/lib/queries";

interface Props {
  lote: Lote;
  quadra: Quadra;
  proprietarios: Proprietario[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved?: () => void;
}

export function QuickSignDialog({ lote, quadra, proprietarios, open, onOpenChange, onSaved }: Props) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSign() {
    if (!nome.trim() || !telefone.trim()) {
      toast.error("Preencha nome e telefone");
      return;
    }
    setLoading(true);
    try {
      const { error: insErr } = await supabase.from("proprietarios").insert({
        lote_id: lote.id,
        nome: nome.trim(),
        telefone: telefone.trim(),
        whatsapp: telefone.trim(),
        fracao: 100,
        apoia_asfalto: true,
        assinatura_status: "confirmou",
      });
      if (insErr) throw insErr;
      const { error: upErr } = await supabase
        .from("lotes")
        .update({ status: "confirmado" })
        .eq("id", lote.id);
      if (upErr) throw upErr;
      toast.success("Apoio registrado! Obrigado por participar 💚");
      setNome("");
      setTelefone("");
      onSaved?.();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao registrar apoio");
    } finally {
      setLoading(false);
    }
  }

  const jaApoiam = proprietarios.filter((p) => p.apoia_asfalto !== false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Quadra {quadra.nome} · Lote {lote.numero}
          </DialogTitle>
          <DialogDescription>
            Cadastre seu apoio ao asfaltamento da Rua. Em poucos segundos seu lote fica verde no mapa.
          </DialogDescription>
        </DialogHeader>

        {jaApoiam.length > 0 && (
          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            <div className="font-medium mb-1 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-[var(--status-confirmado)]" />
              Já apoiam este lote:
            </div>
            <ul className="text-muted-foreground space-y-0.5">
              {jaApoiam.map((p) => (
                <li key={p.id}>• {p.nome}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Seu nome completo</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Maria Silva" />
          </div>
          <div>
            <Label className="text-xs">Telefone / WhatsApp</Label>
            <Input
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(62) 9 9999-9999"
              inputMode="tel"
            />
          </div>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Este cadastro <strong>não substitui</strong> a assinatura presencial do abaixo-assinado, mas
            mostra para a Prefeitura e para os vizinhos quem está apoiando.
          </AlertDescription>
        </Alert>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSign} disabled={loading}>
            {loading ? "Enviando…" : "Quero apoiar 💚"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}