# BuildSafe UI Audit — current app inconsistencies (R2 to-do list)

Scope: every page/component under `web/app` + `web/components`, against `design-system/MASTER.md`.
Each finding: `file:line — issue → fix`. Categories:
**[C1]** unstyled / inconsistently-sized form control · **[C2]** inline style contradicting the
token scale · **[C3]** missing hover/focus/disabled/busy state · **[C4]** hard-coded colour
outside the token set · **[C5]** spacing off the rhythm scale · **[ICON]** emoji/text-glyph used
as icon · **[A11Y]** accessibility · **[GAP]** missing system component.

Line numbers are from the current tree (2026-07-03). Server data-only files
(`tradie/page.tsx`, `customer/page.tsx`, `admin/page.tsx`, `onboarding/page.tsx`,
`check/run-check.ts`, `app/api/**`) are clean apart from items noted under `builder/page.tsx`.

---

## 0. Root causes in `web/app/app.css` (fix these first — most page findings collapse into them)

| # | Line | Issue | Fix (MASTER ref) |
|---|---|---|---|
| A1 | **171-172** | **[C1] THE `/login` BUG.** Text-control selector is `input[type=text],input[type=email],input[type=number],input[type=date],select,textarea` — **`type=password` is missing** (so are `tel`, `url`, `search`, `time`). Password fields render with UA default border/padding/radius while the email field above them is fully styled. Affects `login/LoginForm.tsx:85-92`, `onboarding/OnboardingWizard.tsx:232,236`. `input:focus` (line 173) still recolours the UA border on focus, making the mismatch look even more accidental. | Replace with the `:where(...)` catch-all selector in MASTER §5; add `min-height:var(--ctl-m)` |
| A2 | — | [C1] No checkbox/radio styling anywhere (see TradieApp:130 `style={{width:"auto"}}` hack) | MASTER §5 checkbox recipe (18px, `accent-color:var(--orange)`) |
| A3 | — | [C3] No `:disabled` / `[readonly]` styling for inputs/selects (ReviewForm:95,99 look editable) | MASTER §5 states block |
| A4 | — | [C1] `select` keeps the UA chevron/appearance — inconsistent across OS; no padding-right reserve | MASTER §5 select recipe |
| A5 | 45 | [C3] `.btn[disabled]{pointer-events:none}` suppresses the `not-allowed` cursor; no busy/spinner pattern, no `aria-busy` | MASTER §4 states |
| A6 | 76 | [C3/A11Y] `.search input{outline:none}` — hero search focus relies only on the 12%-alpha ring from `input:focus`; container has no `:focus-within` | MASTER §13.2 |
| A7 | 10, 37-44, 48, 57, 105-108, 216-221 | [C2] Radii off any scale: 6, 9, 11, 12, 14, 15, 18, 22, 24, 26, 27, 28, 34px all in use | Radii scale + migration map, MASTER §2.2 |
| A8 | 57, 136, 180, 265 | [C2] Ad-hoc z-indexes 100/120/150/200 | `--z-*` scale, MASTER §2.2 |
| A9 | 32, 37, 115, 139, 149, 177, 187-190, 193, 226 | [C2] Ad-hoc durations .15/.18/.2/.22/.25/.3/.35/.6s | `--t-1/2/3` tokens, MASTER §2.2 |
| A10 | 111 | [C5] `section{padding:5rem 0}` fixed — crowds 375px, no rhythm token | `--sec-y` clamp, MASTER §12 |
| A11 | 53 | [C4] `.stars` colour `#F5A623` hard-coded (only non-token colour in the sheet) | tokenize as `--star:#F5A623` when Stars goes SVG |
| A12 | 187-190 | [C3] `.tog .knob::after` animates `left` (layout property) | transform per MASTER §7; add disabled state (TradieApp:589 never disables it while busy) |
| A13 | 180-182 | [GAP] `.toast-fix` is single-instance, success-only; JS dismisses at 2600ms (below the 3–5s guideline); no error variant, no queue, no hover-pause | MASTER §9 toasts |
| A14 | — | [GAP] No skeleton classes, no `.empty`, no `.note`, no `.field-error`, no modal/drawer, no table styles anywhere in the sheet | MASTER §5, §8, §9, §10 |
| A15 | 255-258 | [C3/A11Y] Mobile `.side` drawer: no scrim, no body scroll-lock, no Escape-close, focus not returned to burger | MASTER §7 |
| A16 | 32-34 | [A11Y] `.rv{opacity:0}` — content invisible until JS observer runs; no no-JS guard; also used inside app panels where data must not fade | MASTER §13 motion rules |
| A17 | 48 | [A11Y] `.pill` at .6rem = 9.6px — at the legibility floor; never shrink further (AdminApp:383 uses .58rem inline) | MASTER §2.3 floor |
| A18 | 248-264 | [C5] Only 1020px/640px breakpoints exist; 375/768/1024/1440 never audited (kpis jump 4→2→1 with nothing between 640-1020 for `.grid3` on tablets) | MASTER §12 checkpoints |
| A19 | 57, 107 | [C3-low] `backdrop-filter` unprefixed in source — Next's default PostCSS autoprefixes at build; verify in build output and keep autoprefixer if a custom `postcss.config` is ever added | MASTER §3 |

