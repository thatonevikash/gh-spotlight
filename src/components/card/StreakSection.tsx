import type { StreakStats } from "@/lib/streaks";
import type { PrimerTheme } from "@/lib/primer-themes";
import { Icon } from "../Icon";

function date(value: string) {
  return new Date(`${value}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
  });
}
function range(start: string | null, end: string | null) {
  if (!start || !end) return "No contributions yet";
  return `${date(start)} – ${date(end)}`;
}

export function StreakSection({ stats: s, theme: t }: { stats: StreakStats; theme: PrimerTheme }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", marginTop: 17, padding: "12px 14px", border: `1px solid ${t.borderDefault}`, borderRadius: 8, background: t.bgMuted, flexShrink: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: t.accent, fontSize: 10, fontWeight: 600 }}>
          <Icon name="flame" size={13} />
          <span>CONTRIBUTION STREAKS</span>
        </div>
        <span style={{ fontSize: 9, color: t.fgMuted }}>All time · UTC</span>
      </div>
      <div style={{ display: "flex", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", width: "37%", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
            <span style={{ fontFamily: "Mono", fontSize: 25, color: t.accent }}>{s.current.days.toLocaleString("en-US")}</span>
            <span style={{ fontSize: 10, color: t.fgMuted }}>{s.current.days === 1 ? "day" : "days"}</span>
          </div>
          <span style={{ fontWeight: 600, fontSize: 11 }}>Current streak</span>
          <span style={{ color: t.fgMuted, fontSize: 9 }}>{s.current.days ? range(s.current.start, s.current.end) : "Start your next streak"}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", width: "34%", gap: 4, borderLeft: `1px solid ${t.borderDefault}`, paddingLeft: 13 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
            <span style={{ fontFamily: "Mono", fontSize: 20 }}>{s.longest.days.toLocaleString("en-US")}</span>
            <span style={{ fontSize: 10, color: t.fgMuted }}>{s.longest.days === 1 ? "day" : "days"}</span>
          </div>
          <span style={{ fontSize: 11 }}>Longest streak</span>
          <span style={{ color: t.fgMuted, fontSize: 9 }}>{range(s.longest.start, s.longest.end)}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", width: "29%", gap: 4, borderLeft: `1px solid ${t.borderDefault}`, paddingLeft: 13 }}>
          <span style={{ fontFamily: "Mono", fontSize: 20 }}>{s.total.toLocaleString("en-US")}</span>
          <span style={{ fontSize: 11 }}>Total contributions</span>
          <span style={{ color: t.fgMuted, fontSize: 9 }}>{s.firstContribution ? `Since ${date(s.firstContribution)}` : "No contributions yet"}</span>
        </div>
      </div>
    </div>
  );
}
