import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { CommunityGuidelinesList } from '../components/CommunityGuidelinesList';
import { Card } from '../components/byourside/ui';

export default function GuidelinesPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Volver"
          onClick={() => navigate(-1)}
          className="inline-flex size-10 items-center justify-center rounded-full bg-card shadow-soft"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="font-serif text-2xl sm:text-3xl">Normas de la comunidad</h1>
      </header>

      <p className="text-sm leading-relaxed text-muted-foreground">
        Quienes acompañan acá son personas de la comunidad, no profesionales. Estas normas existen para que este sea un
        lugar seguro para todas las personas.
      </p>

      <Card className="p-5 sm:p-6">
        <CommunityGuidelinesList className="space-y-5" />
      </Card>
    </div>
  );
}
