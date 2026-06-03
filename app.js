const STORAGE = {
  goals: 'lifeos_v11_goals',
  expenses: 'lifeos_v11_expenses',
  budget: 'lifeos_v11_budget',
  reflections: 'lifeos_v11_reflections',
  plantedAt: 'lifeos_v11_planted_at'
};

const AREAS = {
  health: '🏃 Gesundheit',
  career: '💼 Karriere',
  finance: '💰 Finanzen',
  relationships: '❤️ Beziehungen',
  growth: '🧠 Entwicklung'
};
const CATEGORIES = {
  food: '🍔 Essen', alcohol: '🍺 Alkohol', grocery: '🛒 Einkauf', fun: '🎮 Freizeit', mobility: '🚗 Mobilität', online: '📦 Online', subs: '📱 Abos'
};

let state = {
  tab: 'today',
  goals: load(STORAGE.goals, []),
  expenses: load(STORAGE.expenses, []),
  budget: Number(localStorage.getItem(STORAGE.budget) || 1000),
  reflections: load(STORAGE.reflections, []),
  plannedExpense: false,
  goalType: 'daily'
};
if (!localStorage.getItem(STORAGE.plantedAt)) localStorage.setItem(STORAGE.plantedAt, new Date().toISOString());

function load(key, fallback){ try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; } }
function save(){
  localStorage.setItem(STORAGE.goals, JSON.stringify(state.goals));
  localStorage.setItem(STORAGE.expenses, JSON.stringify(state.expenses));
  localStorage.setItem(STORAGE.budget, String(state.budget));
  localStorage.setItem(STORAGE.reflections, JSON.stringify(state.reflections));
}
function todayISO(){ return new Date().toISOString().slice(0,10); }
function fmtEUR(n){ return new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(n); }
function escapeHtml(s=''){ return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function daysActive(){ return Math.max(1, Math.floor((new Date() - new Date(localStorage.getItem(STORAGE.plantedAt))) / 86400000) + 1); }
function todayGoals(){ return state.goals.filter(g => g.type === 'daily'); }
function completedTodayGoals(){ return todayGoals().filter(g => g.completedDate === todayISO()); }
function focusGoal(){ return todayGoals().find(g => g.isFocus); }
function todayExpenses(){ return state.expenses.filter(e => e.createdAt.slice(0,10) === todayISO()); }
function monthExpenses(){ const ym = todayISO().slice(0,7); return state.expenses.filter(e => e.createdAt.slice(0,7) === ym); }
function spentToday(){ return todayExpenses().reduce((s,e)=>s+Number(e.amount),0); }
function spentMonth(){ return monthExpenses().reduce((s,e)=>s+Number(e.amount),0); }
function dailyBudget(){ const now = new Date(); const daysInMonth = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate(); return state.budget / daysInMonth; }
function availableToday(){ return dailyBudget() - spentToday(); }
function treeStage(){ const d = daysActive(); if (d < 7) return ['🌱','Samen']; if (d < 30) return ['🌿','Sprössling']; if (d < 365) return ['🌳','Junger Baum']; return ['🌲','Lebensbaum']; }
function courseText(){
  const goals = todayGoals(); const done = completedTodayGoals().length; const goalRate = goals.length ? done/goals.length : .5;
  const budgetOK = spentMonth() <= state.budget;
  if (goalRate >= .6 && budgetOK) return ['🌿 Du bist auf Kurs.','📈 Deine Entwicklung zeigt nach oben.'];
  if (goalRate >= .3 || budgetOK) return ['🌤 Du bleibst stabil.','Kleine Schritte reichen aus.'];
  return ['🌧 Etwas aus dem Tritt.','🌱 Heute reicht ein neuer Anfang.'];
}
function nextStep(){ const fg = focusGoal(); if (!fg) return 'Fokusziel auswählen'; if (fg.completedDate !== todayISO()) return `${fg.title} erledigen`; if (todayExpenses().length === 0) return 'Erste Ausgabe erfassen'; return 'Tag bewusst weiterführen'; }
function insight(){
  if (state.expenses.length >= 5) {
    const spontaneous = state.expenses.filter(e=>!e.planned).length;
    const p = Math.round(spontaneous/state.expenses.length*100);
    return `${p}% deiner Ausgaben waren spontan.`;
  }
  if (state.goals.length >= 3) return 'Deine ersten Muster entstehen gerade.';
  return 'Plane heute wenige, aber klare Schritte.';
}
function milestones(){
  const d = daysActive();
  return [
    {days:1, icon:'🌱', title:'Baum gepflanzt'}, {days:7, icon:'🐦', title:'Erster Vogel'}, {days:30, icon:'🌸', title:'Erste Blüte'}, {days:100, icon:'🌿', title:'Großer Ast'}, {days:365, icon:'🌲', title:'Ein Jahr Wachstum'}
  ].filter(m=>d>=m.days);
}

function render(){
  document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active', b.dataset.tab === state.tab));
  const app = document.getElementById('app');
  app.innerHTML = ({today: renderToday, goals: renderGoals, finance: renderFinance, journey: renderJourney})[state.tab]();
  bind();
}
function renderHeader(title, sub=''){ return `<div class="top"><div><p class="eyebrow">LifeOS</p><h1 class="title">${title}</h1>${sub?`<p class="subtitle">${sub}</p>`:''}</div></div>`; }
function renderToday(){ const [emoji,stage]=treeStage(); const [course,trend]=courseText(); const goals=todayGoals(); const fg=focusGoal();
  return `${renderHeader('Heute','Dein tägliches Briefing.')}
  <section class="card briefing"><p class="eyebrow">👋 Guten Morgen, Julius</p><h2 style="margin:0 0 8px">${course}</h2><p class="notice">${trend}</p><div class="tree-wrap"><div class="tree small">${emoji}</div><div class="muted">${stage} · Tag ${daysActive()}</div></div></section>
  <section class="metric-grid"><div class="metric"><div class="label">🎯 Fokus heute</div><div class="value">${fg?escapeHtml(fg.title):'Nicht gesetzt'}</div></div><div class="metric"><div class="label">💰 Heute verfügbar</div><div class="value">${fmtEUR(availableToday())}</div></div></section>
  <section class="card"><div class="row"><div><p class="eyebrow">💡 Heute wichtig</p><h3 style="margin:0">${insight()}</h3></div></div></section>
  <section class="card"><p class="eyebrow">👉 Nächster Schritt</p><h2 style="margin:0 0 14px">${nextStep()}</h2><button class="btn" data-tabgo="goals">Zu den Zielen</button></section>
  <section class="card"><div class="row"><div><p class="eyebrow">🎯 Ziele</p><h3 style="margin:0">${completedTodayGoals().length} von ${goals.length} erledigt</h3></div><div class="pill">${Math.round((goals.length?completedTodayGoals().length/goals.length:0)*100)}%</div></div><div class="progress"><div class="bar" style="width:${(goals.length?completedTodayGoals().length/goals.length:0)*100}%"></div></div></section>`;
}
function renderGoals(){ const daily=todayGoals(); const long=state.goals.filter(g=>g.type==='long');
 return `${renderHeader('Ziele','Heute entscheidet, was morgen wächst.')}
 <section class="card"><p class="eyebrow">➕ Neues Ziel</p><div class="form"><input id="goalTitle" class="input" placeholder="z. B. Sport, Lernen, Wohnung" maxlength="40"/><select id="goalArea" class="select">${Object.entries(AREAS).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select><div class="seg"><button class="goal-type active" data-type="daily">Tagesziel</button><button class="goal-type" data-type="long">Langfristig</button></div><button class="btn" id="addGoal">Ziel hinzufügen</button></div></section>
 <h2 class="section-title">🔥 Fokus heute</h2>${focusGoal()?goalItem(focusGoal()):'<div class="empty">Wähle bei einem Tagesziel den Stern, um es als Fokus zu setzen.</div>'}
 <h2 class="section-title">🎯 Heute</h2><div class="stack">${daily.length?daily.map(goalItem).join(''):'<div class="empty">Noch keine Tagesziele. Lege bis zu 5 an.</div>'}</div>
 <h2 class="section-title">📈 Langfristig</h2><div class="stack">${long.length?long.map(goalItem).join(''):'<div class="empty">Langfristige Ziele erscheinen hier.</div>'}</div>`;
}
function goalItem(g){ const done = g.completedDate === todayISO(); return `<div class="goal ${done?'done':''}" data-id="${g.id}"><div class="goal-main"><button class="check toggleGoal">${done?'✓':'○'}</button><div><div class="goal-title">${escapeHtml(g.title)}</div><div class="meta">${AREAS[g.area]||g.area} ${g.isFocus?'· 🔥 Fokus':''}</div></div></div><div class="actions"><button class="icon-btn focusGoal">⭐</button><button class="icon-btn deleteGoal">🗑️</button></div></div>`; }
function renderFinance(){ const ex=todayExpenses().slice().reverse();
 return `${renderHeader('Finanzen','Bewusstsein statt Kontrolle.')}
 <section class="card briefing"><p class="eyebrow">Heute verfügbar</p><h1 class="title">${fmtEUR(availableToday())}</h1><p class="subtitle">Monat: ${fmtEUR(spentMonth())} / ${fmtEUR(state.budget)}</p><div class="progress"><div class="bar" style="width:${Math.min(100,spentMonth()/state.budget*100)}%"></div></div></section>
 <section class="card"><p class="eyebrow">➕ Ausgabe erfassen</p><div class="form"><input id="expenseAmount" class="input" inputmode="decimal" placeholder="Betrag, z. B. 8,50"/><select id="expenseCategory" class="select">${Object.entries(CATEGORIES).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select><div class="seg"><button class="planned active" data-planned="false">Spontan</button><button class="planned" data-planned="true">Geplant</button></div><input id="expenseNote" class="input" placeholder="Notiz optional" maxlength="40"/><button class="btn" id="addExpense">Speichern</button></div></section>
 <section class="card"><p class="eyebrow">Monatsbudget ändern</p><div class="row"><input id="budgetInput" class="input" value="${state.budget}" inputmode="decimal"/><button class="icon-btn" id="saveBudget">✓</button></div></section>
 <h2 class="section-title">Letzte Ausgaben heute</h2><div class="stack">${ex.length?ex.map(expenseItem).join(''):'<div class="empty">Heute noch keine Ausgabe erfasst.</div>'}</div>`;
}
function expenseItem(e){ return `<div class="expense" data-id="${e.id}"><div class="expense-main"><div style="font-size:24px">${(CATEGORIES[e.category]||'💸').split(' ')[0]}</div><div><div class="goal-title">${escapeHtml(e.note || (CATEGORIES[e.category]||e.category).replace(/^\S+\s/,''))}</div><div class="meta">${e.planned?'Geplant':'Spontan'} · ${new Date(e.createdAt).toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})}</div></div></div><div class="row" style="gap:8px"><strong>${fmtEUR(e.amount)}</strong><button class="icon-btn deleteExpense">🗑️</button></div></div>`; }
function renderJourney(){ const [emoji,stage]=treeStage(); const ms=milestones(); const goals=state.goals.length; const spontaneous=state.expenses.length?Math.round(state.expenses.filter(e=>!e.planned).length/state.expenses.length*100):0;
 return `${renderHeader('Reise','Dein Wachstum wird sichtbar.')}
 <section class="card briefing"><div class="tree-wrap"><div class="tree big">${emoji}</div><h2 style="margin:6px 0 0">Dein Lebensbaum</h2><p class="subtitle">${stage} · Tag ${daysActive()}</p></div></section>
 <section class="metric-grid"><div class="metric"><div class="label">🎯 Ziele</div><div class="value">${goals}</div></div><div class="metric"><div class="label">💰 Spontan</div><div class="value">${spontaneous}%</div></div></section>
 <h2 class="section-title">Meilensteine</h2><div class="stack">${ms.length?ms.map(m=>`<div class="milestone"><div><strong>${m.icon} ${m.title}</strong><div class="meta">Tag ${m.days}</div></div></div>`).join(''):'<div class="empty">Deine ersten Meilensteine entstehen bald.</div>'}</div>
 <section class="card"><p class="eyebrow">🧠 Erste Erkenntnis</p><h3 style="margin:0">${insight()}</h3><p class="subtitle">LifeOS bewertet nicht. Es macht sichtbar.</p></section>`;
}
function bind(){
  document.querySelectorAll('[data-tabgo]').forEach(b=>b.onclick=()=>{state.tab=b.dataset.tabgo; render();});
  const addGoal=document.getElementById('addGoal'); if(addGoal) addGoal.onclick=()=>{ const title=document.getElementById('goalTitle').value.trim(); if(!title) return; if(state.goalType==='daily' && todayGoals().length>=5) return alert('Maximal 5 Tagesziele.'); state.goals.push({id:String(Date.now()), title, area:document.getElementById('goalArea').value, type:state.goalType, isFocus:false, createdAt:new Date().toISOString(), completedDate:null}); save(); render(); };
  document.querySelectorAll('.goal-type').forEach(b=>b.onclick=()=>{state.goalType=b.dataset.type; document.querySelectorAll('.goal-type').forEach(x=>x.classList.toggle('active',x===b));});
  document.querySelectorAll('.toggleGoal').forEach(b=>b.onclick=()=>{ const id=b.closest('.goal').dataset.id; const g=state.goals.find(x=>x.id===id); g.completedDate = g.completedDate===todayISO()?null:todayISO(); save(); render(); });
  document.querySelectorAll('.deleteGoal').forEach(b=>b.onclick=()=>{ const id=b.closest('.goal').dataset.id; state.goals=state.goals.filter(x=>x.id!==id); save(); render(); });
  document.querySelectorAll('.focusGoal').forEach(b=>b.onclick=()=>{ const id=b.closest('.goal').dataset.id; const g=state.goals.find(x=>x.id===id); if(g.type!=='daily') return alert('Nur Tagesziele können Fokusziel sein.'); state.goals.forEach(x=>x.isFocus=false); g.isFocus=true; save(); render(); });
  document.querySelectorAll('.planned').forEach(b=>b.onclick=()=>{state.plannedExpense=b.dataset.planned==='true'; document.querySelectorAll('.planned').forEach(x=>x.classList.toggle('active',x===b));});
  const addExpense=document.getElementById('addExpense'); if(addExpense) addExpense.onclick=()=>{ const raw=document.getElementById('expenseAmount').value.replace(',','.'); const amount=Number(raw); if(!amount||amount<=0) return; state.expenses.push({id:String(Date.now()), amount, category:document.getElementById('expenseCategory').value, planned:state.plannedExpense, note:document.getElementById('expenseNote').value.trim(), createdAt:new Date().toISOString()}); save(); render(); };
  document.querySelectorAll('.deleteExpense').forEach(b=>b.onclick=()=>{ const id=b.closest('.expense').dataset.id; state.expenses=state.expenses.filter(x=>x.id!==id); save(); render(); });
  const saveBudget=document.getElementById('saveBudget'); if(saveBudget) saveBudget.onclick=()=>{ const v=Number(document.getElementById('budgetInput').value.replace(',','.')); if(v>0){state.budget=v; save(); render();} };
}
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{ state.tab=b.dataset.tab; render(); });
render();
