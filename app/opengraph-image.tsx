import { ImageResponse } from "next/og";

// altovo brand sheet v1.0 — generated social share card (1200×630).
export const alt = "altovo · World Cup 2026 prediction game";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#F5F3EE";
const GOLD = "#D9B65B";

// The altovo chevron mark, inlined as an SVG data URI (satori renders <img>).
const MARK = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">` +
    `<path d="M14 70 L48 14 L82 70" stroke="${PAPER}" stroke-width="14" fill="none" stroke-linejoin="miter"/>` +
    `<path d="M48 14 L48 50" stroke="${PAPER}" stroke-width="14" fill="none" opacity="0.18"/>` +
    `</svg>`,
)}`;

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background:
            "linear-gradient(135deg, #06152B 0%, #0A1E3D 55%, #102A52 100%)",
          color: PAPER,
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* gold top hairline */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: 8,
            background: GOLD,
            display: "flex",
          }}
        />
        {/* signal glow, top-right */}
        <div
          style={{
            position: "absolute",
            top: -160,
            right: -120,
            width: 520,
            height: 520,
            background:
              "radial-gradient(circle, rgba(61,111,190,0.45) 0%, rgba(61,111,190,0) 70%)",
            display: "flex",
          }}
        />

        {/* brand row */}
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={MARK} width={72} height={72} alt="" />
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <span style={{ fontSize: 44, fontWeight: 600, letterSpacing: "-0.02em" }}>
              altovo
            </span>
            <span
              style={{
                width: 2,
                height: 34,
                background: "rgba(245,243,238,0.25)",
                display: "flex",
              }}
            />
            <span
              style={{
                fontSize: 20,
                letterSpacing: "0.28em",
                color: "rgba(245,243,238,0.6)",
                textTransform: "uppercase",
                display: "flex",
              }}
            >
              World Cup 2026
            </span>
          </div>
        </div>

        {/* hero */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <span
            style={{
              fontSize: 22,
              letterSpacing: "0.32em",
              color: GOLD,
              textTransform: "uppercase",
              display: "flex",
            }}
          >
            Prediction game
          </span>
          <span
            style={{
              fontSize: 94,
              fontWeight: 700,
              lineHeight: 1.02,
              letterSpacing: "-0.03em",
              display: "flex",
            }}
          >
            Predict every match.
          </span>
          <span
            style={{
              fontSize: 34,
              color: "rgba(245,243,238,0.72)",
              letterSpacing: "-0.01em",
              display: "flex",
            }}
          >
            Score points, play your jokers, win the office cup.
          </span>
        </div>

        {/* footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 12,
                background: GOLD,
                display: "flex",
              }}
            />
            <span
              style={{ fontSize: 26, fontFamily: "monospace", letterSpacing: "0.04em" }}
            >
              worldcup.ota-i.com
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {["3 exact", "1 outcome", "0 miss"].map((t) => (
              <span
                key={t}
                style={{
                  display: "flex",
                  fontSize: 20,
                  padding: "10px 18px",
                  borderRadius: 999,
                  border: "1px solid rgba(245,243,238,0.2)",
                  color: "rgba(245,243,238,0.85)",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
