// app.js
const STORAGE_KEY = "ahp_policy_state_v1";

const RI = { 1:0, 2:0, 3:0.58, 4:0.90, 5:1.12, 6:1.24, 7:1.32, 8:1.41, 9:1.45, 10:1.49 };

const CRITERIA = [
  {
    id: "feasibility",
    name: "Fattibilità",
    description: "Facilità di implementazione della policy sotto il profilo tecnico, amministrativo, organizzativo ed economico."
  },
  {
    id: "cooperation",
    name: "Cooperazione transfrontaliera",
    description: "Capacità della policy di rafforzare il coordinamento istituzionale, l'armonizzazione degli standard e la governance condivisa tra Italia e Croazia."
  },
  {
    id: "territorialImpact",
    name: "Impatto territoriale",
    description: "Capacità della policy di migliorare la continuità del corridoio ciclabile, l'accessibilità e la qualità dell'esperienza dei cicloturisti, inclusa la capacità di attrarre e soddisfare la domanda turistica internazionale, ed i benefici per operatori e comunità locali."
  }
];

const POLICIES = [
  {
    id: "p1",
    code: "Policy 1",
    name: "Infrastructure Enhancement Policy",
    objective: "Garantire una rete ciclabile continua, sicura e facilmente fruibile lungo tutto il corridoio Adriatico-Ionico.",
    actions: [
      {
        code: "A1.1",
        name: "Completion of Missing Links",
        bullets: ["eliminazione delle interruzioni della rete", "completamento dei tratti mancanti"]
      },
      {
        code: "A1.2",
        name: "Safe Last-Mile Access",
        bullets: ["collegamenti sicuri tra stazioni ferroviarie, porti, centri urbani e ciclovia", "attraversamenti protetti", "percorsi dedicati nei nodi di interscambio"]
      },
      {
        code: "A1.3",
        name: "Uniform Signage",
        bullets: ["standard condiviso per la segnaletica", "continuità della segnaletica lungo il corridoio, incluso il wayfinding continuo nei tratti critici"]
      },
      {
        code: "A1.4",
        name: "Rest Areas and Micro-Infrastructure",
        bullets: ["aree di sosta, fontanelle", "punti di manutenzione", "ricarica e-bike"]
      },
      {
        code: "A1.5",
        name: "Bike-Friendly Stations and Ports",
        bullets: ["parcheggi protetti", "deposito bagagli", "punti informativi"]
      }
    ]
  },
  {
    id: "p2",
    code: "Policy 2",
    name: "Intermodal Mobility Policy",
    objective: "Integrare efficacemente bicicletta, trasporto pubblico e trasporto marittimo.",
    actions: [
      {
        code: "A2.1",
        name: "Bike-Train Enhancement",
        bullets: ["incremento della capacità di trasporto biciclette", "servizi stagionali potenziati", "prenotazione semplice e trasparente"]
      },
      {
        code: "A2.2",
        name: "Bike-Bus Integration",
        bullets: ["trasporto biciclette sugli autobus regionali", "portabici dedicati", "integrazione nei contratti di servizio"]
      },
      {
        code: "A2.3",
        name: "Bike-Boat and Ferry Integration",
        bullets: ["standard comuni per il trasporto biciclette", "armonizzazione delle procedure di imbarco"]
      }
    ]
  },
  {
    id: "p3",
    code: "Policy 3",
    name: "Smart Mobility and Information Policy",
    objective: "Migliorare la gestione e l'utilizzo della rete attraverso strumenti digitali.",
    actions: [
      {
        code: "A3.1",
        name: "Real-Time Route Information",
        bullets: ["deviazioni", "cantieri", "interruzioni"]
      },
      {
        code: "A3.2",
        name: "Data-Driven Monitoring",
        bullets: ["contatori automatici", "raccolta dati omogenea", "dashboard condivise"]
      },
      {
        code: "A3.3",
        name: "Manutenzione predittiva",
        bullets: ["condizioni del percorso"]
      }
    ]
  },
  {
    id: "p4",
    code: "Policy 4",
    name: "Cross-Border Governance Policy",
    objective: "Rafforzare il coordinamento istituzionale e garantire una gestione condivisa del corridoio.",
    actions: [
      {
        code: "A4.1",
        name: "Cross-Border Steering Committee",
        bullets: ["organismo permanente Italia-Croazia", "coordinamento strategico"]
      },
      {
        code: "A4.2",
        name: "Stakeholder Working Groups",
        bullets: ["coinvolgimento permanente di enti pubblici, operatori turistici e associazioni", "formazione per amministrazioni e operatori"]
      },
      {
        code: "A4.3",
        name: "Communication and Promotion",
        bullets: ["branding comune", "campagne congiunte", "partecipazione a fiere internazionali"]
      }
    ]
  }
];

