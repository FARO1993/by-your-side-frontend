import { test, expect, type Page } from '@playwright/test';
import { uniqueUsername } from './helpers';

async function dismissWelcome(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Empecemos 💜' }).click();
}

test.describe('Registro y login', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('un usuario nuevo puede registrarse y llega al feed', async ({ page }) => {
    const username = uniqueUsername('e2e');

    await page.goto('/register');

    await page.getByPlaceholder('Tu nombre').fill(username);
    await page.getByPlaceholder('vos@ejemplo.com').fill(`${username}@example.com`);
    await page.getByPlaceholder('Elegí una contraseña').fill('secretpass123');

    await page.getByRole('button', { name: 'Crear mi espacio' }).click();

    await expect(page.getByRole('heading', { name: /Bienvenido a ByYourSide/ })).toBeVisible();
    await dismissWelcome(page);

    await expect(page).toHaveURL('/feed');
    await expect(page.getByText(new RegExp(`Hola, ${username}`))).toBeVisible();
  });

  test('un usuario existente puede loguearse', async ({ page }) => {
    const username = uniqueUsername('e2e_login');

    await page.goto('/register');
    await page.getByPlaceholder('Tu nombre').fill(username);
    await page.getByPlaceholder('vos@ejemplo.com').fill(`${username}@example.com`);
    await page.getByPlaceholder('Elegí una contraseña').fill('secretpass123');
    await page.getByRole('button', { name: 'Crear mi espacio' }).click();
    await dismissWelcome(page);
    await expect(page).toHaveURL('/feed');

    await page.getByTestId('own-avatar-link').click();
    await page.getByRole('button', { name: 'Cerrar sesión' }).click();
    await expect(page).toHaveURL('/login');

    await page.getByPlaceholder('vos@ejemplo.com').fill(`${username}@example.com`);
    await page.getByPlaceholder('Tu contraseña').fill('secretpass123');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.getByRole('button', { name: 'Ingresar' }).click();

    await expect(page.getByRole('heading', { name: /Hola de nuevo/ })).toBeVisible();
    await expect(page.getByText('Estamos acá. 💜')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Bienvenido a ByYourSide/ })).toHaveCount(0);
    await expect(page).toHaveURL('/feed');
  });
});