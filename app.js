const $ = (q) => document.querySelector(q);

const storeKey = "lifeos_v02";
const areas = [
  { id:"relationships", icon:"❤️", name:"Beziehungen" },
  { id:"health", icon:"🏃", name:"Gesundheit" },
  { id:"career", icon:"💼", name:"Karriere" },
  { id:"finance", icon:"💰", name:"Finanzen" },
  { id:"growth", icon:"🧠", name:"Entwicklung" }
];

const defaultState = {
  createdAt: new Date().toISOString(),
  activeTab: "today",
  chapter: null,
  money: { monthlyBudget: 1000, expenses: [] },
  reflections: [],
  insights: [],
  planted: false
};

let state = load();

function load(){
  try { return { ...defaultState, ...(JSON.parse(localStorage.getItem(storeKey)) || {}) }; }
  catch { return structuredClone(defaultState); }
}
function save(){ localStorage.setItem(storeKey, JSON.stringify(state)); }

function daysSince(date){
  return Math.max(1, Math.ceil((Date.now() - new Date(date).getTime()) / 86400000));
}
function euro(n){ return new Intl.NumberFormat("de-DE",{style:"currency",currency:"EUR"}).format(n || 0); }
function todayKey(){ return new Date().toISOString().slice(0,10); }

function timePhase(){
  const h = new Date().getHours();
  if(h >= 5 && h < 11) return "morning";
  if(h >= 11 && h < 18) return "day";
  if(h >= 18 || h < 2) return "evening";
  return "night";
}

function spentThisMonth(){
  const ym = new Date().toISOString().slice(0,7);
  return state.money.expenses
    .filter(e => (e.date || "").startsWith(ym))
    .reduce((s,e)=>s+Number(e.amount||0),0);
}

function todayImportant(){
  const last = state.reflections.slice(-7);
  if(!state.planted) return "Pflanze deinen Lebensbaum und beginne deine Reise.";
  if(!state.chapter) return "Wähle ein Kapitel, das in den nächsten Wochen Aufmerksamkeit verdient.";
  if(last.length < 3) return "Ein paar kurze Abendreflexionen reichen, damit LifeOS erste Muster erkennt.";
  const counts = {};
  last.flatMap(r=>r.areas||[]).forEach(a => counts[a]=(counts[a]||0)+1);
  const top = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
  if(top){
    const area = areas.find(a=>a.id===top[0]);
    return `${area.icon} ${area.name} war zuletzt häufig präsent.`;
  }
  return "Heute reicht ein kleiner bewusster Schritt.";
}

function statusLine(){
  const refs = state.reflections.length;
  if(refs === 0) return "🌱 Heute beginnt dein Lebensbaum.";
  if(refs < 5) return "🌿 Du baust erste Struktur auf.";
  const good = state.reflections.slice(-7).filter(r=>r.mood==="good").length;
  if(good >= 4) return "🌿 Du bist auf Kurs.";
  return "🌱 Kleine Schritte reichen aus.";
}

function switchTab(tab){
  state.activeTab = tab;
  save();
  render();
}

function render(){
  document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active", b.dataset.tab===state.activeTab));
  const view = $("#view");
  if(state.activeTab === "today") view.innerHTML = todayView();
  if(state.activeTab === "chapters") view.innerHTML = chaptersView();
  if(state.activeTab === "money") view.innerHTML = moneyView();
  if(state.activeTab === "insights") view.innerHTML = insightsView();
  if(state.activeTab === "refuge") view.innerHTML = refugeView();
  bind();
}

