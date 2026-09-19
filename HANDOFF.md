# ByYourSide — Design Handoff (v0 → Cursor)

This document is a **UI/visual handoff only**. It describes the "Presencia" design
system and screens built in v0 so you can integrate the visuals into your existing
React + TypeScript + Vite + React Router + Tailwind application.

> **Scope guardrails**
> - No new product functionality is introduced.
> - No backend, auth, database, or API contracts are defined or replaced here.
> - Every list of data (posts, notifications, conversations…) is **mock sample data**
>   whose TypeScript shapes are meant to map onto your **existing** API models.
> - Where you see "integration point", wire it to the endpoint you already have.
>   Do not invent endpoints or models.

---

## 1. Design tokens

All tokens are defined in `app/globals.css` as CSS custom properties on `:root`,
exposed to Tailwind via the `@theme inline` block. Colors use the **oklch** color
space. Only **two semantic accents** carry the product:

- **Presence / Empathy → coral** ("estoy con vos", "no estás solo/a")
- **Listening / Support → teal** ("te leo", "contame más")

Everything else stays quiet so those two signals read instantly.

### Colors — surfaces & ink

| Token | CSS var | Value (oklch) | Use |
|---|---|---|---|
| Background / Cream | `--background`, `--cream` | `oklch(0.976 0.008 70)` | App canvas (warm off-white) |
| Foreground / Ink | `--foreground` | `oklch(0.29 0.02 275)` | Primary text (deep warm slate) |
| Card | `--card` | `oklch(0.995 0.004 75)` | Card/surface background |
| Card foreground | `--card-foreground` | `oklch(0.29 0.02 275)` | Text on cards |
| Popover | `--popover` | `oklch(0.995 0.004 75)` | Popover surface |
| Muted | `--muted` | `oklch(0.955 0.01 70)` | Subtle fills, hover states |
| Muted foreground | `--muted-foreground` | `oklch(0.5 0.02 278)` | Secondary text |
| Border | `--border` | `oklch(0.9 0.01 70)` | Hairline borders |
| Input | `--input` | `oklch(0.9 0.01 70)` | Field borders |
| Ring | `--ring` | `oklch(0.7 0.12 30)` | Focus ring (coral) |
| Destructive | `--destructive` | `oklch(0.58 0.16 28)` | Errors |

### Presence colors (coral)

| Token | CSS var | Value | Use |
|---|---|---|---|
| Presence | `--presence` | `oklch(0.71 0.13 32)` | Primary coral (buttons, active nav) |
| Presence strong | `--presence-strong` | `oklch(0.56 0.15 32)` | AA-contrast coral **text** on light |
| Presence soft | `--presence-soft` | `oklch(0.95 0.03 40)` | Tinted backgrounds, badges, active pills |
| Presence foreground | `--presence-foreground` | `oklch(0.99 0.01 60)` | Text/icons on coral fills |

### Listening colors (teal)

| Token | CSS var | Value | Use |
|---|---|---|---|
| Listening | `--listening` | `oklch(0.63 0.07 195)` | Primary teal |
| Listening strong | `--listening-strong` | `oklch(0.47 0.07 197)` | AA-contrast teal **text** on light |
| Listening soft | `--listening-soft` | `oklch(0.955 0.02 190)` | Tinted backgrounds, badges |
| Listening foreground | `--listening-foreground` | `oklch(0.99 0.01 190)` | Text/icons on teal fills |

> shadcn neutral slots (`--primary`, `--secondary`, `--accent`, etc.) are kept so the
> stock `components/ui/button.tsx` still works; `--primary` is aliased to coral.

### Typography

| Property | Value |
|---|---|
| Sans family | `--font-sans` = Inter → `ui-sans-serif, system-ui, sans-serif` |
| Serif family | `--font-serif` = Fraunces → `ui-serif, Georgia, serif` |
| Headings (`h1–h4`) | serif, `font-weight: 500`, `letter-spacing: -0.01em` |
| Body | sans, antialiased, `text-rendering: optimizeLegibility` |

