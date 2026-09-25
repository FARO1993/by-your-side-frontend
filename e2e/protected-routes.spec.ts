import { test, expect } from '@playwright/test';

test.describe('Rutas protegidas', () => {
  test('redirige a /login si no hay sesión', async ({ page }) => {
    await page.goto('/feed');
    await expect(page).toHaveURL('/login');
  });

  test('/help es accesible sin sesión', async ({ page }) => {
    await page.goto('/help');
    await expect(page).toHaveURL('/help');
    await expect(page.getByText('Ayuda ahora')).toBeVisible();
  });

  test('las rutas de cuenta públicas siguen siendo públicas', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page).toHaveURL('/forgot-password');
    await expect(page.getByRole('heading', { name: 'Recuperar contraseña' })).toBeVisible();

    await page.goto('/reset-password');
    await expect(page).toHaveURL('/reset-password');
    await expect(page.getByRole('heading', { name: 'Nueva contraseña' })).toBeVisible();

    await page.goto('/verify-email');
    await expect(page).toHaveURL('/verify-email');
    await expect(page.getByText('Falta el enlace')).toBeVisible();
  });

  test('cambiar contraseña sigue protegido', async ({ page }) => {
    await page.goto('/account/password');
    await expect(page).toHaveURL('/login');
  });

  test('recargar en una ruta protegida no da 404 (SPA fallback)', async ({ page }) => {
    await page.goto('/help');
    await page.reload();
    await expect(page.getByText('Ayuda ahora')).toBeVisible();
  });
});