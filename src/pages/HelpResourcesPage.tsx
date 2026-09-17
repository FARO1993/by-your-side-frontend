import { Link } from 'react-router-dom';

export default function HelpResourcesPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="font-serif text-3xl font-semibold text-ink">Recursos de ayuda</h1>
      <p className="mt-3 text-dusk">
        Si estás pasando un momento muy difícil, no estás solo/a. Estas líneas están atendidas
        por profesionales, son gratuitas y confidenciales.
      </p>

      <section className="mt-8 border-l-2 border-horizon bg-white p-5">
        <h2 className="font-serif text-xl font-semibold text-ink">
          Si estás en crisis ahora mismo
        </h2>
        <div className="mt-4 flex flex-col gap-3">
          <a href="tel:08009990091" className="block">
            <span className="font-medium text-horizon">0800-999-0091</span>
            <p className="text-sm text-dusk">
              Línea Nacional de Salud Mental (Ministerio de Salud) — Argentina, 24hs, gratuita
            </p>
          </a>
          <a href="tel:911" className="block">
            <span className="font-medium text-horizon">911</span>
            <p className="text-sm text-dusk">Emergencias — si hay riesgo inmediato para tu vida</p>
          </a>
          <a href="tel:107" className="block">
            <span className="font-medium text-horizon">107</span>
            <p className="text-sm text-dusk">SAME — emergencias médicas en CABA</p>
          </a>
        </div>
      </section>

      <section className="mt-6 border-l-2 border-mist bg-white p-5">
        <h2 className="font-serif text-xl font-semibold text-ink">Apoyo especializado</h2>
        <div className="mt-4 flex flex-col gap-3">
          <a href="tel:135" className="block">
            <span className="font-medium text-ink">135</span>
            <p className="text-sm text-dusk">
              Centro de Asistencia al Suicida — línea gratuita, anónima y confidencial
            </p>
          </a>
          <a href="tel:141" className="block">
            <span className="font-medium text-ink">141</span>
            <p className="text-sm text-dusk">
              SEDRONAR — orientación y acompañamiento por consumos problemáticos
            </p>
          </a>
        </div>
      </section>

      <p className="mt-6 text-sm text-dusk">
        ¿No estás en Argentina? Buscá "línea de prevención del suicidio" junto con el nombre de tu
        país, o comunicate con el servicio de emergencias local.
      </p>

      <p className="mt-8 text-sm text-dusk">
        ByYourSide es un espacio de acompañamiento entre personas, no un servicio de salud mental
        ni un sustituto de ayuda profesional.{' '}
        <Link to="/feed" className="font-medium text-horizon hover:underline">
          Volver a la app
        </Link>
      </p>
    </div>
  );
}