Font sizes use Tailwind's default scale. Notable in-app choices:
- Section titles / card headings: `text-lg` **serif** (`SectionTitle`, `EmptyState`, `ErrorState` all use `font-serif`).
- Body copy: `text-sm` / `text-[0.975rem]` for inputs, `leading-relaxed` for post/message content.
- Micro labels (mobile nav, badges, hints): `text-xs` / `text-[0.65rem]`.

Font weights used: `font-medium` (labels/nav), `font-semibold` (buttons, section titles), serif `500` (headings).

### Border radius

Base `--radius: 1rem`. Scale (from `@theme inline`):

| Token | Value |
|---|---|
| `--radius-sm` | `calc(1rem - 4px)` = `0.75rem` |
| `--radius-md` | `calc(1rem - 2px)` = `0.875rem` |
| `--radius-lg` | `1rem` |
| `--radius-xl` | `calc(1rem + 6px)` = `1.375rem` |
| `--radius-2xl` | `calc(1rem + 12px)` = `1.75rem` |

In practice: cards use `rounded-2xl`, fields use `rounded-xl`, buttons/pills/badges use `rounded-full`.

### Shadows

Custom utilities in `@layer utilities` (soft, layered — no harsh drop shadows):

- `.shadow-soft`
  `0 1px 2px -1px oklch(0.29 0.02 275 / 0.06), 0 4px 16px -6px oklch(0.29 0.02 275 / 0.08)`
- `.shadow-lift`
  `0 2px 4px -2px oklch(0.29 0.02 275 / 0.08), 0 12px 32px -12px oklch(0.29 0.02 275 / 0.14)`

### Spacing

Tailwind's default 4px-based spacing scale (`gap-*`, `p-*`, `space-y-*`). Common rhythm:
page padding `px-4 sm:px-6`, vertical stack `space-y-4/6`, card padding `p-5`/`p-6`/`p-8`/`p-10`.
Layouts are **flexbox-first**; grid is used only for the Discover topic grid.

### Animation / easing

- Easing token: `--ease-calm: cubic-bezier(0.22, 1, 0.36, 1)` (used via `ease-[var(--ease-calm)]`).
- Keyframe utilities:
  - `.animate-gentle-pop` — `gentle-pop 0.32s` (scale 1 → 1.06 → 1), used on response actions.
  - `.animate-soft-rise` — `soft-rise 0.4s` (fade + 6px translateY), used on cards/empty states.
  - `.skeleton` — shimmer gradient `1.6s` infinite, for loading placeholders.
- Transitions: buttons `transition-all duration-200`, `active:translate-y-px`.
- **Reduced motion**: all three animations are disabled under `@media (prefers-reduced-motion: reduce)`.

### Breakpoints

Tailwind defaults. The single meaningful breakpoint in this design is **`md` (768px)**:
below `md` → mobile (bottom tab bar, single column); at/above `md` → desktop (top header,
multi-column). `sm` is used for minor padding bumps. Messages uses `md` to switch between
one-pane (mobile) and two-column (desktop).

---

## 2. Shared components

Two source files hold everything reusable:

**`components/byourside/ui.tsx`** (framework-agnostic primitives):

| Component | Purpose / API notes |
|---|---|
| `PresenceGlyph` | Two interlocking rings SVG — the brand mark. `className` only. |
| `Button` | Pill button. `variant`: `presence \| listening \| outline \| ghost \| soft`; `size`: `sm \| md \| lg`; `loading`, `fullWidth`. Renders a spinner when loading. |
| `IconButton` | Circular 40px icon button. Requires `label` (aria-label). Used for header actions; positions notification dots via `absolute`. |
| `TextField` | Labeled input. Props: `label`, `hint`, `error`, `icon` (Lucide). Wires `aria-invalid`/`aria-describedby`. |
| `TextArea` | Labeled multiline input. Props: `label`, `hint`. |
| `Badge` | Small pill. `tone`: `neutral \| presence \| listening`. |
| `Card` | Rounded surface (`rounded-2xl bg-card shadow-soft`). Polymorphic via `as`. |
| `Spinner` | Inline status spinner with sr-only `label`. |
| `EmptyState` | Centered empty message. Props: `icon`, `title`, `description`, `action`. |
| `ErrorState` | `role="alert"` error card. Props: `title`, `description`, `onRetry`. |
| `SectionTitle` | Serif section heading (`h2`). |

