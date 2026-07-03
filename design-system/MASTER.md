# BuildSafe Design System — MASTER (global source of truth)

**Persist pattern** (UI/UX Pro Max): this file is the global source of truth for every page and
component. Page-specific deviations live in `design-system/pages/<page>.md`. **Rule: check the
page file first; if absent or silent on a topic, MASTER wins.** Never restate MASTER values in a
page file — page files contain *deltas only*.

Scope: `web/` (Next.js 16, vanilla CSS in `web/app/app.css`). This document is written so that an
implementation agent can apply it mechanically. Values are exact. Where a value already exists in
`app.css` it is **kept exactly**; new tokens extend, never replace, the approved navy/orange system.

Skill grounding: each major choice cites its UI/UX Pro Max data row in §14. Chart colours were
validated with the dataviz skill's `validate_palette.js` (all four checks PASS on `#FFFFFF`).

---

## 1. Identity & direction (locked — do not redesign)

- **Pattern:** Trust & Authority + Interactive Product Demo hybrid. Landing order: hero
  (credibility) → proof (stats/logos/records) → solution overview → clear CTA path. Navy/grey
  authority base; **accent (orange) reserved for CTAs and signal moments**. [landing.csv:
  "Trust & Authority + Conversion"]
- **Style:** Soft-UI-Evolution card system + Glassmorphism for nav/overlays + Bento allowance for
  dashboard tiles. No brutalism, no AI purple/pink gradients (explicit fintech anti-pattern).
  [styles.csv: "Soft UI Evolution", "Glassmorphism", "Bento Box Grid"; methodology §4]
- **Colour:** fintech navy `#0A1B2E` × signal orange `#FF5A1F` — matches the skill's construction
  reasoning ("Grey/navy + Orange (safety)") and legal-services "authority navy" palette logic.
  [products.csv: "Construction/Architecture"; colors.csv: "Legal Services"]
- **Type:** Space Grotesk (display) / Inter (body/UI) / JetBrains Mono (data, refs, micro-labels).
  Exact tri-stack from the skill's fintech pairing; mono is for *data accuracy* (ABNs, $, dates,
  source refs) — never for body copy. [typography.csv: "Web3 Bitcoin DeFi (Space Grotesk + Inter + Mono)"]
- **Voice in UI:** facts with sources, never verdicts (legal guardrails in CLAUDE.md override
  everything here). Keep the already-written legal copy verbatim when refactoring.
- **Light mode only in v1.** All contrast targets are evaluated against white / `--mist` surfaces.

---

## 2. Design tokens

### 2.1 Existing tokens — KEEP EXACTLY (already in `app.css:5-15`)

```css
:root{
  --navy:#0A1B2E; --navy2:#0F2440; --ink:#0B1524; --slate:#4E5D77; --slate2:#6E7D93;
  --paper:#FFF; --mist:#F5F7FB; --cloud:#E8EDF5; --line:#E2E8F2;
  --orange:#FF5A1F; --orange2:#FF8452; --osoft:#FFF0E9;
  --risk:#E5484D; --rsoft:#FDEBEC; --watch:#E9950C; --wsoft:#FEF4E2; --clear:#149E5F; --csoft:#E6F6EF;
  --r:14px; --rl:22px;
  --sh1:0 1px 2px rgba(10,27,46,.06),0 2px 10px rgba(10,27,46,.06);
  --sh2:0 10px 32px rgba(10,27,46,.12);
  --sh3:0 28px 70px -14px rgba(10,27,46,.28);
  --fd:"Space Grotesk",sans-serif; --fb:"Inter",sans-serif; --fm:"JetBrains Mono",monospace;
}
```

Semantic roles (documentation, not new CSS): `--ink` body text · `--slate` secondary text ·
`--slate2` tertiary/micro text (min ~11.5px on white, never on `--cloud`) · `--line` hairlines ·
`--mist` app canvas · `--cloud` inset surfaces & skeleton base · status triad `--risk/--watch/--clear`
with their `*soft` tint backgrounds (status is always colour + label, never colour alone).

### 2.2 NEW tokens — add to the same `:root` block