---

## 1. `web/app/login/LoginForm.tsx`

- **:85-92 [C1] The named bug.** `<input type="password">` gets none of the shared control
  styling (root cause A1): UA border ~2px inset grey, ~2px padding, no 11px radius, no orange
  focus ring — sits directly under a fully-styled email input. **Fix = A1 selector change**;
  no markup change needed.
- :58 [C2] `style={{width:"min(480px,92%)"}}` overrides `.ob-card` width inline → `.ob-card.narrow`.
- :59 [C2/C5] logo `style={{marginBottom:"1.4rem"}}` (duplicated OnboardingWizard:132) → `.ob-card .logo` rule.
- :95-97 [C2] Inline error `style={{color:"var(--risk)",fontSize:".85rem",...}}` — duplicated at
  OnboardingWizard:331 → `.field-error` (MASTER §5).
- :99-101 [C3] Busy button changes label (good) but no spinner, no `aria-busy`, width jumps → §4 busy pattern.
- :103-111 [C2] Demo-box card styled inline (bg/border/radius 14/padding/margin) → `.card.flat` + tokens.
- :116-131 [C3] Demo-login buttons are bare `.mono` text (`style={{fontSize:".74rem",...}}`) — no
  hover state, not visibly interactive; global focus ring only → make them `.btn btn-g btn-s` or add `.link-btn` with hover.
- :136 [C2] Inline link colour/weight → `.link-accent`.

## 2. `web/app/onboarding/OnboardingWizard.tsx`

- **:232, :236 [C1] Two more unstyled password inputs** (root cause A1) — "Choose a password" /
  "Repeat your password" both UA-default.
- :331 [C2] Duplicated inline error style → `.field-error`.
- :149, :209 [C5] `.sub` inline margins (`.6rem 0 1.4rem` etc.) → rhythm utilities.
- :253 [C2/A11Y] `<label style={{marginBottom:".5rem"}}>` used as a heading with no control → `.field-legend` (or `fieldset/legend`).
- :269, :279 [C5] `.f2` inline `marginTop:"1rem"` ×2 — `.form` gap already provides rhythm; remove.
- :299-314 [A11Y] `<label>` wraps the build-type chip *buttons* (label without a form control,
  interactive content inside label) → `fieldset` + `legend`.
- :348-377 [C2] Step-3 layout fully inline (textAlign/padding/flex/gap/maxWidth) → compose from `.empty`-style shell.
- :340 [C3] Busy label good; no spinner/`aria-busy` (§4).
- — [A11Y] On step change, focus stays on the Continue button; move focus to the new step's `h2`.

## 3. `web/app/tradie/TradieApp.tsx`

- :16-17 [C4] `RISK_COL={risk:"#E5484D",watch:"#E9950C",ok:"#149E5F"}`, `NEUTRAL_COL="#2E5E8F"` —
  re-hard-codes `--risk/--watch/--clear` + steel blue → use `var(--risk)`/`var(--av-1)` strings or a shared map in `lib/format`.