**`components/byourside/app-shell.tsx`** (layout & navigation):

| Component | Purpose / API notes |
|---|---|
| `AppShell` | Controlled shell. Props: `active: Route`, `onNavigate(route)`, `children`, `width` (`xl \| 2xl \| 5xl`), `bare` (skip centered padding, for full-height screens), `unread`. Renders `DesktopNav` + `MobileNav`. |
| `DesktopNav` (internal) | Sticky top header ≥ `md`: logo, primary nav, messages/help icon buttons, "Compartir" CTA, avatar. |
| `MobileNav` (internal) | Sticky top mini-header + fixed bottom tab bar < `md`, with a raised center "Compartir" FAB. Respects `env(safe-area-inset-bottom)`. |
| `Route` (type) | Union of all screen ids — see §3. |

**Other existing byourside components referenced** (already in the project before this pass):
`Logo`, `Avatar` (`name`, `size`), `Feed` and its internal `PostCard` / `ResponseActions` / `Composer` / `SupportBanner` (in `components/byourside/feed.tsx`). `SupportBanner` gained an optional `onOpenHelp` callback so its button can route to the Help screen; `Feed` forwards it.

---

## 3. Screens

All screens live in `components/byourside/screens/*` and are composed by the demo
router `components/byourside/app-demo.tsx`, which owns `active`/`onNavigate` state and
renders each screen inside `AppShell`. Every screen is a **controlled, presentational**
component — it takes data + callbacks as props (in the demo, fed from sample data).

Routes (`Route` union): `feed`, `discover`, `create`, `notifications`, `profile`,
`messages`, `companion`, `help`, `login`, `register`.

### Feed (`feed.tsx`)
- **Layout**: single centered column (`AppShell width="xl"`), composer at top, post list below, `SupportBanner`.
- **Components**: `Composer`, `PostCard`, `ResponseActions` (presence/listening choices), `SupportBanner`.
- **Responsive**: single column both breakpoints; nav switches via `AppShell`.
- **Interactions**: choose a presence/listening response (`animate-gentle-pop`); open composer; SupportBanner → Help.
- **Empty**: `EmptyState` ("aún no hay publicaciones"). **Loading**: skeleton post cards (`.skeleton`). **Error**: `ErrorState` with `onRetry`.
- **Integration points**: fetch feed posts; submit a post; submit a response; counts. Purely visual: layout, mood dots, banner copy.

### Discover (`discover.tsx`)
- **Layout**: search field + **grid** of topic cards (`grid` is the one place grid is used) + suggested people list.
- **Components**: `TextField` (search icon), topic `Card`s tinted by `tone`, suggested-person rows with follow button.
- **Responsive**: 1 column mobile → 2–3 columns at `md`/`lg`.
- **Interactions**: search input; follow/"acompañar" toggle; open topic.
- **Empty**: no-results `EmptyState`. **Loading**: skeleton grid. **Error**: `ErrorState`.
- **Integration points**: topic list, search query, suggested people, follow action. Visual: tinting, layout.

### Create Post (`create-post.tsx`)
- **Layout**: focused single-column composer — author row, large `TextArea`, mood selector, submit bar.
- **Components**: `Avatar`, `TextArea`, mood chips (`Badge`-like), `Button` (presence).
- **Responsive**: full-width card mobile; centered narrow column desktop.
- **Interactions**: type content, pick a mood tone, character affordance, submit (`loading` state on button).
- **Empty**: n/a (creation form). **Loading**: submit button `loading`. **Error**: inline error message / `ErrorState` on submit failure.
- **Integration points**: create-post mutation, mood value. Visual: composer chrome, mood chips.