function todayView(){
  const phase = timePhase();
  const greeting = phase==="morning" ? "Guten Morgen" : phase==="evening" ? "Guten Abend" : "Heute";
  const spent = spentThisMonth();
  const available = Math.max(0, state.money.monthlyBudget - spent);
  return `
    <section class="header">
      <div class="eyebrow">${new Date().toLocaleDateString("de-DE",{weekday:"long",day:"numeric",month:"long"})}</div>
      <h1>${greeting}, Julius</h1>
      <div class="status">${statusLine()}</div>
    </section>

    <section class="card big-card solid">
      <div class="label">Heute wichtig</div>
      <div class="title">${todayImportant()}</div>
      <p class="text">LifeOS zeigt dir nur das, was heute wirklich Aufmerksamkeit verdient.</p>
    </section>

    <section class="card">
      <div class="row">
        <div>
          <div class="label">Aktuelles Kapitel</div>
          <div class="title">${state.chapter ? state.chapter.title : "Noch kein Kapitel"}</div>
          <p class="text">${state.chapter ? (state.chapter.why || "Dein aktueller Fokus.") : "Starte ein Kapitel, das dein Leben gerade prägen soll."}</p>
        </div>
        <button class="secondary" data-tab-go="chapters">Öffnen</button>
      </div>
    </section>

    <section class="grid">
      <div class="card">
        <div class="label">Verfügbar</div>
        <div class="metric">${euro(available)}</div>
        <p class="small">Diesen Monat</p>
      </div>
      <div class="card">
        <div class="label">Lebensbaum</div>
        <div class="metric">${state.planted ? daysSince(state.createdAt) : "0"}</div>
        <p class="small">Tage begleitet</p>
      </div>
    </section>

    <section class="card">
      <button class="primary" id="openReflection">🌙 Wie war dein Tag?</button>
    </section>
  `;
}

function chaptersView(){
  return `
    <section class="header">
      <div class="eyebrow">Richtung</div>
      <h1>Kapitel</h1>
      <div class="status">🎯 Ein Kapitel gleichzeitig</div>
    </section>

    <section class="card solid">
      <div class="label">Aktives Kapitel</div>
      <div class="title">${state.chapter ? state.chapter.title : "Kein Kapitel aktiv"}</div>
      <p class="text">${state.chapter ? (state.chapter.why || "Kein Warum hinterlegt.") : "Ein Kapitel ist kein To-do. Es ist eine Richtung für die nächsten Wochen."}</p>
      ${state.chapter ? `<div class="progress" style="--w:${state.chapter.progress||10}%"><span></span></div>` : ""}
      <br />
      <button class="primary" id="newChapter">${state.chapter ? "Kapitel ändern" : "Kapitel starten"}</button>
    </section>
  `;
}

function moneyView(){
  const spent = spentThisMonth();
  const available = Math.max(0, state.money.monthlyBudget - spent);
  const last = state.money.expenses.slice(-5).reverse();
  return `
    <section class="header">
      <div class="eyebrow">Ressourcen</div>
      <h1>Finanzen</h1>
      <div class="status">💰 Geld als Spiegel deiner Prioritäten</div>
    </section>

    <section class="grid">
      <div class="card solid">
        <div class="label">Monatsbudget</div>
        <div class="metric">${euro(state.money.monthlyBudget)}</div>
      </div>
      <div class="card solid">
        <div class="label">Verfügbar</div>
        <div class="metric">${euro(available)}</div>
      </div>
    </section>

    <section class="card">
      <button class="primary" id="addExpense">Ausgabe erfassen</button>
      <br><br>
      <button class="secondary" id="editBudget">Budget ändern</button>
    </section>

    <section class="card">
      <div class="label">Letzte Ausgaben</div>
      <div class="list">
        ${last.length ? last.map(e=>`
          <div class="item row">
            <div>
              <div class="item-title">${e.note || "Ausgabe"}</div>
              <div class="small">${areaName(e.area)} · ${new Date(e.date).toLocaleDateString("de-DE")}</div>
            </div>
            <strong>${euro(e.amount)}</strong>
          </div>`).join("") : `<p class="text">Noch keine Ausgaben erfasst.</p>`}
      </div>
    </section>
  `;
}

function insightsView(){
  const obs = buildObservations();
  return `
    <section class="header">
      <div class="eyebrow">Verständnis</div>
      <h1>Erkenntnisse</h1>
      <div class="status">🐦 Wenige, aber bedeutende Hinweise</div>
    </section>
    <section class="card solid">
      <div class="label">Beobachtungen</div>
      <div class="list">
        ${obs.length ? obs.map(o=>`<div class="item">${o}</div>`).join("") : `<p class="text">Noch nicht genug Daten. Ein paar Reflexionen reichen, damit erste Beobachtungen entstehen.</p>`}
      </div>
    </section>
  `;
}

function buildObservations(){
  const out = [];
  const last = state.reflections.slice(-14);
  if(last.length >= 3) out.push(`🌙 Du hast ${last.length} Reflexionen gespeichert. Daraus entsteht langsam dein Muster.`);
  const counts = {};
  last.flatMap(r=>r.areas||[]).forEach(a=>counts[a]=(counts[a]||0)+1);
  const top = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
  if(top){
    const a = areas.find(x=>x.id===top[0]);
    out.push(`${a.icon} ${a.name} war zuletzt dein präsentester Lebensbereich.`);
  }
  return out;
}

