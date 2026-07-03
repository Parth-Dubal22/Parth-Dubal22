/** SVG scene art for "photo" tiles — ported 1:1 from prototype js/app.js art().
 *  Swap for real photos later; keep aspect ratios (400×240). */

const SCENES: Record<string, React.ReactNode> = {
  crane: (
    <>
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FF8452" />
          <stop offset=".55" stopColor="#C2503A" />
          <stop offset="1" stopColor="#12304F" />
        </linearGradient>
      </defs>
      <rect width="400" height="240" fill="url(#g1)" />
      <circle cx="322" cy="52" r="26" fill="#FFD9A8" opacity=".9" />
      <g stroke="#0A1B2E" strokeWidth="6">
        <path d="M60 240V90h10v150M65 90L200 60M200 60v20M200 60l60 10M150 72v14" />
      </g>
      <rect x="230" y="140" width="120" height="100" fill="#0A1B2E" />
      <rect x="120" y="170" width="80" height="70" fill="#0E2238" />
      <g fill="#FFB08C">
        <rect x="245" y="155" width="12" height="12" />
        <rect x="270" y="155" width="12" height="12" />
        <rect x="295" y="155" width="12" height="12" />
        <rect x="245" y="180" width="12" height="12" />
        <rect x="270" y="180" width="12" height="12" />
      </g>
    </>
  ),
  frame: (
    <>
      <defs>
        <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7FB2E5" />
          <stop offset="1" stopColor="#E9EEF5" />
        </linearGradient>
      </defs>
      <rect width="400" height="240" fill="url(#g2)" />
      <g stroke="#B87333" strokeWidth="7" fill="none">
        <path d="M60 240V120L200 60l140 60v120M110 240V140M160 240V118M240 240V118M290 240V140M60 160h280M60 200h280" />
      </g>
      <rect y="228" width="400" height="12" fill="#8C6A4F" />
    </>
  ),
  house: (
    <>
      <defs>
        <linearGradient id="g3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFE3C2" />
          <stop offset="1" stopColor="#F5A25B" />
        </linearGradient>
      </defs>
      <rect width="400" height="240" fill="url(#g3)" />
      <rect x="70" y="120" width="260" height="120" fill="#F7F3EA" />
      <path d="M50 125L200 55l150 70z" fill="#41546B" />
      <rect x="110" y="150" width="46" height="46" fill="#2E4258" />
      <rect x="244" y="150" width="46" height="46" fill="#2E4258" />
      <rect x="182" y="160" width="40" height="80" fill="#B87333" />
      <rect y="230" width="400" height="10" fill="#5E7256" />
    </>
  ),
  tower: (
    <>
      <defs>
        <linearGradient id="g4" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0F2440" />
          <stop offset="1" stopColor="#2E5E8F" />
        </linearGradient>
      </defs>
      <rect width="400" height="240" fill="url(#g4)" />
      <rect x="90" y="60" width="90" height="180" fill="#132C48" />
      <rect x="220" y="30" width="100" height="210" fill="#0C1F36" />
      <g fill="#FFC773">
        <rect x="102" y="76" width="14" height="10" />
        <rect x="130" y="76" width="14" height="10" />
        <rect x="102" y="104" width="14" height="10" />
        <rect x="234" y="50" width="16" height="11" />
        <rect x="262" y="50" width="16" height="11" />
        <rect x="234" y="82" width="16" height="11" />
        <rect x="290" y="114" width="16" height="11" />
        <rect x="262" y="146" width="16" height="11" />
      </g>
    </>
  ),
  tile: (
    <>
      <rect width="400" height="240" fill="#D8E2EA" />
      <g stroke="#fff" strokeWidth="6">
        <path d="M0 60h400M0 130h400M0 200h400M80 0v240M180 0v240M280 0v240" />
      </g>
      <rect x="185" y="65" width="90" height="60" fill="#2E5E8F" />
      <rect x="85" y="135" width="90" height="60" fill="#FF8452" />
    </>
  ),
};

export default function Art({
  kind,
  label,
  className,
  style,
}: {
  kind: string;
  label?: string;
  /** Optional extras so wrappers (e.g. SitePhoto's fallback) can size/position
   *  the scene without new CSS. Omitted everywhere else — fully backward compatible. */
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={className ? `art ${className}` : "art"} style={style}>
      <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice">
        {SCENES[kind] ?? SCENES.house}
      </svg>
      {label ? <span className="cap">{label}</span> : null}
    </div>
  );
}
