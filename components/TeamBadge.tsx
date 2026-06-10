export function TeamBadge({
  crest,
  tla,
  name,
}: {
  crest: string | null;
  tla: string | null;
  name: string | null;
}) {
  if (crest && crest.startsWith("http")) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <span className="badge">
        <img src={crest} alt={name ?? ""} loading="lazy" />
      </span>
    );
  }
  return <span className="badge">{tla ?? "—"}</span>;
}