function refugeView(){
  const d = daysSince(state.createdAt);
  const roots = rootStrength();
  return `
    <section class="header">
      <div class="eyebrow">Dein Ort</div>
      <h1>Refugium</h1>
      <div class="status">🌳 ${state.planted ? `${d} Tage begleitet` : "Noch nicht gepflanzt"}</div>
    </section>

    ${state.planted ? `
    <section class="tree-stage">
      ${treeSvg()}
    </section>

    <section class="card roots-panel">
      <div class="label">🌱 Fundament</div>
      <p class="text">Deine Wurzeln entstehen aus Reflexionen, Kapiteln und Ressourcen.</p>
      ${areas.map(a=>`
        <div class="root-row">
          <div>${a.icon} ${a.name}</div>
          <div class="rootbar"><span style="width:${roots[a.id]}%"></span></div>
        </div>
      `).join("")}
    </section>` : `
    <section class="card solid">
      <div class="title">🌱 Pflanze deinen Lebensbaum</div>
      <p class="text">Heute beginnt dein persönliches Refugium.</p>
      <br>
      <button class="primary" id="plantTree">Baum pflanzen</button>
    </section>`}
  `;
}

function treeSvg(){
  const refs = state.reflections.length;
  const leaves = Math.min(30, 4 + refs * 2);
  let leafEls = "";
  const positions = [
    [170,120],[210,110],[250,128],[145,155],[230,158],[280,165],[180,190],[255,205],
    [125,205],[300,220],[160,245],[230,250],[275,260],[195,285],[140,290],[310,300],
    [115,250],[335,260],[205,80],[265,95],[105,170],[335,185],[175,325],[250,330],
    [210,215],[295,130],[145,105],[315,110],[225,300],[95,220]
  ];
  for(let i=0;i<leaves;i++){
    const [x,y]=positions[i%positions.length];
    leafEls += `<ellipse class="leaf" cx="${x}" cy="${y}" rx="18" ry="10" fill="#79a96f" opacity=".9" transform="rotate(${(i*37)%160} ${x} ${y})"/>`;
  }
  const bird = state.reflections.length >= 5 ? `<text class="bird" x="275" y="128" font-size="28">🐦</text>` : "";
  return `
  <svg class="tree-svg" viewBox="0 0 430 430" preserveAspectRatio="xMidYMid meet">
    <path d="M70 370 C145 330, 285 330, 360 370" fill="none" stroke="#8aa879" stroke-width="18" stroke-linecap="round" opacity=".25"/>
    <path d="M215 345 C205 280, 210 210, 215 145" fill="none" stroke="#8a5f3d" stroke-width="30" stroke-linecap="round"/>
    <path d="M215 245 C170 215, 130 180, 102 140" fill="none" stroke="#8a5f3d" stroke-width="14" stroke-linecap="round"/>
    <path d="M220 225 C265 205, 302 170, 335 125" fill="none" stroke="#8a5f3d" stroke-width="14" stroke-linecap="round"/>
    <path d="M215 295 C170 285, 135 265, 95 235" fill="none" stroke="#8a5f3d" stroke-width="12" stroke-linecap="round"/>
    <path d="M225 290 C280 292, 325 270, 365 240" fill="none" stroke="#8a5f3d" stroke-width="12" stroke-linecap="round"/>
    ${leafEls}
    ${bird}
  </svg>`;
}

function rootStrength(){
  const roots = Object.fromEntries(areas.map(a=>[a.id,8]));
  state.reflections.forEach(r => (r.areas||[]).forEach(a => roots[a] = Math.min(100, roots[a]+8)));
  if(state.chapter?.area) roots[state.chapter.area] = Math.min(100, roots[state.chapter.area]+20);
  state.money.expenses.forEach(e => { if(e.area) roots[e.area] = Math.min(100, roots[e.area]+3); });
  return roots;
}

function areaName(id){
  const a = areas.find(x=>x.id===id);
  return a ? `${a.icon} ${a.name}` : "Ohne Bereich";
}

