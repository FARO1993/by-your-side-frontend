import { test, expect } from '@playwright/test';

test.describe('Rutas protegidas', () => {
  test('redirige a /login si no hay sesión', async ({ page }) => {
    await page.goto('/feed');
    await expect(page).toHaveURL('/login');
  });

  test('/help es accesible sin sesión', async ({ page }) => {
    await page.goto('/help');
    await expect(page).toHaveURL('/help');
    await expect(page.getByText('Recursos de ayuda')).toBeVisible();
  });

  test('recargar en una ruta protegida no da 404 (SPA fallback)', async ({ page, context }) => {
    // Regresion del bug que arreglamos con vercel.json -- reproducible
    // tambien en local si el dev server no sirve bien rutas SPA.
    await page.goto('/help');
    await page.reload();
    await expect(page.getByText('Recursos de ayuda')).toBeVisible();
  });
});