function identityMatrix(n){
  return Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => i === j ? 1 : 1));
}

function actionLabels(policy){
  return policy.actions.map(a => `${a.code} ${a.name}`);
}

function defaultPolicyState(policy){
  return {
    id: policy.id,
    actionMatrices: CRITERIA.map(() => identityMatrix(policy.actions.length)),
    activeActionCritIdx: 0
  };
}

function defaultState(){
  return {
    problem: {
      name: "Italy-Croatia Adriatic-Ionian Cycling Corridor",
      goal: "Prioritize policy actions through an AHP model with shared criteria and separate policy-level analyses."
    },
    criteriaMatrix: identityMatrix(CRITERIA.length),
    policies: POLICIES.map(defaultPolicyState),
    activePolicyIdx: 0
  };
}

function validMatrix(A, n){
  return Array.isArray(A) && A.length === n && A.every(r => Array.isArray(r) && r.length === n);
}

function normalizeState(st){
  const fresh = defaultState();
  if(!st || typeof st !== "object") return fresh;

  if(validMatrix(st.criteriaMatrix, CRITERIA.length)) fresh.criteriaMatrix = st.criteriaMatrix;
  if(typeof st.activePolicyIdx === "number") fresh.activePolicyIdx = Math.max(0, Math.min(POLICIES.length - 1, st.activePolicyIdx));

  if(Array.isArray(st.policies)){
    POLICIES.forEach((policy, pIdx) => {
      const saved = st.policies.find(x => x && x.id === policy.id) || st.policies[pIdx];
      if(!saved) return;
      const nA = policy.actions.length;
      if(Array.isArray(saved.actionMatrices) && saved.actionMatrices.length === CRITERIA.length){
        saved.actionMatrices.forEach((m, cIdx) => {
          if(validMatrix(m, nA)) fresh.policies[pIdx].actionMatrices[cIdx] = m;
        });
      }
      if(typeof saved.activeActionCritIdx === "number"){
        fresh.policies[pIdx].activeActionCritIdx = Math.max(0, Math.min(CRITERIA.length - 1, saved.activeActionCritIdx));
      }
    });
  }
  return fresh;
}

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeState(JSON.parse(raw)) : defaultState();
  }catch{
    return defaultState();
  }
}

function saveState(st){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(st));
}

function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;");
}

function setStatus(st){
  const el = document.getElementById("status");
  if(!el) return;
  const policy = POLICIES[st.activePolicyIdx] || POLICIES[0];
  el.textContent = `${CRITERIA.length} criteri, ${POLICIES.length} policy, policy attiva: ${policy.code}`;
}

function cloneMatrix(A){ return A.map(r => r.slice()); }

function powerIterationWeights(A, maxIter=1500, tol=1e-11){
  const n = A.length;
  let w = Array(n).fill(1/n);

  for(let it=0; it<maxIter; it++){
    const Aw = Array(n).fill(0);
    for(let i=0;i<n;i++){
      let s = 0;
      for(let j=0;j<n;j++) s += A[i][j] * w[j];
      Aw[i] = s;
    }
    const sum = Aw.reduce((a,b)=>a+b,0);
    const wNew = Aw.map(x => x/sum);
    let diff = 0;
    for(let i=0;i<n;i++) diff = Math.max(diff, Math.abs(wNew[i]-w[i]));
    w = wNew;
    if(diff < tol) break;
  }

  const Aw2 = Array(n).fill(0);
  for(let i=0;i<n;i++){
    let s = 0;
    for(let j=0;j<n;j++) s += A[i][j] * w[j];
    Aw2[i] = s;
  }
  const lambdaMax = Aw2.reduce((a,v,i)=> a + (v / w[i]), 0) / n;
  return { weights: w, lambdaMax };
}