- :77, :84 [C2/C1] Add-watch form inline `display:flex;gap:.5rem` + input `maxWidth:230` —
  one of **five** competing inline input widths (230/140/260/220/`minWidth:260`) → `.w-m` wrapper (§5).
- :86 [ICON] `＋ Watch` fullwidth-plus glyph as icon → 16px plus SVG.
- :124-134 [C1] `ReportDelay` checkbox: unstyled + `style={{width:"auto"}}` hack; label row inline
  flex (`:129`) → MASTER §5 checkbox + `.check-row`.
- :142 [C2] Inline flex button row → `.form .actions`.
- :205-211 [C2] `textAlign:right` wrapper + mono micro inline (`fontSize:".66rem"`) → `.micro` utility.
- :264 [ICON] `Applied ✓` → pill with 12px check SVG.
- :304-310 [C1/C2] Exposure input `maxWidth:140` inline + inline mono label → `.w-s` + `.micro`.
- :335, :347 [C2] Inline paragraph (.86rem) and timestamp (.62rem) type overrides → `.item p`/`.micro`.
- :366 [C4] Avatar `#2E5E8F` (also :576 uses token — inconsistent) → `var(--av-1)`.
- :540-551 [C2/C4] App bar block: burger `style={{display:"flex"}}` + three `span style={{background:"#fff"}}`
  + title `style={{fontFamily:"var(--fd)"}}` + EXIT link `.62rem #9DB0CC` — **identical block
  duplicated in all four apps** → style `.appbar` children in CSS once (`.appbar .burger{display:flex}`,
  `.appbar .burger span{background:#fff}`, `.appbar b{font-family:var(--fd)}`, `.appbar .exit`).
- :588 [ICON] `👋` emoji in the dashboard h2 — explicit anti-pattern violation → drop it (copy stays "G'day {first}").
- :589-592 [C3] Availability `.tog` not `disabled` while `availBusy` (double-tap window; knob also A12).
- :606, :766 [ICON] `4.8 ★` glyph in KPI + pstats → `<Stars>` (SVG version) or 14px star SVG.
- :769 [ICON] `insCurrent ? "✓" : "—"` as a stat value → check SVG + visually-hidden text.
- :609, :626, :641, :654 [C5] `topbar`/blocks spaced with inline `marginTop:".4rem"/"1.6rem"` → `--stack-gap` (§12).
- :617-622, :632-637, :662-667, :685-690, :707-712, :742-747, :841-846 [GAP] Seven empty states as
  text-only `.item` rows — no illustration, no CTA (e.g. watchlist empty should CTA "Add a builder") → `.empty` (§9).
- :758-763 [C2] `.phead` h3 inline `fontSize:"1.3rem"` + meta mono inline .66rem (duplicated
  BuilderApp:725-728) → `.phead h3` rule + `.micro`.
- :783 [C5] Profile form `.card` inline `padding:"1.5rem"` (tier-2 padding is 1.7rem) → card tier default.
- :795 [C2] `label style={{marginBottom:".4rem"}}` → `.field-legend`.
- :825 [C2] Submit `style={{justifySelf:"start"}}` (pattern repeated 8× across apps) → `.form .actions`.
- :831-835 [ICON/C5] `＋ Add work photo` glyph; portfolio `Art` tiles are 4:3 while the system
  photo card is 16:10 (R1) → plus SVG; migrate portfolio to `.photo` 16:10.
- — [GAP] No skeletons; every mutation refreshes via `router.refresh()` with zero pending UI
  (lists just re-render) → `loading.tsx` + `aria-busy` wrap (§8).

## 4. `web/app/builder/BuilderApp.tsx`

- **:169 [C3] One global `busy` flag** — accepting one applicant disables *every* button in the
  app (remove/watch/post/review/upgrade) → per-action busy state (CustomerApp `quoteBusy` is the house pattern).