```css
:root{
  /* spacing scale (4px base). Snap every margin/padding/gap to a step. */
  --s1:4px; --s2:8px; --s3:12px; --s4:16px; --s5:20px;
  --s6:24px; --s7:32px; --s8:48px; --s9:64px; --s10:96px;

  /* section rhythm (see §12 for per-page-type usage) */
  --sec-y:clamp(3rem,7vw,5rem);   /* marketing section vertical padding */
  --sec-head-mb:3rem;             /* .sec-head bottom margin */
  --stack-gap:1.6rem;             /* gap between module groups inside an app panel */
  --card-gap:1.3rem;              /* grid2/grid3 gap */
  --list-gap:.8rem;               /* .list row gap */

  /* control heights — ONE scale for buttons AND form fields */
  --ctl-s:36px; --ctl-m:44px; --ctl-l:52px;

  /* radii scale (replaces ad-hoc 6/9/11/12/14/15/18/22/24/26/27/28px) */
  --r-1:6px;   /* pills, srcline chips, skeleton text */
  --r-2:9px;   /* btn-s, small tags, small avatars */
  --r-3:12px;  /* buttons, form fields, mcard, toasts */
  --r-4:14px;  /* = --r  · items, kpis, reviews, photo cards */
  --r-5:18px;  /* role cards, av-lg */
  --r-6:22px;  /* = --rl · cards, jobcards, bcards, modals */
  --r-7:26px;  /* appcards, ob-card, covers, hero shells */
  --r-pill:999px;

  /* shadows (additions; sh1–sh3 unchanged) */
  --sh0:0 1px 2px rgba(10,27,46,.05);                 /* flat/nested items */
  --sh-cta:0 8px 20px -6px rgba(255,90,31,.5);        /* primary button glow */

  /* z-index scale */
  --z-nav:100; --z-appbar:120; --z-scrim:140; --z-side:150;
  --z-overlay:180; --z-modal:190; --z-toast:200;

  /* motion (150–300ms band per methodology; --ease is the approved reveal curve) */
  --t-1:150ms;  /* colour/border/opacity hovers */
  --t-2:200ms;  /* transforms: lifts, knobs, chips */
  --t-3:300ms;  /* panels, toasts, drawers, page transitions */
  --ease:cubic-bezier(.2,.7,.2,1);

  /* glass recipes (see §3) */
  --glass-bg:rgba(255,255,255,.78);
  --glass-bg-dark:rgba(10,27,46,.6);
  --glass-blur:14px;
  --glass-line:rgba(226,232,242,.85);

  /* focus & validation rings (keep the 3px orange outline) */
  --focus-ring:3px solid var(--orange);
  --ring-soft:0 0 0 4px rgba(255,90,31,.12);
  --ring-danger:0 0 0 4px rgba(229,72,77,.14);

  /* skeleton shimmer (see §8) */
  --skel-base:var(--cloud);
  --skel-sheen:rgba(255,255,255,.6);

  /* chart palette — validated, fixed order (see §11) */
  --ch-1:#2E6FC9; --ch-2:#FF5A1F; --ch-3:#0C9DB0; --ch-4:#B87333; --ch-5:#A34A8E;
  --ch-grid:var(--cloud); --ch-axis:var(--slate2);

  /* neutral avatar palette (never keyed to risk on public/customer surfaces) */
  --av-1:#2E5E8F; --av-2:#149E5F; --av-3:#B87333; --av-4:#41546B;
}
```

**Migration map for off-scale radii** (mechanical, ≤2px visual drift): `11px→var(--r-3)` ·
`15px (.search)→var(--r-4)` · `18px→var(--r-5)` · `24px (.av-xl)→var(--r-7)` ·
`26/27/28px→var(--r-7)` · `34px` phone-frame illustration is exempt (decorative one-off).

### 2.3 Type scale

| Role | Font | Size | Weight | Notes |
|---|---|---|---|---|
| h1 hero | `--fd` | `clamp(2.4rem,5.4vw,4rem)` | 700 | keep; letter-spacing −.02em, lh 1.06 |
| h2 section | `--fd` | `clamp(1.8rem,3.4vw,2.6rem)` | 700 | |
| h2 app topbar | `--fd` | 1.5rem | 700 | `.topbar h2` |
| h3 card title | `--fd` | 1.2rem | 700 | |
| h4 item title | `--fd` | 1.05rem | 700 | jobcards, bcards |
| body | `--fb` | 1rem / .92–.96rem in cards | 400 | lh 1.6 |
| `.sub` lede | `--fb` | 1.08rem | 400 | `--slate` |
| UI label | `--fb` | .78rem | 600 | form labels, `--slate` |
| `.hint` | `--fb` | .72rem | 400 | `--slate2` |
| micro-mono | `--fm` | .58–.7rem, tracking .06–.14em, uppercase | 500–600 | kpi labels, meta rows, srcline |
| price/stat display | `--fd` | 1.7rem (kpi) / 2.1rem (pricing) | 700 | proportional figures — **never** `tabular-nums` on display numbers; tabular only in table columns and axis ticks (dataviz rule) |

Micro-mono below .58rem is forbidden (≤9px is illegible). `.pill` stays .6rem uppercase mono —
it always duplicates meaning in text, never colour-alone.

---

## 3. Glass recipes (nav, overlays, photo captions)

[styles.csv "Glassmorphism": blur 10–20px, translucent 15–30%, 1px light border, verify 4.5:1]

```css
/* light glass — sticky site nav (current .nav, formalised) */
.glass{background:var(--glass-bg);backdrop-filter:blur(var(--glass-blur));
  -webkit-backdrop-filter:blur(var(--glass-blur));border-bottom:1px solid var(--glass-line)}
/* dark glass — chips/captions over photos, navy overlays */
.glass-dark{background:var(--glass-bg-dark);backdrop-filter:blur(6px);
  -webkit-backdrop-filter:blur(6px);color:#fff}
/* mandatory fallback */
@supports not ((backdrop-filter:blur(1px)) or (-webkit-backdrop-filter:blur(1px))){
  .glass{background:rgba(255,255,255,.96)}
  .glass-dark{background:rgba(10,27,46,.9)}
}
```

