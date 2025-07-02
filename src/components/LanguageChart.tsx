import { useId } from "react";
import type { LanguageShare } from "../lib/languages";

interface Props {
  languages: LanguageShare[];
}

const ROW = 30;
const BAR = 14;
// Horizontal layout in percent of the chart width, so the SVG stays crisp
// and readable at any width without scaling the text.
// The right 22% is left free for the value text, even on a 320px screen.
const LABEL_END = 28;
const BAR_START = 30;
const BAR_MAX = 48;

function pct(share: number): string {
  const p = share * 100;
  return p >= 10 || p === 0 ? `${Math.round(p)}%` : `${p.toFixed(1)}%`;
}

export function LanguageChart({ languages }: Props) {
  const id = useId();
  const max = Math.max(...languages.map((l) => l.share), 0);
  const height = languages.length * ROW;
  const summary = languages.map((l) => `${l.language} ${pct(l.share)} (${l.repos} repo${l.repos === 1 ? "" : "s"})`).join(", ");

  return (
    <section className="card" aria-labelledby={`${id}-h`}>
      <header className="card-head">
        <h2 id={`${id}-h`}>Languages</h2>
        <p className="card-sub">Primary language of each original repo</p>
      </header>
      {languages.length === 0 ? (
        <p className="empty">None of the original repos declare a language.</p>
      ) : (
        <svg
          className="lang-chart"
          width="100%"
          height={height}
          role="img"
          aria-labelledby={`${id}-t`}
          aria-describedby={`${id}-d`}
        >
          <title id={`${id}-t`}>Languages by number of repositories</title>
          <desc id={`${id}-d`}>{summary}</desc>
          {languages.map((l, i) => {
            const y = i * ROW;
            const width = max > 0 ? (l.share / max) * BAR_MAX : 0;
            return (
              <g key={l.language} data-language={l.language}>
                <text x={`${LABEL_END}%`} y={y + ROW / 2} textAnchor="end" dominantBaseline="central" className="lang-label">
                  {l.language.length > 18 ? `${l.language.slice(0, 17)}...` : l.language}
                </text>
                <rect
                  x={`${BAR_START}%`}
                  y={y + (ROW - BAR) / 2}
                  width={`${BAR_MAX}%`}
                  height={BAR}
                  rx={3}
                  className="lang-track"
                />
                <rect
                  x={`${BAR_START}%`}
                  y={y + (ROW - BAR) / 2}
                  width={`${Math.max(width, 0.6)}%`}
                  height={BAR}
                  rx={3}
                  fill={l.color}
                />
                <text x="100%" y={y + ROW / 2} textAnchor="end" dominantBaseline="central" className="lang-value">
                  {pct(l.share)}
                  <tspan className="lang-count"> ({l.repos})</tspan>
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </section>
  );
}
