// The altovo mark — brand sheet v1.0. Uses currentColor so it follows the theme.
export function Logo({ size = 24 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 96 96"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="altovo"
      style={{ color: "var(--brand)" }}
    >
      <path
        d="M14 70 L48 14 L82 70"
        stroke="currentColor"
        strokeWidth="14"
        strokeLinejoin="miter"
        strokeLinecap="butt"
      />
      <path
        d="M48 14 L48 50"
        stroke="currentColor"
        strokeWidth="14"
        strokeLinecap="butt"
        opacity="0.18"
      />
    </svg>
  );
}
