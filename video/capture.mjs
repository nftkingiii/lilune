// Records the live Lilune site for the demo films. Runs in GitHub Actions (see
// .github/workflows/capture-video.yml) because the runner can reach Kuru, the
// Monad testnet RPC and Envio. Each segment is a Chromium screencast resampled
// to 30 fps and encoded to out/<segment>.mp4, with marks in out/marks.json.
// A virtual WebAuthn authenticator with PRF stands in for the passkey, so Mera
// derives a real Monad testnet account exactly as it would for a person.
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const URL_ = process.env.LILUNE_URL || "https://lilune-production.up.railway.app";
const OUT = "video/out";
const FPS = 30;
const FUND_WAIT_MS = Number(process.env.FUND_WAIT_MS || 20 * 60 * 1000);
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await cdp.send("WebAuthn.enable");
await cdp.send("WebAuthn.addVirtualAuthenticator", {
  options: { protocol: "ctap2", ctap2Version: "ctap2_1", transport: "internal", hasResidentKey: true, hasUserVerification: true, isUserVerified: true, automaticPresenceSimulation: true, hasPrf: true },
});
page.on("console", (m) => { if (m.type() === "error") console.log("page error:", m.text()); });

const marks = {};
let shots = [];
let pointer = [];
let segmentStart = 0;
const logPointer = (x, y, click = false) => pointer.push({ t: +(Date.now() / 1000 - segmentStart).toFixed(2), x: Math.round(x), y: Math.round(y), click });
cdp.on("Page.screencastFrame", async ({ data, metadata, sessionId }) => {
  shots.push({ t: metadata.timestamp, buf: Buffer.from(data, "base64") });
  await cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
});

async function segment(name, fn) {
  shots = [];
  pointer = [];
  const local = [];
  const t0 = Date.now() / 1000;
  segmentStart = t0;
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 90, maxWidth: 1920, maxHeight: 1080, everyNthFrame: 1 });
  await page.waitForTimeout(400);
  try {
    await fn((label) => local.push({ label, t: +(Date.now() / 1000 - t0).toFixed(2) }));
  } finally {
    await page.waitForTimeout(500);
    const t1 = Date.now() / 1000;
    await cdp.send("Page.stopScreencast");
    const dir = join(OUT, `${name}-frames`);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    const n = Math.floor((t1 - t0) * FPS);
    let j = 0;
    for (let i = 0; i < n && shots.length; i++) {
      const t = t0 + i / FPS;
      while (j + 1 < shots.length && shots[j + 1].t <= t) j++;
      writeFileSync(join(dir, String(i + 1).padStart(5, "0") + ".jpg"), shots[j].buf);
    }
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(FPS), "-i", join(dir, "%05d.jpg"), "-c:v", "libx264", "-crf", "16", "-preset", "slow", "-pix_fmt", "yuv420p", join(OUT, `${name}.mp4`)]);
    rmSync(dir, { recursive: true, force: true });
    marks[name] = { duration: +(t1 - t0).toFixed(2), marks: local, pointer };
    writeFileSync(join(OUT, "marks.json"), JSON.stringify(marks, null, 1));
    console.log(`segment ${name}: ${(t1 - t0).toFixed(1)}s, ${shots.length} distinct frames`);
  }
}

const pause = (ms) => page.waitForTimeout(ms);
const still = (name) => page.screenshot({ path: join(OUT, `${name}.png`) });
async function glide(locator) {
  const box = await locator.boundingBox();
  if (!box) return;
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  logPointer(x, y);
  await page.mouse.move(x, y, { steps: 18 });
  logPointer(x, y);
}
async function press(locator) {
  await locator.scrollIntoViewIfNeeded();
  await glide(locator);
  await pause(250);
  const box = await locator.boundingBox();
  if (box) logPointer(box.x + box.width / 2, box.y + box.height / 2, true);
  await locator.click();
}
async function typeInto(locator, text) {
  await press(locator);
  await locator.pressSequentially(text, { delay: 35 });
}
const btn = (name, exact = true) => page.getByRole("button", { name, exact });
const menuTrigger = () => page.getByRole("button", { name: "Open account menu" });
async function setMenu(open, animate = false) {
  const trigger = menuTrigger();
  if ((await trigger.getAttribute("aria-expanded")) === String(open)) return;
  if (animate) await press(trigger); else await trigger.click();
  await pause(300);
}

await page.goto(URL_, { waitUntil: "networkidle" });
await page.waitForSelector(".pulse-source.ready", { timeout: 30000 }).catch(() => console.log("Kuru pulse not ready"));
await pause(1200);
await still("home");

await segment("home", async (mark) => {
  mark("hero");
  await pause(2500);
  await page.mouse.wheel(0, 640);
  mark("pulse");
  await pause(4500);
  await page.mouse.wheel(0, -640);
  await pause(800);
});

await segment("discover", async (mark) => {
  await press(btn("Find my companies"));
  mark("picker");
  await pause(900);
  for (const product of ["ChatGPT", "YouTube", "Xbox", "AWS"]) {
    await press(btn(product));
    await pause(500);
  }
  mark("connections");
  await page.locator(".stack-connections").scrollIntoViewIfNeeded().catch(() => {});
  await pause(3500);
  await press(page.getByRole("button", { name: /Discover my companies/ }));
  mark("watchlist");
  await pause(2500);
  await page.mouse.wheel(0, 900);
  await pause(2500);
  await page.mouse.wheel(0, -900);
  await pause(600);
});

