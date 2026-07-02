/* BuildSafe shared logic (in-memory demo — no accounts, no storage) */
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const ST={risk:["ALERT","risk"],watch:["WATCH","watch"],ok:["CLEAR","ok"]};
const money=n=>"$"+Number(n||0).toLocaleString("en-AU");
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

function toast(msg){let t=$("#toast");if(!t){t=document.createElement("div");t.id="toast";t.className="toast-fix";t.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg><span></span>';document.body.appendChild(t)}t.querySelector("span").textContent=msg;t.classList.add("show");clearTimeout(t._x);t._x=setTimeout(()=>t.classList.remove("show"),2600)}

function stars(r){let h="";for(let i=1;i<=5;i++)h+=`<span class="${i<=Math.round(r)?"":"dim"}">★</span>`;return `<span class="stars" aria-label="${r} out of 5">${h}</span>`}
function initials(n){return n.split(/\s+/).slice(0,2).map(w=>w[0]).join("").toUpperCase()}

/* SVG scene art for "photo" tiles */
function art(kind,label){
  const scenes={
    crane:`<defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF8452"/><stop offset=".55" stop-color="#C2503A"/><stop offset="1" stop-color="#12304F"/></linearGradient></defs><rect width="400" height="240" fill="url(#g1)"/><circle cx="322" cy="52" r="26" fill="#FFD9A8" opacity=".9"/><g stroke="#0A1B2E" stroke-width="6"><path d="M60 240V90h10v150M65 90L200 60M200 60v20M200 60l60 10M150 72v14"/></g><rect x="230" y="140" width="120" height="100" fill="#0A1B2E"/><rect x="120" y="170" width="80" height="70" fill="#0E2238"/><g fill="#FFB08C"><rect x="245" y="155" width="12" height="12"/><rect x="270" y="155" width="12" height="12"/><rect x="295" y="155" width="12" height="12"/><rect x="245" y="180" width="12" height="12"/><rect x="270" y="180" width="12" height="12"/></g>`,
    frame:`<defs><linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7FB2E5"/><stop offset="1" stop-color="#E9EEF5"/></linearGradient></defs><rect width="400" height="240" fill="url(#g2)"/><g stroke="#B87333" stroke-width="7" fill="none"><path d="M60 240V120L200 60l140 60v120M110 240V140M160 240V118M240 240V118M290 240V140M60 160h280M60 200h280"/></g><rect y="228" width="400" height="12" fill="#8C6A4F"/>`,
    house:`<defs><linearGradient id="g3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE3C2"/><stop offset="1" stop-color="#F5A25B"/></linearGradient></defs><rect width="400" height="240" fill="url(#g3)"/><rect x="70" y="120" width="260" height="120" fill="#F7F3EA"/><path d="M50 125L200 55l150 70z" fill="#41546B"/><rect x="110" y="150" width="46" height="46" fill="#2E4258"/><rect x="244" y="150" width="46" height="46" fill="#2E4258"/><rect x="182" y="160" width="40" height="80" fill="#B87333"/><rect y="230" width="400" height="10" fill="#5E7256"/>`,
    tower:`<defs><linearGradient id="g4" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0F2440"/><stop offset="1" stop-color="#2E5E8F"/></linearGradient></defs><rect width="400" height="240" fill="url(#g4)"/><rect x="90" y="60" width="90" height="180" fill="#132C48"/><rect x="220" y="30" width="100" height="210" fill="#0C1F36"/><g fill="#FFC773"><rect x="102" y="76" width="14" height="10"/><rect x="130" y="76" width="14" height="10"/><rect x="102" y="104" width="14" height="10"/><rect x="234" y="50" width="16" height="11"/><rect x="262" y="50" width="16" height="11"/><rect x="234" y="82" width="16" height="11"/><rect x="290" y="114" width="16" height="11"/><rect x="262" y="146" width="16" height="11"/></g>`,
    tile:`<rect width="400" height="240" fill="#D8E2EA"/><g stroke="#fff" stroke-width="6"><path d="M0 60h400M0 130h400M0 200h400M80 0v240M180 0v240M280 0v240"/></g><rect x="185" y="65" width="90" height="60" fill="#2E5E8F"/><rect x="85" y="135" width="90" height="60" fill="#FF8452"/>`
  };
  return `<div class="art"><svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice">${scenes[kind]||scenes.house}</svg>${label?`<span class="cap">${esc(label)}</span>`:""}</div>`;
}

const B=id=>BS.builders.find(b=>b.id===id);

/* ------- shared renderers ------- */
function builderCard(b,forCustomer){
  return `<div class="bcard rv">
    ${art(b.art,b.loc)}
    <div class="bod">
      <div class="nm"><div><h4>${esc(b.nm)}</h4><div class="loc">${esc(b.lic)} · ABN ${b.abn}</div></div>
        ${b.verified?`<span class="vbadge"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>Verified</span>`:`<span class="pill ${ST[b.st][1]}">${ST[b.st][0]}</span>`}
      </div>
      <div class="rw">${stars(b.rating)} <b>${b.rating}</b> · ${b.reviews} reviews</div>
      <div class="cta">
        <a class="btn btn-d btn-s" href="profile.html?b=${b.id}">View profile</a>
        ${forCustomer?`<button class="btn btn-g btn-s" data-quote="${b.id}">Request quote</button>`:`<button class="btn btn-g btn-s" data-watchadd="${b.id}">＋ Watch</button>`}
      </div>
    </div></div>`;
}

function reviewHTML(r){
  return `<div class="review"><div class="rt"><span class="avatar" style="background:#2E5E8F">${initials(r.n)}</span><div><b style="font-size:.88rem">${esc(r.n)}</b> <span class="pill navy" style="margin-left:.3rem">${esc(r.role)}</span></div><span style="margin-left:auto">${stars(r.r)}</span></div><p>“${esc(r.tx)}”</p>${r.reply?`<div class="reply"><b>RESPONSE FROM BUILDER</b><br>${esc(r.reply)}</div>`:""}</div>`;
}

function jobCard(j,mode){ // mode: 'tradie' | 'builder'
  const b=B(j.by)||{nm:"You",st:"ok"};
  const st=ST[b.st];
  return `<div class="jobcard rv"><div class="top"><div><h4>${esc(j.t)}</h4><div class="meta"><span>${esc(j.loc)}</span><span>Starts ${esc(j.start)}</span><span>${esc(j.dur)}</span><span>${esc(j.req)}</span></div></div><span class="rate">${esc(j.rate)}</span></div>
  <div class="paycheck"><span style="display:flex;align-items:center;gap:.5rem;font-size:.84rem"><span class="pill ${st[1]}">Builder: ${st[0]}</span> <b style="font-size:.84rem">${esc(b.nm)}</b></span>
  ${mode==="tradie"?(j.applied?`<span class="pill ok">Applied ✓</span>`:`<button class="btn btn-p btn-s" data-apply="${j.id}">Apply now</button>`):`<span class="mono" style="font-size:.66rem;color:var(--slate2)">${j.apps} applicants</span>`}</div></div>`;
}

/* ------- tabs (app shells) ------- */
function initTabs(){
  $$(".sbtn[data-tab]").forEach(b=>b.addEventListener("click",()=>{
    $$(".sbtn[data-tab]").forEach(x=>x.classList.remove("on"));b.classList.add("on");
    $$(".panel").forEach(p=>p.classList.toggle("on",p.id===b.dataset.tab));
    const s=$(".side");if(s)s.classList.remove("open");
    window.scrollTo({top:0});
  }));
  const bb=$("#appburger");if(bb)bb.addEventListener("click",()=>$(".side").classList.toggle("open"));
}

/* reveal */
function initReveal(){const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}}),{threshold:.1});$$(".rv").forEach(el=>io.observe(el))}

/* delegate shared actions */
document.addEventListener("click",e=>{
  const ap=e.target.closest("[data-apply]");
  if(ap){const j=BS.jobs.find(x=>x.id==ap.dataset.apply);if(j&&!j.applied){j.applied=true;j.apps++;toast("Application sent — the builder can see your verified profile");if(window.renderJobsTradie)renderJobsTradie()}}
  const q=e.target.closest("[data-quote]");
  if(q){toast("Quote request sent to "+B(q.dataset.quote).nm+" — they'll reply in-app")}
  const w=e.target.closest("[data-watchadd]");
  if(w){const id=w.dataset.watchadd;if(!BS.watch.find(x=>x.b===id)){BS.watch.push({b:id,exp:0});toast(B(id).nm+" added to your watchlist")}else toast("Already on your watchlist")}
});
document.addEventListener("DOMContentLoaded",()=>{initReveal();initTabs()});
