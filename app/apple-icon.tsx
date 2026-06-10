import { ImageResponse } from "next/og";

// Apple touch icon (home-screen). iOS rounds the corners, so fill the square.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const MARK = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">` +
    `<path d="M14 70 L48 14 L82 70" stroke="#F5F3EE" stroke-width="14" fill="none" stroke-linejoin="miter"/>` +
    `<path d="M48 14 L48 50" stroke="#F5F3EE" stroke-width="14" fill="none" opacity="0.18"/>` +
    `</svg>`,
)}`;

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #06152B 0%, #0A1E3D 100%)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={MARK} width={108} height={108} alt="" />
      </div>
    ),
    { ...size },
  );
}
