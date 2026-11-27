export interface ContributionDay {
  date: string;
  contributionCount: number;
}

export interface Streak {
  days: number;
  start: string | null;
  end: string | null;
}

export interface StreakStats {
  total: number;
  firstContribution: string | null;
  through: string;
  current: Streak;
  longest: Streak;
}

const DAY = 86_400_000;
const emptyStreak = (): Streak => ({ days: 0, start: null, end: null });

// Calendar dates are UTC. An unfinished today does not break yesterday's run.
export function calculateStreaks(
  input: ContributionDay[],
  now = new Date(),
): StreakStats {
  const today = now.toISOString().slice(0, 10);
  const yesterday = new Date(Date.parse(today) - DAY).toISOString().slice(0, 10);
  const days = [...new Map(input.filter((d) => d.date <= today).map((d) => [d.date, d])).values()]
    .sort((a, b) => a.date.localeCompare(b.date));
  let run = emptyStreak();
  let longest = emptyStreak();
  let total = 0;
  let firstContribution: string | null = null;
  for (const day of days) {
    total += day.contributionCount;
    if (day.contributionCount <= 0) {
      run = emptyStreak();
      continue;
    }
    firstContribution ??= day.date;
    const adjacent = run.end && Date.parse(day.date) - Date.parse(run.end) === DAY;
    run = { days: adjacent ? run.days + 1 : 1, start: adjacent ? run.start : day.date, end: day.date };
    if (run.days > longest.days) longest = { ...run };
  }
  // Find the last active run separately: today's zero may have reset `run`.
  let current = emptyStreak();
  const active = days.filter((d) => d.contributionCount > 0);
  const last = active.at(-1);
  if (last && (last.date === today || last.date === yesterday)) {
    current = { days: 1, start: last.date, end: last.date };
    for (let i = active.length - 2; i >= 0; i--) {
      if (Date.parse(current.start!) - Date.parse(active[i].date) !== DAY) break;
      current.days++;
      current.start = active[i].date;
    }
  }
  return { total, firstContribution, through: today, current, longest };
}
