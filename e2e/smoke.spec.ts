import { expect, test } from '@playwright/test';
import { futureEvent, mockSupabase } from './support';

test.describe('signed out', () => {
  test('shows the sign-in form and signs in with email', async ({ page }) => {
    await mockSupabase(page, { signedIn: false });
    await page.goto('/?lang=en');
    await page.getByLabel('Email').fill('e2e@example.com');
    await page.getByLabel('Password').fill('secret');
    await page.getByRole('button', { name: 'Sign in' }).first().click();
    await expect(page.getByRole('navigation').first()).toBeVisible();
  });
});

test.describe('signed in', () => {
  test('loads the band data into the dashboard', async ({ page }) => {
    await mockSupabase(page, { tables: { events: [futureEvent()] } });
    await page.goto('/?lang=en');
    await expect(page.getByText('Gala E2E').first()).toBeVisible();
  });

  test('creates an event through the command palette and sends it to the API', async ({ page }) => {
    const backend = await mockSupabase(page);
    await page.goto('/?lang=en');
    await page.keyboard.press('Control+k');
    const palette = page.getByRole('combobox');
    await palette.fill('new event');
    await palette.press('Enter'); // keyboard-only: arrow/Enter selects the top match
    await page.getByPlaceholder('Festival Latino de Fruitvale').fill('Fiesta E2E');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect.poll(() => backend.writes.find((w) => w.table === 'events' && w.method === 'POST')).toBeTruthy();
    const write = backend.writes.find((w) => w.table === 'events')!;
    expect(write.body).toMatchObject({ title_es: 'Fiesta E2E', type: 'gig' });
  });

  test('queues a write made offline and replays it when the connection returns', async ({ page, context }) => {
    const backend = await mockSupabase(page);
    await page.goto('/?lang=en');
    await expect(page.getByRole('navigation').first()).toBeVisible();

    // Open the form while online (its code is lazy-loaded), then lose the connection before saving.
    await page.keyboard.press('Control+k');
    await page.getByRole('combobox').fill('new event');
    await page.getByRole('combobox').press('Enter');
    await page.getByPlaceholder('Festival Latino de Fruitvale').fill('Offline gig');
    await context.setOffline(true);
    await page.getByRole('button', { name: 'Save' }).click();
    expect(backend.writes.filter((w) => w.table === 'events')).toHaveLength(0);

    await context.setOffline(false);
    await expect.poll(() => backend.writes.some((w) => w.table === 'events' && w.method === 'POST'), { timeout: 10_000 }).toBe(true);
  });
});