function consistency(A, lambdaMax){
  const n = A.length;
  const ci = n <= 2 ? 0 : (lambdaMax - n) / (n - 1);
  const ri = RI[n] ?? 1.49;
  const cr = ri === 0 ? 0 : ci / ri;
  return { ci, cr };
}

function ahpSolve(A){
  const { weights, lambdaMax } = powerIterationWeights(A);
  const { ci, cr } = consistency(A, lambdaMax);
  return { weights, lambdaMax, ci, cr };
}

function crMessage(cr){
  if(cr <= 0.10) return { level: "good", title: "Consistenza buona", text: `CR ${cr.toFixed(3)}.` };
  if(cr <= 0.20) return { level: "mid", title: "Consistenza borderline", text: `CR ${cr.toFixed(3)}.` };
  return { level: "warn", title: "Consistenza bassa", text: `CR ${cr.toFixed(3)}.` };
}

function crBadge(cr){
  const m = crMessage(cr);
  const cls = m.level === "good" ? "badge good" : (m.level === "mid" ? "badge mid" : "badge warn");
  return `<span class="${cls}">${escapeHtml(m.title)} ${escapeHtml(m.text)}</span>`;
}

function clamp(x,a,b){ return Math.max(a, Math.min(b, x)); }
function lerp(a,b,t){ return a + (b - a) * t; }
function mixColor(c1, c2, t){
  return [
    Math.round(lerp(c1[0], c2[0], t)),
    Math.round(lerp(c1[1], c2[1], t)),
    Math.round(lerp(c1[2], c2[2], t)),
  ];
}
function rgb(arr){ return `rgb(${arr[0]},${arr[1]},${arr[2]})`; }

function matrixHeatmap(canvasId, title){
  return `
    <div class="heatWrap">
      <div class="heatTitle">
        <div class="panelTitle" style="margin:0;">${escapeHtml(title)}</div>
        <div class="heatLegend">
          <span>basso</span>
          <span class="heatLegendBar"></span>
          <span>alto</span>
        </div>
      </div>
      <canvas class="heatCanvas" id="${canvasId}" width="900" height="560"></canvas>
    </div>
  `;
}

function drawMatrixHeatmap(canvasId, labels, A){
  const c = document.getElementById(canvasId);
  if(!c) return;
  const ctx = c.getContext("2d");
  const n = labels.length;
  const W = c.width;
  const H = c.height;
  ctx.clearRect(0,0,W,H);

  const pad = 16;
  const top = 62;
  const left = 210;
  const cell = Math.floor(Math.min(W - left - pad, H - top - pad) / n);

  let maxAbs = 0.0;
  for(let i=0;i<n;i++){
    for(let j=0;j<n;j++){
      const v = Number(A[i][j]);
      if(Number.isFinite(v) && v > 0) maxAbs = Math.max(maxAbs, Math.abs(Math.log(v)));
    }
  }
  if(maxAbs === 0) maxAbs = 1;

  const blue = [29, 78, 216];
  const white = [255, 255, 255];
  const red = [220, 38, 38];

  ctx.fillStyle = "rgba(15,23,42,0.88)";
  ctx.font = "12px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for(let j=0;j<n;j++){
    const x = left + j*cell + cell/2;
    ctx.save();
    ctx.translate(x, top - 18);
    ctx.rotate(-0.35);
    ctx.fillText(labels[j], 0, 0);
    ctx.restore();
  }

  ctx.textAlign = "right";
  for(let i=0;i<n;i++){
    const y = top + i*cell + cell/2;
    ctx.fillText(labels[i], left - 10, y);
  }

  ctx.textAlign = "center";
  for(let i=0;i<n;i++){
    for(let j=0;j<n;j++){
      const v = Number(A[i][j]);
      const x = left + j*cell;
      const y = top + i*cell;
      let col = white;
      if(Number.isFinite(v) && v > 0){
        const t = clamp(Math.log(v) / maxAbs, -1, 1);
        if(t < 0) col = mixColor(white, blue, Math.abs(t));
        if(t > 0) col = mixColor(white, red, Math.abs(t));
      }
      ctx.fillStyle = rgb(col);
      ctx.fillRect(x, y, cell, cell);
      ctx.strokeStyle = "rgba(15,23,42,0.10)";
      ctx.strokeRect(x, y, cell, cell);
      ctx.fillStyle = "rgba(15,23,42,0.86)";
      ctx.font = "11px system-ui";
      ctx.fillText(Number.isFinite(v) ? v.toFixed(2) : "", x + cell/2, y + cell/2);
    }
  }
}

