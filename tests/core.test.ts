import assert from "node:assert/strict";
import { test } from "node:test";
import { cardSchema } from "../src/lib/params";
import { calculateStreaks } from "../src/lib/streaks";
import { themeNames } from "../src/lib/primer-themes";
import { fetchProfile, GitHubError } from "../src/lib/github";

test("validates card parameters and rejects unsupported values", () => {
  const p = cardSchema.parse({ user: "octocat" });
  assert.equal(p.theme, "light");
  assert.equal(p.radius, 8);
  assert.equal(p.border, true);
  assert.equal(p.streak, false);
  assert.equal(cardSchema.parse({ user: "x", streak: "true" }).streak, true);
  for (const value of [
    { user: "../etc" },
    { user: "x", radius: "33" },
    { user: "x", border: "yes" },
    { user: "x", streak: "yes" },
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

test("calculates streaks across years, leap days, gaps, and an unfinished today", () => {
  const now = new Date("2026-01-03T12:00:00Z");
  const days = ["2025-12-30", "2025-12-31", "2026-01-01", "2026-01-02"]
    .map((date) => ({ date, contributionCount: 2 }));
  const stats = calculateStreaks([
    ...days, days[0], { date: "2026-01-03", contributionCount: 0 },
    { date: "2026-01-04", contributionCount: 100 },
  ].reverse(), now);
  assert.equal(stats.total, 8);
  assert.deepEqual(stats.current, { days: 4, start: "2025-12-30", end: "2026-01-02" });
  assert.deepEqual(stats.longest, stats.current);
  assert.equal(calculateStreaks(days, new Date("2026-01-04T12:00:00Z")).current.days, 0);
  assert.equal(calculateStreaks([], now).longest.days, 0);
  assert.equal(calculateStreaks([{ date: "2026-01-03", contributionCount: 1 }], now).current.days, 1);
  const leap = calculateStreaks(["2024-02-28", "2024-02-29", "2024-03-01"]
    .map((date) => ({ date, contributionCount: 1 })), new Date("2024-03-01T12:00:00Z"));
  assert.equal(leap.current.days, 3);
  const gap = calculateStreaks([
    { date: "2026-01-01", contributionCount: 1 },
    { date: "2026-01-03", contributionCount: 1 },
  ], now);
  assert.equal(gap.longest.days, 1);
  assert.equal(gap.current.days, 1);
});

test("loads all contribution years only when streaks are enabled", async () => {
  const original = globalThis.fetch;
  const token = process.env.GITHUB_TOKEN;
  process.env.GITHUB_TOKEN = "test-token";
  const year = new Date().getUTCFullYear();
  let calendars = 0;
  let failHistory = false;
  globalThis.fetch = async (_input, init) => {
    const body = JSON.parse(String(init?.body));
    if (body.query.includes("StreakHistory")) {
      calendars++;
      if (failHistory) return Response.json({ errors: [{ type: "RATE_LIMITED" }] });
      const date = body.variables.from.slice(0, 10);
      return Response.json({ data: { user: { contributionsCollection: {
        contributionCalendar: { weeks: [{ contributionDays: [{ date, contributionCount: 3 }] }] },
      } } } });
    }
    return Response.json({ data: { user: {
      login: "example", name: null, bio: null, avatarUrl: "", status: null,
      followers: { totalCount: 0 }, pullRequests: { totalCount: 0 }, issues: { totalCount: 0 },
      contributionsCollection: { totalCommitContributions: 1, contributionYears: [year, year - 1], contributionCalendar: { totalContributions: 3 } },
      repositories: { totalCount: 0, pageInfo: { hasNextPage: false, endCursor: "" }, nodes: [] },
    } } });
  };
  try {
    assert.equal((await fetchProfile("example")).streaks, undefined);
    assert.equal(calendars, 0);
    const profile = await fetchProfile("example", true);
    assert.equal(calendars, 2);
    assert.equal(profile.streaks?.total, 6);
    assert.equal(profile.streaks?.firstContribution, `${year - 1}-01-01`);
    failHistory = true;
    await assert.rejects(fetchProfile("example", true), (e: unknown) => e instanceof GitHubError && e.status === 429);
  } finally {
    globalThis.fetch = original;
    if (token === undefined) delete process.env.GITHUB_TOKEN;
    else process.env.GITHUB_TOKEN = token;
  }
});

test("renders expanded streak cards in every Primer theme and visibility combination", async () => {
  const { GET } = await import("../src/app/api/card/route");
  for (const theme of themeNames) {
    for (const hide of ["", "bio,languages"]) {
      const response = await GET(new Request(`http://localhost/api/card?user=octocat&demo=true&streak=true&theme=${theme}&hide=${hide}`));
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("content-type"), "image/png");
      const bytes = Buffer.from(await response.arrayBuffer());
      assert.equal(bytes.readUInt32BE(16), 1200);
      assert.equal(bytes.readUInt32BE(20), 880);
    }
  }
});
