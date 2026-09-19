# ByYourSide — Visual Handoff Specification

> **Objetivo de este documento.** Permitir que otro agente de código (Cursor)
> **replique visualmente 1:1** el diseño de este proyecto de v0 dentro de una
> aplicación **React/Vite existente**, conservando la **funcionalidad, rutas y
> APIs reales** de esa aplicación.
>
> - **Fuente de verdad del DISEÑO** → este proyecto de v0.
> - **Fuente de verdad de la FUNCIONALIDAD/DATOS** → la app externa.
>
> Todos los valores de esta especificación están extraídos del código real
> (`app/globals.css`, `components/byourside/**`, `lib/byourside*.ts`). No hay
> valores inventados. Los datos de ejemplo (`SAMPLE_POSTS`, `CONVERSATIONS`,
> etc.) son **mock**: se reemplazan por datos reales, pero la **forma visual**
> descrita debe mantenerse.

---

## 0. Concepto de diseño ("Presencia")

Sistema cálido, calmo y humano. **Dos acentos semánticos** cargan todo el
producto y deben leerse al instante; todo lo demás permanece silencioso.

| Acento | Color | Significado | Uso |
|---|---|---|---|
| **Presence** | Coral | Empatía · "Estoy acá", "no estás solo/a" | Acción primaria, presencia, mood pesado/tierno |
| **Listening** | Teal | Escucha · "Te leo", "contame más" | Acción secundaria, escucha, mood estable/buscando |

La marca es **dos anillos entrelazados** (coral + teal) — dos personas, lado a
lado. El solapamiento es el punto.

Regla transversal: superficies neutras cálidas, sombras suaves (nunca duras),
esquinas redondeadas generosas, tipografía serif para títulos y sans para
cuerpo, micro-interacciones lentas y calmas.

---

## 1. Design Tokens (valores EXACTOS)

Definidos en `app/globals.css` con Tailwind v4 (`@theme inline`) y variables
CSS en `:root`. **`color-scheme: light` únicamente** — no hay tema oscuro.

### 1.1 Colores — formato OKLCH

Todos los colores están en **OKLCH**. Copiá los valores tal cual.

```css
:root {
  color-scheme: light;
  --radius: 1rem;

  /* Lienzo neutro cálido */
  --cream:               oklch(0.976 0.008 70);
  --background:          oklch(0.976 0.008 70);  /* = cream */
  --foreground:          oklch(0.29 0.02 275);   /* tinta slate cálida profunda */

  --card:                oklch(0.995 0.004 75);
  --card-foreground:     oklch(0.29 0.02 275);
  --popover:             oklch(0.995 0.004 75);
  --popover-foreground:  oklch(0.29 0.02 275);

  --muted:               oklch(0.955 0.01 70);
  --muted-foreground:    oklch(0.5 0.02 278);

  --border:              oklch(0.9 0.01 70);
  --input:               oklch(0.9 0.01 70);
  --ring:                oklch(0.7 0.12 30);     /* foco coral */

  /* Presence / Empatía — coral */
  --presence:            oklch(0.71 0.13 32);
  --presence-strong:     oklch(0.56 0.15 32);    /* texto AA sobre claro */
  --presence-soft:       oklch(0.95 0.03 40);
  --presence-foreground: oklch(0.99 0.01 60);

  /* Listening / Escucha — teal */
  --listening:           oklch(0.63 0.07 195);
  --listening-strong:    oklch(0.47 0.07 197);   /* texto AA sobre claro */
  --listening-soft:      oklch(0.955 0.02 190);
  --listening-foreground:oklch(0.99 0.01 190);

  /* Slots neutros shadcn (para button.tsx, etc.) */
  --primary:             oklch(0.71 0.13 32);    /* = presence */
  --primary-foreground:  oklch(0.99 0.01 60);
  --secondary:           oklch(0.955 0.01 70);
  --secondary-foreground:oklch(0.29 0.02 275);
  --accent:              oklch(0.955 0.01 70);
  --accent-foreground:   oklch(0.29 0.02 275);
  --destructive:         oklch(0.58 0.16 28);
}
```

**Mapeo semántico rápido**

- Texto principal → `--foreground`. Texto secundario → `--muted-foreground`.
- Superficie de página → `--background` (cream). Superficie de tarjeta → `--card` (casi blanco cálido).
- Bordes/inputs → `--border` / `--input` (mismo valor).
- Anillo de foco → `--ring` (coral).
- Fondos "soft" (chips, banners, estados) → `--presence-soft` / `--listening-soft`.
- Texto de acento accesible → `--presence-strong` / `--listening-strong` (NUNCA uses `--presence`/`--listening` para texto sobre claro; son para rellenos/bordes/puntos).

> **Nota Tailwind v4.** Los tokens se exponen como utilidades vía `@theme inline`
> con prefijo `--color-*`: `bg-background`, `text-foreground`, `bg-card`,
> `bg-muted`, `text-muted-foreground`, `border-border`, `bg-presence`,
> `text-presence-foreground`, `bg-listening`, `bg-presence-soft`,
> `text-presence-strong`, `text-listening-strong`, `bg-cream`, etc.
> En un proyecto Vite con Tailwind v3 esto se traduce a `theme.extend.colors`
> (ver §11).

### 1.2 Utilidades de color adicionales (definidas a mano en `@layer utilities`)

```css
.bg-presence-soft   { background-color: var(--presence-soft); }
.bg-listening-soft  { background-color: var(--listening-soft); }
.text-presence-strong  { color: var(--presence-strong); }
.text-listening-strong { color: var(--listening-strong); }
.border-presence  { border-color: var(--presence); }
.border-listening { border-color: var(--listening); }
```

### 1.3 Tipografía

Dos familias, cargadas como variables de fuente (Next usa `next/font`; en Vite
usá `@fontsource` o Google Fonts y definí las variables CSS):

```css
--font-sans:  var(--font-inter),    ui-sans-serif, system-ui, sans-serif;
--font-serif: var(--font-fraunces), ui-serif, Georgia, serif;
```

| Rol | Familia | Peso | Detalle |
|---|---|---|---|
| **Títulos `h1`–`h4`** | **Fraunces** (serif) | `500` | `letter-spacing: -0.01em`. Aplicado globalmente en `@layer base`. |
| **Cuerpo / UI** | **Inter** (sans) | `400`/`500`/`600` | Antialiased, `text-rendering: optimizeLegibility`. |

`body` usa `--font-sans`, `-webkit-font-smoothing: antialiased`.

**Escala de tamaños usada realmente** (clases Tailwind → rem):

