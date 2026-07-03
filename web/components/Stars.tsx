/** Star rating — inline SVG stars (MASTER §13.3: SVG icons, no text glyphs).
 *  Filled vs dim driven by class so CSS controls the palette (--star / --cloud). */
function Star({ dim }: { dim: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={dim ? "star dim" : "star"}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 17.3l-5.9 3.5 1.5-6.7L2.5 9.6l6.8-.6L12 2.7l2.7 6.3 6.8.6-5.1 4.5 1.5 6.7z" />
    </svg>
  );
}

export default function Stars({ rating }: { rating: number }) {
  return (
    <span className="stars" role="img" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} dim={i > Math.round(rating)} />
      ))}
    </span>
  );
}
