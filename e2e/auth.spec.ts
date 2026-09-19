import { test, expect } from '@playwright/test';
import { uniqueUsername } from './helpers';

test.describe('Registro y login', () => {
  test('un usuario nuevo puede registrarse y llega al feed', async ({ page }) => {
    const username = uniqueUsername('e2e');

    await page.goto('/register');

    await page.getByPlaceholder('Usuario').fill(username);
    await page.getByPlaceholder('Email').fill(`${username}@example.com`);
    await page.getByPlaceholder('Nombre').fill('Test E2E');
    await page.getByPlaceholder('Contraseña').fill('secretpass123');

    await page.getByRole('button', { name: 'Registrarme' }).click();

    await expect(page).toHaveURL('/feed');
    await expect(page.getByText(/Hola, Test E2E/)).toBeVisible();
  });

  test('un usuario existente puede loguearse', async ({ page }) => {
    const username = uniqueUsername('e2e_login');

    await page.goto('/register');
    await page.getByPlaceholder('Usuario').fill(username);
    await page.getByPlaceholder('Email').fill(`${username}@example.com`);
    await page.getByPlaceholder('Contraseña').fill('secretpass123');
    await page.getByRole('button', { name: 'Registrarme' }).click();
    await expect(page).toHaveURL('/feed');

    // Logout via el menu de usuario (data-testid, no depende del nombre)
    await page.getByTestId('user-menu-trigger').click();
    await page.getByTestId('logout-button').click();
    await expect(page).toHaveURL('/login');

    await page.getByPlaceholder('Usuario').fill(username);
    await page.getByPlaceholder('Contraseña').fill('secretpass123');
    await page.getByRole('button', { name: 'Ingresar' }).click();

    await expect(page).toHaveURL('/feed');
  });

  test('muestra error con credenciales inválidas', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('Usuario').fill('usuario_que_no_existe_xyz');
    await page.getByPlaceholder('Contraseña').fill('cualquierpass');
    await page.getByRole('button', { name: 'Ingresar' }).click();

    await expect(page.getByText(/Invalid username or password|Error al iniciar sesión/)).toBeVisible();
    await expect(page).toHaveURL('/login');
  });
});