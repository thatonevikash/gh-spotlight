import "server-only";
export interface Language {
  name: string;
  color: string;
  size: number;
}
export interface Profile {
  name: string;
  login: string;
  bio: string;
  avatar: string | null;
  status: string;
  stars: number;
  commits: number;
  prs: number;
  issues: number;
  followers: number;
  contributions: number;
  repositories: number;
  languages: Language[];
}
export class GitHubError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
interface Repository {
  stargazerCount: number;
  languages: {
    edges: { size: number; node: { name: string; color: string | null } }[];
  };
}
interface UserNode {
  name: string | null;
  login: string;
  bio: string | null;
  avatarUrl: string;
  status: { message: string } | null;
  followers: { totalCount: number };
  pullRequests: { totalCount: number };
  issues: { totalCount: number };
  contributionsCollection: {
    totalCommitContributions: number;
    contributionCalendar: { totalContributions: number };
  };
  repositories: {
    totalCount: number;
    pageInfo: { hasNextPage: boolean; endCursor: string };
    nodes: Repository[];
  };
}
const query = `query Spotlight($login: String!, $after: String, $from: DateTime!, $to: DateTime!) {
 user(login: $login) {
 name login bio avatarUrl status { message } followers { totalCount } pullRequests { totalCount } issues { totalCount }
 contributionsCollection(from: $from, to: $to) { totalCommitContributions contributionCalendar { totalContributions } }
 repositories(first: 100, after: $after, ownerAffiliations: OWNER, privacy: PUBLIC, isFork: false) {
 totalCount pageInfo { hasNextPage endCursor }
 nodes { stargazerCount languages(first: 10, orderBy: {field: SIZE, direction: DESC}) { edges { size node { name color } } } }
 } } }`;
export async function fetchProfile(login: string): Promise<Profile> {
  const token = process.env.GITHUB_TOKEN;
  if (!token)
    throw new GitHubError("Set GITHUB_TOKEN to generate live cards.", 503);
  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), 0, 1)).toISOString();
  let after: string | null = null;
  let user: UserNode | null = null;
  const repos: Repository[] = [];
  do {
    let response: Response;
    try {
      response = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          variables: { login, after, from, to: now.toISOString() },
        }),
        signal: AbortSignal.timeout(15000),
        cache: "no-store",
      });
    } catch {
      throw new GitHubError(
        "GitHub is temporarily unavailable. Try again shortly.",
        502,
      );
    }
    if (
      response.status === 429 ||
      (response.status === 403 &&
        response.headers.get("x-ratelimit-remaining") === "0")
    )
      throw new GitHubError("GitHub rate limit reached. Try again later.", 429);
    if (!response.ok)
      throw new GitHubError(
        response.status === 401
          ? "The server GitHub token needs attention."
          : "GitHub is temporarily unavailable.",
        502,
      );
    const result = (await response.json()) as {
      data?: { user: UserNode | null };
      errors?: { type?: string; message: string }[];
    };
    if (result.errors?.some((e) => e.type === "RATE_LIMITED"))
      throw new GitHubError("GitHub rate limit reached. Try again later.", 429);
    if (
      result.errors?.some((e) => e.type === "NOT_FOUND") ||
      (result.data && !result.data.user)
    )
      throw new GitHubError(`No GitHub profile found for @${login}.`, 404);
    if (result.errors?.length || !result.data?.user)
      throw new GitHubError("Unable to load this GitHub profile.", 502);
    user = result.data.user;
    repos.push(...user.repositories.nodes);
    after = user.repositories.pageInfo.hasNextPage
      ? user.repositories.pageInfo.endCursor
      : null;
    if (repos.length >= 10000 && after)
      throw new GitHubError("This profile exceeds the repository limit.", 422);
  } while (after);
  if (!user) throw new GitHubError("Profile unavailable.", 502);
  const languageMap = new Map<string, Language>();
  for (const repo of repos)
    for (const edge of repo.languages.edges) {
      const previous = languageMap.get(edge.node.name);
      languageMap.set(edge.node.name, {
        name: edge.node.name,
        color: edge.node.color || "#8b949e",
        size: (previous?.size || 0) + edge.size,
      });
    }
  let avatar: string | null = null;
  try {
    const url = new URL(user.avatarUrl);
    if (
      url.protocol === "https:" &&
      url.hostname === "avatars.githubusercontent.com"
    ) {
      url.searchParams.set("s", "128");
      const image = await fetch(url, {
        signal: AbortSignal.timeout(5000),
        redirect: "error",
      });
      const mime = image.headers.get("content-type")?.split(";")[0];
      if (
        image.ok &&
        mime &&
        ["image/png", "image/jpeg", "image/webp"].includes(mime)
      ) {
        const bytes = Buffer.from(await image.arrayBuffer());
        if (bytes.length <= 2_000_000)
          avatar = `data:${mime};base64,${bytes.toString("base64")}`;
      }
    }
  } catch {
    /* Avatar failure must not break the card. */
  }
  return {
    name: user.name || user.login,
    login: user.login,
    bio: user.bio || "",
    avatar,
    status: user.status?.message || "",
    stars: repos.reduce((sum, repo) => sum + repo.stargazerCount, 0),
    commits: user.contributionsCollection.totalCommitContributions,
    prs: user.pullRequests.totalCount,
    issues: user.issues.totalCount,
    followers: user.followers.totalCount,
    contributions:
      user.contributionsCollection.contributionCalendar.totalContributions,
    repositories: user.repositories.totalCount,
    languages: [...languageMap.values()]
      .sort((a, b) => b.size - a.size)
      .slice(0, 5),
  };
}
export const demoProfile: Profile = {
  name: "Mona Octocat",
  login: "octocat",
  bio: "Building things, one commit at a time.",
  avatar: null,
  status: "",
  stars: 1284,
  commits: 862,
  prs: 156,
  issues: 48,
  followers: 3240,
  contributions: 1246,
  repositories: 32,
  languages: [
    { name: "TypeScript", color: "#3178c6", size: 48 },
    { name: "JavaScript", color: "#f1e05a", size: 28 },
    { name: "CSS", color: "#663399", size: 16 },
    { name: "HTML", color: "#e34c26", size: 8 },
  ],
};