function drawBarChart(canvasId, title, items){
  const c = document.getElementById(canvasId);
  if(!c) return;
  const ctx = c.getContext("2d");
  const W = c.width;
  const H = c.height;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle = "rgba(15,23,42,0.92)";
  ctx.font = "18px system-ui";
  ctx.fillText(title, 18, 28);

  const maxV = Math.max(...items.map(x => x.value), 0.00001);
  const left = 18;
  const top = 50;
  const chartW = W - 36;
  const chartH = H - 72;
  const n = items.length;
  const gap = 14;
  const barW = (chartW - gap*(n-1)) / n;

  items.forEach((x, i)=>{
    const h = (x.value / maxV) * (chartH * 0.90);
    const bx = left + i*(barW+gap);
    const by = top + chartH - h;
    ctx.fillStyle = "rgba(37,99,235,0.18)";
    ctx.fillRect(bx, by, barW, h);
    ctx.fillStyle = "rgba(15,23,42,0.76)";
    ctx.font = "12px system-ui";
    ctx.fillText(x.name, bx, top + chartH + 15);
    ctx.fillStyle = "rgba(15,23,42,0.90)";
    ctx.fillText(x.value.toFixed(3), bx, by - 6);
  });
}

function shortLabel(label){
  return label.length > 34 ? label.slice(0, 31) + "..." : label;
}

function pairwiseHTML(items, A){
  const n = items.length;
  let html = "";
  for(let i=0;i<n;i++){
    for(let j=i+1;j<n;j++){
      const left = typeof items[i] === "string" ? { title: items[i], description: "" } : items[i];
      const right = typeof items[j] === "string" ? { title: items[j], description: "" } : items[j];
      const aij = A[i][j];
      let v;
      if(aij >= 1){
        v = Math.round(aij);
        v = Math.max(1, Math.min(9, v));
      }else{
        v = -Math.round(1 / aij);
        v = Math.max(-9, Math.min(-2, v));
      }
      html += `
        <div class="pairRow" data-i="${i}" data-j="${j}">
          <div>
            <div class="pairTitle">${escapeHtml(left.title)}</div>
            ${left.description ? `<div class="pairDesc">${escapeHtml(left.description)}</div>` : ""}
          </div>
          <div class="pairMid">
            <input type="range" class="rng" min="-9" max="9" step="1" value="${v}" />
            <div class="valBox">${v}</div>
            <div class="dirBox"></div>
          </div>
          <div style="text-align:right">
            <div class="pairTitle">${escapeHtml(right.title)}</div>
            ${right.description ? `<div class="pairDesc">${escapeHtml(right.description)}</div>` : ""}
          </div>
        </div>
      `;
    }
  }
  return html;
}