- :333-345 [C2/C4] App-bar block duplicate (see TradieApp :540).
- :360 [A11Y] `aria-current={tab === t.id}` renders `aria-current="false"` on inactive tabs
  (invalid; TradieApp/CustomerApp use `"page"|undefined`) — same in AdminApp:299 → standardise `"page"` convention.
- :366, :647, :723, :818 [C4] Avatar `#2E5E8F` ×4 → `var(--av-1)`.
- :393, :731 [ICON] `{vm.ratingText} ★` ×2 → SVG star.
- :406, :480 [ICON] `↑`/`↓` text arrows in card headings → 14px arrow SVGs (or drop; the copy explains direction).
- :413, :484, :507, :549, :646 [C2] `style={{boxShadow:"none"}}` ×5 — the ad-hoc "flat nested item" → `.item.flat` (§6).
- :445-447, :493-495, :525, :698 [GAP] Empty states as bare `.hint` paragraphs — third competing
  empty-state pattern (vs `.item` rows in Tradie, `.card` in Customer) → `.empty`.
- :475 [ICON] `＋ Watch` glyph.
- :474, :615, :691, :846 [C2] `justifySelf:"start"` buttons → `.form .actions`.
- :537, :561 [C2/C5] Cards inline `padding:"1.2rem"/"1.6rem"` + `maxWidth:760` ×2 → card tiers + `.wrap-narrow`.
- :538 [C2] `<b style={{fontFamily:"var(--fd)"}}>` as heading (same ReviewForm:31,45,91) → real heading element/class.
- :540, :610 [C2] `.pill` inline `verticalAlign:"middle"` ×2 → pills align via flex context.
- :569, :596, :678 [C1] Three `<select>`s with UA chevron (root cause A4).
- :641-642 [C2] `APPLICANTS (n)` as `<b style={{fontSize:".8rem",color:"var(--slate)"}}>` → `.mini-h` utility.
- :653 [ICON] `Accepted ✓`.
- :673, :839 [C5] Nested form cards inline `padding/margin` → tier defaults + `--stack-gap`.
- :722 [C5] `.phead` inline `marginBottom:"1.4rem"` → stack rhythm.
- :758 [C2] Active tier card `style={{borderColor:"var(--clear)"}}` → `.card.tier-active`.
- :773 [C2] Criteria `<ul>` fully inline (margin/padding/gap) → `.criteria` list component (shared with AdminApp:376).
- :781-795 [C5] Conditional inline `marginTop/marginLeft` button spacing → `.card .actions` row.
- :820-821 [C2/C5] Review author `b` inline `.88rem` + pill `marginLeft:".3rem"` (repeated in every
  review renderer: TradieApp:368-369, b/[slug]/page.tsx:270-271) → `.review .rt` handles both.

## 5. `web/app/customer/CustomerApp.tsx`

- :215-223 [C2/C4] App-bar block duplicate.
- :249, :372 [C4] Avatar `#2E5E8F` ×2.
- :262-269 [C1/C2] Directory search input inline `maxWidth:260` — differs from every other inline
  input width → `.w-m` (one width for inline filter inputs).
- :285-293, :360-366 [GAP] Empty states as `.card` h3+p — "No matches" has no reset-filters CTA → `.empty` with action.
- :295, :303 [C5] `hint`/topbar inline margins → rhythm tokens.
- :305 [C5] Check form card inline `padding:"1.6rem"`.
- :324 [C3] "Run check →" button while `chkBusy`: disabled but label static (CheckForm.tsx:50 does
  "Checking…" — inconsistent busy convention) → §4 busy pattern everywhere.
- :324 [C2] `justifySelf:"start"`.

## 6. `web/app/admin/AdminApp.tsx`

- :272-284 [C2/C4] App-bar block duplicate; :299 [A11Y] boolean `aria-current`.
- :303 [C4/C2] Sidebar queue count: `style={{marginLeft:"auto",fontSize:".62rem",color:"#FF5A1F"}}`
  — hard-coded brand orange + inline layout → `.sbtn .count` badge (MASTER §7; reuse for R3 unread).