function bind(){
  document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>switchTab(b.dataset.tab));
  document.querySelectorAll("[data-tab-go]").forEach(b=>b.onclick=()=>switchTab(b.dataset.tabGo));
  $("#openReflection")?.addEventListener("click", openReflection);
  $("#newChapter")?.addEventListener("click", openChapter);
  $("#plantTree")?.addEventListener("click", ()=>{ state.planted=true; save(); render(); });
  $("#addExpense")?.addEventListener("click", openExpense);
  $("#editBudget")?.addEventListener("click", openBudget);
}

function showModal(html){
  const m = $("#modal");
  m.classList.remove("hidden");
  m.innerHTML = `<div class="sheet">${html}<br><button class="secondary" id="closeModal">Schließen</button></div>`;
  $("#closeModal").onclick = closeModal;
}
function closeModal(){ $("#modal").classList.add("hidden"); $("#modal").innerHTML=""; }

function openReflection(){
  showModal(`
    <h2>🌙 Wie war dein Tag?</h2>
    <div class="emoji-options">
      <button data-mood="good">😀</button>
      <button data-mood="ok">😐</button>
      <button data-mood="hard">☹️</button>
    </div>
    <div id="reflectionStep"></div>
  `);
  document.querySelectorAll("[data-mood]").forEach(b=>b.onclick=()=>reflectionAreas(b.dataset.mood));
}
function reflectionAreas(mood){
  $("#reflectionStep").innerHTML = `
    <div class="label">Was hat deinen Tag geprägt?</div>
    <div class="area-options">
      ${areas.map(a=>`<label><input type="checkbox" value="${a.id}"> ${a.icon} ${a.name}</label>`).join("")}
    </div>
    <textarea id="reflectionNote" placeholder="Was bleibt von diesem Tag? (optional)"></textarea>
    <br><br>
    <button class="primary" id="saveReflection">Reflexion speichern</button>
  `;
  $("#saveReflection").onclick = () => {
    const selected = [...document.querySelectorAll("#reflectionStep input:checked")].map(i=>i.value);
    state.reflections.push({ date:new Date().toISOString(), mood, areas:selected, note:$("#reflectionNote").value.trim() });
    if(!state.planted) state.planted = true;
    save(); closeModal(); render();
  };
}

function openChapter(){
  showModal(`
    <h2>🎯 Neues Kapitel</h2>
    <p class="text">Welcher Bereich verdient in den nächsten Wochen Aufmerksamkeit?</p><br>
    <select id="chapterArea">${areas.map(a=>`<option value="${a.id}">${a.icon} ${a.name}</option>`).join("")}</select><br><br>
    <input class="input" id="chapterTitle" placeholder="z. B. Wieder fit werden" value="${state.chapter?.title||""}"><br><br>
    <textarea id="chapterWhy" placeholder="Warum ist dir das wichtig?">${state.chapter?.why||""}</textarea><br><br>
    <button class="primary" id="saveChapter">Kapitel starten</button>
  `);
  $("#saveChapter").onclick = () => {
    state.chapter = {
      title: $("#chapterTitle").value.trim() || "Neues Kapitel",
      why: $("#chapterWhy").value.trim(),
      area: $("#chapterArea").value,
      progress: state.chapter?.progress || 10,
      startedAt: new Date().toISOString()
    };
    save(); closeModal(); render();
  };
}

function openExpense(){
  showModal(`
    <h2>💰 Ausgabe erfassen</h2>
    <input class="input" id="expenseAmount" type="number" step="0.01" placeholder="Betrag"><br><br>
    <input class="input" id="expenseNote" placeholder="Notiz, z. B. Essen"><br><br>
    <select id="expenseArea">${areas.map(a=>`<option value="${a.id}">${a.icon} ${a.name}</option>`).join("")}</select><br><br>
    <button class="primary" id="saveExpense">Speichern</button>
  `);
  $("#saveExpense").onclick = () => {
    state.money.expenses.push({
      amount: Number($("#expenseAmount").value || 0),
      note: $("#expenseNote").value.trim(),
      area: $("#expenseArea").value,
      date: new Date().toISOString()
    });
    save(); closeModal(); render();
  };
}

function openBudget(){
  showModal(`
    <h2>Budget ändern</h2>
    <input class="input" id="budgetAmount" type="number" value="${state.money.monthlyBudget}"><br><br>
    <button class="primary" id="saveBudget">Speichern</button>
  `);
  $("#saveBudget").onclick = () => {
    state.money.monthlyBudget = Number($("#budgetAmount").value || 0);
    save(); closeModal(); render();
  };
}

render();