function bindPairwise(rootEl, A, onUpdate){
  rootEl.querySelectorAll(".pairRow").forEach(row=>{
    const i = Number(row.dataset.i);
    const j = Number(row.dataset.j);
    const rng = row.querySelector(".rng");
    const valBox = row.querySelector(".valBox");
    const dirBox = row.querySelector(".dirBox");
    if(!rng || !valBox || !dirBox) return;

    const normalize = (raw)=>{
      let v = Number(raw);
      if(v === 0) v = 1;
      if(v === -1) v = -2;
      if(v < 0) v = Math.max(-9, Math.min(-2, v));
      else v = Math.max(1, Math.min(9, v));
      return v;
    };

    const setDirection = (v)=>{
      if(v === 1) dirBox.textContent = "Equivalenti";
      else if(v > 1) dirBox.textContent = "Destra preferita";
      else dirBox.textContent = "Sinistra preferita";
    };

    const apply = ()=>{
      const v = normalize(rng.value);
      rng.value = String(v);
      valBox.textContent = String(v);
      setDirection(v);
      const B = cloneMatrix(A);
      if(v > 1){
        B[i][j] = v;
        B[j][i] = 1 / v;
      }else if(v === 1){
        B[i][j] = 1;
        B[j][i] = 1;
      }else{
        const s = Math.abs(v);
        B[i][j] = 1 / s;
        B[j][i] = s;
      }
      for(let k=0;k<B.length;k++) B[k][k] = 1;
      onUpdate(B);
    };

    rng.addEventListener("input", ()=>{
      const v = normalize(rng.value);
      rng.value = String(v);
      valBox.textContent = String(v);
      setDirection(v);
    });
    rng.addEventListener("change", apply);
    setDirection(normalize(rng.value));
  });
}

function actionDescription(action){
  return action.bullets.join("; ");
}

function criteriaItems(){
  return CRITERIA.map(c => ({ title: c.name, description: c.description }));
}

function actionItems(policy){
  return policy.actions.map(a => ({ title: `${a.code} ${a.name}`, description: actionDescription(a) }));
}

function renderIntroPage(st){
  const view = document.getElementById("view");
  if(!view) return;
  view.innerHTML = `
    <div class="panelTitle">Modello AHP impostato</div>
    <h2>${escapeHtml(st.problem.name)}</h2>
    <p class="muted">${escapeHtml(st.problem.goal)}</p>

    <div class="divider"></div>
    <div class="panelTitle">Criteri fissi</div>
    <div class="infoGrid">
      ${CRITERIA.map(c => `
        <div class="infoCard">
          <h3>${escapeHtml(c.name)}</h3>
          <p>${escapeHtml(c.description)}</p>
        </div>
      `).join("")}
    </div>

    <div class="divider"></div>
    <div class="panelTitle">Policy e azioni</div>
    ${POLICIES.map(policy => `
      <div class="policyBlock">
        <h3>${escapeHtml(policy.code)}. ${escapeHtml(policy.name)}</h3>
        <p class="muted">${escapeHtml(policy.objective)}</p>
        <ul class="actionList">
          ${policy.actions.map(a => `
            <li>
              <strong>${escapeHtml(a.code)} ${escapeHtml(a.name)}</strong>
              <span>${escapeHtml(actionDescription(a))}</span>
            </li>
          `).join("")}
        </ul>
      </div>
    `).join("")}
  `;
}

function renderCriteriaPage(st){
  const view = document.getElementById("view");
  if(!view) return;
  const solve = ahpSolve(st.criteriaMatrix);
  view.innerHTML = `
    <div class="panelTitle">Step 1, confronto dei criteri</div>
    <p class="muted">Valuta i tre criteri una sola volta. Questi pesi saranno usati per tutte le policy.</p>
    <div class="small muted">${crBadge(solve.cr)}</div>
    <div style="height:10px"></div>
    <div class="matrixLayout">
      <div id="critPairs"></div>
      <div>
        ${matrixHeatmap("hm_crit", "Matrice criteri")}
        <div style="display:flex; gap:10px; margin-top:10px;">
          <button type="button" class="btn inline" id="crit_reset">Reset criteri</button>
        </div>
      </div>
    </div>
  `;

  const critPairsEl = document.getElementById("critPairs");
  critPairsEl.innerHTML = pairwiseHTML(criteriaItems(), st.criteriaMatrix);
  bindPairwise(critPairsEl, st.criteriaMatrix, (B)=>{
    st.criteriaMatrix = B;
    saveState(st);
    renderCriteriaPage(st);
    setStatus(st);
  });

  document.getElementById("crit_reset").addEventListener("click", ()=>{
    st.criteriaMatrix = identityMatrix(CRITERIA.length);
    saveState(st);
    renderCriteriaPage(st);
    setStatus(st);
  });

  setTimeout(()=> drawMatrixHeatmap("hm_crit", CRITERIA.map(c => c.name), st.criteriaMatrix), 0);
}

