import { mkdir, writeFile } from "node:fs/promises";
import { GET } from "../src/app/api/card/route";
import { themeNames } from "../src/lib/primer-themes";
async function main() {
  await mkdir("public/previews", { recursive: true });
  for (const theme of themeNames) {
    for (const streak of [false, true]) {
      const response = await GET(
        new Request(
          `http://localhost/api/card?user=octocat&demo=true&theme=${theme}&streak=${streak}`,
        ),
      );
      if (!response.ok || response.headers.get("content-type") !== "image/png")
        throw new Error(`Preview failed: ${theme}`);
      await writeFile(
        `public/previews/${theme}${streak ? "-streak" : ""}.png`,
        Buffer.from(await response.arrayBuffer()),
      );
      console.log(`Generated ${theme}${streak ? " streak" : ""} preview`);
    }
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
