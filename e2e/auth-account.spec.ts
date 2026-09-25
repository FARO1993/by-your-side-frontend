import { expect, test, type Page, type Route } from '@playwright/test';

const user = {
  id: '11111111-1111-4111-8111-111111111111',
  username: 'ana',
  email: 'ana@example.com',
  displayName: 'Ana',
  bio: null,
  avatarUrl: null,
  role: 'USER',
  createdAt: '2026-09-25T00:00:00Z',
  emailVerified: false,
  emailVerifiedAt: null,
};

const emptyPage = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  number: 0,
  size: 20,
  last: true,
};

function json(route: Route, status: number, body: unknown) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

async function installApi(page: Page, hooks?: { refresh?: (route: Route) => Promise<void> }) {
  await page.route('http://localhost:8080/api/**', async (route) => {
    const request = route.request();
    const url = request.url();
    const method = request.method();
    const authorization = request.headers().authorization ?? '';

    if (url.includes('/api/auth/register') && method === 'POST') {
      return json(route, 201, {
        accessToken: 'access-reg',
        refreshToken: 'refresh-reg',
        tokenType: 'Bearer',
        expiresIn: 900,
        username: 'ana',
        role: 'USER',
      });
    }

    if (url.includes('/api/auth/login') && method === 'POST') {
      return json(route, 200, {
        accessToken: 'access-login',
        refreshToken: 'refresh-login',
        tokenType: 'Bearer',
        expiresIn: 900,
        username: 'ana',
        role: 'USER',
      });
    }

    if (url.includes('/api/auth/refresh') && method === 'POST') {
      if (hooks?.refresh) return hooks.refresh(route);
      return json(route, 200, {
        accessToken: 'access-new',
        refreshToken: 'refresh-new',
        tokenType: 'Bearer',
        expiresIn: 900,
      });
    }

    if (url.includes('/api/auth/logout')) {
      return json(route, 200, { message: 'Logged out successfully.' });
    }

    if (url.includes('/api/auth/forgot-password')) {
      return json(route, 200, {
        message: 'If an account with that email exists, we\'ve sent password reset instructions.',
      });
    }

    if (url.includes('/api/auth/reset-password')) {
      return json(route, 200, { message: 'Your password has been reset successfully.' });
    }

    if (url.includes('/api/auth/change-password')) {
      return json(route, 200, { message: 'Password changed successfully.' });
    }

    if (url.includes('/api/auth/verify-email')) {
      return json(route, 200, { emailVerified: true, emailVerifiedAt: '2026-09-25T12:00:00Z' });
    }

    if (url.includes('/api/auth/resend-verification')) {
      return json(route, 200, {
        message: 'If an account with that email needs verification, we\'ve sent a new email.',
      });
    }

    if (url.includes('/api/users/me')) {
      if (authorization === 'Bearer access-old') {
        return json(route, 401, { message: 'expired' });
      }
      return json(route, 200, user);
    }

    if (url.includes('/api/posts/feed')) return json(route, 200, emptyPage);
    if (url.includes('/api/statuses/feed')) return json(route, 200, []);
    if (url.includes('/api/conversations')) return json(route, 200, []);
    if (url.includes('/api/notifications/unread-count')) return json(route, 200, { count: 0 });

    return json(route, 200, {});
  });
}