Rules: glass only on *chrome* (nav, appbar, caption chips, scrims) — never on reading surfaces
holding paragraphs. Text on `.glass` must still measure ≥4.5:1 against the blurred worst case
(use `--ink`/`--slate`, never `--slate2`, on light glass). Next's default PostCSS chain
auto-prefixes `backdrop-filter`; if a custom `postcss.config` is ever added, keep autoprefixer.

---

## 4. Buttons

Base `.btn` (keep): inline-flex, gap .5rem, weight 600, white-space nowrap, `cursor:pointer`,
`transition:transform var(--t-1),box-shadow var(--t-1),background var(--t-1)`.
Hover `translateY(-1px)`, active resets. Radius `var(--r-3)`.

| Size | Class | Height | Padding | Font | Radius |
|---|---|---|---|---|---|
| Small | `.btn-s` | `--ctl-s` 36px | .5rem .9rem | .82rem | `--r-2` 9px |
| Default | `.btn` | `--ctl-m` 44px | .7rem 1.3rem | .94rem | `--r-3` 12px |
| Large | `.btn-lg` | `--ctl-l` 52px | .95rem 1.6rem | 1rem | `--r-4` 14px |

Add `min-height:` of the size to each class so icon-only and short-label buttons hold the scale
(44px is also the minimum touch target — [ux-guidelines.csv "Touch Target Size", High]).

| Variant | Class | Fill | Text | Hover | Use |
|---|---|---|---|---|---|
| Primary | `.btn-p` | `--orange`, `--sh-cta` | #fff | `#FF6B35` | THE action of the view (≤1 per view region) |
| Dark | `.btn-d` | `--navy` | #fff | `--navy2` | secondary-strong (Save, View profile) |
| Ghost | `.btn-g` | #fff, 1.5px `--line` | `--ink` | border `--slate2` | tertiary, cancel, filters |
| **On-dark (NEW)** | `.btn-w` | #fff | `--ink` | `--mist` | white buttons on navy/hero — replaces the repeated inline `background:rgba(255,255,255,.95)` hack |
| Destructive confirm | `.btn-danger` | `--risk` | #fff | `#D13438` | only inside confirm dialogs — list "Remove" stays `.btn-g` |

**States (every variant must implement all five):**

```css
.btn:hover{transform:translateY(-1px)}
.btn:active{transform:none}
.btn:focus-visible{outline:var(--focus-ring);outline-offset:2px}
.btn[disabled],.btn[aria-disabled=true]{opacity:.5;cursor:not-allowed;transform:none;box-shadow:none}
/* change from current pointer-events:none — the not-allowed cursor must show; guard in JS */
.btn.busy{position:relative;cursor:progress}
.btn.busy>.spin{width:16px;height:16px;animation:spin .8s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
```

Busy pattern: set `aria-busy="true"`, keep the label ("Signing in…" style is correct — LoginForm
is the reference), prepend the 16px SVG spinner, and set `min-width` equal to the idle width so
the button doesn't reflow. Never disable *all* page buttons for one in-flight mutation (current
BuilderApp/AdminApp single-`busy` bug) — scope busy state per action.

---

## 5. Form controls — one recipe for everything

**This section fixes the `/login` password bug.** `app.css:171` styles only
`[type=text|email|number|date]`, so `type=password` (login + both onboarding password fields),
`tel`, `search`, `url` render with UA default borders/padding. The canonical selector:

```css
input:where([type=text],[type=email],[type=password],[type=number],[type=date],
  [type=tel],[type=url],[type=search],[type=time],[type=datetime-local]),
select,textarea{
  width:100%;min-height:var(--ctl-m);          /* 44px — same scale as buttons */
  background:#fff;border:1.5px solid var(--line);border-radius:var(--r-3);
  padding:.6rem .85rem;font:inherit;font-size:.92rem;line-height:1.45;color:var(--ink);
  transition:border-color var(--t-1),box-shadow var(--t-1);
}
input::placeholder,textarea::placeholder{color:var(--slate2)}
input:focus,select:focus,textarea:focus{outline:none;border-color:var(--orange);box-shadow:var(--ring-soft)}
textarea{min-height:96px;resize:vertical;line-height:1.5}

/* select: normalise the UA chevron */
select{appearance:none;-webkit-appearance:none;padding-right:2.4rem;
  background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236E7D93' stroke-width='2' stroke-linecap='round'><path d='M6 9l6 6 6-6'/></svg>");
  background-repeat:no-repeat;background-position:right .85rem center;background-size:16px}

/* checkbox / radio (currently completely unstyled) */
input[type=checkbox],input[type=radio]{width:18px;height:18px;accent-color:var(--orange);
  flex:none;cursor:pointer;margin:0}
label.check-row{display:flex;align-items:center;gap:.55rem;font-weight:500;min-height:var(--ctl-s)}

/* states */
input:disabled,select:disabled,textarea:disabled,input[readonly]{
  background:var(--mist);color:var(--slate2);cursor:not-allowed}
[aria-invalid=true]{border-color:var(--risk)!important;box-shadow:var(--ring-danger)}
```

Field anatomy (keep): `<label>` .78rem/600/`--slate`, grid gap .4rem, control inside the label;
`.hint` .72rem `--slate2` after the label text. **Every input keeps a visible label** — placeholder
is never the only label. Use the semantically correct `type=` (email/tel/number/date).
[ux-guidelines.csv "Input Labels" (High), "Input Types"]