### Notifications (`notifications.tsx`)
- **Layout**: single column list grouped by read/unread; each row = actor avatar + icon glyph (presence/listening/comment/follow) + text + optional excerpt + timestamp.
- **Components**: `Avatar`, kind glyph, `Badge`, `timeAgo()` helper.
- **Responsive**: single column both breakpoints.
- **Interactions**: mark read on view/click; tap navigates to related post/profile.
- **Empty**: `EmptyState` ("no tenés novedades"). **Loading**: skeleton rows. **Error**: `ErrorState`.
- **Integration points**: notifications list, unread count, mark-as-read. Visual: kind glyphs, grouping.

### Profile (`profile.tsx`)
- **Layout**: header (avatar, name, handle, bio, mood, stat trio: acompañando / te acompañan / presencia recibida) + user's posts.
- **Components**: `Avatar`, `Badge`, stat blocks, `PostCard`, edit + **logout** affordance (logout routes to `login`).
- **Responsive**: stacked header mobile; roomier desktop.
- **Interactions**: edit profile; logout; view own posts.
- **Empty**: `EmptyState` for no posts. **Loading**: skeleton header + posts. **Error**: `ErrorState`.
- **Integration points**: current user, profile stats, user posts, logout action. Visual: header layout, stat presentation.

### Messages (`messages.tsx`)
- **Layout**: **`AppShell bare` full-height**. Desktop `md`+ = two columns (conversation list | thread). Mobile = list, tapping a conversation swaps to the thread with a back button.
- **Components**: `ConversationList` rows (avatar, name, last message, unread dot), `MessageBubble` (mine vs theirs), composer input, `Avatar`, `timeAgo()`.
- **Responsive**: two-pane ≥ `md`; single-pane push/back < `md`.
- **Interactions**: select conversation; send message; back navigation on mobile; unread badge clears.
- **Empty**: no-conversations `EmptyState`; "select a conversation" placeholder on desktop right pane. **Loading**: skeleton list/bubbles. **Error**: `ErrorState`.
- **Integration points**: conversations, messages, send-message mutation, unread counts. Visual: bubble styling, two-pane layout.

### Modo compañía / Companion (`companion.tsx`)
- **Layout**: calm, reduced-chrome single column — a focused mode for accompanying others; larger type, more whitespace, gentle prompts.
- **Components**: `Card`, `Button` (listening/presence), `SectionTitle`, quiet prompts.
- **Responsive**: centered narrow column both breakpoints.
- **Interactions**: enter/exit companion mode; send a presence/listening gesture.
- **Empty**: gentle `EmptyState` when nobody needs accompanying. **Loading**: subtle spinner. **Error**: `ErrorState`.
- **Integration points**: whatever feed/queue drives "who to accompany" in your app. Visual: the calm mode treatment is entirely presentational.

### Help / Crisis (`help.tsx`)
- **Layout**: the most sensitive screen — calm, reassuring single column: supportive heading, reassurance copy, **helpline list**, quiet secondary actions.
- **Components**: `Card`, helpline rows (region, name, contact), `Button`, `SectionTitle`.
- **Responsive**: single column both breakpoints, generous spacing.
- **Interactions**: tap-to-call/contact links; return to feed.
- **Empty/Loading/Error**: static content; if you fetch a real directory, use `EmptyState`/`ErrorState`.
- **Integration points**: `HELP_LINES` is **placeholder data** — wire to your real resource directory. Visual: layout, reassurance copy, tone.

### Login (`auth.tsx`)
- **Layout**: two-panel on desktop (warm brand/emotional panel + form panel); single-column stacked on mobile.
- **Components**: `TextField` (email, password), `Button` (presence, `fullWidth`, `loading`), `PresenceGlyph`/`Logo`, link to Register.
- **Responsive**: side-by-side ≥ `md`; brand panel collapses/omits on mobile.
- **Interactions**: submit credentials (button `loading`), navigate to Register, forgot-password link.
- **Empty**: n/a. **Loading**: submit `loading`. **Error**: field `error` props + form-level `ErrorState`/message.
- **Integration points**: **your existing auth**. This screen is UI only — bind submit to your current login endpoint/session logic. Do not add new auth.