function renderPolicyTabs(st){
  return `
    <div class="tabs" id="policyTabs">
      ${POLICIES.map((p, i) => `<button type="button" class="tabBtn ${i === st.activePolicyIdx ? "active" : ""}" data-policy="${i}">${escapeHtml(p.code)}</button>`).join("")}
    </div>
  `;
}

function bindPolicyTabs(st){
  document.querySelectorAll("#policyTabs .tabBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      st.activePolicyIdx = Number(btn.dataset.policy);
      saveState(st);
      renderPolicyPage(st);
      setStatus(st);
    });
  });
}

function renderPolicyPage(st){
  const view = document.getElementById("view");
  if(!view) return;
  const pIdx = st.activePolicyIdx;
  const policy = POLICIES[pIdx];
  const pState = st.policies[pIdx];
  const activeCritIdx = pState.activeActionCritIdx || 0;
  const matrix = pState.actionMatrices[activeCritIdx];
  const solve = ahpSolve(matrix);

  view.innerHTML = `
    <div class="panelTitle">Step 2, confronto azioni policy per policy</div>
    ${renderPolicyTabs(st)}
    <h2>${escapeHtml(policy.code)}. ${escapeHtml(policy.name)}</h2>
    <p class="muted">${escapeHtml(policy.objective)}</p>

    <div class="divider"></div>
    <div class="panelTitle">Criterio applicato alle azioni</div>
    <div class="tabs" id="actionCritTabs">
      ${CRITERIA.map((c, i) => `<button type="button" class="tabBtn ${i === activeCritIdx ? "active" : ""}" data-crit="${i}">${escapeHtml(c.name)}</button>`).join("")}
    </div>
    <p class="muted">${escapeHtml(CRITERIA[activeCritIdx].description)}</p>
    <div class="small muted">${crBadge(solve.cr)}</div>
    <div style="height:10px"></div>

    <div class="matrixLayout">
      <div id="actionPairs"></div>
      <div>
        ${matrixHeatmap("hm_actions", `Azioni, ${CRITERIA[activeCritIdx].name}`)}
        <div style="display:flex; gap:10px; margin-top:10px;">
          <button type="button" class="btn inline" id="action_reset">Reset questa matrice</button>
        </div>
      </div>
    </div>
  `;

  bindPolicyTabs(st);
  document.querySelectorAll("#actionCritTabs .tabBtn").forEach(btn => {
    btn.addEventListener("click", () => {
      pState.activeActionCritIdx = Number(btn.dataset.crit);
      saveState(st);
      renderPolicyPage(st);
      setStatus(st);
    });
  });

  const actionPairsEl = document.getElementById("actionPairs");
  actionPairsEl.innerHTML = pairwiseHTML(actionItems(policy), matrix);
  bindPairwise(actionPairsEl, matrix, (B)=>{
    pState.actionMatrices[activeCritIdx] = B;
    saveState(st);
    renderPolicyPage(st);
    setStatus(st);
  });

  document.getElementById("action_reset").addEventListener("click", ()=>{
    pState.actionMatrices[activeCritIdx] = identityMatrix(policy.actions.length);
    saveState(st);
    renderPolicyPage(st);
    setStatus(st);
  });

  setTimeout(()=> drawMatrixHeatmap("hm_actions", actionLabels(policy).map(shortLabel), matrix), 0);
}

function weightsTable(labels, weights){
  return `
    <table>
      <thead><tr><th>Item</th><th>Weight</th></tr></thead>
      <tbody>
        ${labels.map((x,i)=>`<tr><td>${escapeHtml(x)}</td><td>${Number(weights[i]).toFixed(6)}</td></tr>`).join("")}
      </tbody>
    </table>
  `;
}

function rankingTable(items){
  return `
    <table>
      <thead><tr><th>Azione</th><th>Score</th></tr></thead>
      <tbody>${items.map(x=>`<tr><td>${escapeHtml(x.name)}</td><td>${x.score.toFixed(6)}</td></tr>`).join("")}</tbody>
    </table>
  `;
}