Inline error: `<p class="field-error" role="alert">` — .8rem, 500, `--risk`, 14px alert-triangle
SVG, margin-top .35rem. The identical inline error styling duplicated in LoginForm:95 and
OnboardingWizard:331 becomes this class.

Inline compact forms (add-watch, revoke, filters): controls keep the same height/padding/border —
width may vary via a wrapper class (`.w-s` 140px · `.w-m` 230px · `.w-l` 320px), never via
per-instance `style={{maxWidth}}`.

Form grid: `.form` gap 1rem · `.f2` two-up, collapses at 640px. Submit row: primary button
left-aligned (`justify-self:start` becomes part of `.form .actions`, not inline styles).

---

## 6. Cards — three tiers, one flat modifier

| Tier | Classes | Radius | Shadow | Padding | Hover |
|---|---|---|---|---|---|
| 1 · row/tile | `.item` `.kpi` `.review` `.mcard` | `--r-4` 14 (`--r-3` for mcard) | `--sh1` | 1rem–1.2rem | none |
| 2 · content card | `.card` `.jobcard` `.bcard` | `--r-6` 22 | `--sh1` → `--sh2` | 1.25–1.7rem | translateY(−3/−4px), `--t-2` — only when the whole card is a link/summary |
| 3 · shell | `.appcard` `.ob-card` `.phead` `.modal panel` | `--r-7` 26 | `--sh1` (ob-card `--sh3`) | 1.8–2.4rem | none |

New: `.item.flat`/`.card.flat` = `box-shadow:none;border:1px solid var(--line)` — replaces the
five+ `style={{boxShadow:"none"}}` inline copies for nested lists. Status stripe modifier stays:
`.alertcard` left 4px `--risk` / `.w` `--watch` / `.c` `--clear`.
Hover lift only where the card is clickable (`cursor:pointer` required on clickables).

---

## 7. Pills, badges, chips, toggles, tabs/sidebar

- **`.pill`** (keep): mono .6rem 600 uppercase, radius `--r-1`, variants `risk|watch|ok|navy`.
  Pills are inline labels — never block-level status banners (use `.note` card for those, see §9).
- **`.vbadge`** (keep): `--csoft`/`--clear`, 13px check SVG. Verification tiers only.
- **`.chip`** (keep): filter/select chips, min-height `--ctl-s` 36px, radius `--r-pill`;
  selected `.on` = `--orange` border + `--osoft` bg + `aria-pressed="true"`.
- **Count badge (NEW)** `.sbtn .count`: `margin-left:auto;background:var(--orange);color:#fff;`
  `font:600 .62rem var(--fm);min-width:18px;height:18px;border-radius:var(--r-pill);`
  `display:grid;place-items:center;padding:0 .3rem` — replaces AdminApp's inline orange text
  count; reuse for R3 unread-message badges and R7 notification bell.
- **`.tog`** (keep look): switch to `transform:translateX(20px)` for the knob (never animate
  `left`), `--t-2`; disabled state opacity .5 + not-allowed; keep `aria-pressed`.
- **Sidebar `.sbtn`** (keep): active = `.on` + `aria-current="page"` (string convention — the
  boolean form in BuilderApp/AdminApp renders invalid `aria-current="false"`).
  [ux-guidelines.csv "Active State"]
- **Mobile sidebar behaviour (NEW, required):** opening `.side` adds a `.side-scrim`
  (`position:fixed;inset:0;background:rgba(10,27,46,.45);z-index:var(--z-scrim)`), locks body
  scroll, closes on scrim click and Escape, and returns focus to the burger.

---

## 8. Skeleton loaders

[ux-guidelines.csv "Loading States" (High): skeleton screens, never frozen UI]

```css
.skel{position:relative;overflow:hidden;background:var(--skel-base);border-radius:var(--r-3)}
.skel::after{content:"";position:absolute;inset:0;transform:translateX(-100%);
  background:linear-gradient(90deg,transparent,var(--skel-sheen),transparent);
  animation:skel-sheen 1.4s ease-in-out infinite}
@keyframes skel-sheen{to{transform:translateX(100%)}}
/* presets — match the component being replaced */
.skel-text{height:.8em;border-radius:var(--r-1)}
.skel-title{height:1.1em;width:40%;border-radius:var(--r-1)}
.skel-avatar{width:30px;height:30px;border-radius:var(--r-2)}
.skel-kpi{height:86px;border-radius:var(--r-4)}
.skel-item{height:74px;border-radius:var(--r-4)}
.skel-card{height:180px;border-radius:var(--r-6)}
.skel-photo{aspect-ratio:16/10;border-radius:var(--r-4)}
```

