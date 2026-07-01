const STORAGE_KEY = "cyros_ahp_decision_support_v1";
const RI = {1:0,2:0,3:0.58,4:0.90,5:1.12,6:1.24,7:1.32,8:1.41,9:1.45,10:1.49};

const BRAND = {
  primary: "#D7A79D",
  primaryDark: "#A15F52",
  row: "#1F6F8B",
  column: "#D68145",
  text: "#10213D"
};

const CRITERIA = [
  {id:"feasibility", name:"Feasibility", description:"Ease of policy implementation from technical, administrative, organisational and economic perspectives."},
  {id:"cooperation", name:"Cross-border Cooperation", description:"Capacity of the policy to strengthen institutional coordination, harmonisation of standards and shared governance between Italy and Croatia."},
  {id:"territorialImpact", name:"Territorial Impact", description:"Capacity of the policy to improve corridor continuity, accessibility and cycling experience, including attractiveness for international cycle tourism and benefits for local communities and tourism operators."}
];

const POLICIES = [
  {
    id:"p1", code:"Policy 1", name:"Infrastructure Enhancement Policy", icon:"bridge",
    objective:"Ensure a continuous, safe and user-friendly cycling network along the Adriatic-Ionian Corridor.",
    actions:[
      {code:"A1.1", name:"Completion of Missing Links", bullets:["Elimination of network discontinuities", "Completion of missing sections"]},
      {code:"A1.2", name:"Safe Last-Mile Access", bullets:["Safe connections between railway stations, ports, urban centres and the cycling corridor", "Protected crossings", "Dedicated routes at intermodal hubs"]},
      {code:"A1.3", name:"Uniform Signage", bullets:["Shared signage standards", "Continuous wayfinding along the corridor, including critical sections"]},
      {code:"A1.4", name:"Bike Support Facilities", bullets:["Rest areas and drinking water fountains", "Maintenance and information points", "E-bike charging stations", "Secure bicycle parking and luggage storage"]}
    ]
  },
  {
    id:"p2", code:"Policy 2", name:"Intermodal Mobility Policy", icon:"intermodal",
    objective:"Enhance the integration of cycling with public transport and maritime transport.",
    actions:[
      {code:"A2.1", name:"Bike-Train Enhancement", bullets:["Increased bicycle carrying capacity", "Enhanced seasonal services", "Simple and transparent booking"]},
      {code:"A2.2", name:"Bike-Bus Integration", bullets:["Bicycle transport on regional buses", "Dedicated bicycle racks", "Integration into public service contracts"]},
      {code:"A2.3", name:"Bike-Boat and Ferry Integration", bullets:["Common standards for bicycle transport", "Harmonised boarding procedures"]}
    ]
  },
  {
    id:"p3", code:"Policy 3", name:"Smart Mobility and Information Policy", icon:"smart",
    objective:"Improve corridor management and user experience through digital tools.",
    actions:[
      {code:"A3.1", name:"Real-Time Route Information", bullets:["Diversions", "Roadworks", "Route interruptions"]},
      {code:"A3.2", name:"Data-Driven Monitoring", bullets:["Automatic counters", "Harmonised data collection", "Shared dashboards"]},
      {code:"A3.3", name:"Predictive Maintenance", bullets:["Route condition monitoring"]}
    ]
  },
  {
    id:"p4", code:"Policy 4", name:"Cross-Border Governance Policy", icon:"governance",
    objective:"Strengthen institutional coordination and ensure shared corridor management.",
    actions:[
      {code:"A4.1", name:"Cross-Border Steering Committee", bullets:["Permanent Italy-Croatia body", "Strategic coordination"]},
      {code:"A4.2", name:"Stakeholder Working Groups", bullets:["Permanent involvement of public authorities, tourism operators and associations", "Training for administrations and operators"]},
      {code:"A4.3", name:"Communication and Promotion", bullets:["Common branding", "Joint campaigns", "Participation in international fairs"]}
    ]
  }
];

