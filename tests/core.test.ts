import assert from "node:assert/strict";
import { test } from "node:test";
import { cardSchema } from "../src/lib/params";
import { fetchProfile, GitHubError } from "../src/lib/github";

test("validates card parameters and rejects unsupported values", () => {
  const p = cardSchema.parse({ user: "octocat" });
  assert.equal(p.theme, "light");
  assert.equal(p.radius, 8);
  assert.equal(p.border, true);
  for (const value of [
    { user: "../etc" },
    { user: "x", radius: "33" },
    { user: "x", border: "yes" },
    { user: "x", hide: "stars" },
    { user: "x", theme: "neon" },
    { user: "x", extra: "value" },
  ])
    assert.equal(cardSchema.safeParse(value).success, false);
  assert.equal(
    cardSchema.parse({
      user: "octocat",
      hide: "bio,languages",
      border: "false",
    }).border,
    false,
  );
});
test("aggregates paginated repositories, languages, and avatar bytes", async () => {
  const original = globalThis.fetch;
  const token = process.env.GITHUB_TOKEN;
  process.env.GITHUB_TOKEN = "test-token";
  let pages = 0;
  globalThis.fetch = async (input, init) => {
    if (String(input).includes("avatars.githubusercontent.com"))
      return new Response(new Uint8Array([1, 2, 3]), {
        headers: { "content-type": "image/png" },
      });
    const body = JSON.parse(String(init?.body));
    assert.equal(body.variables.after, pages === 0 ? null : "cursor");
    pages++;
    return Response.json({
      data: {
        user: {
          name: "Example",
          login: "example",
          bio: null,
          avatarUrl: "https://avatars.githubusercontent.com/u/1",
          status: null,
          followers: { totalCount: 3 },
          pullRequests: { totalCount: 4 },
          issues: { totalCount: 5 },
          contributionsCollection: {
            totalCommitContributions: 6,
            contributionCalendar: { totalContributions: 7 },
          },
          repositories: {
            totalCount: 2,
            pageInfo: { hasNextPage: pages === 1, endCursor: "cursor" },
            nodes: [
              {
                stargazerCount: pages,
                languages: {
                  edges: [
                    {
                      size: pages * 100,
                      node: { name: "TypeScript", color: "#3178c6" },
                    },
                  ],
                },
              },
            ],
          },
        },
      },
    });
  };
  try {
    const p = await fetchProfile("example");
    assert.equal(pages, 2);
    assert.equal(p.stars, 3);
    assert.equal(p.languages[0].size, 300);
    assert.equal(p.avatar, "data:image/png;base64,AQID");
    assert.equal(p.commits, 6);
  } finally {
    globalThis.fetch = original;
    if (token === undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN = token;
  }
});
test("maps GitHub not-found and rate-limit errors", async () => {
  const original = globalThis.fetch;
  const token = process.env.GITHUB_TOKEN;
  process.env.GITHUB_TOKEN = "test-token";
  try {
    globalThis.fetch = async () =>
      Response.json({
        data: { user: null },
        errors: [{ type: "NOT_FOUND", message: "missing" }],
      });
    await assert.rejects(
      fetchProfile("missing"),
      (e: unknown) => e instanceof GitHubError && e.status === 404,
    );
    globalThis.fetch = async () =>
      Response.json({ errors: [{ type: "RATE_LIMITED", message: "limited" }] });
    await assert.rejects(
      fetchProfile("example"),
      (e: unknown) => e instanceof GitHubError && e.status === 429,
    );
  } finally {
    globalThis.fetch = original;
    if (token === undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN = token;
  }
});

// Exercise the actual image pipeline, including README-safe upstream error cards.
test("renders PNGs and maps missing users and rate limits to image responses", async () => {
  const { GET } = await import("../src/app/api/card/route");
  const original = globalThis.fetch;
  const token = process.env.GITHUB_TOKEN;
  process.env.GITHUB_TOKEN = "test-token";
  try {
    globalThis.fetch = async () =>
      Response.json({
        data: { user: null },
        errors: [{ type: "NOT_FOUND", message: "missing" }],
      });
    const missing = await GET(
      new Request("http://localhost/api/card?user=missing&theme=dark"),
    );
    assert.equal(missing.status, 200);
    assert.equal(missing.headers.get("x-card-error"), "404");
    assert.equal(missing.headers.get("content-type"), "image/png");
    globalThis.fetch = async () => new Response(null, { status: 429 });
    const limited = await GET(
      new Request("http://localhost/api/card?user=octocat"),
    );
    assert.equal(limited.status, 429);
    assert.equal(limited.headers.get("retry-after"), "60");
    assert.equal(limited.headers.get("cache-control"), "no-store");
    const demo = await GET(
      new Request("http://localhost/api/card?user=octocat&demo=true"),
    );
    const bytes = Buffer.from(await demo.arrayBuffer());
    assert.equal(demo.status, 200);
    assert.equal(bytes.readUInt32BE(16), 1200);
    assert.equal(bytes.readUInt32BE(20), 640);
    const { writeFile, mkdir } = await import("node:fs/promises");
    await mkdir("artifacts", { recursive: true });
    await writeFile("artifacts/light-updated.png", bytes);
  } finally {
    globalThis.fetch = original;
    if (token === undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN = token;
  }
});