- :308 [C4] Avatar `#2E5E8F`.
- :323-329 [C5/C2] Accuracy card inline `marginBottom` + `p` inline `.85rem` → `.note.info`.
- :331-332, :368-369, :435-436, :489-490, :516-517 [GAP] Five "queue clear" empty states as inline
  one-line `.item`s → `.empty` (keep the `pill ok`).
- :339, :445 [C2] Detail paragraphs inline (.82/.84rem + margins) → `.item p` rule.
- :376-386 [C2] Criteria checklist `<ul>`/`<li>`/icon spans fully inline; :383 mono at `.58rem`
  (9.3px — at/below the legibility floor, A17) → `.criteria` component, min `.6rem`.
- :411-418 [C1/C2] Revoke form: inline flex + `input maxWidth:220` (fourth inline width);
  reason input `required`-less but validated in JS with toast only — no `[aria-invalid]` styling → `.w-m` + `.field-error`.
- :447-460 [C2] Dispute resolution form inline flex + `minWidth:260;flex:1` input (fifth width variant).
- :461-466 [C3] Two submit buttons share `busy` — pressing "Uphold" also disables "Reject" on *all*
  disputes (same global-busy bug as BuilderApp).
- :469-475 [C2] SLA countdown inline mono + conditional colour → `.sla` / `.sla.late` classes.
- — [GAP] Email log renders as `.item` list; belongs in the `.tbl` table spec (MASTER §7-tables) with `td.num` timestamps.

## 7. `web/app/page.tsx` (landing)

- :25, :311 [C2] `.eyebrow` inline `background:"rgba(255,90,31,.15)"` on navy (also check/page.tsx:35,127;
  pricing:182) → `.eyebrow.on-dark` variant.
- :28 [C5] `h1 style={{marginTop:"1.3rem"}}` (same check/page.tsx:38) → hero rhythm rule.
- :48-56, :390 [C2] `.btn-g` + inline `background:"rgba(255,255,255,.95)"/"#fff"` ×4 → **`.btn-w`** (MASTER §4).
- :80 [C4] Avatar `#2E5E8F`.
- :94, :108 [ICON] `★ 4.8` glyphs in phone mock; :119 `✓` in mock card (decorative mock — still swap to SVG for consistency).
- :118, :135, (ExposureCalculator:47) [C2] `.mcard` inline `borderLeft:"4px solid var(--clear|--risk|--orange)"`
  → `.mcard.strip-ok/.strip-risk/.strip-or` (align with `.alertcard` naming).
- :145 [C2] `.rate` inline `fontSize:".8rem"` scale override.
- :203, :224, :256, :272, :288 (+check/page.tsx:81,94,107) [C2] `.ic` inline bg/colour pairs ×8 →
  `.ic.navy/.ic.pro/.ic.risk/.ic.watch/.ic.ok` variants.
- :267, :283, :299 [C5] Card CTAs inline `marginTop:"1rem"` ×3 → `.card .btn` spacing rule.
- :308-340 [C2/C4] Navy proof band: section inline `background/color`, h2/p/checks inline `#fff/#9DB0CC/#DDE7F3`,
  check SVGs `stroke="#33C088"` ×3 → **`.sec-navy`** section class + `--clear-ondark:#33C088` token
  (same block duplicated at check/page.tsx:124-158).
- :371-394 [C2/C4] CTA band `.appcard` inline gradient `#0F2440→#0A1B2E`, padding 3.5rem, inline
  flex CTA row (duplicated pricing:170-193) → `.cta-band` component.
- :162-186 scene SVG palette — exempt (illustration, same class as Art.tsx).

## 8. `web/app/jobs/page.tsx`

- **:85-97 [C1] Worst unstyled-control cluster in the app.** Filter `<select>` and `<input>` styled
  entirely inline: `border:1.5px solid var(--line);borderRadius:"9px";padding:".45rem .6rem";fontSize:".82rem"`
  → ~34px tall vs the 44px control scale; radius 9 vs 12; the input omits `background:#fff`; the
  select has no chevron treatment; labels are `.hint`-styled flex rows. → Delete all inline styles;
  A1/A4 recipes + `.w-m`; labels per §5.