Usage contract: the loading container sets `aria-busy="true"` and contains a visually-hidden
"Loading…" live text; skeleton nodes are `aria-hidden="true"`; render the *expected* count
(3 rows default) in the real layout grid so nothing jumps. The global reduced-motion rule already
kills the shimmer (static `--cloud` block remains). Use on: every server-fetch boundary
(`loading.tsx` per app route), and during `router.refresh()`-driven list mutations (wrap the list,
don't blank it).

---

## 9. Empty states, error states, toasts, notes

**Empty state** — one pattern everywhere (currently three competing ad-hoc ones):
illustration + headline + one sentence + CTA. [ux-guidelines.csv "Empty States"]

```css
.empty{display:grid;justify-items:center;text-align:center;gap:.35rem;
  padding:2.4rem 1.5rem;background:#fff;border:1.5px dashed var(--line);border-radius:var(--r-6)}
.empty svg{width:72px;height:72px;color:var(--slate2);margin-bottom:.6rem}
.empty h3{font-size:1.05rem}
.empty p{color:var(--slate);font-size:.9rem;max-width:38ch}
.empty .btn{margin-top:.8rem}
```

Illustrations: 72px line-art SVGs in the Art palette (navy strokes, one orange accent) — one per
context: `watchlist` (binoculars/crane), `alerts` (bell), `jobs` (hard hat), `reviews` (stars),
`requests` (envelope), `queue-clear` (tick), `search` (magnifier), `messages` (bubbles, R3).
Every empty state names the *next action* and carries exactly one CTA (e.g. Watchlist: "No
builders watched yet / Add the builders you work under — monitoring runs continuously." →
`＋` is banned; button label "Add a builder"). Admin "queue clear" keeps its `pill ok` but moves
into this shell.

**Error states:**
- Inline field: `.field-error` (§5).
- Failed fetch/mutation region: `.note.danger` card — `--rsoft` bg, 1px `--risk` border 30%,
  radius `--r-4`, icon + message + `.btn-g btn-s` "Retry".
- Route level: `error.tsx` per app segment — `.empty` shell with the `queue-clear` illustration
  recoloured `--risk`, headline "Something broke on our side", body without jargon, Retry button
  (calls `reset()`), and a link to support. Never a blank screen.

**Note/banner (NEW `.note`):** block-level info replaces pills-as-paragraphs
(pricing status messages): padding .8rem 1rem, radius `--r-4`, 1px border, variants
`ok` `--csoft`/`--clear` · `warn` `--wsoft`/`--watch` · `danger` `--rsoft`/`--risk` ·
`info` `--cloud`/`--navy`; icon 16px + text .88rem; `role="status"` (or `alert` for danger).

**Toasts** [ux-guidelines.csv "Toast Notifications": auto-dismiss 3–5s]:
keep `.toast-fix` look (navy, radius `--r-3`, `--sh3`, bottom-centre, `--z-toast`).
Changes: dismiss at **3500ms** (current 2600ms is under guidance); success icon `#7CE3AE` (keep),
add error variant `.toast-fix.err` with 16px alert-triangle in `#FF9A9E` and `role="alert"`;
queue up to 3 stacked (column-reverse, gap .5rem) instead of overwriting; hover pauses the timer;
reduced-motion: opacity fade only (drop the translateY). **Every mutation fires exactly one toast**
(success or error) — the API already does; keep that invariant for all new features.

---

## 10. Modals & drawers (for R3 messaging, R4 profile builder, destructive confirms)

```css
.scrim{position:fixed;inset:0;background:rgba(10,27,46,.55);z-index:var(--z-overlay);
  animation:fade var(--t-3) var(--ease)}
.modal{position:fixed;inset:0;display:grid;place-items:center;padding:1rem;z-index:var(--z-modal)}
.modal-box{width:min(560px,100%);max-height:90dvh;overflow:auto;background:#fff;
  border-radius:var(--r-6);box-shadow:var(--sh3);padding:2rem}
.drawer{position:fixed;top:0;right:0;bottom:0;width:min(420px,92vw);background:#fff;
  box-shadow:var(--sh3);z-index:var(--z-modal);transform:translateX(100%);
  transition:transform var(--t-3) var(--ease)}
.drawer.open{transform:none}
```

Behaviour contract (non-negotiable): `role="dialog" aria-modal="true"` + `aria-labelledby`;
focus moves in on open, is trapped, and returns to the trigger on close; Escape and scrim-click
close; body scroll locked; reduced-motion swaps the slide for an opacity fade. Header: h3 + 36px
ghost close button (X SVG). Footer: actions right-aligned, primary last. Confirm-dialog variant:
`.modal-box` max-width 440px, `.btn-danger` primary.

---

## 11. Photo cards, category tiles, profile hero, KPI tiles, charts

### 11.1 Photo card (R1) — real photos with SVG fallback

```css
.photo{position:relative;aspect-ratio:16/10;border-radius:var(--r-4);overflow:hidden;
  background:linear-gradient(135deg,#12304F,#0A1B2E)}  /* navy base shows while loading */
.photo img{width:100%;height:100%;object-fit:cover;display:block}
.photo::after{content:"";position:absolute;inset:0;z-index:1;
  background:linear-gradient(180deg,transparent 45%,rgba(10,21,36,.72))} /* caption scrim */
.photo .cap{position:absolute;left:.8rem;right:.8rem;bottom:.7rem;z-index:2;color:#fff}
.photo .cap.micro{font:600 .6rem var(--fm);letter-spacing:.1em;text-transform:uppercase;
  width:max-content;padding:.3rem .55rem;border-radius:var(--r-1);
  background:var(--glass-bg-dark);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px)}
.photo .cap.title{font:700 1.02rem var(--fd)}   /* category tiles, gallery captions */
```

- **Ratio is 16:10 everywhere** (cards, tiles, gallery, portfolio) except: bcard header 16:8
  (keep), profile cover (§11.3). Reserve the box with `aspect-ratio` — zero CLS.
- Use `next/image` with `fill`, `sizes`, lazy below the fold, meaningful `alt`; wire `onError`
  to swap in the matching `<Art>` SVG (existing art stays as the automatic fallback only).
  [stacks/nextjs.csv "Use next/image"; add `/public/photos` — no remote hosts needed. ux-guidelines.csv "Lazy Loading"]
- White text over photos: the scrim guarantees the caption zone; never place text on the top 45%.

### 11.2 Category tile (R5) — customer grid & job-board filter share one component

`.cat-tile` = `.photo` + interactive contract: the whole tile is a single `<a>`;
`cursor:pointer`; hover/focus = image `scale(1.04)` over `--t-3` + tile `--sh2`
(transform on the img, not the tile — no layout shift); `:focus-visible` shows the 3px ring;
`.cap.title` bottom-left + optional count pill top-right (`.pill navy` on `.glass-dark`).
Grid: `repeat(auto-fill,minmax(210px,1fr))`, gap `--s4`; 4 → 3 → 2 columns at 1440/1024/640;
never 1 column (2-up minimum at 375px — tiles are square-ish at that width, acceptable).
Same tiles (smaller, 3-up) in onboarding trade selection and profile editing — selected state =
3px inset `--orange` ring + check chip, `aria-pressed`.

Dashboard stat/photo mixes may use bento spans (2×1 hero tile + 1×1s) — radius stays `--r-6`,
gap `--s4`, hover scale ≤1.02. [styles.csv "Bento Box Grid"]

### 11.3 Profile hero (R6) — cover + avatar overlap

Formalises (and moves into `app.css`) the inline `<style>` currently in `web/app/b/[slug]/page.tsx:96`:

```css
.cover{height:clamp(150px,26vw,230px);border-radius:var(--r-7);overflow:hidden;
  position:relative;margin-bottom:-56px}
.cover .photo,.cover .art{height:100%;border-radius:var(--r-7)}
.phead-hero{position:relative;z-index:2}          /* the .phead card overlapping the cover */
.phead-hero .avatar{box-shadow:0 0 0 4px #fff}    /* white ring lifts avatar off the cover */
.pwrap{width:min(980px,92%);margin-inline:auto;padding:2rem 0 4rem}
@media(max-width:640px){.cover{margin-bottom:-40px}.phead-hero .av-xl{width:72px;height:72px}}
```

Hero contents (R6 order): avatar/logo · name + verified badge · mono meta line · pstats
(rating, reviews, re-verification) · actions column (Message / Request quote / Save — primary
`.btn-p` first) · responsiveness indicator as `.pill navy`. Cover uses `.photo` with a real
photo (R1), `priority` loading (it's the LCP), SVG fallback. Tradie public page `/t/[slug]`
reuses this recipe unchanged.

### 11.4 Stat/KPI tiles

Keep `.kpi` (radius `--r-4`, `--sh1`, label mono .58rem uppercase `--slate2`, value `--fd` 1.7rem).
Additions per the dataviz stat-tile contract (label · value · optional delta · optional trend):

```css
.kpi .delta{display:inline-flex;align-items:center;gap:.25rem;font-size:.72rem;font-weight:600;margin-top:.2rem}
.kpi .delta.up{color:var(--clear)} .kpi .delta.down{color:var(--risk)}
.kpi .spark{margin-top:.5rem;height:28px}
```

Delta = signed value vs a named period ("+12% vs last week") with a 12px SVG arrow (never "↑"
text chars); colour = direction × whether up is good (an exposure increase is `down`-red even
though the number rose). Value auto-compacts (1,284 / 12.9K / $4.2M via `lib/format`). Sparkline:
12 points, `--ch-1` line 2px, current period dot `--ch-2`, no axes. Value colour modifiers keep
`b.risk/.ok/.or` semantics. One **hero figure** max per dashboard view (≥40px) — the tile grid
carries the rest.

### 11.5 Chart palette & recharts rules (R4 AI-insights panel)

Categorical series — **fixed order, never cycled, never re-assigned when a filter removes a
series** (colour follows the entity):

| Slot | Token | Hex | Name |
|---|---|---|---|
| 1 | `--ch-1` | `#2E6FC9` | steel blue (navy family, chart-legible step) |
| 2 | `--ch-2` | `#FF5A1F` | signal orange (brand) |
| 3 | `--ch-3` | `#0C9DB0` | teal |
| 4 | `--ch-4` | `#B87333` | copper (already in the avatar/art palette) |
| 5 | `--ch-5` | `#A34A8E` | plum |

Validated with the dataviz skill validator on `#FFFFFF` (charts render on white cards):
lightness band PASS · chroma floor PASS · **worst adjacent CVD ΔE 15.9 (tritan)** — above the
≥12 target · contrast ≥3:1 PASS. Ordering is the CVD mechanism: keep it.
A 6th series is never a new hue — fold into "Other" (`--slate2`) or split into small multiples.

- **Status triad is reserved**: `--risk #E5484D` / `--watch #E9950C` / `--clear #149E5F` mark
  risk states only (with label + icon, never colour alone) and are **never used as series
  colours**. On white, `--watch` is <3:1 — that's why status always ships inside tinted-pill
  text form, never as a bare swatch.
- **Sequential** (heatmaps/intensity): one hue, steel-blue ramp light→dark
  `#DCE9F9 → #B7D0F0 → #8FB4E5 → #5E90D6 → #2E6FC9 → #1F4E93 → #143764`.
- **Diverging** (owed vs paid, delta maps): `--ch-1` blue ↔ `--ch-2` orange with neutral
  midpoint `--cloud #E8EDF5`; equal steps per arm. (Warm/cool pair native to the brand.)
- **Recharts config:** grid `stroke=var(--ch-grid)` dasharray `3 6` `vertical={false}`; axes
  `tickLine={false}` `axisLine={{stroke:var(--line)}}` ticks Inter 11px `fill:var(--ch-axis)`
  with `tabular-nums`; Line `strokeWidth={2}` `dot={false}` `activeDot={{r:4}}`; Area
  `fillOpacity={0.18}` [charts.csv "Trend Over Time": fill 20%]; Bar radius `[4,4,0,0]` max
  width 28px, 2px white gap between stacked segments; **one y-axis only — never dual-axis**
  (two scales → two charts); ≥2 series get a legend AND differ by dash pattern
  (series 2+ `strokeDasharray="6 3"`) so identity isn't colour-alone [charts.csv a11y note];
  direct-label up to 4 series; tooltip = white card, radius `--r-3`, `--sh2`, 1px `--line`,
  mono label; provide a data-table toggle for every chart; label projections "estimate"
  (ACL guardrail). KPIs vs targets use bullet-style bars with values always visible as text
  [charts.csv "Performance vs Target (Compact)"].
- Empty chart = `.empty` (no fake zero-lines); loading chart = `.skel-card`.
- `recharts` is not yet in `web/package.json` — add at R4 implementation time.

---

## 12. Page-type rhythm

**Breakpoints (test all four):** 375 · 768 · 1024 · 1440. Existing media queries live at 1020px
and 640px — keep them but audit every page at the four checkpoints. [methodology checklist]

### Marketing pages (`/`, `/check`, `/pricing`, future `/how-it-works`)
- `.wrap` `min(1180px,92%)`; sections `padding-block:var(--sec-y)` (clamp 48→80px — replaces
  fixed `5rem` which crowds 375px); `.sec-head` max-width 660px, `margin-bottom:var(--sec-head-mb)`.
- Section cadence (Trust & Authority): hero → proof strip → alternating `.split` rows
  (image side flips) → card grid → navy proof band → CTA band → footer. Exactly one navy band
  and one CTA band per page. Orange only on CTAs, eyebrows, and signal data.
- Hero: navy gradient, `padding:5rem 0 0`, scene SVG bottom 46% height; buttons on navy use
  `.btn-w`/`.btn-p`; hero stats `--fd` 1.6rem.
- Footer: `.f-legal` .76rem `--slate2` — legal copy is load-bearing, never truncate.

### App shells (`/tradie`, `/builder`, `/customer`, `/admin`)
- Grid 236px sidebar + main; main padding `1.8rem 2rem 3rem` (→ `1.2rem 1.1rem 3rem` ≤1020px);
  `.topbar` mb 1.6rem; `.kpis` 4→2→1 columns, gap `--s4`, mb 1.4rem; module groups separated by
  `var(--stack-gap)` using a `.topbar` (h3 + action) — **no ad-hoc `marginTop` values**:
  the panel is a vertical stack: topbar → kpis → [topbar → list]×n.
- `.list` gap `--list-gap`; `.grid2/.grid3` gap `--card-gap`.
- Every panel: skeleton on load, `.empty` when zero rows, toast on every mutation.

### Public profiles (`/b/[slug]`, `/t/[slug]`) & check results
- `.pwrap` 980px; cover recipe §11.3; two-column body `grid2` with `align-items:start`,
  collapsing at 1020px (record/facts column first on mobile); h3 sub-heads
  `margin:1.8rem 0 .8rem`; end with `.f-legal`.
- Check result page shares the 860px narrow wrap and list-of-facts rhythm.

### Auth & onboarding (`/login`, `/onboarding`)
- `.ob` full-viewport centred, mist→white gradient; `.ob-card` 680px (wizard) / 480px (login),
  radius `--r-7`, `--sh3`, padding 2.4rem (→1.5rem at 375px). Progress bar `.prog` stays.
  R1 adds a photo side panel ≥1024px (split 480px form + photo column) — form column unchanged.

---

## 13. Motion & accessibility invariants

**Motion** (150–300ms band, gentle; [methodology; styles.csv Soft UI Evolution 200–300ms]):
- Hovers: colour/border `--t-1`; lifts ≤4px translate `--t-2`; image zooms ≤1.04 `--t-3`.
- Panel/tab switch: fade+8px rise `--t-3` (retune existing `fade` .35s → 300ms).
- **Page transitions:** `web/app/template.tsx` wrapping children in `.page-in`
  (`@keyframes pagein{from{opacity:0;transform:translateY(8px)}}` `--t-3` `--ease`) — one
  recipe for all route changes.
- Scroll-reveal `.rv` is **marketing-only** (never in app shells; data must not fade in).
  Guard no-JS: `<html class="no-js">` swap or `@media (scripting:none){.rv{opacity:1;transform:none}}`
  so content is never invisible without JS.
- Never animate layout properties (`left/top/width/height`) — transforms only (fix `.tog::after`).
- `prefers-reduced-motion`: the global kill-switch stays (`app.css:24`); every NEW animation must
  degrade to opacity-or-nothing under it; toasts/drawers fade instead of slide; shimmer freezes.

**Accessibility (release-blocking, per the Pro Max pre-delivery checklist):**
1. Contrast ≥4.5:1 for text: `--ink`/`--slate` pass anywhere; `--slate2` (≈4.6:1 on white)
   only on white/mist ≥11.5px, never on `--cloud`/photos; white on navy passes; `--orange` on
   white is large-text/UI-only (≥1rem bold or non-text).
2. `:focus-visible` 3px orange ring everywhere (keep `app.css:23`); inputs use the border+ring
   recipe; `.search` (hero) gets `:focus-within` ring on the container since the inner input's
   outline is suppressed. Never `outline:none` without a replacement. [ux-guidelines.csv "Focus States", High]
3. **No emoji or text-glyphs as icons** — purge `👋 ＋ ✓ ★ ↑ ↓` (inventory in AUDIT.md);
   icons are 24-grid stroke SVGs (stroke-width 2, round caps — the established house style),
   `aria-hidden="true"` when decorative. Stars stay the `.stars` component but render SVG stars
   (fill `#F5A623`, dim `--cloud`) with the existing `aria-label`.
4. Keyboard: every flow completable — tabs are buttons (fine), Escape closes sidebar/modals/drawers,
   scrim traps described in §7/§10; `aria-current="page"` string convention; `aria-pressed` on
   chips/toggles (already right — keep).
5. Touch targets ≥44×44 (`--ctl-m`); `.btn-s`/`.chip` (36px) acceptable ≥768px only — bump
   tap-area via padding on mobile.
6. Images: meaningful `alt` (R1 requirement), `aria-hidden` for decorative art; unique SVG
   gradient ids (fix Art.tsx fixed `g1..g4` ids — collide when repeated per page; derive from
   `useId()`).
7. Toasts `role="status"`/`role="alert"`; loading regions `aria-busy`; counts announced via
   text not colour.

---

## 14. Skill-data citations (what informed what)

| Decision | Source row (UI/UX Pro Max data) |
|---|---|
| Landing structure, navy authority + accent-for-CTA-only | landing.csv "Trust & Authority + Conversion" (also "Enterprise Gateway") |
| Navy/orange fit for construction-fintech | products.csv "Construction/Architecture" (grey/navy + safety orange); colors.csv "Legal Services" (authority navy) |
| Avoid purple/pink gradient fintech cliché | methodology §4 anti-pattern (products/colors fintech rows) |
| Glass nav / caption recipe (blur 10–20px, 1px border, 4.5:1 check, fallback) | styles.csv "Glassmorphism" |
| Card tiers, 22px radii, hover ≤1.02–1.04, grid gaps, bento spans | styles.csv "Bento Box Grid" |
| Shadow softness, 200–300ms motion, AA+ focus discipline | styles.csv "Soft UI Evolution" |
| Space Grotesk/Inter/JetBrains Mono weights & roles (mono = data) | typography.csv "Web3 Bitcoin DeFi (Space Grotesk + Inter + Mono)" |
| Skeletons over frozen UI; lazy-load below fold | ux-guidelines.csv "Loading States" (High), "Lazy Loading" |
| Empty state = message + action | ux-guidelines.csv "Empty States" |
| Toast auto-dismiss 3–5s | ux-guidelines.csv "Toast Notifications" |
| Focus rings, 44px targets, visible labels, correct input types, active nav state | ux-guidelines.csv "Focus States", "Touch Target Size", "Input Labels", "Input Types", "Active State" |
| Line/area chart rules: fill ~20%, series differ by line style not colour alone, data-table fallback | charts.csv "Trend Over Time" |
| KPI-vs-target: values always visible as text, bullet grid for 3–10 KPIs | charts.csv "Performance vs Target (Compact)" |
| next/image everywhere, OG images per page | stacks/nextjs.csv "Use next/image", "Include OpenGraph images" |
| Chart palette validation (4 checks PASS), fixed slot order, status-reserved rule, stat-tile contract, one-axis rule, proportional display figures | dataviz skill `validate_palette.js` + references/palette.md + marks-and-anatomy.md |

## 15. Pre-delivery checklist (run per page — R2 acceptance)

- [ ] No emojis/text-glyphs as icons (SVG only) · [ ] `cursor:pointer` on all clickables
- [ ] Hover states with 150–300ms transitions · [ ] Text contrast ≥4.5:1
- [ ] Visible keyboard focus on every interactive element · [ ] `prefers-reduced-motion` respected
- [ ] Responsive at 375/768/1024/1440 — no horizontal scroll, nothing under sticky bars
- [ ] Zero unstyled form controls (incl. password/checkbox/select) · [ ] Skeleton on every fetch
- [ ] `.empty` on every zero-state · [ ] Toast on every mutation · [ ] All values on the token scale
