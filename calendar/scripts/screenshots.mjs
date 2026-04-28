import puppeteer from "puppeteer";
import { mkdir } from "node:fs/promises";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = "previews";

const SHOTS = [
  { name: "01-login",            path: "/login",                                 width: 1400, height: 900 },
  { name: "02-calendar-month",   path: "/demo?view=calendar",                    width: 1600, height: 1100 },
  { name: "03-chores",           path: "/demo?view=chores",                      width: 1600, height: 1100 },
  { name: "04-meals",            path: "/demo?view=meals",                       width: 1600, height: 1100 },
  { name: "05-lists",            path: "/demo?view=lists",                       width: 1600, height: 900 },
  { name: "06-settings",         path: "/demo?view=settings",                    width: 1600, height: 1100 },
  { name: "07-wall-display",     path: "/demo?view=wall",                        width: 1600, height: 1200 },
  { name: "08-onboarding",       path: "/onboarding",                            width: 1400, height: 900 },
];

await mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

for (const s of SHOTS) {
  const page = await browser.newPage();
  await page.setViewport({ width: s.width, height: s.height, deviceScaleFactor: 2 });
  const url = `${BASE}${s.path}`;
  console.log(`→ ${s.name}: ${url}`);
  try {
    await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });
  } catch (e) {
    console.warn(`   warn (continuing): ${e.message}`);
  }
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: `${OUT}/${s.name}.png`, fullPage: false });
  await page.close();
}

await browser.close();
console.log("Done.");
