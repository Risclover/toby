import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false, slowMo: 200 });
const context = await browser.newContext();
const page = await context.newPage();
await page.goto('http://localhost:5173');
await page.pause();