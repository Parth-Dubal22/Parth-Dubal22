/** Star rating — ported from prototype stars(). */
export default function Stars({ rating }: { rating: number }) {
  return (
    <span className="stars" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= Math.round(rating) ? "" : "dim"}>★</span>
      ))}
    </span>
  );
}