| Contexto | Clase | Tamaño |
|---|---|---|
| Título de pantalla (desktop) | `text-3xl` | 1.875rem |
| Título de pantalla (mobile) / dialog | `text-2xl` | 1.5rem |
| Sub-título de sección / card title | `text-xl` / `text-lg` | 1.25 / 1.125rem |
| Nombre de autor / label fuerte | `text-base` | 1rem |
| Cuerpo de post | `text-[0.975rem]` | 0.975rem |
| Cuerpo de mensaje / lista | `text-[0.95rem]` | 0.95rem |
| Composer grande (create) | `text-[1.05rem]` | 1.05rem |
| Cuerpo secundario / meta | `text-sm` | 0.875rem |
| Timestamps / captions / hints | `text-xs` | 0.75rem |
| Micro-label mobile nav | `text-[0.65rem]` | 0.65rem |
| Eyebrow / row label | `text-[0.7rem]` uppercase | 0.7rem |

**Letter-spacing especial:** eyebrows y row-labels usan `tracking-[0.12em]` o
`tracking-[0.1em]` en mayúsculas (`uppercase`). Títulos serif usan `-0.01em`.

**Balance de texto:** títulos largos usan `text-balance`; párrafos de intro,
`text-pretty`.

### 1.4 Espaciado

Escala Tailwind estándar (múltiplos de 0.25rem). Valores recurrentes:

- **Gaps entre cards en una lista:** `space-y-4` (1rem).
- **Gaps entre secciones de pantalla:** `space-y-5` / `space-y-6` (1.25 / 1.5rem).
- **Padding de card:** `p-4` (móvil) → `p-5`/`p-6` (superior). Composer `p-4 sm:p-5`. PostCard `p-5 sm:p-6`.
- **Padding de header/banner con gradiente:** `p-6 sm:p-8`.
- **Gaps horizontales avatar↔texto:** `gap-3` (0.75rem).
- **Padding horizontal del main:** `px-4 sm:px-6`.
- **Padding vertical del main:** `pt-6 md:pt-8`, `pb-28 md:pb-16` (el `pb` grande deja lugar a la bottom-nav móvil).

### 1.5 Radios

```css
--radius: 1rem;               /* base (lg) */
--radius-sm:  calc(var(--radius) - 4px);  /* 0.75rem  → rounded-sm slot */
--radius-md:  calc(var(--radius) - 2px);  /* 0.875rem */
--radius-lg:  var(--radius);              /* 1rem */
--radius-xl:  calc(var(--radius) + 6px);  /* ~1.375rem */
--radius-2xl: calc(var(--radius) + 12px); /* ~1.75rem */
```

Uso real:

- **Cards / superficies:** `rounded-2xl` (contenedor de mensajes usa `rounded-3xl`).
- **Botones, pills, chips, badges, inputs redondos:** `rounded-full`.
- **Inputs de formulario (TextField/TextArea):** `rounded-xl`.
- **Burbujas de chat:** `rounded-2xl` + esquina "cola" `rounded-br-md` (míos) / `rounded-bl-md` (otros).
- **Foco por teclado:** `border-radius: 6px` en el outline.

### 1.6 Sombras (suaves, en capas — nunca drop-shadows duros)

```css
.shadow-soft {
  box-shadow:
    0 1px 2px -1px oklch(0.29 0.02 275 / 0.06),
    0 4px 16px -6px oklch(0.29 0.02 275 / 0.08);
}
.shadow-lift {
  box-shadow:
    0 2px 4px -2px oklch(0.29 0.02 275 / 0.08),
    0 12px 32px -12px oklch(0.29 0.02 275 / 0.14);
}
```

- `shadow-soft`: reposo de casi todas las tarjetas, botones sólidos, chips activos.
- `shadow-lift`: hover de PostCard y TopicCard (elevación).

### 1.7 Motion

```css
--ease-calm: cubic-bezier(0.22, 1, 0.36, 1);
```

| Animación | Keyframes | Duración / easing | Uso |
|---|---|---|---|
| `animate-gentle-pop` | scale 1 → 1.06 → 1 | `0.32s var(--ease-calm)` | Pill de respuesta al activarse |
| `animate-soft-rise` | opacity 0→1, `translateY(6px→0)` | `0.4s var(--ease-calm) both` | Entrada de PostCard, EmptyState |
| `skeleton` (shimmer) | `background-position -200%→200%` | `1.6s ease-in-out infinite` | Skeletons de carga |

- **Transiciones de hover/estado:** `transition-colors` o `transition-all duration-200 ease-[var(--ease-calm)]`.
- **Active (press) de botones/pills:** `active:translate-y-px` (y `active:scale-95` en el FAB móvil).
- **Hover de cards elevables:** `hover:-translate-y-0.5` + `hover:shadow-lift`.
- **`@media (prefers-reduced-motion: reduce)`** desactiva `gentle-pop`, `soft-rise` y `skeleton`.

---

## 2. Iconografía