### Register (`auth.tsx`)
- Same two-panel treatment as Login. Fields: name, email, password (+ any your API already requires).
- **Interactions**: submit registration, navigate to Login.
- **Integration points**: your existing registration flow. UI only.

---

## 4. Existing functionality integration (per screen)

For every screen below, "Visual only" = safe to drop in as-is; "Needs your API" = bind
to endpoints/models you **already have**. No endpoints or models are invented here — the
TS interfaces in `lib/byourside.ts` and `lib/byourside-data.ts` are shape suggestions to
adapt to your real models.

| Screen | Visual only | Needs your existing API |
|---|---|---|
| Feed | layout, mood dots, banner, response animation | fetch posts, create post, send response, counts |
| Discover | grid/card tinting, layout | topics, search, suggested people, follow |
| Create Post | composer chrome, mood chips | create-post mutation |
| Notifications | kind glyphs, grouping, `timeAgo` | notifications list, unread, mark-read |
| Profile | header/stat layout | current user, stats, user posts, logout |
| Messages | bubbles, two-pane layout | conversations, messages, send, unread |
| Companion | calm-mode treatment | your accompany queue/feed source |
| Help/Crisis | layout, copy, tone | real helpline directory (replace `HELP_LINES`) |
| Login/Register | two-panel layout, fields | **your existing auth** (login/register/session) |

**Sample data to replace with real API data** (all in `lib/`):
`SAMPLE_POSTS`, `PROFILE_POSTS`, `CURRENT_USER`, `SUGGESTED_PEOPLE`, `DISCOVER_TOPICS`,
`NOTIFICATIONS`, `CONVERSATIONS`, `HELP_LINES`. `RESPONSE_OPTIONS` and `MOOD_TONE_STYLES`
are **UI config** (labels/styles) and can stay as design constants.

---

## 5. React / Vite migration notes

The v0 build targets Next.js; your target is React + TS + Vite + React Router. What to adapt:

- **`"use client"` directives** (top of `ui.tsx`, `app-shell.tsx`, screens): **delete them.**
  They are Next.js App Router markers and are meaningless/ignored under Vite.
- **Fonts**: v0 loads Inter/Fraunces via `next/font` and exposes them as `--font-inter` /
  `--font-fraunces` (referenced by `--font-sans` / `--font-serif`). Under Vite, load the
  fonts yourself (Fontsource or `<link>` to Google Fonts) and define
  `--font-inter` / `--font-fraunces` (or point `--font-sans`/`--font-serif` directly at
  the family names) in your global CSS. All component classes reference the CSS vars, so no
  component changes are needed once the vars resolve.
- **`app/globals.css`**: move its contents into your Vite global stylesheet (e.g.
  `src/index.css`). It uses **Tailwind v4** syntax (`@import 'tailwindcss'`, `@theme inline`,
  `@custom-variant`, `@layer`). Ensure your project is on Tailwind v4; if you are on v3,
  port the tokens into `tailwind.config` `theme.extend` and convert `@theme inline` vars
  accordingly. The `shadcn/tailwind.css` and `tw-animate-css` imports are optional niceties.
- **`app/page.tsx` + `app/layout.tsx`**: Next.js entrypoints. Replace with your Vite entry
  (`main.tsx` + `App.tsx`) and route tree. `layout.tsx` metadata → set via `index.html` /
  `react-helmet` or leave to your app.
- **Routing**: `app-demo.tsx` uses local `useState<Route>` as a stand-in router. Replace
  with React Router: map `AppShell`'s `active` to the current path and `onNavigate` to
  `navigate(path)`. `AppShell` is already **controlled** precisely so this swap is clean.
  Suggested path map: `feed → "/"`, `discover → "/discover"`, `create → "/create"`,
  `notifications → "/notifications"`, `profile → "/profile"`, `messages → "/messages"`,
  `companion → "/companion"`, `help → "/help"`, `login → "/login"`, `register → "/register"`.
