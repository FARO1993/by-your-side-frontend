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

  test('recargar en una ruta protegida no da 404 (SPA fallback)', async ({ page }) => {
    await page.goto('/help');
    await page.reload();
    await expect(page.getByText('Ayuda ahora')).toBeVisible();
  });
});