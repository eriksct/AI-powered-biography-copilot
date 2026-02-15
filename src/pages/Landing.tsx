import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  BookOpen,
  Mic,
  Search,
  Calendar,
  PenTool,
  Link2,
  MessageCircle,
  Clock,
  Puzzle,
  Check,
  ArrowRight,
  Mail,
  Play,
} from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCTA = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth?mode=signup');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <span className="text-lg font-semibold text-foreground">Biograph</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Button onClick={() => navigate('/dashboard')} size="sm">
                Tableau de bord
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/auth')}
                >
                  Se connecter
                </Button>
                <Button size="sm" onClick={handleCTA}>
                  Commencer gratuitement
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="max-w-4xl mx-auto px-6 pt-20 pb-16 sm:pt-28 sm:pb-24 text-center relative">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight">
            Ecrivez vos biographies avec les bons outils
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            De l'enregistrement des entretiens a la redaction assistee par IA — creez des recits de vie qui honorent vraiment chaque histoire
          </p>
          <p className="mt-4 text-sm sm:text-base text-muted-foreground/80 max-w-xl mx-auto">
            Une plateforme pensee pour les biographes qui souhaitent consacrer plus de temps a ecouter leurs sujets, et moins de temps a reecouter des heures d'enregistrements.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" onClick={handleCTA} className="text-base px-8 py-6 gap-2">
              Commencer gratuitement
              <ArrowRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-base px-8 py-6"
              onClick={() => window.location.href = 'mailto:erik.schjoth@gmail.com'}
            >
              <Mail className="w-4 h-4 mr-2" />
              Contactez-nous
            </Button>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-primary" />
              Aucune carte bancaire requise
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-primary" />
              Donnees securisees et privees
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-primary" />
              Support en francais
            </span>
          </div>
        </div>
      </section>

      {/* Demo Video */}
      <section className="py-16 sm:py-20 bg-secondary/30">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            Decouvrez la plateforme en 2 minutes
          </h2>
          <p className="mt-3 text-muted-foreground">
            Voir comment enregistrer, transcrire et organiser vos entretiens biographiques en quelques clics.
          </p>
          <div className="mt-8 aspect-video rounded-xl overflow-hidden bg-secondary border border-border flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Play className="w-16 h-16 mx-auto mb-3 text-primary/40" />
              <p className="text-sm">Video de demonstration</p>
              <p className="text-xs mt-1">Bientot disponible</p>
            </div>
          </div>
          <Button variant="outline" className="mt-6" onClick={handleCTA}>
            Essayer gratuitement maintenant
          </Button>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center">
            Vous connaissez ces defis. Nous aussi.
          </h2>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <ProblemCard
              icon={<MessageCircle className="w-8 h-8" />}
              title="La peur de mal retranscrire"
              description='Vous avez passe des heures avec votre sujet, recueilli ses souvenirs les plus precieux. Et maintenant, cette question vous hante : "Et si je ne rendais pas justice a son histoire ?"'
              highlight="Vous n'etes pas seul. C'est la preoccupation n°1 de tous les biographes."
            />
            <ProblemCard
              icon={<Clock className="w-8 h-8" />}
              title="Des heures perdues a reecouter"
              description="Vous vous souvenez qu'a la minute 47 de l'entretien du 12 mars, Madame Dubois a evoque son frere pendant la guerre. Mais ou exactement ? Vous rembobinez, reecoutez..."
              highlight="15 a 20 heures par projet passees a simplement chercher dans vos enregistrements."
            />
            <ProblemCard
              icon={<Puzzle className="w-8 h-8" />}
              title="Des recits non-lineaires a demeler"
              description={`"Ah, j'y pense ! En 1967... non, attendez, c'etait avant mon mariage, donc plutot 1965..." Les personnes agees racontent avec le coeur, pas avec un calendrier.`}
              highlight="10 a 15 heures par projet rien que pour remettre les histoires dans l'ordre."
            />
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-16 sm:py-20 bg-primary/5">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            Et si vous pouviez vous concentrer uniquement sur l'essentiel : l'ecoute et l'ecriture ?
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Notre plateforme prend en charge tout le reste — sans jamais remplacer votre sensibilite de biographe.
          </p>
          <p className="mt-4 text-sm text-muted-foreground max-w-xl mx-auto">
            Nous n'avons pas cree un outil qui ecrit a votre place. Nous avons cree un assistant qui vous libere des taches chronophages, pour que vous puissiez faire ce que vous faites de mieux : <strong className="text-foreground">creer des recits de vie authentiques et emouvants</strong>.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center mb-16">
            Votre nouveau processus de travail, simplifie
          </h2>

          <div className="space-y-20">
            <FeatureBlock
              icon={<Mic className="w-6 h-6" />}
              title="Enregistrez. C'est tout."
              description="Un clic pour demarrer l'enregistrement. Votre conversation est automatiquement transcrite avec une precision de 95%. Finis les carnets griffonnes ou les transcriptions manuelles."
              benefit="Gardez le contact visuel avec votre sujet. Soyez pleinement present dans la conversation, sans craindre de manquer un mot important."
              reverse={false}
            />
            <FeatureBlock
              icon={<Search className="w-6 h-6" />}
              title="Retrouvez n'importe quel moment en 30 secondes."
              description={`Tapez "frere" — tous les passages ou le sujet parle de son frere apparaissent. Cliquez sur l'un d'eux — l'audio saute directement a ce moment precis.`}
              benefit="Divisez par 7 votre temps de recherche. Ce qui prenait 20 heures en prend maintenant 3."
              reverse={true}
            />
            <FeatureBlock
              icon={<Calendar className="w-6 h-6" />}
              title="Donnez un sens chronologique aux souvenirs fragmentes."
              description={`Glissez-deposez chaque segment de recit sur une ligne du temps visuelle. "Cette histoire de l'ecole ? Vers 1952." Voyez toute la vie se deployer devant vous.`}
              benefit="Organisez une vie entiere en quelques heures au lieu de plusieurs jours."
              reverse={false}
            />
            <FeatureBlock
              icon={<PenTool className="w-6 h-6" />}
              title="Transformez vos transcriptions en prose narrative."
              description="Selectionnez un passage du transcript — l'IA vous propose des versions redigees. Vous choisissez celle qui vous plait, ou la modifiez. Toujours a votre demande, jamais automatiquement."
              benefit="Reduisez de moitie votre temps de redaction, en restant l'auteur a 100%."
              reverse={true}
            />
            <FeatureBlock
              icon={<Link2 className="w-6 h-6" />}
              title="Chaque phrase renvoie a sa source exacte."
              description={`Survolez un paragraphe — voyez instantanement d'ou vient l'information. Cliquez — reecoutez le passage original. Vous ne vous demanderez plus jamais "Ou a-t-il dit ca ?"`}
              benefit="Zero risque de deformation. Tout est verifiable."
              reverse={false}
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 sm:py-24 bg-secondary/30">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Simple et transparent
            </h2>
            <p className="mt-3 text-muted-foreground">
              Commencez gratuitement. Passez a la version payante quand vous etes pret.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Free Plan */}
            <div className="rounded-2xl border border-border bg-card p-8 flex flex-col">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-foreground">Gratuit</h3>
                <p className="text-sm text-muted-foreground mt-1">Pour decouvrir et valider</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-foreground">0 EUR</span>
                <span className="text-muted-foreground ml-1">/ mois</span>
                <p className="text-xs text-muted-foreground mt-1">Gratuit pour toujours</p>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                <PricingFeature>1 projet de biographie actif</PricingFeature>
                <PricingFeature>2 heures d'enregistrement et transcription</PricingFeature>
                <PricingFeature>Stockage securise de vos donnees</PricingFeature>
              </ul>
              <Button variant="outline" className="w-full" onClick={handleCTA}>
                Commencer gratuitement
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-3">
                Ideal pour tester sur un premier projet personnel.
              </p>
            </div>

            {/* Pro Plan */}
            <div className="rounded-2xl border-2 border-primary bg-card p-8 flex flex-col relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                Recommande
              </div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-foreground">Professionnel</h3>
                <p className="text-sm text-muted-foreground mt-1">Pour les biographes professionnels</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-foreground">69 EUR</span>
                <span className="text-muted-foreground ml-1">/ mois</span>
                <p className="text-xs text-muted-foreground mt-1">Sans engagement, annulable a tout moment</p>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                <PricingFeature highlight>Projets illimites</PricingFeature>
                <PricingFeature highlight>15 heures de transcription par mois</PricingFeature>
                <PricingFeature highlight>Assistant IA illimite</PricingFeature>
                <PricingFeature>Toutes les fonctionnalites</PricingFeature>
                <PricingFeature>Export professionnel DOCX et PDF</PricingFeature>
                <PricingFeature>Support email prioritaire</PricingFeature>
              </ul>
              <Button className="w-full" onClick={handleCTA}>
                Demarrer avec Professionnel
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-3">
                Biographes professionnels, genealogistes, historiens oraux.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center mb-12">
            Vos questions. Nos reponses.
          </h2>
          <Accordion type="single" collapsible className="space-y-2">
            <FAQItem value="tech" question="Je ne suis pas tres a l'aise avec la technologie. Est-ce complique ?">
              Non, c'est justement pense pour etre simple. Si vous savez envoyer un email et utiliser un traitement de texte, vous saurez utiliser notre plateforme. De plus, nous avons des tutoriels video de 2-3 minutes qui vous guident pas a pas. Et notre support repond en francais, avec patience et clarte.
            </FAQItem>
            <FAQItem value="ai" question="L'intelligence artificielle va-t-elle ecrire mes biographies a ma place ?">
              Absolument pas. L'IA est un assistant, pas un auteur. Elle vous suggere des reformulations uniquement quand vous le demandez. Vous restez l'auteur a 100%. C'est votre sensibilite, votre style, votre comprehension humaine qui creent la biographie.
            </FAQItem>
            <FAQItem value="security" question="Mes enregistrements sont-ils securises et confidentiels ?">
              Oui, totalement. Vos donnees sont chiffrees et stockees sur des serveurs securises en Europe (conformite RGPD). Nous ne partageons jamais vos contenus avec des tiers. Vous pouvez supprimer vos donnees a tout moment.
            </FAQItem>
            <FAQItem value="accent" question="La transcription fonctionne-t-elle avec des accents regionaux ou des personnes agees ?">
              Oui, tres bien. Notre technologie de transcription est entrainee sur des voix variees, y compris des accents francais regionaux. Pour les voix agees ou faibles, nous recommandons simplement un bon micro. Et pour les passages incertains, la transcription vous indique son niveau de confiance.
            </FAQItem>
            <FAQItem value="trial" question="Puis-je essayer avant de payer ?">
              Oui, completement. Le plan Gratuit vous permet de faire un projet complet avec 2 heures d'enregistrement. C'est largement suffisant pour realiser une premiere biographie courte et valider que la plateforme vous convient. Aucune carte bancaire requise.
            </FAQItem>
            <FAQItem value="export" question="Puis-je exporter ma biographie finale dans Word ou PDF ?">
              Oui, en un clic. Vous exportez au format DOCX (Microsoft Word) ou PDF, avec une mise en page professionnelle. Ensuite, vous etes libre de le modifier davantage, de l'imprimer, ou de l'envoyer a un editeur.
            </FAQItem>
            <FAQItem value="time" question="Combien de temps faut-il pour ecrire une biographie avec votre outil ?">
              Ca depend de la longueur visee, mais nos utilisateurs rapportent un gain de temps de 50% en moyenne. Une biographie qui prenait 40-50 heures en prend maintenant 20-25. Notre objectif : que vous fassiez mieux avec le meme temps, ou aussi bien en deux fois moins de temps.
            </FAQItem>
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-primary/5 to-primary/10">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            Pret a ecrire des biographies qui rendent vraiment justice aux vies racontees ?
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Rejoignez les biographes qui consacrent leur temps a ce qui compte : l'ecoute, la connexion humaine, et l'ecriture qui honore chaque histoire.
          </p>
          <Button size="lg" className="mt-8 text-base px-8 py-6 gap-2" onClick={handleCTA}>
            Commencer gratuitement — Aucune carte bancaire requise
            <ArrowRight className="w-4 h-4" />
          </Button>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-primary" />
              Essai gratuit complet (1 projet, 2h)
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-primary" />
              Configuration en 2 minutes
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-primary" />
              Support en francais
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Biograph</span>
          </div>
          <div className="text-center sm:text-right text-sm text-muted-foreground">
            <p>Erik Schjoth — erik.schjoth@gmail.com</p>
            <p className="mt-1">Base en France</p>
          </div>
        </div>
      </footer>

      {/* Mobile sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border sm:hidden z-50">
        <Button className="w-full" onClick={handleCTA}>
          Commencer gratuitement
        </Button>
      </div>
    </div>
  );
}

/* Sub-components */

function ProblemCard({
  icon,
  title,
  description,
  highlight,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div className="w-12 h-12 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      <p className="text-sm font-medium text-foreground">{highlight}</p>
    </div>
  );
}

function FeatureBlock({
  icon,
  title,
  description,
  benefit,
  reverse,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  benefit: string;
  reverse: boolean;
}) {
  return (
    <div className={`flex flex-col ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'} gap-8 items-center`}>
      <div className="flex-1 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            {icon}
          </div>
          <h3 className="text-xl font-semibold text-foreground">{title}</h3>
        </div>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
        <div className="rounded-lg bg-primary/5 border border-primary/10 p-4">
          <p className="text-sm text-foreground">
            <strong>L'avantage pour vous :</strong> {benefit}
          </p>
        </div>
      </div>
      <div className="flex-1 aspect-video rounded-xl bg-secondary/50 border border-border flex items-center justify-center">
        <div className="text-muted-foreground/40">{icon}</div>
      </div>
    </div>
  );
}

function PricingFeature({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      <Check className={`w-4 h-4 mt-0.5 shrink-0 ${highlight ? 'text-primary' : 'text-muted-foreground'}`} />
      <span className={highlight ? 'font-medium text-foreground' : 'text-muted-foreground'}>{children}</span>
    </li>
  );
}

function FAQItem({
  value,
  question,
  children,
}: {
  value: string;
  question: string;
  children: React.ReactNode;
}) {
  return (
    <AccordionItem value={value} className="border border-border rounded-lg px-4 data-[state=open]:bg-secondary/30">
      <AccordionTrigger className="text-left text-sm font-medium hover:no-underline">
        {question}
      </AccordionTrigger>
      <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
        {children}
      </AccordionContent>
    </AccordionItem>
  );
}
