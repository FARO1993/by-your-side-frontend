import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { getMyMoodHistory } from "../api/statuses";
import type { MoodHistoryEntry } from "../api/types";
import { cn } from "../lib/cn";
import { buildMoodDays, summarize, type MoodDay } from "../lib/moodHistory";
import { STATUS_MOOD_UI } from "../lib/visual";
import { Card } from "./byourside/ui";

const DAYS = 14;

const weekday = new Intl.DateTimeFormat("es-AR", { weekday: "narrow" });
const longDate = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

function dayLabel(day: MoodDay): string {
  return `${longDate.format(day.date)}: ${day.mood ? STATUS_MOOD_UI[day.mood].label : "sin registro"}`;
}

/**
 * "Cómo estuviste": historial de ánimo PROPIO de las últimas dos semanas.
 * Privado (solo lo ve la persona). Sin rachas, puntajes ni juicios: los días
 * sin registro son simplemente días sin registro.
 * Si el backend no tiene el endpoint todavía (404), no se muestra nada.
 */
export function MoodHistoryCard() {
  const [entries, setEntries] = useState<MoodHistoryEntry[] | null | undefined>(
    undefined,
  );
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getMyMoodHistory(DAYS)
      .then((data) => {
        if (!cancelled) setEntries(data);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const days = useMemo(
    () => (entries ? buildMoodDays(entries, DAYS) : []),
    [entries],
  );
  const summary = useMemo(() => summarize(days), [days]);

  if (entries === null) return null;

  return (
    <section aria-labelledby="mood-history-title">
      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 id="mood-history-title" className="font-serif text-xl">
            Cómo estuviste
          </h2>
          <p className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
            <Lock className="size-3" aria-hidden="true" />
            Solo vos ves esto
          </p>
        </div>

        {failed ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No pudimos traer tu historial ahora. Probá en un rato.
          </p>
        ) : entries === undefined ? (
          <div className="mt-4 h-28 rounded-2xl skeleton" aria-hidden="true" />
        ) : (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              {summaryText(summary)}
            </p>

            <ol
              aria-label={`Tus últimos ${DAYS} días`}
              className="mt-4 grid grid-cols-7 gap-x-1 gap-y-3 sm:gap-x-2"
            >
              {days.map((day) => (
                <li
                  key={day.key}
                  className="flex flex-col items-center gap-1"
                  title={dayLabel(day)}
                >
                  <span
                    className="text-[0.65rem] uppercase text-muted-foreground"
                    aria-hidden="true"
                  >
                    {weekday.format(day.date)}
                  </span>
                  <span
                    role="img"
                    aria-label={dayLabel(day)}
                    className={cn(
                      "block size-7 rounded-full sm:size-8",
                      day.group === "steady" && "bg-mood-steady",
                      day.group === "heavy" && "bg-mood-heavy",
                      day.group === null &&
                        "border-2 border-dashed border-border",
                    )}
                  />
                  <span
                    className="text-[0.7rem] tabular-nums text-muted-foreground"
                    aria-hidden="true"
                  >
                    {day.date.getDate()}
                  </span>
                </li>
              ))}
            </ol>

            <ul
              className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground"
              aria-label="Referencias"
            >
              <Legend swatch="bg-mood-steady" label="Más tranquilos" />
              <Legend swatch="bg-mood-heavy" label="Más pesados" />
              <Legend
                swatch="border-2 border-dashed border-border"
                label="Sin registro"
              />
            </ul>

            {summary.heavy >= 3 && summary.heavy >= summary.steady ? (
              <p className="mt-4 rounded-2xl bg-presence-soft/70 p-3 text-sm text-foreground">
                Vienen siendo días pesados. No tenés que atravesarlo en soledad:{" "}
                <Link
                  to="/help"
                  className="font-medium text-presence-strong underline-offset-2 hover:underline"
                >
                  hay personas para hablar ahora
                </Link>
                , y también podés contarlo acá.
              </p>
            ) : null}

            {summary.recorded > 0 ? (
              <details className="mt-4 text-sm">
                <summary className="cursor-pointer text-listening-strong underline-offset-2 hover:underline">
                  Ver día por día
                </summary>
                <ul className="mt-2 space-y-1 text-muted-foreground">
                  {[...days]
                    .reverse()
                    .filter((day) => day.mood)
                    .map((day) => (
                      <li key={day.key}>
                        <span className="capitalize">
                          {longDate.format(day.date)}
                        </span>
                        {" · "}
                        <span className="text-foreground">
                          {STATUS_MOOD_UI[day.mood!].label}
                        </span>
                      </li>
                    ))}
                </ul>
              </details>
            ) : null}
          </>
        )}
      </Card>
    </section>
  );
}

function summaryText({
  recorded,
  steady,
  heavy,
}: {
  recorded: number;
  steady: number;
  heavy: number;
}): string {
  if (recorded === 0) {
    return "Todavía no hay registros. Cuando elijas cómo llegás en el inicio, va a aparecer acá.";
  }
  const days = (count: number) => (count === 1 ? "1 día" : `${count} días`);
  const parts = [
    steady > 0
      ? `${days(steady)} más tranquilo${steady === 1 ? "" : "s"}`
      : null,
    heavy > 0 ? `${days(heavy)} más pesado${heavy === 1 ? "" : "s"}` : null,
  ].filter(Boolean);
  return `En estas dos semanas registraste ${days(recorded)}: ${parts.join(" y ")}.`;
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <li className="inline-flex items-center gap-1.5">
      <span
        className={cn("inline-block size-3 rounded-full", swatch)}
        aria-hidden="true"
      />
      {label}
    </li>
  );
}