test.describe('flujos de cuenta con API mockeada', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('register muestra la bienvenida y después entra al feed', async ({ page }) => {
    await installApi(page);
    await page.goto('/register');
    await page.getByPlaceholder('Tu nombre').fill('Ana');
    await page.getByPlaceholder('vos@ejemplo.com').fill('ana@example.com');
    await page.getByPlaceholder('Elegí una contraseña').fill('secretpass');
    await page.getByRole('button', { name: 'Crear mi espacio' }).click();

    await expect(page.getByRole('heading', { name: 'Bienvenido a ByYourSide, Ana.' })).toBeVisible();
    const presenceAnimation = await page.locator('.bys-figure-presence').evaluate((element) => getComputedStyle(element).animationName);
    expect(presenceAnimation).toBe('none');
    await page.getByRole('button', { name: 'Empecemos 💜' }).click();
    await expect(page.getByRole('heading', { name: /Bienvenido a ByYourSide/ })).toHaveCount(0);
    await expect(page).toHaveURL('/feed');
    await expect(page.getByRole('heading', { name: 'Hola, Ana' })).toBeVisible();

    await page.reload();
    await expect(page.getByRole('heading', { name: 'Hola, Ana' })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Bienvenido a ByYourSide/ })).toHaveCount(0);
  });

  test('login entra al feed sin la bienvenida', async ({ page }) => {
    await installApi(page);
    await page.goto('/login');
    await page.getByPlaceholder('vos@ejemplo.com').fill('ana@example.com');
    await page.getByPlaceholder('Tu contraseña').fill('secretpass');
    await page.getByRole('button', { name: 'Ingresar' }).click();

    await expect(page).toHaveURL('/feed');
    await expect(page.getByRole('heading', { name: 'Hola, Ana' })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Bienvenido a ByYourSide/ })).toHaveCount(0);
  });

  test('forgot password muestra una respuesta genérica', async ({ page }) => {
    await installApi(page);
    await page.goto('/forgot-password');
    await page.getByPlaceholder('vos@ejemplo.com').fill('nadie@example.com');
    await page.getByRole('button', { name: 'Enviar instrucciones' }).click();
    await expect(page.getByText('Si existe una cuenta asociada, recibirás un email con instrucciones.')).toBeVisible();
    await expect(page.getByText(/no existe/i)).toHaveCount(0);
  });

  test('reset password con token mockeado vuelve al login sin crear sesión', async ({ page }) => {
    const token = 'reset-token-no-mostrar';
    const logs: string[] = [];
    page.on('console', (message) => logs.push(message.text()));
    await installApi(page);
    await page.goto(`/reset-password?token=${token}`);

    await expect(page.getByText(token)).toHaveCount(0);
    await page.getByLabel('Nueva contraseña').fill('secretpass');
    await page.getByLabel('Confirmá la contraseña').fill('secretpass');
    await page.getByRole('button', { name: 'Restablecer contraseña' }).click();

    await expect(page).toHaveURL('/login');
    await expect(page.getByText('Tu contraseña fue restablecida. Iniciá sesión nuevamente.')).toBeVisible();
    expect(logs.join('\n')).not.toContain(token);
    await expect(page).not.toHaveURL(/\/feed/);
  });

  test('verify email no muestra el token y el reenvío es genérico', async ({ page }) => {
    const token = 'verify-token-no-mostrar';
    const logs: string[] = [];
    page.on('console', (message) => logs.push(message.text()));
    await installApi(page);
    await page.goto(`/verify-email?token=${token}`);

    await expect(page.getByText('Tu correo quedó verificado.')).toBeVisible();
    await expect(page.getByText(token)).toHaveCount(0);
    expect(logs.join('\n')).not.toContain(token);

    await page.goto('/verify-email');
    await page.getByLabel('Correo electrónico').fill('ana@example.com');
    await page.getByRole('button', { name: 'Reenviar verificación' }).click();
    await expect(
      page.getByText('Si hay una cuenta que todavía necesita verificación, te enviamos un nuevo email.'),
    ).toBeVisible();
    await expect(page.getByText(/no encontramos|ya estaba verificado/i)).toHaveCount(0);
  });

  test('change password cierra la sesión y vuelve al login', async ({ page }) => {
    await installApi(page);
    await page.goto('/login');
    await page.getByPlaceholder('vos@ejemplo.com').fill('ana@example.com');
    await page.getByPlaceholder('Tu contraseña').fill('secretpass');
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page).toHaveURL('/feed');

    await page.goto('/account/password');
    await page.getByLabel('Contraseña actual').fill('secretpass');
    await page.getByLabel('Nueva contraseña', { exact: true }).fill('newsecret');
    await page.getByLabel('Confirmá la nueva contraseña').fill('newsecret');
    await page.getByRole('button', { name: 'Actualizar contraseña' }).click();

    await expect(page).toHaveURL('/login');
    await expect(page.getByText('Contraseña actualizada. Iniciá sesión nuevamente.')).toBeVisible();
    await page.goto('/feed');
    await expect(page).toHaveURL('/login');
  });

  test('un access vencido se renueva y la request sigue', async ({ page }) => {
    let refreshCalls = 0;
    await installApi(page, {
      refresh: (route) => {
        refreshCalls += 1;
        return json(route, 200, {
          accessToken: 'access-new',
          refreshToken: 'refresh-new',
          tokenType: 'Bearer',
          expiresIn: 900,
        });
      },
    });
    await page.addInitScript(() => {
      sessionStorage.setItem('byyourside.accessToken', 'access-old');
      sessionStorage.setItem('byyourside.accessExpiresAt', String(Date.now() + 60_000));
      localStorage.setItem('byyourside.refreshToken', 'refresh-old');
    });

    await page.goto('/feed');
    await expect(page.getByRole('heading', { name: 'Hola, Ana' })).toBeVisible();
    expect(refreshCalls).toBe(1);
  });

  test('un refresh inválido lleva al login', async ({ page }) => {
    await installApi(page, {
      refresh: (route) => json(route, 400, { message: 'Refresh token has been revoked' }),
    });
    await page.addInitScript(() => {
      sessionStorage.setItem('byyourside.accessToken', 'access-old');
      sessionStorage.setItem('byyourside.accessExpiresAt', String(Date.now() + 60_000));
      localStorage.setItem('byyourside.refreshToken', 'refresh-old');
    });

    await page.goto('/feed');
    await expect(page).toHaveURL('/login');
    await expect(page.getByText('Tu sesión expiró. Iniciá sesión nuevamente.')).toBeVisible();
  });
});
