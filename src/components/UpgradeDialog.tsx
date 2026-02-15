import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useCheckout } from '@/hooks/useCheckout';
import { STRIPE_PRICES } from '@/lib/plans';
import { Check, Crown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason?: 'projects' | 'transcription';
}

const reasonMessages = {
  projects: 'Vous avez atteint la limite de 1 projet sur le plan Gratuit.',
  transcription: 'Vous avez utilisé vos 2 heures de transcription du plan Gratuit.',
};

const proFeatures = [
  'Biographies illimitées',
  'Assistant IA illimité',
  'Export professionnel (DOCX, PDF)',
  'Support email prioritaire',
  'Historique complet (30 jours)',
];

export default function UpgradeDialog({ open, onOpenChange, reason }: UpgradeDialogProps) {
  const checkout = useCheckout();
  const [loadingPrice, setLoadingPrice] = useState<string | null>(null);

  const handleUpgrade = async (priceId: string) => {
    if (!priceId) {
      toast.error('Les prix Stripe ne sont pas encore configurés.');
      return;
    }
    setLoadingPrice(priceId);
    try {
      await checkout.mutateAsync(priceId);
    } catch {
      toast.error('Erreur lors de la redirection vers le paiement.');
      setLoadingPrice(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Crown className="w-5 h-5 text-amber-500" />
            <DialogTitle>Passez à Biograph Professionnel</DialogTitle>
          </div>
          <DialogDescription>
            {reason ? reasonMessages[reason] : 'Débloquez toutes les fonctionnalités pour vos projets de biographie.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            {proFeatures.map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          <div className="pt-4">
            <Button
              onClick={() => handleUpgrade(STRIPE_PRICES.monthly)}
              disabled={!!loadingPrice}
              className="w-full flex-col h-auto py-4"
            >
              {loadingPrice === STRIPE_PRICES.monthly ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span className="text-lg font-bold">69€ / mois</span>
                  <span className="text-xs opacity-80">Sans engagement, annulable à tout moment</span>
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground pt-2">
            Paiement sécurisé
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