- :69, :71, :164 [C5] `main` inline `padding:"2.6rem 0 3.5rem"`, topbar `marginTop:"1rem"`,
  hint `marginTop:"2rem"` → page-type rhythm (§12).
- :80 [C2] hint `marginLeft:"auto"`.
- :108 [—] `.rv` stagger on a public SEO list — content invisible pre-JS (A16); drop `.rv` here.
- :123-125, :133-138, :148 [C2] Inline flex + `.84rem` name + mono micro overrides → `.paycheck` rules + `.micro`.
- :134 [ICON] `4.8 ★ · 12 reviews`; :146 [ICON] `Applied ✓`.
- :144 [C5] Long sign-in CTA label in a `.btn-s` — wraps at 375px; shorten label or allow wrap style.
- :154-160 [GAP] Empty state `.card` inline padding, no CTA ("clear filters" action missing).

## 9. `web/app/check/page.tsx` + `CheckForm.tsx` + `check/[slug]/page.tsx`

- check/page.tsx:35, :38, :81-107, :124-158 — same landing-family issues (eyebrow on-dark, hero h1
  margin, `.ic` inline pairs, navy band block with `#9DB0CC/#DDE7F3/#33C088`) → `.sec-navy`, `.ic.*`, `.eyebrow.on-dark`.
- CheckForm.tsx:49-51 [C3-good] "Checking…" busy label is the reference pattern — but no spinner/`aria-busy` (§4).
- check/[slug]/page.tsx:105-106 [C2/C5] Section inline `paddingTop:"3rem"`, wrap inline `maxWidth:860` → `.wrap-narrow` token.
- :108, :243 [C2] Inline flex rows → utilities.
- :119-121, :210, :238 [C2] Mono micro lines inline (.68/.64rem — .64 is off the micro scale) → `.micro`.
- :207, :215, :222-223, :261 [C5] Inline `marginTop`s → rhythm.
- :222 [C2] `.card` inline `borderLeft:"4px solid var(--clear)"` → `.card.strip-ok`.

## 10. `web/app/pricing/page.tsx` + `BillingButtons.tsx`

- :85-93 [C2] `.pill` used as block-level `<p role="status">` with inline `marginBottom` —
  pills are inline labels → `.note.ok` / `.note.warn` (MASTER §9).
- :53-63 [C2] Current-plan cluster inline flex column + mono inline `.78rem` → component classes.
- :99-102, :135-138 [C2] Price display `b.mono` inline `fontSize:"2.1rem"` ×2 → `.price` display class (§2.3).
- :99, :127, :135, :163 [C5] Inline `marginTop`s → card rhythm.
- :132 [C2] Eyebrow inline `osoft/orange` variant → `.eyebrow.pro`.
- :170-193 [C2/C4] Pledge band = same inline navy-gradient `.appcard` as landing → `.cta-band`.
- BillingButtons.tsx — busy labels present, no spinner/`aria-busy` (§4); otherwise clean.

## 11. `web/app/b/[slug]/*` (public profile — R6 flagship)

