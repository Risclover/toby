import { defineConfig, devices } from "@playwright/test";
const isCI = !!process.env.CI;
export default defineConfig({
  testDir: "./tests",        // points to your e2e tests folder
  use: {
    baseURL: "http://localhost:5173/api", // your running frontend
    headless: isCI ? true : false,
    viewport: { width: 1280, height: 720 },
    launchOptions: {
      slowMo: 100,          // slows actions so you can see them
    },
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