function identityMatrix(n){ return Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?1:1)); }
function actionLabels(policy){ return policy.actions.map(a => `${a.code} ${a.name}`); }
function defaultPolicyState(policy){ return {id: policy.id, actionMatrices: CRITERIA.map(()=>identityMatrix(policy.actions.length)), activeActionCritIdx: 0}; }
function defaultState(){ return {problem:{name:"Italy-Croatia Adriatic-Ionian Cycling Corridor", goal:"Prioritise policy actions through the Analytic Hierarchy Process with shared criteria and separate policy-level analyses."}, criteriaMatrix: identityMatrix(CRITERIA.length), policies: POLICIES.map(defaultPolicyState), activePolicyIdx:0, lastSaved:null}; }
function validMatrix(A,n){ return Array.isArray(A) && A.length===n && A.every(r=>Array.isArray(r)&&r.length===n); }
function normalizeState(st){
  const fresh = defaultState();
  if(!st || typeof st !== "object") return fresh;
  if(validMatrix(st.criteriaMatrix, CRITERIA.length)) fresh.criteriaMatrix = st.criteriaMatrix;
  if(typeof st.activePolicyIdx === "number") fresh.activePolicyIdx = Math.max(0, Math.min(POLICIES.length-1, st.activePolicyIdx));
  if(st.lastSaved) fresh.lastSaved = st.lastSaved;
  const savedPolicies = Array.isArray(st.policies) ? st.policies : (Array.isArray(st.policyMatrices) ? st.policyMatrices : []);
  POLICIES.forEach((policy,pIdx)=>{
    const saved = savedPolicies.find(x=>x && x.id===policy.id) || savedPolicies[pIdx];
    if(!saved) return;
    const n = policy.actions.length;
    if(Array.isArray(saved.actionMatrices)){
      saved.actionMatrices.forEach((m,cIdx)=>{ if(cIdx<CRITERIA.length && validMatrix(m,n)) fresh.policies[pIdx].actionMatrices[cIdx]=m; });
    }
    if(typeof saved.activeActionCritIdx === "number") fresh.policies[pIdx].activeActionCritIdx = Math.max(0, Math.min(CRITERIA.length-1, saved.activeActionCritIdx));
  });
  return fresh;
}
function loadState(){ try{ const raw=localStorage.getItem(STORAGE_KEY); return raw ? normalizeState(JSON.parse(raw)) : defaultState(); }catch{ return defaultState(); } }
function saveState(st){ st.lastSaved = new Date().toISOString(); localStorage.setItem(STORAGE_KEY, JSON.stringify(st)); updateLastSaved(st); }
function escapeHtml(s){ return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;"); }
function cloneMatrix(A){ return A.map(r=>r.slice()); }

function powerIterationWeights(A, maxIter=1500, tol=1e-11){
  const n=A.length; let w=Array(n).fill(1/n);
  for(let it=0; it<maxIter; it++){
    const Aw=Array(n).fill(0);
    for(let i=0;i<n;i++) for(let j=0;j<n;j++) Aw[i]+=A[i][j]*w[j];
    const sum=Aw.reduce((a,b)=>a+b,0);
    const wNew=Aw.map(x=>x/sum);
    let diff=0; for(let i=0;i<n;i++) diff=Math.max(diff,Math.abs(wNew[i]-w[i]));
    w=wNew; if(diff<tol) break;
  }
  const Aw2=Array(n).fill(0);
  for(let i=0;i<n;i++) for(let j=0;j<n;j++) Aw2[i]+=A[i][j]*w[j];
  const lambdaMax=Aw2.reduce((a,v,i)=>a+(v/w[i]),0)/n;
  return {weights:w, lambdaMax};
}
function consistency(A, lambdaMax){ const n=A.length; if(n<=2) return {ci:0, cr:0}; const ci=(lambdaMax-n)/(n-1); const ri=RI[n] ?? 1.49; return {ci, cr: ri===0 ? 0 : ci/ri}; }
function ahpSolve(A){ const {weights, lambdaMax}=powerIterationWeights(A); const {ci,cr}=consistency(A,lambdaMax); return {weights, lambdaMax, ci, cr}; }
function crMeta(cr){ if(cr<=0.10) return {cls:"good", title:"Acceptable", text:`CR ${cr.toFixed(3)}`}; if(cr<=0.20) return {cls:"mid", title:"Review suggested", text:`CR ${cr.toFixed(3)}`}; return {cls:"warn", title:"Inconsistent", text:`CR ${cr.toFixed(3)}`}; }
function crBadge(cr){ const m=crMeta(cr); return `<span class="badge ${m.cls}"><strong>${m.title}</strong> ${m.text}</span>`; }
function updateLastSaved(st){ const el=document.getElementById("lastSaved"); if(!el) return; if(!st.lastSaved){ el.textContent="Not saved yet"; return; } const d=new Date(st.lastSaved); el.textContent=`Last saved: ${d.toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})}`; }
function setStatus(st){ const el=document.getElementById("status"); if(el){ const p=POLICIES[st.activePolicyIdx] || POLICIES[0]; el.textContent=`${CRITERIA.length} criteria, ${POLICIES.length} policies, active: ${p.code}`; } updateLastSaved(st); }

function policyIcon(type){
  const common = `fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
  if(type==="bridge") return `<svg viewBox="0 0 64 64" aria-hidden="true"><path ${common} d="M9 43h46M13 43c4-14 12-22 19-22s15 8 19 22M20 43V31m12 12V23m12 20V31"/><circle cx="21" cy="48" r="3" fill="currentColor"/><circle cx="43" cy="48" r="3" fill="currentColor"/></svg>`;
  if(type==="intermodal") return `<svg viewBox="0 0 64 64" aria-hidden="true"><path ${common} d="M15 16h34a4 4 0 0 1 4 4v18a4 4 0 0 1-4 4H15a4 4 0 0 1-4-4V20a4 4 0 0 1 4-4Zm4 26-5 8m31-8 5 8M18 24h28M18 33h12m8 0h8"/><circle cx="22" cy="42" r="3" fill="currentColor"/><circle cx="42" cy="42" r="3" fill="currentColor"/></svg>`;
  if(type==="smart") return `<svg viewBox="0 0 64 64" aria-hidden="true"><path ${common} d="M22 12h20a4 4 0 0 1 4 4v32a4 4 0 0 1-4 4H22a4 4 0 0 1-4-4V16a4 4 0 0 1 4-4Zm6 34h8M25 21h14m-14 8h14m-14 8h8"/><path ${common} d="M48 22c4 1 7 4 8 8m-8 10c4-1 7-4 8-8"/></svg>`;
  return `<svg viewBox="0 0 64 64" aria-hidden="true"><path ${common} d="M32 10 12 22l20 12 20-12L32 10Zm-14 20v14c4 5 9 8 14 8s10-3 14-8V30M22 28v11m10-6v13m10-18v11"/></svg>`;
}

function renderCriteriaCards(){
  return `<div class="criteriaGrid">${CRITERIA.map(c=>`<article class="criterionCard"><h3>${escapeHtml(c.name)}</h3><p>${escapeHtml(c.description)}</p></article>`).join("")}</div>`;
}
function saatyScaleTable(){
  return `<table class="scaleTable"><thead><tr><th>Value</th><th>Meaning</th></tr></thead><tbody><tr><td>1</td><td>Equal importance</td></tr><tr><td>3</td><td>Moderate importance</td></tr><tr><td>5</td><td>Strong importance</td></tr><tr><td>7</td><td>Very strong importance</td></tr><tr><td>9</td><td>Extreme importance</td></tr></tbody></table>`;
}
function matrixStarted(A){
  if(!Array.isArray(A)) return false;
  for(let i=0;i<A.length;i++){
    for(let j=0;j<A[i].length;j++){
      if(i !== j && Math.abs(Number(A[i][j]) - 1) > 1e-9) return true;
    }
  }
  return false;
}
function completionItems(st){
  const items = [{ key:"criteria", label:"Criteria", detail:"Shared criteria", done: matrixStarted(st.criteriaMatrix) }];
  POLICIES.forEach((p, pIdx)=>{
    CRITERIA.forEach((c, cIdx)=>{
      items.push({
        key:`p${pIdx}_c${cIdx}`,
        label:`${p.code.replace("Policy ", "P")} · ${c.name.replace("Cross-border Cooperation", "Cooperation").replace("Territorial Impact", "Territorial")}`,
        detail:`${p.name} · ${c.name}`,
        done: matrixStarted(st.policies[pIdx].actionMatrices[cIdx])
      });
    });
  });
  return items;
}
function progressBlock(st, activeKey){
  const items = completionItems(st);
  const doneCount = items.filter(x=>x.done).length;
  const pct = Math.round((doneCount / items.length) * 100);
  return `<section class="assessmentProgress" aria-label="Assessment progress">
    <div class="progressTop"><div><strong>Assessment progress</strong><span>${doneCount} of ${items.length} sections completed</span></div><strong>${pct}%</strong></div>
    <div class="progressTrack"><div style="width:${pct}%"></div></div>
    <div class="progressMap">${items.map((item, i)=>{
      const cls = item.key === activeKey ? "active" : (item.done ? "done" : "todo");
      const symbol = item.done ? "✓" : (i + 1);
      return `<div class="progressItem ${cls}" title="${escapeHtml(item.detail)}"><span>${symbol}</span>${escapeHtml(item.label)}</div>`;
    }).join("")}</div>
  </section>`;
}

function showPoliciesTutorialOnce(){
  if(document.body.dataset.page !== "policies") return;
  if(document.querySelector(".tutorialOverlay")) return;
  if(sessionStorage.getItem("cyrosPoliciesTutorialSeen_v2") === "true") return;
  const modal = document.createElement("div");
  modal.className = "tutorialOverlay";
  modal.innerHTML = `<div class="tutorialModal" role="dialog" aria-modal="true" aria-labelledby="tutorialTitle">
    <div class="tutorialIcon">i</div>
    <h2 id="tutorialTitle">Welcome to the Policy Assessment</h2>
    <p>Each policy is evaluated separately under the three shared evaluation criteria: <strong>Feasibility</strong>, <strong>Cross-border Cooperation</strong> and <strong>Territorial Impact</strong>.</p>
    <p>For each criterion, compare the policy actions in pairs using the slider.</p>
    <div class="tutorialSliderGuide">
      <div><strong>Left</strong><span>Choose this side if the left action is preferred.</span></div>
      <div><strong>Centre</strong><span>Use the centre for equal importance.</span></div>
      <div><strong>Right</strong><span>Choose this side if the right action is preferred.</span></div>
    </div>
    <p>Complete all pairwise comparisons for the current criterion. Then continue with the next criterion. After completing all three criteria, proceed to the next policy.</p>
    <button type="button" class="btn primary" id="tutorialStartBtn">Start assessment</button>
  </div>`;
  document.body.appendChild(modal);
  const close = ()=>{ sessionStorage.setItem("cyrosPoliciesTutorialSeen_v2", "true"); modal.remove(); };
  modal.querySelector("#tutorialStartBtn").addEventListener("click", close);
  modal.addEventListener("click", e=>{ if(e.target === modal) close(); });
  document.addEventListener("keydown", function escHandler(e){ if(e.key === "Escape"){ close(); document.removeEventListener("keydown", escHandler); } });
}

function pairwiseHTML(labels, descriptions, A){
  let html="";
  for(let i=0;i<labels.length;i++){
    for(let j=i+1;j<labels.length;j++){
      const aij=A[i][j];
      let v = aij>=1 ? -Math.round(aij) : Math.round(1/aij);
      if(Math.abs(v) === 1) v = 1;
      if(v===0) v=1; if(v===-1) v=-2; v=Math.max(-9,Math.min(9,v));
      const left=descriptions?.[i] || ""; const right=descriptions?.[j] || "";
      html += `<div class="comparisonCard pairRow" data-i="${i}" data-j="${j}">
        <div class="compareItem"><div class="compareLabel">${escapeHtml(labels[i])}</div>${left}</div>
        <div class="pairMid"><div class="scaleLabels"><span>Left preferred</span><span>Equal</span><span>Right preferred</span></div><input type="range" class="rng" min="-9" max="9" step="1" value="${v}"><div class="pairReadout"><span class="valBox">${v}</span><span class="dirBox"></span></div></div>
        <div class="compareItem right"><div class="compareLabel">${escapeHtml(labels[j])}</div>${right}</div>
      </div>`;
    }
  }
  return html;
}
function bindPairwise(rootEl, A, onUpdate){
  rootEl.querySelectorAll(".pairRow").forEach(row=>{
    const i=Number(row.dataset.i), j=Number(row.dataset.j), rng=row.querySelector(".rng"), valBox=row.querySelector(".valBox"), dirBox=row.querySelector(".dirBox");
    const normalize=raw=>{ let v=Number(raw); if(v===0) v=1; if(v===-1) v=-2; return v<0?Math.max(-9,Math.min(-2,v)):Math.max(1,Math.min(9,v)); };
    const setDirection=v=>{ dirBox.textContent = v===1 ? "Equal importance" : (v>1 ? "Right item preferred" : "Left item preferred"); valBox.textContent = v===1 ? "1" : String(Math.abs(v)); };
    const apply=()=>{ const v=normalize(rng.value); rng.value=String(v); setDirection(v); const B=cloneMatrix(A); if(v>1){const s=Math.abs(v); B[i][j]=1/s; B[j][i]=s;} else if(v===1){B[i][j]=1; B[j][i]=1;} else {const s=Math.abs(v); B[i][j]=s; B[j][i]=1/s;} for(let k=0;k<B.length;k++) B[k][k]=1; onUpdate(B); };
    rng.addEventListener("input",()=>{ const v=normalize(rng.value); rng.value=String(v); setDirection(v); });
    rng.addEventListener("change",apply); setDirection(normalize(rng.value));
  });
}

function hexToRgb(hex){ const h=hex.replace("#",""); return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]; }
function mixHex(a,b,t){ const A=hexToRgb(a),B=hexToRgb(b); const C=A.map((x,i)=>Math.round(x+(B[i]-x)*t)); return `rgb(${C[0]},${C[1]},${C[2]})`; }
function colorForValue(v){
  if(!Number.isFinite(v) || v<=0) return "#fff";
  if(v===1) return "#ffffff";
  const strength = Math.min(1, Math.abs(Math.log(v)) / Math.log(9));
  const base = v>1 ? BRAND.row : BRAND.column;
  return mixHex("#ffffff", base, 0.16 + strength*0.70);
}
function svgTextLines(text, maxChars=18, maxLines=3){
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines=[]; let cur="";
  words.forEach(w=>{ const next = cur ? `${cur} ${w}` : w; if(next.length > maxChars && cur){ lines.push(cur); cur=w; } else cur=next; });
  if(cur) lines.push(cur);
  if(lines.length > maxLines){ const kept = lines.slice(0, maxLines); kept[maxLines-1] = kept[maxLines-1].replace(/\.*$/,'') + "…"; return kept; }
  return lines;
}
function svgMultiText(lines, x, y, opts={}){
  const anchor = opts.anchor || "middle", size = opts.size || 10, weight = opts.weight || 700, fill = opts.fill || BRAND.text, dy = opts.dy || 12;
  const start = y - ((lines.length - 1) * dy / 2);
  return `<text x="${x}" y="${start}" text-anchor="${anchor}" font-size="${size}" font-weight="${weight}" fill="${fill}">${lines.map((line,i)=>`<tspan x="${x}" dy="${i===0?0:dy}">${escapeHtml(line)}</tspan>`).join("")}</text>`;
}
function matrixSVG(containerId, labels, A, title){
  const el=document.getElementById(containerId); if(!el) return;
  const short = labels.map(x=>x.replace(/^A\d\.\d\s*/,""));
  const n=labels.length;
  const cell = n <= 3 ? 66 : (n === 4 ? 58 : 52);
  const left = n <= 3 ? 190 : 210;
  const top = n <= 3 ? 100 : 116;
  const pad = 28;
  const W=left + n*cell + pad;
  const H=top + n*cell + 74;
  let cells="";
  for(let i=0;i<n;i++) for(let j=0;j<n;j++){
    const v=Number(A[i][j]), x=left+j*cell, y=top+i*cell, fill=colorForValue(v), txt= v>=1 ? v.toFixed(v===1?0:2) : v.toFixed(2);
    cells += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="9" fill="${fill}" stroke="rgba(36,50,74,.18)"/>`;
    cells += `<text x="${x+cell/2}" y="${y+cell/2+5}" text-anchor="middle" font-size="${n>=5?11:13}" font-weight="850" fill="#10213D">${txt}</text>`;
  }
  const rowLabels = short.map((l,i)=>svgMultiText(svgTextLines(l, 22, 3), left-14, top+i*cell+cell/2, {anchor:"end", size:n>=5?9:10, weight:850, fill:"#10213D", dy:11})).join("");
  const colLabels = short.map((l,j)=>{ const x=left+j*cell+cell/2, y=top-28; return `<g transform="translate(${x},${y}) rotate(-22)">${svgMultiText(svgTextLines(l, 15, 3), 0, 0, {anchor:"start", size:n>=5?8.5:9.5, weight:850, fill:"#10213D", dy:10})}</g>`; }).join("");
  el.innerHTML = `<div class="heatWrap"><div class="heatTitle"><div><h3>${escapeHtml(title)}</h3><p>Pairwise comparison matrix</p></div></div><div class="matrixScroll"><svg class="heatSvg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${escapeHtml(title)}">
    <text x="20" y="26" font-size="15" font-weight="850" fill="#10213D">${escapeHtml(title)}</text>
                ${colLabels}${rowLabels}${cells}
</svg></div></div>`;
}

