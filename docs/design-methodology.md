# UI/UX Pro Max — distilled methodology (extracted from nextlevelbuilder/ui-ux-pro-max-skill v2.10, MIT)

## Workflow (design system before code)
1. Classify product type → match industry reasoning rule (BuildSafe = B2B SaaS / Fintech-adjacent / construction).
2. Pick landing PATTERN from the 8: Hero-Centric / Conversion-Optimized / Feature-Rich Showcase / Minimal & Direct / Social Proof-Focused / Interactive Product Demo / Trust & Authority / Storytelling-Driven.
   → BuildSafe fit: **Trust & Authority + Interactive Product Demo hybrid** (B2B, risk product: trust converts).
3. Pick STYLE from 67 (relevant here: Glassmorphism [modern SaaS, financial dashboards], Bento Box Grid [dashboards, product pages], Soft UI Evolution [modern enterprise], Dimensional Layering [cards/depth]).
4. Colors: industry mood — fintech/risk = deep navy authority + one signal accent; AVOID "AI purple/pink gradients" for banking/fintech (explicit anti-pattern).
5. Typography: pairing with distinct display vs body; provide Google Fonts import.
6. Key effects: smooth transitions 150–300ms, gentle hovers; avoid harsh animation.

## Pre-delivery checklist (run on every UI before handoff)
- [ ] No emojis as icons — use SVG (Heroicons/Lucide)
- [ ] cursor:pointer on all clickable elements
- [ ] Hover states with smooth transitions (150–300ms)
- [ ] Light mode text contrast ≥ 4.5:1
- [ ] Visible keyboard focus states
- [ ] prefers-reduced-motion respected
- [ ] Responsive at 375 / 768 / 1024 / 1440
- [ ] Anti-patterns filtered for the industry

## Persist pattern
design-system/MASTER.md = global source of truth; pages/*.md = overrides. Check page file first, else MASTER.
