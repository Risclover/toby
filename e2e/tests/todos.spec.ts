import { test, expect } from "@playwright/test";

test.describe("Tasks E2E", () => {
    test("user can add and complete a task", async ({ page }) => {
        // go to app
        await page.goto("http://localhost:5173");

        // add a task
        await page.getByPlaceholder("Add a task...").fill("Buy milk");
        await page.getByRole("button", { name: /add/i }).click();

        // check that it appears
        await expect(page.getByText("Buy milk")).toBeVisible();

        // complete the task
        await page.getByRole("checkbox").check();

        // confirm completed state
        await expect(page.getByText("Buy milk")).toHaveClass(/completed/);
    });
});