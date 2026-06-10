export const dynamic = "force-dynamic";

const SECTIONS = [
  {
    title: "Scoring",
    items: [
      ["3 pts", "Exact score — you nailed it."],
      ["1 pt", "Correct outcome (win, draw or loss) but not the exact score."],
      ["0 pts", "Wrong outcome."],
    ],
  },
  {
    title: "Jokers — double points",
    items: [
      ["8 total", "3 in the group stage, then 1 per knockout round (third-place match and final share one)."],
      ["2×", "A joker doubles whatever the match earns — 6 for an exact hit, 2 for the outcome, still 0 if wrong."],
      ["No carry-over", "Unused jokers expire with their phase. Spend them."],
    ],
  },
  {
    title: "Knockout matches",
    items: [
      ["Pick a winner", "No draw bets in the knockouts."],
      ["Pens count", "The outcome point goes to the team that advances — even on penalties."],
      ["Scoreline", "The exact score settles on the result after 90 or 120 minutes (shootout goals don't count)."],
    ],
  },
  {
    title: "How betting works",
    items: [
      ["Final means final", "You confirm once. No edits, no cancels — choose wisely."],
      ["Closes at kick-off", "Each match locks the second it starts."],
      ["No peeking", "Others' bets stay hidden until you've placed yours (or the match kicks off)."],
    ],
  },
  {
    title: "Leaderboard",
    items: [
      ["Tiebreaker", "Equal points? Most exact scores wins, then most correct outcomes, then joker points."],
    ],
  },
];

export default function RulesPage() {
  return (
    <>
      <div className="dayhead">
        <h2>How it works</h2>
      </div>
      {SECTIONS.map((s) => (
        <section key={s.title} style={{ marginBottom: 14 }}>
          <p className="mono" style={{ margin: "14px 0 8px" }}>
            {s.title}
          </p>
          <div className="card" style={{ padding: "4px 16px" }}>
            {s.items.map(([k, v]) => (
              <div key={k} className="statrow" style={{ alignItems: "flex-start", gap: 14 }}>
                <span
                  style={{
                    fontFamily: "var(--font-jbmono)",
                    fontWeight: 700,
                    fontSize: 13,
                    color: "var(--accent)",
                    whiteSpace: "nowrap",
                    paddingTop: 2,
                  }}
                >
                  {k}
                </span>
                <span style={{ fontSize: 14.5, textAlign: "right" }}>{v}</span>
              </div>
            ))}
          </div>
        </section>
      ))}
      <p style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
        Kickoff times show in your own timezone by default — the toggle on the matches page
        switches to stadium-local time. Results come in automatically; an admin can correct them
        if the feed misbehaves. Forgot your PIN? Any admin can reset it for you.
      </p>
    </>
  );
}
