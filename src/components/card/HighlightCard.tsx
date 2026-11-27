import type { Profile } from "@/lib/github";
import type { CardOptions } from "@/lib/params";
import { resolveTheme } from "@/lib/primer-themes";
import { StreakSection } from "./StreakSection";
import { Icon } from "../Icon";
export const CARD_WIDTH = 600;
export const CARD_HEIGHT = 320;
export const cardHeight = (streak: boolean) => streak ? 440 : CARD_HEIGHT;
export function HighlightCard({
  profile: p,
  options: o,
}: {
  profile: Profile;
  options: CardOptions;
}) {
  const t = resolveTheme(o.theme);
  const languages = p.languages;
  const total = languages.reduce((s, l) => s + l.size, 0) || 1;
  const metrics = [
    ["star", "Total stars", p.stars],
    ["git-commit", "Commits", p.commits],
    ["git-pull-request", "Pull requests", p.prs],
    ["issue-opened", "Issues", p.issues],
    ["people", "Followers", p.followers],
    ["repo", "Repositories", p.repositories],
  ] as const;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        width: CARD_WIDTH,
        height: cardHeight(o.streak),
        backgroundColor: t.bgDefault,
        color: t.fgDefault,
        border: o.border ? `1px solid ${t.borderDefault}` : undefined,
        borderRadius: o.radius,
        padding: 24,
        fontFamily: "Inter",
        fontSize: 13,
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {p.avatar ? (
          <img
            src={p.avatar}
            width={48}
            height={48}
            style={{ borderRadius: 24 }}
            alt=""
          />
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 48,
              height: 48,
              borderRadius: 24,
              background: t.bgMuted,
              color: t.accent,
            }}
          >
            <Icon name="mark-github" size={32} />
          </div>
        )}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
            flexGrow: 1,
          }}
        >
          <span style={{ fontSize: 20, fontWeight: 600 }}>
            {p.name.slice(0, 40)}
          </span>
          <span style={{ fontFamily: "Mono", fontSize: 12, color: t.fgMuted }}>
            @{p.login}
          </span>
        </div>
        <Icon name="mark-github" color={t.fgMuted} size={22} />
      </div>
      {!o.hide.split(",").includes("bio") && (
        <div
          style={{
            display: "flex",
            height: 32,
            alignItems: "center",
            color: t.fgMuted,
            fontSize: 12,
          }}
        >
          {(p.bio || p.status || "Open source on GitHub.").slice(0, 82)}
        </div>
      )}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          marginTop: 12,
          paddingTop: 14,
          borderTop: `1px solid ${t.borderDefault}`,
          rowGap: 17,
        }}
      >
        {metrics.map(([icon, label, value]) => (
          <div
            key={label}
            style={{
              display: "flex",
              width: "33.333%",
              gap: 9,
              alignItems: "center",
            }}
          >
            <Icon name={icon} color={t.fgMuted} />
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ fontFamily: "Mono", fontSize: 17 }}>
                {value.toLocaleString("en-US")}
              </span>
              <span style={{ fontSize: 11, color: t.fgMuted }}>
                {label}
                {label === "Commits" ? ` (${new Date().getUTCFullYear()})` : ""}
              </span>
            </div>
          </div>
        ))}
      </div>
      {!o.hide.split(",").includes("languages") && languages.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 9,
            marginTop: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              height: 6,
              width: "100%",
              borderRadius: 3,
              overflow: "hidden",
              background: t.bgMuted,
            }}
          >
            {languages.map((l) => (
              <div
                key={l.name}
                style={{
                  display: "flex",
                  width: `${(l.size / total) * 100}%`,
                  background: l.color,
                  height: 6,
                }}
              />
            ))}
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            {languages.map((l) => (
              <div
                key={l.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 10,
                  color: t.fgMuted,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    width: 7,
                    height: 7,
                    borderRadius: 4,
                    background: l.color,
                  }}
                />
                {l.name}
              </div>
            ))}
          </div>
        </div>
      )}
      {o.streak && p.streaks && <StreakSection stats={p.streaks} theme={t} />}
      <div
        style={{
          display: "flex",
          marginTop: "auto",
          paddingTop: 10,
          fontSize: 10,
          color: t.fgMuted,
          justifyContent: "space-between",
        }}
      >
        <span>
          {p.contributions.toLocaleString("en-US")} contributions this year
        </span>
        <span>{o.demo ? "Sample data · gh-spotlight" : "gh-spotlight"}</span>
      </div>
    </div>
  );
}
export function ErrorCard({
  message,
  options,
}: {
  message: string;
  options: CardOptions;
}) {
  const t = resolveTheme(options.theme);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 18,
        boxSizing: "border-box",
        width: CARD_WIDTH,
        height: cardHeight(options.streak),
        padding: 32,
        fontFamily: "Inter",
        background: t.bgDefault,
        color: t.fgDefault,
        border: `1px solid ${t.borderDefault}`,
        borderRadius: options.radius,
      }}
    >
      <Icon name="mark-github" size={32} color={t.fgMuted} />
      <span style={{ fontSize: 22 }}>Unable to generate card</span>
      <span style={{ fontSize: 15, color: t.fgMuted }}>{message}</span>
      <span style={{ fontSize: 12, color: t.fgMuted }}>gh-spotlight</span>
    </div>
  );
}