function computePolicyResults(st, pIdx){
  const policy = POLICIES[pIdx];
  const pState = st.policies[pIdx];
  const criteria = ahpSolve(st.criteriaMatrix);
  const actionSolves = pState.actionMatrices.map(A => ahpSolve(A));
  const scores = Array(policy.actions.length).fill(0);

  for(let a=0; a<policy.actions.length; a++){
    for(let c=0; c<CRITERIA.length; c++){
      scores[a] += criteria.weights[c] * actionSolves[c].weights[a];
    }
  }

  const ranking = policy.actions
    .map((a, i) => ({ name: `${a.code} ${a.name}`, score: scores[i] }))
    .sort((a,b) => b.score - a.score);

  return { criteria, actionSolves, scores, ranking };
}

function renderResultsPage(st){
  const view = document.getElementById("view");
  if(!view) return;
  const crit = ahpSolve(st.criteriaMatrix);

  view.innerHTML = `
    <div class="panelTitle">Risultati</div>
    <h2>Priorità delle azioni per ciascuna policy</h2>
    <p class="muted">I pesi dei criteri sono comuni. I confronti delle azioni sono separati per policy e per criterio.</p>
    <div class="small muted">Criteri: ${crBadge(crit.cr)}</div>
    <div class="divider"></div>
    <div class="panelTitle">Pesi dei criteri</div>
    ${weightsTable(CRITERIA.map(c => c.name), crit.weights)}
    <div class="divider"></div>
    ${POLICIES.map((policy, pIdx) => {
      const res = computePolicyResults(st, pIdx);
      return `
        <div class="policyResult">
          <h3>${escapeHtml(policy.code)}. ${escapeHtml(policy.name)}</h3>
          <p class="muted">${escapeHtml(policy.objective)}</p>
          <div class="small muted">
            ${CRITERIA.map((c, cIdx) => `${escapeHtml(c.name)}: ${crBadge(res.actionSolves[cIdx].cr)}`).join(" ")}
          </div>
          <div class="row resultRow">
            <div>
              <div class="panelTitle">Ranking azioni</div>
              ${rankingTable(res.ranking)}
            </div>
            <div>
              <canvas class="chart" id="chart_${policy.id}" width="900" height="320"></canvas>
            </div>
          </div>
        </div>
      `;
    }).join("")}
  `;

  setTimeout(()=>{
    POLICIES.forEach((policy, pIdx)=>{
      const res = computePolicyResults(st, pIdx);
      drawBarChart(`chart_${policy.id}`, policy.code, policy.actions.map((a, i) => ({ name: a.code, value: res.scores[i] })));
    });
  }, 0);
}

function wireNavButtons(st){
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  if(prevBtn){
    prevBtn.addEventListener("click", ()=>{
      saveState(st);
      const page = document.body.dataset.page;
      if(page === "criteria") location.href = "index.html";
      if(page === "policies") location.href = "criteria.html";
      if(page === "results") location.href = "policies.html";
    });
  }
  if(nextBtn){
    nextBtn.addEventListener("click", ()=>{
      saveState(st);
      const page = document.body.dataset.page;
      if(page === "intro") location.href = "criteria.html";
      if(page === "criteria") location.href = "policies.html";
      if(page === "policies") location.href = "results.html";
    });
  }
}

function wireCommonButtons(st){
  const reset = document.getElementById("btnReset");
  if(reset){
    reset.addEventListener("click", ()=>{
      const fresh = defaultState();
      saveState(fresh);
      location.href = "criteria.html";
    });
  }
  const exp = document.getElementById("btnExport");
  if(exp){
    exp.addEventListener("click", ()=>{
      const out = {
        problem: st.problem,
        criteria: CRITERIA,
        policies: POLICIES,
        criteriaMatrix: st.criteriaMatrix,
        policyMatrices: st.policies
      };
      const blob = new Blob([JSON.stringify(out, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ahp_policy_state.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
  }
}

function main(){
  const st = loadState();
  wireNavButtons(st);
  wireCommonButtons(st);
  setStatus(st);
  const page = document.body.dataset.page;
  if(page === "intro") renderIntroPage(st);
  if(page === "criteria") renderCriteriaPage(st);
  if(page === "policies") renderPolicyPage(st);
  if(page === "results") renderResultsPage(st);
  saveState(st);
}

if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", main);
else main();
window.addEventListener("pageshow", main);