await segment("trade", async (mark) => {
  await press(btn("Trade"));
  await pause(800);
  await press(page.getByRole("button", { name: /^Market:/ }));
  mark("picker");
  await pause(900);
  await press(page.getByRole("option", { name: /MON \/ USDC/ }));
  await page.waitForSelector(".trading-chart, canvas, svg", { timeout: 20000 }).catch(() => {});
  mark("live-chart");
  await pause(3000);
  await press(btn("1W"));
  await pause(2000);
  await press(btn("Candles"));
  mark("candles");
  await pause(3000);
  await press(btn("1D"));
  await pause(1500);
  await press(btn("$100"));
  await pause(600);
  const review = page.getByRole("button", { name: /Review buy/ });
  if (!(await review.isEnabled())) { console.log("Review buy disabled (no live price?)"); return; }
  await press(review);
  mark("review");
  await pause(2500);
  await still("trade-review");
  await press(page.getByRole("button", { name: /Confirm demo buy/ }));
  mark("bought");
  await pause(2000);
});

await segment("portfolio", async (mark) => {
  await press(btn("Portfolio"));
  mark("portfolio");
  await pause(4000);
  await page.mouse.wheel(0, 700);
  await pause(2500);
  await page.mouse.wheel(0, -700);
  await pause(500);
});

await segment("mera", async (mark) => {
  await press(page.getByRole("button", { name: /Connect Mera/ }).first());
  mark("passkey");
  await page.waitForSelector("text=/0x[0-9a-fA-F]{4}…/", { timeout: 30000 });
  mark("connected");
  await pause(2500);
  await setMenu(true, true);
  mark("menu");
  await pause(2500);
  await press(page.getByRole("button", { name: /Profile/ }));
  mark("profile");
  await pause(3000);
  await setMenu(false, true);
  await pause(600);
});

await setMenu(true);
await page.getByRole("button", { name: /Profile/ }).click();
const account = await page.locator("#full-address").inputValue();
await setMenu(false);
console.log(`MERA_ACCOUNT=${account}`);
// Publish the address right away so someone can fund it while the run waits.
if (process.env.GITHUB_TOKEN && process.env.GITHUB_REPOSITORY) {
  const dir = "video/account-branch";
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "account.txt"), `${account}\n`);
  const git = (...args) => execFileSync("git", args, { cwd: dir, stdio: "inherit" });
  git("init", "-q", "-b", "video-account");
  git("-c", "user.name=github-actions", "-c", "user.email=github-actions@users.noreply.github.com", "commit", "-q", "--allow-empty", "-m", "Mera account for the demo capture");
  git("add", "account.txt");
  git("-c", "user.name=github-actions", "-c", "user.email=github-actions@users.noreply.github.com", "commit", "-q", "-m", account);
  git("push", "-qf", `https://x-access-token:${process.env.GITHUB_TOKEN}@github.com/${process.env.GITHUB_REPOSITORY}`, "video-account");
}
writeFileSync(join(OUT, "account.txt"), `${account}\n`);

await segment("launch-form", async (mark) => {
  await press(page.getByRole("button", { name: /^Launch/ }).first());
  mark("studio");
  await pause(1500);
  await typeInto(page.locator("#market-name"), "AI Infrastructure");
  await typeInto(page.locator("#market-ticker"), "AINF");
  await typeInto(page.locator("#market-description"), "AI infrastructure outgrows consumer AI apps as training and inference spend keeps compounding.");
  mark("filled");
  await pause(1200);
  await press(page.getByRole("button", { name: /Continue to validation/ }));
  mark("validate");
  await pause(3000);
  await press(page.getByRole("button", { name: /Review market/ }));
  mark("review");
  await pause(3500);
  await still("launch-review");
});

// Deploying needs testnet MON for gas. Wait (not recorded) for someone to fund
// the printed account from the Monad faucet, polling the RPC directly.
async function balanceOf(address) {
  const response = await fetch("https://testnet-rpc.monad.xyz", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getBalance", params: [address, "latest"] }),
  }).catch(() => null);
  const body = await response?.json().catch(() => null);
  return body?.result ? BigInt(body.result) : 0n;
}
let funded = false;
const deadline = Date.now() + FUND_WAIT_MS;
console.log(`Waiting up to ${FUND_WAIT_MS / 60000} min for ${account} to receive testnet MON`);
while (Date.now() < deadline) {
  if ((await balanceOf(account)) > 0n) { funded = true; break; }
  await pause(10000);
}
if (funded) {
  // Let the app read the new balance the same way a person would.
  await setMenu(true);
  await page.getByRole("button", { name: "Refresh wallet balance" }).click();
  await pause(2500);
  await setMenu(false);
  await page.getByRole("button", { name: /Deploy token/ }).waitFor({ timeout: 30000 }).catch(() => { funded = false; });
}
console.log(`FUNDED=${funded}`);

if (funded) {
  await segment("deploy", async (mark) => {
    await page.locator(".deploy-panel").scrollIntoViewIfNeeded();
    mark("ready");
    await pause(2000);
    await press(page.getByRole("button", { name: /Deploy token/ }));
    mark("signing");
    await page.waitForSelector("#launch-success-title", { timeout: 120000 });
    mark("deployed");
    await pause(4000);
    await still("deployed");
    await page.locator(".launch-feed").scrollIntoViewIfNeeded();
    mark("feed-wait");
    await page.waitForSelector(".launch-feed-item em", { timeout: 120000 }).catch(() => console.log("feed did not show the new launch"));
    await page.locator(".launch-feed").scrollIntoViewIfNeeded();
    mark("feed");
    await pause(5000);
    await still("feed");
  });
} else {
  await segment("deploy-unfunded", async (mark) => {
    await page.locator(".deploy-panel").scrollIntoViewIfNeeded();
    mark("unfunded");
    await pause(3000);
    await page.locator(".launch-feed").scrollIntoViewIfNeeded();
    mark("feed");
    await pause(4000);
  });
}

await browser.close();
console.log(JSON.stringify(marks));