- **Librería:** [`lucide-react`](https://lucide.dev). Reemplazá 1:1 en Vite (mismo paquete).
- **Tamaños:** `size-4` (1rem) para inline/labels, `size-5` (1.25rem) para nav e íconos de acción, `size-6` para hero circles.
- **Stroke width:** `2` por defecto; `2.4`/`2.5` para énfasis (activo, spinner, `+` del FAB); `1.8` para íconos grandes en círculos hero.

| Icono | Contexto |
|---|---|
| `Home` | Nav "Inicio" |
| `Compass` | Nav "Descubrir" |
| `Plus` | Nav "Compartir" / FAB / botón crear |
| `Bell` | Nav "Novedades" / empty de notificaciones |
| `User` | Nav "Perfil" |
| `MessageCircle` | Mensajes (header actions), tarjeta de ayuda |
| `LifeBuoy` | Ayuda (header actions) |
| `Ear` | Escucha (row label, botones, notificaciones) |
| `Heart` | Modo compañía (hero, guideline) |
| `ShieldCheck` | Guideline de seguridad (companion) |
| `MessageSquare` | Contador de respuestas (post), notificación tipo comentario |
| `Search` | Inputs de búsqueda (discover, messages) |
| `UserPlus` | Acompañar (discover), notificación tipo follow |
| `Check` | Estado "Acompañás" (discover) |
| `ArrowLeft` | Volver (create, help, chat móvil) |
| `Send` | Enviar mensaje |
| `RefreshCw` | Actualizar feed |
| `CalendarDays` | Fecha de alta (perfil) |
| `Settings` | Editar perfil |
| `Globe`, `Users`, `Lock` | Audiencia en Create Post |
| `Mail`, `Lock`, `User` | Inputs de auth |
| `Wind` | "Respirar un momento" (help) |
| `ExternalLink` | Nota de emergencias (help) |
| `Phone` | Líneas de ayuda (help) |
| `Loader2` | Spinner (`animate-spin`) |

**SVG propios (no lucide):**

- **`Logo`** (`components/byourside/logo.tsx`): `viewBox="0 0 44 28"`, `h-6 w-auto`. Dos círculos `r=11`, `stroke-width=2.5`, centros en `cx=16` (stroke `var(--presence)`) y `cx=28` (stroke `var(--listening)`), ambos `cy=14`, `fill=none`. Wordmark opcional "ByYourSide" en serif `text-lg font-semibold tracking-tight`.
- **`PresenceGlyph`** (en `ui.tsx` y duplicado en `response-actions.tsx`): `viewBox="0 0 24 16"`. Dos círculos `r=6`, `stroke-width=1.8`, `cx=9` y `cx=15`, `cy=8`, `currentColor`. Se dimensiona con `h-3.5 w-5` o `h-4 w-6`.

---

## 3. Componentes reutilizables

Ubicación: `components/byourside/ui.tsx` (primitivas), más
`avatar.tsx`, `logo.tsx`, `composer.tsx`, `post-card.tsx`,
`response-actions.tsx`, `post-skeleton.tsx`, `app-shell.tsx`.

> Todas las primitivas son **framework-agnósticas** (React + TS + Tailwind).
> Dependen sólo de `lucide-react` y de `cn` (helper `clsx`/`tailwind-merge` en
> `@/lib/utils`).

### 3.1 `Button`

Propósito: acción principal/secundaria en todo el producto.

- **Base:** `inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 ease-[var(--ease-calm)] active:translate-y-px disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none`
- **Variantes:**
  - `presence` (default): `bg-presence text-presence-foreground shadow-soft hover:brightness-[1.03]`
  - `listening`: `bg-listening text-listening-foreground shadow-soft hover:brightness-[1.03]`
  - `outline`: `border border-border bg-card text-foreground hover:bg-muted`
  - `ghost`: `text-foreground/80 hover:bg-muted hover:text-foreground`
  - `soft`: `bg-presence-soft text-presence-strong hover:brightness-[0.98]`
- **Tamaños:** `sm` = `min-h-9 px-3.5 text-sm`, `md` = `min-h-11 px-5 text-sm`, `lg` = `min-h-12 px-6 text-base`.
- **Props:** `variant`, `size`, `loading` (muestra `Loader2` girando + deshabilita), `fullWidth` (`w-full`).
- **Estados:** hover = brillo/fondo; active = `translate-y-px`; disabled/loading = `opacity-50`, sin puntero; focus = anillo global (`--ring`).

### 3.2 `IconButton`

- Botón circular de 40px: `relative inline-flex size-10 items-center justify-center rounded-full text-foreground/80 hover:bg-muted hover:text-foreground`.
- Requiere `label` (→ `aria-label`). Contenedor `relative` para badges de notificación absolutos.

### 3.3 `TextField`

- Estructura: `<label>` (`text-sm font-medium`) + wrapper `relative` + `<input>`; hint (`text-xs text-muted-foreground`) o error (`text-xs font-medium text-destructive`).
- Input: `min-h-11 w-full rounded-xl border border-input bg-card px-3.5 text-[0.975rem]`, placeholder `text-muted-foreground`, `focus:border-presence focus-visible:outline-none`.
- Con `icon` (LucideIcon): ícono `absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground`, input recibe `pl-10`.
- Error: `border-destructive` + `aria-invalid`. Wire `aria-describedby` a hint/err.

### 3.4 `TextArea`

- Igual estilo que TextField pero multilinea: `rounded-xl border border-input bg-card p-3.5 text-[0.975rem] leading-relaxed resize-none`, `focus:border-presence`.

### 3.5 `Badge`

- `inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset`.
- Tonos: `neutral` (`bg-muted text-muted-foreground ring-border`), `presence` (`bg-presence-soft text-presence-strong ring-presence/25`), `listening` (`bg-listening-soft text-listening-strong ring-listening/25`).

### 3.6 `Card`

- `rounded-2xl bg-card shadow-soft`. Polimórfico vía `as`. El padding lo pone el consumidor.

### 3.7 `Spinner`

- `Loader2` `size-4 animate-spin text-presence` + texto `sr-only`, `role="status"`.

### 3.8 `EmptyState`

- `animate-soft-rise rounded-2xl bg-card p-10 text-center shadow-soft`.
- Círculo `size-12 rounded-full bg-presence-soft text-presence-strong` con ícono (`size-6`) o `PresenceGlyph`.
- Título serif `text-lg`; descripción `text-sm text-muted-foreground max-w-xs`; `action` opcional centrada.

### 3.9 `ErrorState`

- `role="alert"`, `rounded-2xl border border-border/60 bg-card p-8 text-center shadow-soft`.
- Título serif `text-lg`, descripción `text-sm`, botón `outline` `Reintentar` (`onRetry`).
- Copys por defecto: "Algo no salió como esperábamos" / "No pudimos cargar esto ahora. Podés intentarlo de nuevo en un momento."

### 3.10 `SectionTitle`

- `font-serif text-lg font-semibold text-foreground`.

### 3.11 `Avatar` (`avatar.tsx`)

- Círculo con `overflow-hidden rounded-full font-medium ring-1 ring-black/[0.04]`.
- Tamaños: `sm` = `size-9 text-sm`, `md` = `size-11 text-base`, `lg` = `size-16 text-xl`.
- Sin imagen: **iniciales** (hasta 2) + **tinte determinista** por hash del nombre entre 3 opciones: `bg-presence-soft text-presence-strong`, `bg-listening-soft text-listening-strong`, `bg-muted text-muted-foreground`.
- Con `src`: `<img className="size-full object-cover">`. `aria-hidden` (decorativo).

### 3.12 `Composer` (`composer.tsx`) — compositor inline del feed

- `section rounded-2xl bg-card p-4 shadow-soft sm:p-5`.
- Layout: Avatar `md` + columna con textarea (`rows=2`, sin borde, `bg-transparent`, placeholder "¿Cómo venís hoy? Acá te leemos sin apuro…").
- Fila de mood chips ("¿Cómo estás hoy?"): pills `min-h-9 rounded-full border border-border bg-background px-3 text-sm`, single-select con `data-[on=true]`; tinte teal para `steady`/`reaching`, coral para `heavy`/`tender`.
- Footer con separador `border-t border-border/60 pt-3`: texto "Compartís con quienes te acompañan." + botón "Compartir" (habilitado sólo con texto: coral `shadow-soft`; deshabilitado: `bg-muted text-muted-foreground cursor-not-allowed`).

### 3.13 `PostCard` (`post-card.tsx`) — unidad central del feed

- `article animate-soft-rise overflow-hidden rounded-2xl bg-card shadow-soft hover:shadow-lift transition-shadow duration-300`. Padding `p-5 sm:p-6`.
- **Header:** Avatar `md` + nombre serif `text-base font-semibold` + `MoodChip` opcional + `<time>` `text-xs text-muted-foreground` (`timeAgo`).
- **MoodChip:** `rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset` con estilos de `MOOD_TONE_STYLES[tone]` (punto `size-1.5` + texto + ring).
- **Contenido:** `mt-4 max-w-prose text-[0.975rem] leading-relaxed text-foreground/90`.
- **`ResponseActions`** (ver 3.14) — foco emocional.
- **Footer** (`border-t border-border/60 pt-3.5 text-xs text-muted-foreground`): "N te acompaña(n)" (punto coral), "N ofrece(n) escucha" (punto teal), y a la derecha botón de respuestas con `MessageSquare`.

### 3.14 `ResponseActions` (`response-actions.tsx`) — núcleo emocional

Reemplaza el clásico "like/comment". **Dos filas separadas**, cada una
single-select:

- **Fila Presencia:** contenedor `rounded-2xl bg-presence-soft/40 p-3.5`. RowLabel con `PresenceGlyph` + "PRESENCIA" (`text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-presence-strong`) + regla `bg-presence/25`.
- **Fila Escucha:** contenedor `rounded-2xl bg-listening-soft/40 p-3.5`. RowLabel con `Ear` + "ESCUCHA" en teal.
- **Pills:** `min-h-11 rounded-full border px-4 text-sm font-medium`, transición calma, `active:translate-y-px`.
  - Inactiva: `border-border bg-card text-foreground/80`, hover pinta el soft del tono.
  - Activa: `animate-gentle-pop` + `border-{tono} bg-{tono}-soft text-{tono}-strong shadow-soft`. `aria-pressed`, `aria-label` = intención.
- **Confirmación:** `aria-live="polite"`, texto que aparece con `opacity` cuando hay respuesta: "Le hiciste saber que **estás de su lado.**"
- Opciones desde `RESPONSE_OPTIONS` (3 presencia + 3 escucha).

### 3.15 `PostCardSkeleton` (`post-skeleton.tsx`)

- Misma silueta que PostCard: `rounded-2xl bg-card p-5 shadow-soft sm:p-6`.
- Barras `.skeleton` (shimmer) `rounded-full`: avatar `size-11`, líneas de título/meta, 3 líneas de contenido (100/92/75%), y dos bloques `h-16 rounded-2xl` (las filas de respuesta).

### 3.16 `AppShell` (`app-shell.tsx`) — layout global

Ver §4 (navegación) y §6 (responsive). Es **controlado**: recibe `active`,
`onNavigate`, `width`, `bare`, `unread`. Contiene `DesktopNav` + `MobileNav` y
un `<main>` centrado (o contenedor "bare" para full-height).

---

## 4. Navegación

Modelo de rutas conceptual (tipo `Route` en `app-shell.tsx`):

```
feed · discover · create · notifications · profile · messages · companion · help · login · register
```

Ítems de la barra principal (`NAV`):

| id | label | icon |
|---|---|---|
| `feed` | Inicio | `Home` |
| `discover` | Descubrir | `Compass` |
| `create` | Compartir | `Plus` |
| `notifications` | Novedades | `Bell` |
| `profile` | Perfil | `User` |

Acciones secundarias siempre accesibles: **Mensajes** (`MessageCircle`) y
**Ayuda** (`LifeBuoy`). `companion` existe como ruta pero no está en la barra
(se llega por navegación programática).

### 4.1 Desktop nav (`md:` en adelante)

- `header sticky top-0 z-30 h-16 border-b border-border/60 bg-background/80 backdrop-blur-md`, contenido `max-w-5xl px-6`, `gap-6`.
- Izquierda: `Logo` (botón → feed).
- Centro (`mx-auto`): pills de nav (excluye `create`): `rounded-full px-4 py-2 text-sm font-medium`. Activa: `bg-presence-soft text-presence-strong` (+ `aria-current="page"`). Inactiva: `text-muted-foreground hover:bg-muted hover:text-foreground`. Ícono `size-4`.
- Derecha: `IconButton` Mensajes (con punto coral `absolute right-1.5 top-1.5 size-2 rounded-full bg-presence ring-2 ring-background` si `unread>0`; activo pinta `bg-presence-soft`), `IconButton` Ayuda (activo `bg-listening-soft`), botón sólido "Compartir" (coral, `Plus size-4`), y Avatar `sm` (→ perfil, `hover:scale-[1.03]`).

### 4.2 Mobile nav (`< md`)

- **Top bar:** `header sticky top-0 z-30 h-14 border-b bg-background/85 backdrop-blur-md px-4`. Logo + IconButtons Mensajes/Ayuda.
- **Bottom tab bar:** `nav fixed inset-x-0 bottom-0 z-30 border-t bg-background/90 backdrop-blur-md`, con `paddingBottom: env(safe-area-inset-bottom)`.
  - 5 ítems `flex-1`, `min-h-14 text-[0.65rem] font-medium`, ícono `size-5` (`strokeWidth` 2.4 si activo). Activo: `text-presence-strong`. Inactivo: `text-muted-foreground`.
  - **`create` es un FAB central**: círculo `size-11 rounded-full bg-presence text-presence-foreground shadow-soft`, `Plus size-5 strokeWidth-2.5`, `active:scale-95`.
  - `notifications` muestra punto coral cuando `unread>0`.

### 4.3 Contenedor principal (`AppShell`)

- Wrapper: `flex min-h-dvh flex-col bg-background`.
- `bare=false` (default): `<main className="mx-auto w-full px-4 pb-28 pt-6 sm:px-6 md:pb-16 md:pt-8 {maxWidth}">`.
- `bare=true` (Messages): `<div className="flex-1">` sin padding.
- **Anchos de contenido** (`MAX_WIDTH`): `xl` = `max-w-xl` (36rem), `2xl` = `max-w-2xl` (42rem), `5xl` = `max-w-5xl` (64rem).

---

## 5. Especificación por pantalla

> Cada pantalla documenta: ruta conceptual · ancho · layout · orden · componentes
> · estados · responsive. El ancho lo asigna `AppDemo` (`WIDTH` map).

### 5.1 Feed — `feed` (`feed.tsx`)

- **Ancho:** `max-w-xl`. **Layout:** columna única, `pb-28` móvil por la tab-bar.
- **Orden vertical:**
  1. `Greeting`: `h1` serif `text-2xl sm:text-3xl` "Hola, Facundo" + subtítulo `text-sm text-muted-foreground`.
  2. `SupportBanner`: `rounded-2xl border border-border/60 bg-card/60 p-4`, `flex items-start gap-3`. Logo sin wordmark (teal), eyebrow "PARA TENER PRESENTE" (`uppercase tracking-[0.1em]`), texto, y link "¿Necesitás ayuda ahora?" (`text-listening-strong hover:underline`) → `onHelp` (navega a `help`).
  3. `Composer` (3.12).
  4. Fila "Cerca tuyo" (SectionTitle) + botón "Actualizar" (`RefreshCw size-3.5`, `text-xs text-muted-foreground`).
  5. Lista de posts `space-y-4`.
- **Estados:**
  - **Loading:** 2 × `PostCardSkeleton` (simulado con `setTimeout` 900ms; en la app real, wire a estado de carga real).
  - **Empty:** card centrada con Logo, título "Todavía está en calma por acá" + copy.
  - **Contenido:** `SAMPLE_POSTS.map(PostCard)`.

### 5.2 Post / PostCard — (no es ruta; unidad dentro de feed, profile, companion)

Ver 3.13 y 3.14. Estados internos: pill inactiva/hover/activa (con pop),
confirmación `aria-live`, contadores optimistas (±1). Hover de tarjeta →
`shadow-lift`.

### 5.3 Profile — `profile` (`screens/profile.tsx`)

- **Ancho:** `max-w-2xl`. **Layout:** columna, `space-y-6`.
- **Orden:**
  1. **Card de perfil** (`overflow-hidden`):
     - Banner gradiente `h-24 sm:h-28 bg-gradient-to-r from-presence-soft via-card to-listening-soft`.
     - Avatar `lg` con `-mt-10 ring-4 ring-card` (solapa el banner); a la derecha botones `outline` "Mensajes" (`MessageCircle`) y `soft` "Editar perfil" (`Settings`).
     - Nombre serif `text-2xl` + `Badge` de mood (tono `listening` si `steady`, si no `presence`).
     - `@handle` (`text-sm text-muted-foreground`), bio (`max-w-prose text-[0.95rem]`), fecha de alta (`CalendarDays` + `text-xs`).
     - Fila de stats `border-t pt-4 gap-8`: 3 × `Stat` (valor serif `text-xl` + label `text-xs`): "te acompañan", "acompañás", "presencia recibida".
  2. **Tabs** (`role="tablist"`): contenedor `rounded-full bg-muted p-1`; tab activa `bg-card text-foreground shadow-soft`, inactiva `text-muted-foreground`. Tabs: "Publicaciones" / "Presencia recibida".
  3. **Contenido de tab:** posts (`PROFILE_POSTS.map(PostCard)`) o `EmptyState` (sin ícono) para "Presencia recibida".
  4. Botón `ghost` "Cerrar sesión" centrado → navega a `login`.

### 5.4 Discover — `discover` (`screens/discover.tsx`)

- **Ancho:** `max-w-2xl`. **Layout:** `space-y-6`.
- **Orden:**
  1. Encabezado `h1` `text-2xl sm:text-3xl` "Descubrir" + subtítulo.
  2. **Buscador:** input `min-h-12 rounded-full border border-input bg-card pl-11 pr-4` con `Search` absoluto a la izquierda. (Estado local `query`, sin filtrado real — wire a búsqueda real.)
  3. **"Temas para acompañar":** grid `grid-cols-1 sm:grid-cols-2 gap-3` de `TopicCard`.
     - **TopicCard:** botón `flex-col items-start gap-2 rounded-2xl border p-4 shadow-soft hover:-translate-y-0.5 hover:shadow-lift`. Borde/fondo según tono (`border-presence/20 bg-presence-soft/40` o teal). Círculo `size-9` con `PresenceGlyph`, título serif `text-base`, descripción `text-sm text-muted-foreground`, "N personas compartiendo" `text-xs`.
  4. **"Personas que podrías acompañar":** `Card` con `<ul divide-y divide-border/60>` de `PersonRow`.
     - **PersonRow:** Avatar `md` + nombre + razón; botón derecha alterna `soft`("Acompañar", `UserPlus`) ↔ `outline`("Acompañás", `Check`) con `aria-pressed`.
  5. Botón `ghost` "Volver al inicio".

### 5.5 Notifications — `notifications` (`screens/notifications.tsx`)

- **Ancho:** `max-w-xl`. **Layout:** `space-y-5`.
- **Orden:**
  1. Header `flex items-end justify-between`: `h1` "Novedades" + subtítulo; si hay no leídas, botón `ghost sm` "Marcar todo como leído".
  2. Lista `space-y-2` de `NotificationRow`, o `EmptyState` (ícono `Bell`) si vacío.
- **NotificationRow:** `flex gap-3 rounded-2xl p-4`. **No leída:** `bg-presence-soft/30` + punto coral `size-2` a la derecha. **Leída:** `bg-card`.
  - Avatar `md` con **badge de tipo** superpuesto (`absolute -bottom-1 -right-1`): `KindIcon` circular `size-9` — `presence`→PresenceGlyph coral, `listening`→`Ear` teal, `comment`→`MessageSquare` teal, `follow`→`UserPlus` coral.
  - Texto: **nombre** en negrita + frase (`text-foreground/80`). Excerpt opcional en `rounded-lg bg-muted/60 px-2.5 py-1 text-sm` entre comillas. `<time>` `text-xs`.
- **Estado:** "Marcar todo como leído" setea `read:true` en todos (local).

### 5.6 Messages / Chat — `messages` (`screens/messages.tsx`)

- **Ancho:** full (`bare=true`), interno `max-w-5xl`. **Altura:** `h-[calc(100dvh-3.5rem)]` móvil / `h-[calc(100dvh-4rem)]` desktop (descuenta la top-bar).
- **Contenedor:** `flex h-full overflow-hidden bg-background md:rounded-3xl md:border md:border-border/60 md:shadow-soft md:px-6 md:py-6`.
- **Layout de dos columnas (desktop `md:`):**
  - **Aside (lista):** `w-80 lg:w-96 shrink-0 border-r border-border/60 bg-card/40`. Header con `h1` "Mensajes" + buscador redondo `min-h-10`. Lista scrolleable de conversaciones.
    - **Item:** `flex gap-3 rounded-xl p-3`. Activo: `bg-presence-soft/50`. Hover: `bg-muted`. Avatar `md` + nombre + `timeAgo` + preview truncado (prefijo "Vos: " si el último es propio; negrita si no leído) + **badge de no leídos** (`min-w-5 rounded-full bg-presence px-1.5 text-xs text-presence-foreground`).
  - **Section (conversación activa):** `flex-1 min-w-0`.
    - **Header:** `flex items-center gap-3 border-b bg-background/80 p-3 backdrop-blur-md`. Botón volver (`ArrowLeft`, sólo móvil `md:hidden`), Avatar `sm`, nombre + estado teal "Está para escucharte" (punto `size-1.5 bg-listening`).
    - **Cuerpo:** `flex-1 overflow-y-auto p-4 bg-gradient-to-b from-presence-soft/20 to-listening-soft/20`. Píldora central informativa `rounded-full bg-card/70 text-xs`. Burbujas `space-y-3`.
    - **MessageBubble:** `max-w-[78%] rounded-2xl px-4 py-2.5 text-[0.95rem] shadow-soft`. Míos: `justify-end`, `bg-presence text-presence-foreground rounded-br-md`. Otros: `justify-start`, `bg-card text-foreground rounded-bl-md`. `<time>` `text-[0.7rem]`.
    - **Input:** `border-t bg-background p-3`, `form flex items-end gap-2`. Textarea `max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-input bg-card px-4 py-2.5`. Botón enviar circular `size-11 rounded-full bg-presence text-presence-foreground shadow-soft disabled:opacity-50` (`Send size-5`).
    - **Enter para enviar:** respeta IME (`!e.nativeEvent.isComposing && e.keyCode !== 229`), Shift+Enter = salto.
- **Responsive:** móvil muestra **solo lista** (`activeId=null`) o **solo conversación**; desktop muestra ambas. Estado inicial: primera conversación seleccionada en desktop.
- **Empty (desktop, sin selección):** panel centrado con `PresenceGlyph`, "Elegí una conversación" + copy (`hidden md:flex`).

### 5.7 Create Post — `create` (`screens/create-post.tsx`)

- **Ancho:** `max-w-xl`. **Layout:** `space-y-5`.
- **Orden:**
  1. Header: botón volver circular (`ArrowLeft`) + `h1` "Compartir algo".
  2. **Card compositor** `p-5 sm:p-6`:
     - Fila identidad: Avatar `md` + nombre + "Acá te leemos sin apuro.".
     - Textarea grande `rows=6 autoFocus text-[1.05rem]` sin borde, `maxLength=500`, placeholder largo. Contador `{remaining} caracteres` (`text-right text-xs`, `aria-live`).
     - Bloque "¿Cómo estás hoy? (opcional)" con mood chips (single-select, mismos tonos que Composer).
     - Bloque "¿Quién puede verlo?" con 3 chips de audiencia (`Globe` "Toda la comunidad", `Users` "Quienes me acompañan", `Lock` "Solo para mí"); activo `bg-presence-soft text-presence-strong`.
  3. Footer acciones `justify-end gap-3`: `ghost` "Cancelar" + `presence` "Compartir" (disabled sin texto). Ambos navegan a `feed`.

### 5.8 Companion (Modo compañía) — `companion` (`screens/companion.tsx`)

- **Ancho:** `max-w-2xl`. **Layout:** `space-y-6`.
- **Orden:**
  1. **Hero card:** gradiente `from-listening-soft via-card to-presence-soft p-6 sm:p-8`. Círculo `size-12` con `Heart`. `h1` serif `text-2xl sm:text-3xl` "Modo compañía" + copy. Botón toggle (`listening` "Activar" ↔ `outline` "Pausar") + indicador de estado (`aria-live`): punto + "Estás disponible" (teal) / "En pausa" (muted).
  2. **"Cómo acompañar bien":** `SectionTitle` + `Card` con lista de 3 `Guideline` (círculo `size-8 bg-card text-listening-strong shadow-soft` con ícono `Ear`/`Heart`/`ShieldCheck` + texto). El de seguridad enlaza a `help`.
  3. **"Buscando compañía ahora":** si activo, 2 × `ReachingCard`; si no, card empty con `Ear`.
- **ReachingCard:** reusa `SAMPLE_POSTS`. Card con autor+mood (inline, sin chip ring), contenido, y o bien botones (`soft` "Estoy con vos" + `listening` "Ofrecer escucha") o, tras enviar, confirmación `rounded-xl bg-listening-soft/50 text-listening-strong` (`role="status"`).

### 5.9 Help / Crisis — `help` (`screens/help.tsx`)

- **Ancho:** `max-w-2xl`. **Layout:** `space-y-6`. Tono calmo y tranquilizador.
- **Orden:**
  1. Header: volver + `h1` "Ayuda ahora".
  2. **Card líder** gradiente `from-presence-soft via-card to-listening-soft p-6 sm:p-8`: círculo `size-12` con `PresenceGlyph`, frase serif `text-xl sm:text-2xl` "Si estás pasando por un momento muy difícil, no estás solo/a." + copy tranquilizador.
  3. **"Líneas de ayuda":** `<ul space-y-3>` de `LineCard` (`rounded-2xl bg-card p-4 shadow-soft`, círculo coral con `Phone`, región en eyebrow, nombre, contacto). Nota final con `ExternalLink` sobre emergencias. Datos: `HELP_LINES` (placeholder — conectar a directorio real).
  4. **"Mientras tanto":** grid `sm:grid-cols-2` de 2 cards: "Respirar un momento" (`Wind`, teal) y "Hablar con alguien de acá" (`MessageCircle`, coral) con botón `soft` "Abrir mensajes" → `messages`.
  5. Pie: Logo sin wordmark + "Siempre vas a encontrar esto en el menú.".

### 5.10 Login — `login` (`screens/auth.tsx`)

- **Full-bleed, fuera del AppShell.** `min-h-dvh bg-background`, grid `max-w-5xl grid-cols-1 lg:grid-cols-2`.
- **WelcomePanel (izq, sólo `lg:`):** `bg-gradient-to-br from-presence-soft via-cream to-listening-soft p-10`, `flex-col justify-between`. Logo arriba; centro: círculo `size-12 bg-card/70` con `PresenceGlyph`, `h2` serif `text-3xl` "No tenés que atravesarlo solo.", copy; abajo leyenda de puntos Presencia (coral) / Escucha (teal).
- **Formulario (der):** centrado `max-w-sm`. Logo visible sólo en móvil (`lg:hidden`). `h1` "Qué bueno verte de nuevo" + subtítulo. Campos `TextField` Email (`Mail`) y Password (`Lock`), link "¿Olvidaste tu contraseña?", `Button fullWidth loading` "Ingresar". Pie: "¿Todavía no tenés cuenta? **Unite**" → `register`.
- **Estado loading:** el submit simula 900ms y navega a `feed` (wire a auth real).

### 5.11 Register — `register` (`screens/auth.tsx`)

- Igual `AuthFrame` que Login. `h1` "Te hacemos un lugar" + subtítulo. Campos: Nombre (`User`), Email (`Mail`), Password (`Lock`, hint "Al menos 8 caracteres."). `Button fullWidth` "Crear mi espacio". Nota de cuidado del espacio. Pie: "¿Ya tenés cuenta? **Ingresá**" → `login`.

---

## 6. Responsive

Breakpoint clave: **`md` (768px)** separa móvil de desktop. Se usan además
`sm` (640px) y `lg` (1024px).

| Aspecto | Mobile (`< md`) | Desktop (`≥ md`) |
|---|---|---|
| **Navegación** | Top-bar `h-14` + bottom tab-bar fija con FAB central | Header `h-16` sticky con pills + acciones + avatar |
| **Padding main** | `px-4 pt-6 pb-28` (deja lugar a la tab-bar) | `sm:px-6 md:pt-8 md:pb-16` |
| **Anchos** | Full width dentro del padding | `max-w-xl/2xl/5xl` centrado |
| **Grids (discover/help)** | `grid-cols-1` | `sm:grid-cols-2` |
| **Messages** | 1 columna: lista *o* conversación (con botón volver) | 2 columnas: lista `w-80 lg:w-96` + conversación; card `rounded-3xl border shadow-soft` |
| **Auth** | 1 columna (form), logo arriba | 2 columnas: WelcomePanel `lg:flex` + form |
| **Títulos** | `text-2xl` | `sm:text-3xl` |
| **Banners hero** | `p-6` | `sm:p-8` |
| **FAB** | Visible (centro de tab-bar) | No aplica (botón "Compartir" en header) |

- **Sticky/fixed:** headers `sticky top-0 z-30`; bottom-nav `fixed bottom-0 z-30`.
- **Safe areas:** bottom-nav usa `paddingBottom: env(safe-area-inset-bottom)`.
- **Overflow:** listas de mensajes/conversaciones `overflow-y-auto`; contenedor de chat `overflow-hidden`.
- **Altura dinámica:** se usa `min-h-dvh` y `100dvh` (no `100vh`) para respetar barras móviles.

---

## 7. Estados visuales (resumen transversal)

| Estado | Tratamiento |
|---|---|
| **Loading (lista)** | `PostCardSkeleton` con shimmer `.skeleton`. |
| **Loading (botón)** | `Button loading` → `Loader2 animate-spin` + disabled. |
| **Loading (inline)** | `Spinner` (`Loader2` coral + `sr-only`). |
| **Empty** | `EmptyState` (card centrada, círculo soft, título serif, copy, acción opcional). Feed y Companion tienen variantes propias con Logo/Ear. |
| **Error** | `ErrorState` (`role="alert"`, botón "Reintentar"). |
| **Disabled** | `opacity-50` + `pointer-events-none` (botones); compositor deshabilitado `bg-muted text-muted-foreground cursor-not-allowed`. |
| **Hover** | Cards elevables: `-translate-y-0.5 shadow-lift`. Botones sólidos: `brightness-[1.03]`. Ghost/pills: fondo `muted`/soft. |
| **Active (press)** | `active:translate-y-px` (botones/pills), `active:scale-95` (FAB). |
| **Focus (teclado)** | Global `outline: 2px solid var(--ring)` `offset 2px` `radius 6px`. Inputs: `focus:border-presence`. |
| **Selected/activo (nav/tab)** | Nav pill `bg-presence-soft text-presence-strong` + `aria-current`. Tab `bg-card shadow-soft`. Pill de respuesta activa: pop + soft + border del tono. |
| **Unread** | Notif: fila `bg-presence-soft/30` + punto coral. Mensajes: preview en negrita + badge numérico coral. Nav: punto coral sobre el ícono. |
| **Online/presencia** | Punto `size-1.5/2` coral (presencia) o teal (escucha/disponible). Chat header: "Está para escucharte". |
| **Success/confirmación** | `aria-live` calmo: "estás de su lado." (ResponseActions), banner teal (Companion). |
| **Destructive** | `--destructive` sólo para texto de error de formulario y borde de input inválido. No hay acciones destructivas rojas prominentes. |

---

## 8. Datos vs. presentación (límites de backend)

> **No inventes APIs.** Abajo se marca qué es puramente visual y qué necesita
> datos/lógica real de la app externa. Los tipos de `lib/byourside*.ts` son un
> **contrato de forma** para mapear tus modelos existentes, no un backend nuevo.

**Puramente visual (copiar tal cual):**

- Todos los tokens, tipografía, sombras, radios, animaciones, iconografía.
- Estructura y clases de cada componente y pantalla.
- Estados de hover/active/focus/selección.
- Skeletons, empty states, error states (presentación).

**Requiere datos reales (mapear a tu API):**

| Modelo (mock) | Campos clave | Reemplazar por |
|---|---|---|
| `Post` | `author`, `content`, `createdAt`, `mood{label,tone}`, `presenceCount`, `listeningCount`, `commentCount`, `myResponse` | Tu modelo de posteos/estados |
| `Author`/`Profile` | `name`, `handle`, `bio`, `avatarUrl`, stats | Tu modelo de usuario |
| `ResponseOption` | `id`, `label`, `kind` (`presence`/`listening`), `intent` | Tus tipos de reacción/apoyo |
| `AppNotification` | `kind`, `actor`, `text`, `excerpt`, `read` | Tus notificaciones |
| `Conversation`/`ChatMessage` | `participant`, `messages[]`, `unread` | Tu mensajería |
| `DiscoverTopic` | `label`, `description`, `tone`, `posts` | Tus temas/tags |
| `HELP_LINES` | `region`, `name`, `contact` | **Directorio real de líneas de crisis** (crítico: no dejar placeholders en producción) |

**Requiere lógica real (hoy simulada):**

- Auth (login/register hacen `setTimeout` → `feed`).
- Envío de post/mensaje (mutan estado local).
- Loading del feed (`setTimeout` 900ms).
- Contadores optimistas de respuestas.
- Búsqueda de discover/mensajes (input sin filtrar).
- "Marcar todo como leído", toggle "Modo compañía", follow/unfollow.
- `timeAgo(iso)` es un helper puro reusable (es-AR); podés conservarlo.

---

## 9. Cómo reproducir este diseño en una app React/Vite existente

**Reutilizá tal cual (portables, sin dependencias de Next):**

1. **Tokens CSS** → copiá los bloques `:root`, `@layer base` y `@layer utilities`
   de `app/globals.css` a tu CSS global. Con Tailwind v4 podés copiar también el
   `@theme inline`; con Tailwind v3, traducí a `tailwind.config` (§11).
2. **Primitivas** (`ui.tsx`, `avatar.tsx`, `logo.tsx`) → dependen sólo de React,
   `lucide-react` y `cn`. Copiá `cn` a `src/lib/utils.ts`
   (`clsx` + `tailwind-merge`).
3. **Componentes de dominio** (`composer`, `post-card`, `response-actions`,
   `post-skeleton`, `app-shell`) y **pantallas** (`screens/*`) → son JSX + Tailwind
   puro. Portables tras ajustar imports y el enrutado (abajo).

**Qué NO copiar de Next.js:**

- No copies `app/layout.tsx`, `app/page.tsx` ni `next/font`. En Vite:
  - Cargá Inter y Fraunces con `@fontsource/inter` / `@fontsource/fraunces`
    (o `<link>` de Google Fonts) y definí `--font-inter` / `--font-fraunces`
    en `:root` para que `--font-sans` / `--font-serif` resuelvan.
  - Importá el CSS global en `src/main.tsx`.
- No copies `"use client"` (inofensivo, pero innecesario en Vite; podés borrarlo).
- Sustituí el alias `@/` según tu `vite.config`/`tsconfig` (o cambiá a rutas
  relativas). Los imports `@/lib/utils` y `@/lib/byourside*` deben apuntar a tu
  estructura.

**Cómo mantener tu arquitectura, rutas y APIs:**

- **Enrutado.** `AppShell` es **controlado**: mapeá `active` a tu ruta actual y
  `onNavigate` a `navigate(path)` de tu router (React Router, TanStack Router,
  etc.). El tipo `Route` es una enum conceptual — asocialo a tus paths reales
  (p. ej. `feed → "/"`, `messages → "/mensajes"`). Reemplazá `AppDemo`
  (router de demo con `useState`) por tu router.
- **Auth full-bleed.** Login/Register se renderizan **fuera** del `AppShell`
  (igual que en `AppDemo`): en tu router, esas rutas no deben montar la shell.
- **Datos.** Reemplazá los imports de `SAMPLE_POSTS`, `CONVERSATIONS`,
  `NOTIFICATIONS`, `PROFILE_POSTS`, `CURRENT_USER`, etc. por tus hooks/queries
  reales (SWR/React Query/tu store). Mantené la **forma** de los tipos o adaptá
  las props de los componentes a tus modelos. Los componentes ya reciben datos
  por props (`PostCard post={...}`), así que el cambio es de origen de datos, no
  de presentación.
- **Lógica.** Cambiá los `setTimeout`/estado local por tus mutaciones reales
  (enviar post/mensaje, marcar leído, follow, login). Conservá los **estados
  visuales** (loading/empty/error) conectándolos a los estados reales de tus
  queries.
- **Contadores optimistas.** `PostCard`/`ResponseActions` ya hacen update
  optimista local; conectá `onRespond` a tu mutación y reconciliá.

**Qué se puede reemplazar visualmente sin romper nada:**

- Copys en español (es-AR) → tu tono/idioma.
- Datos placeholder de `HELP_LINES` → tu directorio real de crisis (obligatorio).
- Avatares por iniciales → imágenes reales vía prop `src` de `Avatar`.

---

## 10. Mapa visual (Screen → Layout → Components → Tokens → Responsive)

| Screen | Layout / ancho | Componentes clave | Tokens dominantes | Responsive |
|---|---|---|---|---|
| **Feed** `feed` | Columna `max-w-xl`, `space-y-` | Greeting, SupportBanner, Composer, PostCard, PostCardSkeleton, EmptyState | card, presence-soft, listening-strong, shadow-soft/lift | Tab-bar móvil / header desktop |
| **PostCard** (unidad) | `article rounded-2xl p-5 sm:p-6` | Avatar, MoodChip, ResponseActions | presence/listening soft+strong, mood tones | Chips `flex-wrap` |
| **Profile** `profile` | Columna `max-w-2xl`, `space-y-6` | Card banner, Avatar `lg`, Badge, Stat, Tabs, PostCard, EmptyState | gradiente presence→listening, muted (tabs) | Botones header `flex` |
| **Discover** `discover` | `max-w-2xl`, `space-y-6` | Buscador redondo, TopicCard (grid), PersonRow, Card | tonos por tema, shadow-lift hover | `grid-cols-1 sm:grid-cols-2` |
| **Notifications** `notifications` | `max-w-xl`, `space-y-5` | NotificationRow, KindIcon, Avatar, EmptyState | presence-soft/30 (unread), tonos por tipo | Lista fluida |
| **Messages** `messages` | Full/`max-w-5xl`, `100dvh - nav` | ConversationList, ActiveConversation, MessageBubble | presence (míos), card (otros), gradiente sutil | 1 col móvil ↔ 2 col desktop |
| **Create** `create` | `max-w-xl`, `space-y-5` | Card compositor, mood chips, audience chips, Button | presence (primario), soft chips | Chips `flex-wrap` |
| **Companion** `companion` | `max-w-2xl`, `space-y-6` | Hero gradiente, Guideline, ReachingCard, Button toggle | listening (hero/estado), gradiente listening→presence | grid guidelines/cards |
| **Help** `help` | `max-w-2xl`, `space-y-6` | Card líder gradiente, LineCard, cards "mientras tanto" | presence (líneas), listening (respirar) | `grid-cols-1 sm:grid-cols-2` |
| **Login** `login` | Grid `max-w-5xl`, full-bleed | AuthFrame, WelcomePanel, TextField, Button | gradiente presence→cream→listening | 1 col móvil ↔ 2 col `lg` |
| **Register** `register` | Igual que Login | AuthFrame, WelcomePanel, TextField (x3), Button | idem | idem |

---

## 11. Apéndice — Traducción de tokens a Tailwind v3 (Vite)

Este proyecto usa **Tailwind v4** (`@theme inline`). Si tu app Vite usa
**Tailwind v3**, mantené las variables CSS en `:root` (§1.1) y mapealas en
`tailwind.config.{js,ts}`:

```js
// tailwind.config.js (Tailwind v3)
export default {
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        cream: "var(--cream)",
        card: { DEFAULT: "var(--card)", foreground: "var(--card-foreground)" },
        popover: { DEFAULT: "var(--popover)", foreground: "var(--popover-foreground)" },
        muted: { DEFAULT: "var(--muted)", foreground: "var(--muted-foreground)" },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        presence: {
          DEFAULT: "var(--presence)",
          strong: "var(--presence-strong)",
          soft: "var(--presence-soft)",
          foreground: "var(--presence-foreground)",
        },
        listening: {
          DEFAULT: "var(--listening)",
          strong: "var(--listening-strong)",
          soft: "var(--listening-soft)",
          foreground: "var(--listening-foreground)",
        },
        destructive: "var(--destructive)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-fraunces)", "ui-serif", "Georgia", "serif"],
      },
      borderRadius: {
        sm: "calc(var(--radius) - 4px)",
        md: "calc(var(--radius) - 2px)",
        lg: "var(--radius)",
        xl: "calc(var(--radius) + 6px)",
        "2xl": "calc(var(--radius) + 12px)",
      },
      transitionTimingFunction: {
        calm: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
}
```

Con este mapeo, clases como `bg-presence`, `text-presence-strong`,
`bg-presence-soft`, `text-listening-foreground`, `border-border`, `bg-card`,
`font-serif`, `rounded-2xl` y `ease-calm` funcionan igual que en v4. Las
utilidades manuales (`.shadow-soft`, `.shadow-lift`, `.skeleton`,
`animate-gentle-pop`, `animate-soft-rise`, `.bg-presence-soft`, etc.) copialas
tal cual dentro de un `@layer utilities` en tu CSS global.

> Nota: si conservás las clases `bg-presence-soft` / `text-presence-strong`
> **tanto** como utilidades manuales (§1.2) **como** colores del theme, hay
> solapamiento inofensivo. Para v3 preferí definirlas vía `colors` del theme
> (arriba) y quitar las utilidades manuales duplicadas para evitar confusión.
```
