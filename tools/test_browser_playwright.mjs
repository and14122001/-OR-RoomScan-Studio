import { chromium } from "playwright";
import assert from "node:assert/strict";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const pageErrors = [];
page.on("pageerror", error => pageErrors.push(error.message));
try {
  await page.goto("http://127.0.0.1:4173/", { waitUntil: "domcontentloaded" });
  await page.locator("#room").waitFor();
  assert.equal(await page.locator("html").getAttribute("lang"), "zh-Hant");
  await page.locator("#width").fill("5");
  await page.locator("#length").fill("7");
  await page.locator("#height").fill("3");
  await page.locator("#apply").click();
  assert.match(await page.locator("body").innerText(), /105/);
  await page.locator("#objName").fill("Playwright 櫃體");
  await page.locator("#objX").fill("0.2");
  await page.locator("#objY").fill("0.2");
  await page.locator("#objZ").fill("0");
  await page.locator("#objW").fill("1");
  await page.locator("#objD").fill("0.6");
  await page.locator("#objH").fill("2");
  await page.locator("#addObject").click();
  assert.match(await page.locator("#objectList").innerText(), /Playwright 櫃體/);
  await page.locator("#runTests").click();
  assert.match(await page.locator("body").innerText(), /PASS|通過/);
  assert.deepEqual(pageErrors, [], "no uncaught browser page errors");
  console.log("PASS: Chromium browser smoke test (load, room dimension update, fixture creation, built-in tests, no page errors).");
} finally { await browser.close(); }
