/* BuildSafe demo state — in-memory (session). Clearly sample data. */
window.BS = {
  me: { tradie:{name:"Parth C.", trade:"Wall & Floor Tiling", suburb:"Clyde North VIC", abn:"84 220 913 557", licence:"—", insurance:"CoverTrade $10M · exp 03/2027", available:false, rating:4.9, jobs:37},
        builder:{name:"Southpoint Projects", abn:"19 407 226 315", licence:"VBA DB-U 71442", suburb:"Cranbourne VIC", tier:2, rating:4.7} },
  builders: [
    {id:"hc", nm:"Harbourline Constructions", abn:"51 824 753 190", loc:"Melbourne SE", st:"risk", lic:"DB-U 41233 · current", rating:3.2, reviews:14, verified:false, col:"#E5484D",
      art:"crane", tags:["Volume residential"], signals:[
        {d:"14 JUN 2026", t:"Creditor's claim — Supreme Court VIC", lv:"risk", src:"Court list"},
        {d:"04 JUN 2026", t:"3 verified reports of 60+ day payment delays", lv:"watch", src:"BuildSafe verified reports"},
        {d:"19 MAY 2026", t:"Two director resignations within 60 days", lv:"watch", src:"ASIC register"}]},
    {id:"bb", nm:"Bassline Building Group", abn:"72 610 442 887", loc:"Werribee VIC", st:"watch", lic:"DB-U 55871 · current", rating:4.1, reviews:22, verified:false, col:"#E9950C",
      art:"frame", tags:["Custom homes"], signals:[
        {d:"19 MAY 2026", t:"Director change recorded", lv:"watch", src:"ASIC register"},
        {d:"02 MAR 2026", t:"All registers clear", lv:"ok", src:"Routine re-test"}]},
    {id:"rh", nm:"Redgum Homes (Aus)", abn:"38 559 201 664", loc:"Officer VIC", st:"ok", lic:"DB-U 60218 · current", rating:4.8, reviews:63, verified:true, col:"#149E5F",
      art:"house", tags:["Townhouses","Renovations"], signals:[
        {d:"30 JUN 2026", t:"All registers clear — verification renewed", lv:"ok", src:"All registers"}]},
    {id:"sp", nm:"Southpoint Projects", abn:"19 407 226 315", loc:"Cranbourne VIC", st:"ok", lic:"DB-U 71442 · current", rating:4.7, reviews:41, verified:true, col:"#2E5E8F",
      art:"tower", tags:["Multi-res","Fit-out"], signals:[
        {d:"28 JUN 2026", t:"All registers clear", lv:"ok", src:"All registers"}]}
  ],
  watch: [ {b:"hc", exp:42300}, {b:"bb", exp:18900}, {b:"rh", exp:34800} ],
  jobs: [
    {id:1, t:"Wall & floor tiler — bathroom reno ×3", by:"rh", rate:"$620/day", loc:"Cranbourne VIC", start:"Mon", dur:"~2 weeks", req:"Own tools", apps:3, applied:false},
    {id:2, t:"Bricklayers ×2 — boundary wall (day hire)", by:"sp", rate:"$580/day", loc:"Werribee VIC", start:"Tomorrow", dur:"2–3 days", req:"ABN required", apps:5, applied:false},
    {id:3, t:"Carpenter — fix-out, townhouse project", by:"bb", rate:"$70/hr", loc:"Doncaster VIC", start:"This week", dur:"4 weeks", req:"White card", apps:2, applied:false},
    {id:4, t:"Labourers ×3 — site clean & materials", by:"sp", rate:"$38/hr", loc:"Clyde North VIC", start:"Friday", dur:"1 day", req:"PPE supplied", apps:7, applied:false}
  ],
  myJobs: [ {id:101, t:"Renderer — 2× facades, acrylic", rate:"$8,400 quote", loc:"Tarneit VIC", start:"Flexible", dur:"Quote job", apps:[{n:"M. Nguyen Rendering",r:4.8,note:"Available next week, insured"},{n:"ProCoat Render Co",r:4.6,note:"Can start Monday"}]} ],
  reviews: {
    rh: [ {n:"Sarah D.", role:"Homeowner", r:5, tx:"Finished our townhouse on schedule. Progress payments were exactly as quoted — no surprises.", reply:"Thanks Sarah — pleasure building for you."},
          {n:"J. Okafor Tiling", role:"Subcontractor", r:5, tx:"Paid every invoice inside 14 days for two years straight. Rare and worth saying publicly."},
          {n:"Dean W.", role:"Homeowner", r:4, tx:"Great build quality. Communication slowed near handover but they got there."} ],
    sp: [ {n:"L. Ferraro Carpentry", role:"Subcontractor", r:5, tx:"Organised sites, clear scopes, pays on time."},
          {n:"Priya K.", role:"Homeowner", r:4, tx:"Solid duplex build, minor defects fixed quickly."} ],
    hc: [ {n:"A. Tomic Plumbing", role:"Subcontractor", r:2, tx:"90 days and chasing. Be careful with your terms."} ],
    bb: [ {n:"R. Silva Concreting", role:"Subcontractor", r:4, tx:"Decent to work with, slightly slow on variations."} ]
  },
  alerts: [
    {lv:"risk", t:"New court filing — Harbourline Constructions", d:"Creditor's claim lodged, Supreme Court of Victoria. You have $42,300 logged against this builder.", src:"Court list · 14 Jun 2026", when:"2h ago"},
    {lv:"watch", t:"Payment-delay reports — Harbourline Constructions", d:"Three verified subcontractor reports of 60+ day delays in the last 90 days (aggregated & anonymised).", src:"BuildSafe verified reports", when:"3d ago"},
    {lv:"ok", t:"Re-verified — Redgum Homes (Aus)", d:"Monthly re-test complete. All registers clear; Verified badge renewed.", src:"All registers · 30 Jun 2026", when:"1w ago"}
  ]
};
