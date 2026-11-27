import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const origin = process.env.TEST_ORIGIN || "http://127.0.0.1:3000";
await mkdir("artifacts", { recursive: true });
const home = await fetch(origin);
assert.equal(home.status, 200);
assert.match(await home.text(), /Your GitHub/);
for (const theme of [
  "light",
  "dark",
  "dark_dimmed",
  "light_high_contrast",
  "dark_high_contrast",
]) {
  const response = await fetch(
    `${origin}/api/card?user=octocat&theme=${theme}&demo=true`,
  );
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.equal(
    response.status,
    200,
    `${theme}: ${bytes.toString().slice(0, 150)}`,
  );
  assert.equal(response.headers.get("content-type"), "image/png");
  assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
  assert.equal(bytes.readUInt32BE(16), 1200);
  assert.equal(bytes.readUInt32BE(20), 640);
  assert.equal(
    response.headers.get("cache-control"),
    "public, max-age=1800, s-maxage=3600, stale-while-revalidate=86400",
  );
  await writeFile(`artifacts/${theme}.png`, bytes);
  console.log(`PASS ${theme}: 1200x640 PNG, ${bytes.length} bytes`);
}
for (const suffix of [
  "",
  "?user=bad!",
  "?user=octocat&radius=100",
  "?user=octocat&theme=bad",
]) {
  const r = await fetch(`${origin}/api/card${suffix}`);
  assert.equal(r.status, 400);
}
const r = await fetch(
  `${origin}/api/card?user=octocat&demo=true&border=false&hide=bio,languages&radius=0`,
);
assert.equal(r.status, 200);
const live = await fetch(`${origin}/api/card?user=octocat&theme=dark`);
if (live.status === 503) {
  assert.equal(live.headers.get("content-type"), "image/png");
  assert.equal(live.headers.get("cache-control"), "no-store");
  await writeFile(
    "artifacts/config-error.png",
    Buffer.from(await live.arrayBuffer()),
  );
  console.log(
    "PASS missing-token error PNG (503); live GitHub verification requires GITHUB_TOKEN",
  );
} else {
  assert.equal(live.status, 200);
  console.log("PASS live sample user");
}
console.log("PASS home, invalid parameters, and hidden sections");