**page.tsx**
- **:96 [C2] Inline `<style>` tag** defining `.cover{height:230px;...margin-bottom:-56px}` and
  `.pwrap` — the profile-hero recipe lives outside the design system and can't be reused by
  `/t/[slug]` (R6) → promote to `app.css` per MASTER §11.3 (with the responsive clamp; fixed
  230px + −56px overlap currently doesn't adapt at 375px).
- :32 [C4] `AV_COLORS=["#2E5E8F","#149E5F","#B87333","#41546B"]` → `--av-1..4` tokens (logic —
  deterministic, never risk-keyed — is correct, keep it).
- :103 [C2] `.phead` inline `position:relative;zIndex:2` → `.phead-hero`.
- :108, :139, :150 [C2] Inline flex/grid/textAlign on hero rows → hero recipe classes.
- :121, :210 [C2] Mono meta lines inline `.68rem` → `.micro`.
- :126 [ICON] `4.6 ★` in pstats → SVG star.
- :158, :160, :220, :252, :303 [C5] Inline `marginTop`s on grid/h3/f-legal → §12 profile rhythm.
- :162, :178, :195 [C2] `.item.alertcard.c` + redundant inline `boxShadow:"var(--sh1)"` (`.item`
  already has `--sh1`) — dead style, delete ×3.
- :164, :180, :197, :270 [C2] `b` inline `.9rem/.88rem` overrides → `.item b` scale.
- :221 [C2] `.portfolio` inline `gridTemplateColumns:"1fr 1fr"` → `.portfolio.two` modifier;
  tiles are `Art` 4:3 → migrate to `.photo` 16:10 with real photos (R1).
- :228-232, :245 [C2/C5] `<details>` card inline padding, summary inline font, ul inline `.85rem` → `.card details` recipe.
- :266 [C4] Review avatar `#2E5E8F`.
- **ProfileActions.tsx** :76 [ICON] `＋ Add to watchlist`; :72-77 [C3] busy without label/spinner change.
- **ProfileNav.tsx** :10-23 [C2] `openMenu` inline CSSProperties object — duplicated byte-for-byte
  in `LandingNav.tsx:10-23` → `.nav-links.open` class in app.css; [C3/A11Y] mobile menu has no
  Escape-close and closes on any click inside (link focus lost); ProfileNav is a fork of
  LandingNav → consolidate into one `SiteNav` component.
- **ReviewForm.tsx** :30, :44, :90 [C5] `card form` inline `padding:"1.3rem",marginTop:"1rem"` ×3;
  :31, :45, :91 [C2] `<b style={{fontFamily:"var(--fd)"}}>` headings ×3 → `.card h3`/`.mini-h`;
  :35, :142 [C2] `justifySelf:"start"`; **:95 [C1/C3] `readOnly` name input and :99 disabled
  select have no readonly/disabled styling** (root causes A3) — they look fully editable.

## 12. `web/components/*`

- **Toast.tsx** :22 [C3] 2600ms auto-dismiss (guideline 3–5s → 3500ms); single slot — a second
  toast overwrites the first (queue per §9); no error variant — API failures announce as polite
  `role="status"` instead of `role="alert"`; slide-up transition not reduced-motion-specific
  (global kill covers it — verify).
- **Stars.tsx** :6 [ICON] `★` text glyphs → inline SVG stars (`--star` fill, `--cloud` dim), keep the `aria-label`.
- **Art.tsx** :8, :33, :48, :65 [A11Y/bug] Fixed gradient ids `g1..g4` — duplicate DOM ids when
  the same scene renders twice on a page (portfolio grids do this); gradients can also cross-paint
  between instances → derive ids from `React.useId()`. Root `<svg>` lacks `aria-hidden`/`role="img"`
  (some call sites wrap with `aria-hidden`, some don't — e.g. bcard art at CustomerApp:94 is exposed). Scene palette itself: exempt (illustration).
- **Reveal.tsx** [A11Y] With JS disabled/failed, all `.rv` content stays `opacity:0` (A16) → no-JS
  guard + never `.rv` inside app shells or SEO-critical lists (jobs:108, pricing cards, b/[slug] usage OK to keep on marketing only).
- **ExposureCalculator.tsx** :16 [C2] `maxWidth:720;margin:"0 auto"` inline → `.wrap-narrow`;
  :18, :48 [C2] type-size overrides inline; :21 [C5] `grid2` inline `gap:"1rem"` (token gap is 1.3rem);
  :47 [C2] `.mcard` inline orange strip → `.mcard.strip-or`.
- **layout.tsx** [GAP] No favicon, no `opengraph-image`/twitter meta (R2 acceptance + nextjs.csv
  "Include OpenGraph images"); fonts load render-blocking via `<link>` (acceptable; revisit with
  `next/font` only after checking the repo's Next 16 docs note in `web/AGENTS.md`).

## 13. `web/app/builder/page.tsx` (server VM)

- :27-28, :138-148 [C4] Avatar colour map re-hard-codes `#E5484D/#E9950C/#2E5E8F` (duplicate of
  TradieApp RISK_COL — third copy of the triad) → single shared map using tokens.

---

## Cross-cutting tallies (for sizing the fix passes)

| Theme | Count | One-line fix |
|---|---|---|
| Unstyled password inputs | 3 (login 1, onboarding 2) | A1 selector |
| Inline-styled/unscaled controls | jobs filter select+input, exposure 140, add-watch 230, dir-search 260, revoke 220, dispute 260 | A1/A4 + `.w-s/.w-m` |
| `style={{boxShadow:"none"}}` | 5 | `.item.flat` |
| App-bar inline block | 4 apps × 6 props | `.appbar` CSS |
| Avatar `#2E5E8F` inline | 10 | `--av-1` |
| `#9DB0CC` inline (EXIT links, navy-band subs) | 8 | `.sec-navy` + `.appbar .exit` |
| `#33C088` check strokes | 6 | `--clear-ondark` |
| Text-glyph icons `＋ ✓ ★ ↑ ↓ 👋` | 22 | SVG swaps (§13.3) |
| Empty states (3 competing patterns) | 16 sites | `.empty` |
| `justifySelf:"start"` submit buttons | 8 | `.form .actions` |
| Inline `marginTop` rhythm breaks | 40+ | `--stack-gap`/§12 |
| Zero skeletons / loading states | all fetch surfaces | §8 + `loading.tsx` per route |

---

## TOP 10 WORST OFFENDERS (fix in this order)

1. **`app.css:171` control-selector gap → unstyled password fields** on `/login` (LoginForm:85-92)
   and `/onboarding` (OnboardingWizard:232,236). The R2-named bug; two-line CSS fix heals three pages. **[C1]**
2. **`jobs/page.tsx:85-97`** — public SEO page ships fully inline-styled filter controls at ~34px
   height, off-radius, missing background/chevron. **[C1/C2]**
3. **No loading feedback anywhere** — zero skeleton classes, no `loading.tsx`, and
   `router.refresh()` mutations give no pending UI. Highest perceived-quality lever per
   ux-guidelines "Loading States" (High). **[GAP]**
4. **Empty-state fragmentation** — 16 zero-states across 3 ad-hoc patterns, none with
   illustration + CTA (SPEC R2 requires illustration + CTA). **[GAP]**
5. **Text-glyphs/emoji as icons (22 instances)** — `👋` (TradieApp:588), `＋` ×4, `✓` ×7, `★` ×8,
   `↑↓` ×2 — direct violation of the no-emoji-icons law and the Pro Max checklist. **[ICON]**
6. **Global `busy` flag disables every button** — BuilderApp:169 and AdminApp (all queues): one
   in-flight action freezes the whole app surface. **[C3]**
7. **Hard-coded colour duplicates of the token set** — risk triad re-declared in TradieApp:16 and
   builder/page.tsx:27; `#2E5E8F` ×10; `#9DB0CC` ×8; `#33C088` ×6; `#FF5A1F` (AdminApp:303). Drift
   risk: change a token, miss 25 call sites. **[C4]**
8. **`b/[slug]/page.tsx:96` inline `<style>` tag** — the flagship page's hero recipe (cover +
   −56px avatar overlap) lives outside the system and can't be reused for `/t/[slug]` (R6);
   fixed 230px cover isn't responsive. **[C2]**
9. **Unstyled checkbox + readonly/disabled controls** — TradieApp:130 checkbox with
   `width:auto` hack; ReviewForm:95,99 readonly/disabled fields indistinguishable from editable.
   Plus UA-default `<select>` chevrons ×6. **[C1/C3]**
10. **Scale drift everywhere else** — 13 distinct radii, 4 ad-hoc z-indexes, 8 durations,
    5 different inline input widths, toast at 2600ms, `.tog` animating `left`, mobile drawer
    without scrim/Escape/scroll-lock, `aria-current` boolean in 2 of 4 apps. Individually small;
    together they are the "basic feel" R2 exists to kill. **[C2/C3/C5/A11Y]**
