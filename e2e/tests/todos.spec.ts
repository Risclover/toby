import { test, expect } from "@playwright/test";

test.describe("Todos E2E", () => {
    test("user can add and complete a todo", async ({ page }) => {
        // go to app
        await page.goto("http://localhost:5173");

        // add a todo
        await page.getByPlaceholder("Add a todo...").fill("Buy milk");
        await page.getByRole("button", { name: /add/i }).click();

        // check that it appears
        await expect(page.getByText("Buy milk")).toBeVisible();

        // complete the todo
        await page.getByRole("checkbox").check();

        // confirm completed state
        await expect(page.getByText("Buy milk")).toHaveClass(/completed/);
    });
});