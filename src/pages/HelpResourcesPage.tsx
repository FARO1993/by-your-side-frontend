import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, MessageCircle, Phone, Wind } from 'lucide-react';
import { Button, Card, PresenceGlyph, SectionTitle } from '../components/byourside/ui';
import { Logo } from '../components/byourside/logo';

const helpLines = [
  {
    region: 'Argentina',
    name: 'Línea Nacional de Salud Mental (Ministerio de Salud)',
    contact: '0800-999-0091',
    tel: '08009990091',
    note: '24hs, gratuita',
  },
  {
    region: 'Argentina',
    name: 'Emergencias',
    contact: '911',
    tel: '911',
    note: 'si hay riesgo inmediato para tu vida',
  },
  {
    region: 'CABA',
    name: 'SAME',
    contact: '107',
    tel: '107',
    note: 'emergencias médicas',
  },
  {
    region: 'Argentina',
    name: 'Centro de Asistencia al Suicida',
    contact: '135',
    tel: '135',
    note: 'línea gratuita, anónima y confidencial',
  },
  {
    region: 'Argentina',
    name: 'SEDRONAR',
    contact: '141',
    tel: '141',
    note: 'orientación y acompañamiento por consumos problemáticos',
  },
] as const;

export default function HelpResourcesPage() {
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
        <h1 className="font-serif text-2xl sm:text-3xl">Ayuda ahora</h1>
      </header>

      <Card className="bg-gradient-to-r from-presence-soft via-card to-listening-soft p-6 sm:p-8">
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-card/70 text-presence-strong">
          <PresenceGlyph className="h-4 w-6" />
        </div>
        <p className="font-serif text-xl text-pretty sm:text-2xl">
          Si estás pasando por un momento muy difícil, no estás solo/a.
        </p>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted-foreground">
          Estas líneas están atendidas por profesionales, son gratuitas y confidenciales. Pedir ayuda
          está bien.
        </p>
      </Card>

      <section>
        <SectionTitle>Líneas de ayuda</SectionTitle>
        <ul className="mt-3 space-y-3">
          {helpLines.map((line) => (
            <li key={line.tel}>
              <a
                href={`tel:${line.tel}`}
                className="flex items-start gap-3 rounded-2xl bg-card p-4 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-presence-soft text-presence-strong">
                  <Phone className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[0.7rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                    {line.region}
                  </span>
                  <span className="mt-0.5 block font-medium text-foreground">{line.name}</span>
                  <span className="mt-1 block font-serif text-lg text-presence-strong">{line.contact}</span>
                  <span className="text-sm text-muted-foreground">{line.note}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
          <ExternalLink className="mt-0.5 size-4 shrink-0" />
          ¿No estás en Argentina? Buscá "línea de prevención del suicidio" junto con el nombre de tu
          país, o comunicate con el servicio de emergencias local.
        </p>
      </section>

      <section>
        <SectionTitle>Mientras tanto</SectionTitle>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Card className="p-5">
            <span className="flex size-10 items-center justify-center rounded-full bg-listening-soft text-listening-strong">
              <Wind className="size-4" />
            </span>
            <p className="mt-3 font-serif text-lg">Respirar un momento</p>
            <p className="mt-1 text-sm text-muted-foreground">
              No hace falta resolverlo todo ahora. Podés ir despacio.
            </p>
          </Card>
          <Card className="p-5">
            <span className="flex size-10 items-center justify-center rounded-full bg-presence-soft text-presence-strong">
              <MessageCircle className="size-4" />
            </span>
            <p className="mt-3 font-serif text-lg">Hablar con alguien de acá</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Si preferís compañía en ByYourSide, podés abrir tus mensajes.
            </p>
            <div className="mt-4">
              <Button size="sm" variant="soft" onClick={() => navigate('/messages')}>
                Abrir mensajes
              </Button>
            </div>
          </Card>
        </div>
      </section>

      <p className="flex items-center justify-center gap-2 pb-2 text-sm text-muted-foreground">
        <Logo />
        Siempre vas a encontrar esto en el menú.
      </p>
    </div>
  );
}
