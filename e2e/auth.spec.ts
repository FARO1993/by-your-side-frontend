import { test, expect } from '@playwright/test';
import { uniqueUsername } from './helpers';

test.describe('Registro y login', () => {
  test('un usuario nuevo puede registrarse y llega al feed', async ({ page }) => {
    const username = uniqueUsername('e2e');

    await page.goto('/register');

    await page.getByPlaceholder('Tu nombre').fill(username);
    await page.getByPlaceholder('vos@ejemplo.com').fill(`${username}@example.com`);
    await page.getByPlaceholder('Elegí una contraseña').fill('secretpass123');

    await page.getByRole('button', { name: 'Crear mi espacio' }).click();

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
  await expect(page).toHaveURL('/feed');

  // Logout vive en /profile, no en /feed -- hay que ir ahi primero
  await page.getByTestId('own-avatar-link').click();
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page).toHaveURL('/login');

  await page.getByPlaceholder('vos@ejemplo.com').fill(`${username}@example.com`);
  await page.getByPlaceholder('Tu contraseña').fill('secretpass123');
  await page.getByRole('button', { name: 'Ingresar' }).click();

  await expect(page).toHaveURL('/feed');
});
});