function computePolicyResults(st, pIdx){
  const policy=POLICIES[pIdx], pst=st.policies[pIdx], crit=ahpSolve(st.criteriaMatrix), altSolves=pst.actionMatrices.map(A=>ahpSolve(A));
  const scores=Array(policy.actions.length).fill(0);
  for(let i=0;i<scores.length;i++) for(let c=0;c<CRITERIA.length;c++) scores[i]+=crit.weights[c]*altSolves[c].weights[i];
  const ranking=policy.actions.map((a,i)=>({code:a.code, name:a.name, score:scores[i], bullets:a.bullets})).sort((a,b)=>b.score-a.score);
  return {policy, criteriaWeights:crit.weights, criteriaCR:crit.cr, altSolves, scores, ranking};
}
function priorityBars(items){
  const max=Math.max(...items.map(x=>x.score),0.00001);
  return `<div class="rankBars">${items.map((x,i)=>`<div class="rankBarRow"><div class="rankLabel"><span class="rankNum ${i===0?'winner':''}">${i+1}</span><span>${escapeHtml(`${x.code ? x.code + " " : ""}${x.name}`)}</span></div><div class="barTrack"><div class="barFill ${i===0?'top':''}" style="width:${(x.score/max*100).toFixed(2)}%"></div></div><div class="barValue">${(x.score*100).toFixed(1)}%</div></div>`).join("")}</div>`;
}
function rankingTable(items){ return `<table class="rankingTable"><thead><tr><th>Rank</th><th>Action</th><th>Priority</th></tr></thead><tbody>${items.map((x,i)=>`<tr class="${i===0?'winnerRow':''}"><td>${i+1}${i===0?' <span class="miniBadge">Highest priority</span>':''}</td><td>${escapeHtml(x.code)} ${escapeHtml(x.name)}</td><td>${(x.score*100).toFixed(1)}%</td></tr>`).join("")}</tbody></table>`; }
function criteriaWeightsTable(weights){ return `<table><thead><tr><th>Criterion</th><th>Weight</th></tr></thead><tbody>${CRITERIA.map((c,i)=>`<tr><td>${escapeHtml(c.name)}</td><td>${(weights[i]*100).toFixed(1)}%</td></tr>`).join("")}</tbody></table>`; }
function allPolicyResults(st){ return POLICIES.map((_,i)=>computePolicyResults(st,i)); }
function reportSummaryHTML(st){ return ""; }
function exportReportJSON(st){
  const crit=ahpSolve(st.criteriaMatrix);
  const out={
    title:"CYROS AHP Decision Support Tool",
    purpose:"Input for D.3.2.1 Policy recommendations to local and regional policies",
    criteria:CRITERIA.map((c,i)=>({...c, weight:crit.weights[i]})),
    criteriaConsistencyRatio:crit.cr,
    policies:allPolicyResults(st).map(r=>({
      code:r.policy.code,
      name:r.policy.name,
      objective:r.policy.objective,
      ranking:r.ranking.map((x,i)=>({rank:i+1, code:x.code, name:x.name, priority:x.score, bullets:x.bullets}))
    }))
  };
  const blob=new Blob([JSON.stringify(out,null,2)],{type:"application/json"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download="cyros_ahp_deliverable_results.json"; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

function renderOverviewPage(st){
  const view=document.getElementById("view"); if(!view) return;
  view.innerHTML=`${progressBlock(st, "overview")}<section class="heroCard"><p class="eyebrow">Version 1.0</p><h2>CYROS AHP Decision Support Tool</h2><p>A web-based decision support system for prioritising cross-border cycling policy actions along the Italy-Croatia Adriatic-Ionian Corridor.</p><div class="heroActions"><a class="btn primary" href="criteria.html">Start assessment</a></div></section>
  <div class="divider"></div><section class="methodCard"><div><div class="panelTitle">Evaluation instructions</div><h3>Analytic Hierarchy Process</h3><p>Each comparison expresses the relative importance of one element over another using Saaty's 1 to 9 scale. Criteria are assessed first. The evaluation then proceeds policy by policy, comparing actions under each criterion.</p></div>${saatyScaleTable()}</section>
  <div class="divider"></div><div class="panelTitle">Shared criteria</div>${renderCriteriaCards()}
  <div class="divider"></div><div class="panelTitle">Policy areas</div><div class="policyGrid">${POLICIES.map(p=>`<article class="policyCard"><div class="policyIcon">${policyIcon(p.icon)}</div><div><span>${p.code}</span><h3>${escapeHtml(p.name)}</h3><p>${escapeHtml(p.objective)}</p></div></article>`).join("")}</div>`;
}
function renderCriteriaPage(st){
  const view=document.getElementById("view"); if(!view) return; const solve=ahpSolve(st.criteriaMatrix);
  const desc=CRITERIA.map(c=>`<p>${escapeHtml(c.description)}</p>`);
  view.innerHTML=`${progressBlock(st, "criteria")}<div class="sectionHead"><div><div class="panelTitle">Step 1</div><h2>Compare the shared criteria</h2><p>The resulting criteria weights will be used across all four policy areas.</p></div>${crBadge(solve.cr)}</div>${renderCriteriaCards()}<div class="divider"></div><div id="critPairs"></div><div class="divider"></div><div id="critMatrix"></div><div class="divider"></div><div class="panelTitle">Criteria weights</div>${criteriaWeightsTable(solve.weights)}`;
  const pairs=document.getElementById("critPairs"); pairs.innerHTML=pairwiseHTML(CRITERIA.map(c=>c.name), desc, st.criteriaMatrix);
  bindPairwise(pairs, st.criteriaMatrix, B=>{ st.criteriaMatrix=B; saveState(st); renderCriteriaPage(st); setStatus(st); });
  matrixSVG("critMatrix", CRITERIA.map(c=>c.name), st.criteriaMatrix, "Criteria comparison matrix");
}
function renderPoliciesPage(st){
  const view=document.getElementById("view"); if(!view) return; const pIdx=st.activePolicyIdx, policy=POLICIES[pIdx], pst=st.policies[pIdx], cIdx=pst.activeActionCritIdx, crit=CRITERIA[cIdx], mat=pst.actionMatrices[cIdx], solve=ahpSolve(mat);
  const actionDesc=policy.actions.map(a=>`<ul>${a.bullets.map(b=>`<li>${escapeHtml(b)}</li>`).join("")}</ul>`);
  view.innerHTML=`${progressBlock(st, `p${pIdx}_c${cIdx}`)}<div class="sectionHead"><div><div class="panelTitle">Step 2</div><h2>Compare actions by policy area</h2><p>Each policy is assessed separately. Select a policy and compare its actions under each criterion.</p></div>${crBadge(solve.cr)}</div>
    <div class="tabs">${POLICIES.map((p,i)=>`<button class="tabBtn ${i===pIdx?'active':''}" data-policy="${i}">${p.code}</button>`).join("")}</div>
    <article class="policyHero"><div class="policyIcon large">${policyIcon(policy.icon)}</div><div><span>${policy.code}</span><h2>${escapeHtml(policy.name)}</h2><p>${escapeHtml(policy.objective)}</p></div></article>
    <div class="tabs critTabs">${CRITERIA.map((c,i)=>`<button class="tabBtn ${i===cIdx?'active':''}" data-criterion="${i}">${escapeHtml(c.name)}</button>`).join("")}</div>
    <div class="criterionFocus"><strong>${escapeHtml(crit.name)}</strong><p>${escapeHtml(crit.description)}</p></div>
    <div id="actionPairs"></div><div class="divider"></div><div id="actionMatrix"></div>`;
  view.querySelectorAll("[data-policy]").forEach(b=>b.addEventListener("click",()=>{ st.activePolicyIdx=Number(b.dataset.policy); saveState(st); renderPoliciesPage(st); setStatus(st); }));
  view.querySelectorAll("[data-criterion]").forEach(b=>b.addEventListener("click",()=>{ pst.activeActionCritIdx=Number(b.dataset.criterion); saveState(st); renderPoliciesPage(st); setStatus(st); }));
  const pairs=document.getElementById("actionPairs"); pairs.innerHTML=pairwiseHTML(actionLabels(policy), actionDesc, mat);
  bindPairwise(pairs, mat, B=>{ pst.actionMatrices[cIdx]=B; saveState(st); renderPoliciesPage(st); setStatus(st); });
  matrixSVG("actionMatrix", actionLabels(policy), mat, `${policy.code}, ${crit.name}`);
  setTimeout(showPoliciesTutorialOnce, 0);
}
function renderResultsPage(st){
  const view=document.getElementById("view"); if(!view) return; const crit=ahpSolve(st.criteriaMatrix);
  view.innerHTML=`${progressBlock(st, "results")}<div class="sectionHead"><div><div class="panelTitle">Step 3</div><h2>Results</h2><p>Final action priorities are calculated separately for each policy area and are formatted for publication in the D.3.2.1 deliverable.</p></div>${crBadge(crit.cr)}</div><div class="resultGrid"><section class="resultCard"><h3>Criteria weights</h3>${priorityBars(CRITERIA.map((c,i)=>({code:"", name:c.name, score:crit.weights[i]})))}${criteriaWeightsTable(crit.weights)}</section></div>${POLICIES.map((p,i)=>{ const r=computePolicyResults(st,i); return `<section class="resultCard policyResult"><div class="resultHead"><div class="policyIcon">${policyIcon(p.icon)}</div><div><span>${p.code}</span><h3>${escapeHtml(p.name)}</h3><p>Action priority ranking</p></div></div>${priorityBars(r.ranking)}${rankingTable(r.ranking)}</section>`; }).join("")}`;
  const print=document.getElementById("btnPrintReport"); if(print) print.addEventListener("click",()=>window.print());
}

function wireCommon(st){
  const reset=document.getElementById("btnReset"); if(reset) reset.addEventListener("click",()=>{ localStorage.removeItem(STORAGE_KEY); location.href="index.html"; });
  const exp=document.getElementById("btnExport"); if(exp) exp.addEventListener("click",()=>{ const out={problem:st.problem, criteria:CRITERIA, policies:POLICIES, criteriaMatrix:st.criteriaMatrix, policyMatrices:st.policies}; const blob=new Blob([JSON.stringify(out,null,2)],{type:"application/json"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download="cyros_ahp_state.json"; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); });
}
function main(){ const st=loadState(); wireCommon(st); setStatus(st); const page=document.body.dataset.page; if(page==="overview") renderOverviewPage(st); if(page==="criteria") renderCriteriaPage(st); if(page==="policies") renderPoliciesPage(st); if(page==="results") renderResultsPage(st); if(page==="policies") setTimeout(showPoliciesTutorialOnce, 350); saveState(st); }
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", main); else main();
window.addEventListener("pageshow", main);
