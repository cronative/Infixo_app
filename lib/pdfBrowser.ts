import puppeteer, { type Browser, type Page } from "puppeteer";

/** Hard limit for one PDF render (navigation + print). */
export const PDF_RENDER_TIMEOUT_MS = 30_000;

const LAUNCH_ARGS = ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"];

// One Chromium per server process, shared across requests (survives dev hot reloads via globalThis).
const g = globalThis as typeof globalThis & { __inflixoPdfBrowser?: Promise<Browser> };

async function launch(): Promise<Browser> {
  const browser = await puppeteer.launch({ headless: true, args: LAUNCH_ARGS });
  // If Chromium crashes or is closed, the next request launches a fresh one.
  browser.on("disconnected", () => {
    g.__inflixoPdfBrowser = undefined;
  });
  return browser;
}

export async function getPdfBrowser(): Promise<Browser> {
  if (g.__inflixoPdfBrowser) {
    const browser = await g.__inflixoPdfBrowser.catch(() => undefined);
    if (browser?.connected) return browser;
  }
  g.__inflixoPdfBrowser = launch();
  try {
    return await g.__inflixoPdfBrowser;
  } catch (err) {
    g.__inflixoPdfBrowser = undefined;
    throw err;
  }
}

/** Opens a page on the shared browser, runs `fn`, and always closes the page (never the browser). */
export async function withPdfPage<T>(fn: (page: Page) => Promise<T>): Promise<T> {
  const browser = await getPdfBrowser();
  const page = await browser.newPage();
  page.setDefaultTimeout(PDF_RENDER_TIMEOUT_MS);
  page.setDefaultNavigationTimeout(PDF_RENDER_TIMEOUT_MS);
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      fn(page),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`PDF render timed out after ${PDF_RENDER_TIMEOUT_MS}ms`)), PDF_RENDER_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
    await page.close().catch(() => undefined);
  }
}
