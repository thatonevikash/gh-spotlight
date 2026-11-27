"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Icon } from "./Icon";
import { themes, themeNames, themeLabels } from "@/lib/primer-themes";
import { cardSchema } from "@/lib/params";
export default function Playground() {
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [username, setUsername] = useState(search.get("user") || "octocat");
  const [origin, setOrigin] = useState("");
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState<"markdown" | "html" | "url">("markdown");
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const parsed = cardSchema.safeParse(Object.fromEntries(search));
  const options = parsed.success
    ? parsed.data
    : cardSchema.parse({ user: "octocat", demo: "true" });
  const demo = !search.has("user") || options.demo;
  const params = new URLSearchParams({
    user: options.user,
    theme: options.theme,
    border: String(options.border),
    radius: String(options.radius),
  });
  if (options.hide) params.set("hide", options.hide);
  const livePath = `/api/card?${params}`;
  if (demo) params.set("demo", "true");
  const imagePath = `/api/card?${params}`;
  const publicUrl = `${origin}${livePath}`;
  const code =
    tab === "markdown"
      ? `![GitHub Stats](${publicUrl})`
      : tab === "html"
        ? `<img src="${publicUrl.replaceAll("&", "&amp;")}" alt="GitHub Stats" width="600" height="320" />`
        : publicUrl;
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);
  useEffect(() => {
    setUsername(search.get("user") || "octocat");
  }, [search]);
  useEffect(() => {
    setLoading(true);
    setFailed(false);
  }, [imagePath]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [notice]);
  function update(values: Record<string, string>) {
    const next = new URLSearchParams(search.toString());
    if (!next.has("user")) {
      next.set("user", "octocat");
      next.set("demo", "true");
    }
    for (const [key, value] of Object.entries(values)) next.set(key, value);
    router.replace(`${pathname}?${next}`, { scroll: false });
  }
  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setNotice("Copied to clipboard");
    } catch {
      setNotice("Clipboard unavailable. Select and copy the snippet below.");
    }
  }
  async function download() {
    try {
      const response = await fetch(imagePath);
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      if (!blob.type.startsWith("image/png")) throw new Error();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${options.user}-${options.theme}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice("PNG downloaded");
    } catch {
      setNotice("Download unavailable. Check your GitHub token and try again.");
    }
  }
  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="wordmark" href="/" aria-label="gh-spotlight home">
          <span className="brand-icon">
            <Icon name="mark-github" size={22} />
          </span>
          gh<span className="wordmark-dash">-</span>spotlight
          <span className="version">v1.0</span>
        </a>
        <nav>
          <a href="#how-it-works">How it works</a>
          <a
            href="https://github.com/primer/primitives"
            target="_blank"
            rel="noreferrer"
          >
            <Icon name="mark-github" />
            Built with Primer
            <Icon name="link-external" size={13} />
          </a>
        </nav>
      </header>
      <main>
        <section className="hero">
          <div className="eyebrow">
            <span className="tiny-symbol">✦</span> A LITTLE SPOTLIGHT FOR YOUR
            OPEN SOURCE
          </div>
          <h1>
            Your GitHub.
            <br />
            In a <span>good light.</span>
          </h1>
          <p>
            Turn your contributions into a card worth sharing.
            <br className="desktop-break" /> GitHub-native design. Crisp at
            every pixel. Yours in seconds.
          </p>
          <div className="hero-meta">
            <span>
              <Icon name="check" size={14} />
              Primer themes
            </span>
            <span>
              <Icon name="check" size={14} />
              2× retina PNG
            </span>
            <span>
              <Icon name="check" size={14} />
              README ready
            </span>
          </div>
        </section>
        <section className="workspace" aria-label="Card generator">
          <aside className="controls">
            <div className="panel-heading">
              <Icon name="sliders" />
              <h2>Make it yours</h2>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const valid = cardSchema.shape.user.safeParse(username);
                if (!valid.success) {
                  setNotice("Enter a valid GitHub username.");
                  return;
                }
                update({ user: username, demo: "false" });
              }}
            >
              <label htmlFor="username">GitHub username</label>
              <div className="username-field">
                <span>@</span>
                <input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="octocat"
                  maxLength={39}
                  required
                />
                <button
                  title="Load GitHub profile"
                  aria-label="Load GitHub profile"
                  type="submit"
                >
                  <Icon name="sync" />
                </button>
              </div>
              <p className="field-help">
                Any public GitHub profile is welcome.
              </p>
            </form>
            <fieldset className="theme-field">
              <legend>Card theme</legend>
              <div className="theme-grid">
                {themeNames.map((name) => (
                  <button
                    key={name}
                    className={`theme-option ${options.theme === name ? "selected" : ""}`}
                    onClick={() => update({ theme: name })}
                    aria-pressed={options.theme === name}
                  >
                    <span
                      className="theme-swatch"
                      style={{
                        background: themes[name].bgDefault,
                        borderColor: themes[name].borderDefault,
                      }}
                    >
                      <span style={{ background: themes[name].fgDefault }} />
                      <span style={{ background: themes[name].fgMuted }} />
                      <span style={{ background: themes[name].accent }} />
                      {options.theme === name && (
                        <i>
                          <Icon name="check" size={11} />
                        </i>
                      )}
                    </span>
                    <span>{themeLabels[name]}</span>
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="options-block">
              <h3>Fine-tune</h3>
              <label className="toggle-row" htmlFor="border">
                Show border
                <input
                  id="border"
                  type="checkbox"
                  role="switch"
                  checked={options.border}
                  onChange={(e) => update({ border: String(e.target.checked) })}
                />
              </label>
              <label className="toggle-row" htmlFor="bio">
                Show bio
                <input
                  id="bio"
                  type="checkbox"
                  role="switch"
                  checked={!options.hide.split(",").includes("bio")}
                  onChange={(e) => {
                    const hide = new Set(
                      options.hide.split(",").filter(Boolean),
                    );
                    if (e.target.checked) hide.delete("bio");
                    else hide.add("bio");
                    update({ hide: [...hide].join(",") });
                  }}
                />
              </label>
              <div className="radius-label">
                <label htmlFor="radius">Corner radius</label>
                <output>{options.radius}px</output>
              </div>
              <input
                id="radius"
                className="radius-slider"
                type="range"
                min="0"
                max="32"
                step="1"
                value={options.radius}
                onChange={(e) => update({ radius: e.target.value })}
              />
              <div className="range-labels">
                <span>Square</span>
                <span>Rounded</span>
              </div>
            </div>
            <div className="control-note">
              <Icon name="info" size={14} />
              <span>
                Your settings live in the URL.
                <br />
                Bookmark it. Share it. Make it yours.
              </span>
            </div>
          </aside>
          <div className="preview-panel">
            <div className="preview-toolbar">
              <div>
                <span className="live-dot" />
                Live preview
                <span className="preview-mode">
                  {demo ? "Sample data" : `@${options.user}`}
                </span>
              </div>
              <span className="resolution">1200 × 640 PNG</span>
            </div>
            <div className="preview-canvas">
              <div className="card-stage" aria-busy={loading}>
                <img
                  key={imagePath}
                  src={imagePath}
                  alt={`${demo ? "Sample " : ""}GitHub statistics for ${options.user}`}
                  width="600"
                  height="320"
                  onLoad={() => setLoading(false)}
                  onError={() => {
                    setLoading(false);
                    setFailed(true);
                  }}
                />
                {loading && (
                  <div className="preview-status">Rendering your card...</div>
                )}
                {failed && (
                  <div className="preview-status error-message">
                    Unable to load the card. Check the server token and retry.
                  </div>
                )}
              </div>
              <div className="canvas-caption">
                <Icon name="zoom-in" size={13} />
                Rendered at 2×. Looks sharp everywhere.
              </div>
            </div>
            <div className="export-area">
              <div className="export-heading">
                <div>
                  <h2>Ready for your README.</h2>
                  <p>One snippet. A little more you.</p>
                </div>
                <button className="download-button" onClick={download}>
                  <Icon name="download" />
                  Download PNG
                </button>
              </div>
              <div className="snippet-box">
                <div
                  className="snippet-tabs"
                  role="tablist"
                  aria-label="Embed format"
                >
                  {(["markdown", "html", "url"] as const).map((value) => (
                    <button
                      key={value}
                      id={`tab-${value}`}
                      role="tab"
                      aria-selected={tab === value}
                      aria-controls="snippet-content"
                      onClick={() => setTab(value)}
                    >
                      {value === "markdown"
                        ? "Markdown"
                        : value === "html"
                          ? "HTML"
                          : "Image URL"}
                    </button>
                  ))}
                  <button
                    className="copy-small"
                    onClick={() => copy(code)}
                    aria-label="Copy snippet"
                  >
                    <Icon name="copy" size={15} />
                  </button>
                </div>
                <pre
                  id="snippet-content"
                  role="tabpanel"
                  aria-labelledby={`tab-${tab}`}
                  tabIndex={0}
                >
                  {code}
                </pre>
              </div>
              <div className="export-bottom">
                <span>
                  <Icon name="info" size={13} />
                  {demo
                    ? "Preview uses sample data. Embed URLs always use live GitHub data."
                    : "Cards refresh automatically. Your README stays up to date."}
                </span>
                <button className="primary-button" onClick={() => copy(code)}>
                  <Icon name="copy" size={14} />
                  Copy{" "}
                  {tab === "markdown"
                    ? "Markdown"
                    : tab === "html"
                      ? "HTML"
                      : "URL"}
                </button>
              </div>
            </div>
          </div>
        </section>
        <section className="details" id="how-it-works">
          <article>
            <div className="detail-icon">
              <Icon name="paintbrush" size={20} />
            </div>
            <h3>Feels right at home.</h3>
            <p>
              Official Primer colors and Octicons.
              <br />A natural fit for your GitHub profile.
            </p>
          </article>
          <article>
            <div className="detail-icon">
              <Icon name="image" size={20} />
            </div>
            <h3>Small card. Sharp details.</h3>
            <p>
              Locally bundled fonts and 2× rendering.
              <br />
              Every contribution, perfectly clear.
            </p>
          </article>
          <article>
            <div className="detail-icon">
              <Icon name="code" size={20} />
            </div>
            <h3>Built for your README.</h3>
            <p>
              Pick a theme, copy your snippet, and ship.
              <br />
              Your stats take care of themselves.
            </p>
          </article>
        </section>
        <div className="setup-note">
          <Icon name="terminal" size={16} />
          <p>
            Running locally? Add <code>GITHUB_TOKEN</code> to{" "}
            <code>.env.local</code> to connect live GitHub data.
          </p>
          <a
            href="https://github.com/settings/tokens"
            target="_blank"
            rel="noreferrer"
          >
            Get a token
            <Icon name="link-external" size={12} />
          </a>
        </div>
      </main>
      <footer>
        <span>
          <Icon name="mark-github" size={17} />
          Made for the people who make things.
        </span>
        <span>
          gh-spotlight<span className="footer-dot">·</span>Open source looks
          good on you.
        </span>
      </footer>
      <div className="toast" role="status" aria-live="polite">
        {notice}
      </div>
    </div>
  );
}