- **No other Next.js APIs are used** — no `next/image`, `next/link`, server actions, route
  handlers, or `next/navigation` inside the components. Icons come from `lucide-react`
  (works anywhere). The `cn` helper is `clsx`/`tailwind-merge` in `lib/utils.ts` (portable).
- **`@/` import alias**: replicate in `vite.config.ts` + `tsconfig` `paths` (map `@/` → `src/`).
- **Avatar images**: `Avatar` falls back to warm initials when `avatarUrl` is absent — no
  image host needed.

---

## 6. Cursor implementation plan (functionality-preserving)

Because your app already works, integrate the **visual layer** without touching data flow:

1. **Bring in tokens first.** Port `globals.css` (tokens, utilities, keyframes) into your
   Vite global stylesheet and confirm the font CSS vars resolve. Verify a page renders with
   the cream background + serif headings before touching components. *(Lowest risk, no logic.)*
2. **Add the primitives.** Copy `components/byourside/ui.tsx` (strip `"use client"`). These
   have no data dependencies. Add `cn` in `lib/utils.ts` if not present.
3. **Add the shell.** Copy `app-shell.tsx`, wire `active`/`onNavigate` to **your existing
   React Router** instead of the demo state. Keep your existing route guards/auth.
4. **Refactor screens one at a time, leaf-first**, replacing your current UI while keeping
   your existing data hooks/selectors. Recommended order (least to most coupled to backend):
   Help → Discover → Notifications → Profile → Feed → Create Post → Messages → Companion.
   For each: render the new component, then feed it your real data + handlers (replace the
   `lib/` sample constants with your existing fetch/query results).
5. **Auth screens last.** Swap Login/Register visuals in, binding submit handlers to your
   **existing** auth calls and session handling. Do not change the auth logic.
6. **Verify per screen** that existing behavior is unchanged (data loads, mutations fire,
   navigation and guards work) before moving on. The sample `lib/` data can stay temporarily
   as a fallback while wiring, then be deleted.

Keep `RESPONSE_OPTIONS` and `MOOD_TONE_STYLES` as design constants; delete the rest of the
sample data once real data is wired.

---

## 7. File / component map (existing → new visual)

Adjust left-hand paths to your real repo structure. The right-hand column is what this
handoff provides.

| Your existing page/component | New visual component (from v0) |
|---|---|
| App root / layout & nav chrome | `components/byourside/app-shell.tsx` (`AppShell` + nav) |
| Router / top-level screen switch | pattern from `components/byourside/app-demo.tsx` → your React Router |
| Feed page | `components/byourside/feed.tsx` (`Feed`, `PostCard`, `ResponseActions`, `Composer`, `SupportBanner`) |
| Discover / Explore page | `components/byourside/screens/discover.tsx` |
| New post / composer page | `components/byourside/screens/create-post.tsx` |
| Notifications page | `components/byourside/screens/notifications.tsx` |
| Profile page | `components/byourside/screens/profile.tsx` |
| Messages / chat page | `components/byourside/screens/messages.tsx` |
| Companion mode page | `components/byourside/screens/companion.tsx` |
| Help / crisis page | `components/byourside/screens/help.tsx` |
| Login page | `components/byourside/screens/auth.tsx` (login view) |
| Register page | `components/byourside/screens/auth.tsx` (register view) |
| Shared buttons/inputs/badges/cards/states | `components/byourside/ui.tsx` |
| Brand mark / logo / avatar | `PresenceGlyph` (in `ui.tsx`), `components/byourside/logo.tsx`, `components/byourside/avatar.tsx` |
| Your API models | shape references in `lib/byourside.ts` + `lib/byourside-data.ts` (adapt, don't adopt blindly) |
| Global styles / theme | `app/globals.css` → your Vite global CSS |

---

### One-line summary
Port `globals.css` tokens → drop in `ui.tsx` primitives → wire `AppShell` to React Router →
refactor screens leaf-first while keeping your existing data/auth → replace sample `lib/`
data with your real API responses. No backend, auth, or API contracts change.
