# Sesión y cuenta — frontend

Decisiones de la fase 1.6. El contrato HTTP sigue viviendo en el backend
(`API_CONTRACT.md`, `FRONTEND_HANDOFF.md`). Este archivo no lo duplica: describe
cómo el frontend lo aplica.

## Tokens

`AuthResponse` ya no tiene `token`. Login y register leen `accessToken` y
`refreshToken`, más `tokenType` y `expiresIn`.

- El access token dura 15 minutos (`expiresIn: 900`) y se manda como
  `Authorization: Bearer <accessToken>`.
- El refresh token dura 30 días, rota en cada `POST /api/auth/refresh` y no se
  usa como Bearer.
- Los endpoints públicos de auth no llevan ese header y un 401 en ellos no
  dispara refresh: login, register, refresh, logout, verify-email,
  resend-verification, forgot-password y reset-password.
- `POST /api/auth/change-password` sí requiere el access token.

## Dónde se guardan

Acceso único en `src/auth/authStorage.ts`.

- `accessToken`: memoria, espejado en `sessionStorage` para reutilizarlo en un
  reload de la misma pestaña mientras no expiró.
- `refreshToken`: `localStorage`, clave `byyourside.refreshToken`.

Deuda explícita: migrar el refresh token a una cookie `HttpOnly` `Secure`
`SameSite` en una fase futura. Esta fase no implementa cookies ni CSRF.

El campo viejo `localStorage.token` se borra y no se vuelve a escribir.

## Refresh

`src/api/client.ts` adjunta el access token. Ante un 401 de un endpoint
autenticado:

1. si hay refresh token, un solo vuelo (`refreshSession`) llama a
   `POST /api/auth/refresh`;
2. guarda el access token y el refresh token nuevos;
3. reintenta la request original una vez (`_retry`);
4. si el refresh falla, o el reintento vuelve a dar 401, limpia la sesión y
   manda a login con «Tu sesión expiró. Iniciá sesión nuevamente.».

Varios 401 simultáneos comparten la misma promesa. Además, el refresh toma el
Web Locks API (`byyourside-auth-refresh`) cuando el navegador lo ofrece, para
no presentar el mismo refresh token desde dos pestañas y disparar la detección
de reuse del backend.

Un 401 de `POST /api/auth/refresh` no vuelve a intentar refresh: ese llamado
usa un cliente Axios aparte, sin el interceptor.

## Logout y contraseñas

- Logout: `POST /api/auth/logout` con `{ "refreshToken" }`, best effort. La
  sesión local se limpia siempre, aunque el backend no responda.
- Change password exitoso: limpia access, refresh y el usuario, y va a login.
  El refresh queda suspendido para que un 401 posterior no reviva la sesión.
- Reset password exitoso: no guarda tokens. Limpia cualquier sesión local y va
  a login.

## Arranque

`AuthContext` tiene `initializing`, `authenticated` y `unauthenticated`.
`ProtectedRoute` muestra el spinner mientras `loading` (`initializing`) es
verdadero. En un reload, si el access token de la pestaña sigue vigente se
usa; si no, y hay refresh token, se renueva una vez antes de pedir
`GET /api/users/me`.

## Bienvenida animada

El componente `AnimatedWelcome` ya estaba en `develop` (merge de
`feature/animated-welcome`). No se rehízo. La figura coral es presencia y la
teal es escucha; el estado final coincide con el logo.

Se muestra una sola vez, después de un registro exitoso, como overlay. No
aparece en un login normal, en un reload ni al navegar el resto de la app.

Como el backend no expone un campo de onboarding, la marca es temporal y por
usuario:

- `byyourside.welcomePending.<userId>`
- `byyourside.welcomeSeen.<userId>`

El `userId` sale de `GET /api/users/me`. `welcomeSeen` se escribe solo cuando
la animación termina (`Empecemos`) o cuando el fallback «Continuar» se usa
porque la pantalla falló. Cerrar la pestaña a la mitad no la marca como vista.

`prefers-reduced-motion: reduce` salta el movimiento y muestra el estado final
estático, con el botón para entrar. La vista `/dev/welcome` sigue existiendo
solo en desarrollo para revisar la animación.

## Correo y contraseña

Rutas públicas, alineadas con los links del backend
(`APP_FRONTEND_URL`):

- `/verify-email?token=...` → `POST /api/auth/verify-email`
- `/forgot-password` → `POST /api/auth/forgot-password`
- `/reset-password?token=...` → `POST /api/auth/reset-password`

El token de esos links no se muestra en la página ni se escribe en logs. El
reenvío de verificación y el pedido de recuperación muestran un mensaje
genérico: el cliente no intenta saber si el correo existe o si ya estaba
verificado.

Cambiar contraseña está en `/account/password`, dentro de la zona autenticada,
con acceso desde el perfil propio.

## Nota sobre la documentación del backend

`FRONTEND_HANDOFF.md`, sección «Limitaciones actuales conocidas», todavía dice
que no hay refresh token ni cambio de contraseña. Esa frase contradice el
resto de ese documento y `API_CONTRACT.md`, que son los que se siguieron. No
se modificó ningún archivo del backend.
