import { test, expect } from '@playwright/test';
import { Page } from "@playwright/test"

const API = 'http://localhost:5000';

const getUserData = () => {
    const ts = Date.now();

    const email = `e2e+${ts}@example.com`;
    const username = `NewAccount${ts}`;
    const householdName = `New Family ${ts}`;
    const password = 'Passw0rd!';

    return { email, username, householdName, password };
}

const fillSignupForm = async (page: Page, userData: ReturnType<typeof getUserData>) => {
    await page.getByPlaceholder("Email").fill(userData.email);
    await page.getByPlaceholder("Username").fill(userData.username);
    await page.getByPlaceholder("Password").fill(userData.password);
    await page.getByPlaceholder("Household Name").fill(userData.householdName)
}

test("signs up, shows dashboard, and persists session after reload", async ({ page }) => {
    const userData = getUserData();

    await page.goto("http://localhost:5173/signup");
    await fillSignupForm(page, userData);

    await Promise.all([
        page.waitForURL(/localhost:5173/), // left the auth screen
        page.getByRole("button", { name: "Submit" }).click()
    ])

    await page.waitForResponse(r => r.url().includes("/api/auth"))
    await page.waitForResponse(r => r.url().includes("/api/households"))

    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toHaveText(userData.householdName);

    await page.getByRole('heading', { name: userData.householdName }).waitFor({ state: 'visible' });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(userData.householdName, { timeout: 10000 });
    await page.getByRole("link", { name: "Profile" }).click()

    await expect(page.getByText(`Username: ${userData.username}`)).toBeVisible()

    await page.goto("http://localhost:5173/login");
    await page.reload()
    await expect(page.getByRole("button", { name: "Logout" })).toBeVisible();
    await expect(page.getByText(`Welcome, ${userData.username}`)).toBeVisible();
})

test("blocks signup when email is already in use and shows inline error", async ({ page, request }) => {
    const userData = getUserData();
    await request.post(`${API}/api/auth/signup`, {
        data: { email: userData.email, password: userData.password, username: userData.username, householdName: userData.householdName },
    });

    await page.goto("http://localhost:5173/signup");
    await page.getByRole("textbox", { name: "Email" }).fill(userData.email);
    await page.getByRole("button", { name: "Submit" }).click()

    await expect(page.getByText(/email already in use/i)).toBeVisible();

    await expect(page).toHaveURL(/\/signup$/);

})