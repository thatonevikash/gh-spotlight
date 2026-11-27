import { readFile } from "node:fs/promises";
import path from "node:path";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import {
  HighlightCard,
  ErrorCard,
  CARD_WIDTH,
  CARD_HEIGHT,
} from "@/components/card/HighlightCard";
import { cardSchema } from "@/lib/params";
import { demoProfile, fetchProfile, GitHubError } from "@/lib/github";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
let fonts: Promise<[Buffer, Buffer, Buffer]> | undefined;
function loadFonts() {
  return (fonts ??= Promise.all([
    readFile(path.join(process.cwd(), "public/fonts/Inter-Regular.woff")),
    readFile(path.join(process.cwd(), "public/fonts/JetBrainsMono.ttf")),
    readFile(path.join(process.cwd(), "public/fonts/Inter-Semibold.woff")),
  ]));
}
export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = cardSchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success)
    return Response.json(
      { error: "Invalid card parameters", details: parsed.error.flatten() },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  const options = parsed.data;
  let message: string | undefined;
  let errorStatus = 0;
  let profile = demoProfile;
  try {
    profile = options.demo ? demoProfile : await fetchProfile(options.user);
  } catch (error) {
    errorStatus = error instanceof GitHubError ? error.status : 500;
    message =
      error instanceof GitHubError
        ? error.message
        : "Something went wrong. Please try again.";
  }
  try {
    const [inter, mono, semibold] = await loadFonts();
    const svg = await satori(
      message ? (
        <ErrorCard message={message} options={options} />
      ) : (
        <HighlightCard profile={profile} options={options} />
      ),
      {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        fonts: [
          { name: "Inter", data: inter, weight: 400, style: "normal" },
          { name: "Inter", data: semibold, weight: 600, style: "normal" },
          { name: "Mono", data: mono, weight: 400, style: "normal" },
        ],
      },
    );
    const png = new Resvg(svg, {
      fitTo: { mode: "width", value: CARD_WIDTH * 2 },
    })
      .render()
      .asPng();
    // Not-found images use HTTP 200 so README image proxies can display them.
    return new Response(new Uint8Array(png), {
      status: errorStatus === 404 ? 200 : errorStatus || 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `inline; filename="${options.user}-github-stats.png"`,
        "Cache-Control": message
          ? "no-store"
          : "public, max-age=1800, s-maxage=3600, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff",
        ...(errorStatus ? { "X-Card-Error": String(errorStatus) } : {}),
        ...(errorStatus === 429 ? { "Retry-After": "60" } : {}),
      },
    });
  } catch {
    return Response.json(
      {
        error:
          "Image rendering failed. Check the bundled fonts and server logs.",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
