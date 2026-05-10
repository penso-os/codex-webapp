import { createRequire } from "node:module";
import { resolve } from "node:path";

const DEFAULT_TEXT = "What should we";
const DEFAULT_MAX_RESPONSE_MS = 5_000;

export function parseSmokeArgs(args = []) {
  const screenshot = valueAfter(args, "--screenshot");
  return {
    url: valueAfter(args, "--url") ?? "http://127.0.0.1:8214/",
    text: valueAfter(args, "--text") ?? DEFAULT_TEXT,
    timeoutMs: Number(valueAfter(args, "--timeout-ms") ?? 10_000),
    maxResponseMs: Number(valueAfter(args, "--max-response-ms") ?? DEFAULT_MAX_RESPONSE_MS),
    browser: args.includes("--browser") || Boolean(screenshot),
    screenshot,
  };
}

export async function runSmoke(args = []) {
  const options = parseSmokeArgs(args);
  if (options.browser) {
    await runBrowserSmokeWithOptions(options);
    return;
  }
  await runHttpSmokeWithOptions(options);
}

export async function runHttpSmoke(args = []) {
  await runHttpSmokeWithOptions(parseSmokeArgs(args));
}

export async function runBrowserSmoke(args = []) {
  await runBrowserSmokeWithOptions(parseSmokeArgs(args));
}

async function runHttpSmokeWithOptions(options) {
  const started = performance.now();
  const response = await fetch(options.url, {
    signal: AbortSignal.timeout(options.timeoutMs),
  });
  const elapsedMs = Math.round(performance.now() - started);
  if (!response.ok) {
    throw new Error(`HTTP smoke returned ${response.status} for ${options.url}`);
  }
  const text = await response.text();
  if (!text.includes(options.text)) {
    throw new Error(`HTTP smoke could not find visible text: ${options.text}`);
  }
  if (elapsedMs > options.maxResponseMs) {
    throw new Error(
      `HTTP smoke exceeded response budget: ${elapsedMs}ms > ${options.maxResponseMs}ms`,
    );
  }
  console.log(`HTTP smoke passed: ${options.url}`);
  console.log(`Found text: ${options.text}`);
  console.log(`Response time: ${elapsedMs}ms (budget ${options.maxResponseMs}ms)`);
  console.log("For screenshot evidence, rerun with --browser --screenshot <path>.");
}

async function runBrowserSmokeWithOptions(options) {
  const playwright = await loadPlaywright();
  const browser = await playwright.chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(options.url, {
      waitUntil: "networkidle",
      timeout: options.timeoutMs,
    });
    await page.getByText(options.text, { exact: false }).waitFor({
      timeout: options.timeoutMs,
    });
    if (options.screenshot) {
      await page.screenshot({
        path: resolve(options.screenshot),
        fullPage: true,
      });
    }
    console.log(`Browser smoke passed: ${options.url}`);
    console.log(`Visible text: ${options.text}`);
  } finally {
    await browser.close();
  }
}

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch {
    const requireFromCwd = createRequire(resolve(process.cwd(), "package.json"));
    try {
      return requireFromCwd("playwright");
    } catch {
      throw new Error(
        [
          "Playwright is required for browser smoke checks.",
          "",
          "Install it in this project:",
          "  npm install -D playwright",
          "  npx playwright install chromium",
        ].join("\n"),
      );
    }
  }
}

function valueAfter(args, flag) {
  const index = args.indexOf(flag);
  if (index === -1) return undefined;
  const value = args[index + 1];
  return value && !value.startsWith("--") ? value : undefined;
}
