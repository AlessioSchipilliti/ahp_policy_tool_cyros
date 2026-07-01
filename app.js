const RI = {1:0,2:0,3:0.58,4:0.90,5:1.12,6:1.24,7:1.32,8:1.41,9:1.45,10:1.49};

const CONFIG = {
  problem: {
    name: "Italy-Croatia Adriatic-Ionian Cycling Corridor",
    goal: "Prioritise policy actions through a transparent AHP-based decision support framework."
  },
  criteria: [
    { id:"feasibility", name:"Feasibility", description:"Ease of policy implementation from technical, administrative, organisational and economic perspectives." },
    { id:"cooperation", name:"Cross-border Cooperation", description:"Capacity to strengthen institutional coordination, harmonisation of standards and shared governance between Italy and Croatia." },
    { id:"territorialImpact", name:"Territorial Impact", description:"Capacity to improve corridor continuity, accessibility and the cycling experience, including attractiveness for international cycle tourism and benefits for local communities and operators." }
  ],
  policies: [
    { id:"p1", code:"Policy 1", icon:"bridge", name:"Infrastructure Enhancement Policy", objective:"Ensure a continuous, safe and user-friendly cycling network along the Adriatic-Ionian Corridor.", actions:[
      { code:"A1.1", name:"Completion of Missing Links", bullets:["Elimination of network discontinuities", "Completion of missing sections"] },
      { code:"A1.2", name:"Safe Last-Mile Access", bullets:["Safe connections between railway stations, ports, urban centres and the cycling corridor", "Protected crossings", "Dedicated routes at intermodal hubs"] },
      { code:"A1.3", name:"Uniform Signage", bullets:["Shared signage standards", "Continuous wayfinding along the corridor, including critical sections"] },
      { code:"A1.4", name:"Bike Support Facilities", bullets:["Rest areas and drinking water fountains", "Maintenance and information points", "E-bike charging", "Secure bicycle parking and luggage storage"] }
    ]},
    { id:"p2", code:"Policy 2", icon:"train", name:"Intermodal Mobility Policy", objective:"Enhance the integration of cycling with public and maritime transport.", actions:[
      { code:"A2.1", name:"Bike-Train Enhancement", bullets:["Increased bicycle carriage capacity", "Enhanced seasonal services", "Simple and transparent booking"] },
      { code:"A2.2", name:"Bike-Bus Integration", bullets:["Bicycle transport on regional buses", "Dedicated bike racks", "Integration into public service contracts"] },
      { code:"A2.3", name:"Bike-Boat and Ferry Integration", bullets:["Common standards for bicycle carriage", "Harmonised boarding procedures"] }
    ]},
    { id:"p3", code:"Policy 3", icon:"data", name:"Smart Mobility and Information Policy", objective:"Improve corridor management and user experience through digital tools.", actions:[
      { code:"A3.1", name:"Real-Time Route Information", bullets:["Detours", "Roadworks", "Temporary interruptions"] },
      { code:"A3.2", name:"Data-Driven Monitoring", bullets:["Automatic counters", "Harmonised data collection", "Shared dashboards"] },
      { code:"A3.3", name:"Predictive Maintenance", bullets:["Route condition monitoring"] }
    ]},
    { id:"p4", code:"Policy 4", icon:"network", name:"Cross-Border Governance Policy", objective:"Strengthen institutional coordination and ensure shared management of the corridor.", actions:[
      { code:"A4.1", name:"Cross-Border Steering Committee", bullets:["Permanent Italy-Croatia body", "Strategic coordination"] },
      { code:"A4.2", name:"Stakeholder Working Groups", bullets:["Permanent involvement of public bodies, tourism operators and associations", "Training for administrations and operators"] },
      { code:"A4.3", name:"Communication and Promotion", bullets:["Common branding", "Joint campaigns", "Participation in international fairs"] }
    ]}
  ]
};

function identityMatrix(n){ return Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?1:1)); }
function makeState(){
  return {
    criteriaMatrix: identityMatrix(CONFIG.criteria.length),
    activePolicy: 0,
    activeActionCriterion: 0,
    policyMatrices: CONFIG.policies.map(p => ({ id:p.id, actionMatrices: CONFIG.criteria.map(()=>identityMatrix(p.actions.length)) }))
  };
}
let state = makeState();

function escapeHtml(s){ return String(s).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;"); }
function cloneMatrix(A){ return A.map(r=>r.slice()); }

function setPairwise(A,i,j,sliderValue){
  const B = cloneMatrix(A);
  if(sliderValue === 1){ B[i][j]=1; B[j][i]=1; }
  else if(sliderValue > 1){ B[i][j]=sliderValue; B[j][i]=1/sliderValue; }
  else { const s = Math.abs(sliderValue); B[i][j]=1/s; B[j][i]=s; }
  for(let k=0;k<B.length;k++) B[k][k]=1;
  return B;
}

function powerIterationWeights(A, maxIter=1200, tol=1e-11){
  const n=A.length;
  let w=Array(n).fill(1/n);
  for(let it=0;it<maxIter;it++){
    const Aw=Array(n).fill(0);
    for(let i=0;i<n;i++) for(let j=0;j<n;j++) Aw[i]+=A[i][j]*w[j];
    const sum=Aw.reduce((a,b)=>a+b,0) || 1;
    const w2=Aw.map(x=>x/sum);
    let diff=0;
    for(let i=0;i<n;i++) diff=Math.max(diff, Math.abs(w2[i]-w[i]));
    w=w2;
    if(diff<tol) break;
  }
  const Aw=Array(n).fill(0);
  for(let i=0;i<n;i++) for(let j=0;j<n;j++) Aw[i]+=A[i][j]*w[j];
  const lambdaMax=Aw.reduce((a,v,i)=>a+(v/(w[i]||1)),0)/n;
  return {weights:w, lambdaMax};
}
function ahpSolve(A){
  const {weights, lambdaMax}=powerIterationWeights(A);
  const n=A.length;
  const ci=n<=2 ? 0 : (lambdaMax-n)/(n-1);
  const ri=RI[n] ?? 1.49;
  const cr=ri===0 ? 0 : ci/ri;
  return {weights, lambdaMax, ci, cr};
}
function crLabel(cr){
  if(cr <= 0.10) return { cls:"good", text:`Acceptable CR ${cr.toFixed(3)}` };
  if(cr <= 0.20) return { cls:"mid", text:`Review suggested CR ${cr.toFixed(3)}` };
  return { cls:"bad", text:`Inconsistent CR ${cr.toFixed(3)}` };
}

function iconSvg(name){
  const common = `fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"`;
  const icons = {
    bridge:`<svg viewBox="0 0 48 48" aria-hidden="true"><path ${common} d="M6 34h36M10 34V18m28 16V18M12 20c8-10 16-10 24 0M16 28h16M20 18v16m8-16v16"/></svg>`,
    train:`<svg viewBox="0 0 48 48" aria-hidden="true"><path ${common} d="M15 6h18a5 5 0 0 1 5 5v20a7 7 0 0 1-7 7H17a7 7 0 0 1-7-7V11a5 5 0 0 1 5-5Zm-1 14h20M16 38l-4 5m20-5 4 5M17 30h.1M31 30h.1"/></svg>`,
    data:`<svg viewBox="0 0 48 48" aria-hidden="true"><path ${common} d="M10 34c14-1 24-10 30-25M12 18c13 0 22 7 24 20M11 34c0-10 7-17 17-17m-8 20c-4-9-2-17 5-24"/></svg>`,
    network:`<svg viewBox="0 0 48 48" aria-hidden="true"><circle ${common} cx="24" cy="10" r="5"/><circle ${common} cx="10" cy="34" r="5"/><circle ${common} cx="38" cy="34" r="5"/><circle ${common} cx="24" cy="34" r="5"/><path ${common} d="M22 15 12 29m14-14 10 14M15 34h4m10 0h4"/></svg>`
  };
  return icons[name] || icons.network;
}

function route(){ return (location.hash || "#overview").replace("#",""); }
function setRoute(r){ location.hash = r; render(); }
function updateNav(){ document.querySelectorAll("[data-route]").forEach(el=>el.classList.toggle("active", el.dataset.route===route())); }

function card(title, body){ return `<section class="card"><h2>${title}</h2>${body}</section>`; }

function renderOverview(){
  app.innerHTML = `
    ${card("Decision support framework", `
      <p>This web application supports the prioritisation of policy actions for the Italy-Croatia Adriatic-Ionian Cycling Corridor through the Analytic Hierarchy Process.</p>
      <div class="methodGrid">
        <div><strong>1. Criteria weighting</strong><span>Compare the three common evaluation criteria.</span></div>
        <div><strong>2. Policy assessment</strong><span>Compare actions within each policy area under each criterion.</span></div>
        <div><strong>3. Results dashboard</strong><span>Review rankings, consistency ratios and report-ready outputs.</span></div>
      </div>
    `)}
    ${card("Saaty's scale", `
      <div class="scaleGrid">
        <div><b>1</b><span>Equal importance</span></div>
        <div><b>3</b><span>Moderate importance</span></div>
        <div><b>5</b><span>Strong importance</span></div>
        <div><b>7</b><span>Very strong importance</span></div>
        <div><b>9</b><span>Extreme importance</span></div>
      </div>
    `)}
    ${card("Evaluation criteria", `<div class="criteriaCards">${CONFIG.criteria.map(c=>`<article><h3>${escapeHtml(c.name)}</h3><p>${escapeHtml(c.description)}</p></article>`).join("")}</div>`)}
  `;
}

function comparisonValue(A,i,j){
  const v=A[i][j];
  if(v>=1) return Math.round(v);
  return -Math.round(1/v);
}
function itemDescription(item){
  if(item.description) return `<p>${escapeHtml(item.description)}</p>`;
  if(item.bullets) return `<ul>${item.bullets.map(b=>`<li>${escapeHtml(b)}</li>`).join("")}</ul>`;
  return "";
}
function pairwiseEditor(labels, items, A, onUpdate){
  let html = `<div class="pairwiseList">`;
  for(let i=0;i<labels.length;i++){
    for(let j=i+1;j<labels.length;j++){
      const v = comparisonValue(A,i,j);
      html += `
        <div class="compareCard" data-i="${i}" data-j="${j}">
          <article class="compareSide"><span>${escapeHtml(labels[i])}</span>${itemDescription(items[i])}</article>
          <div class="sliderBox">
            <input class="pairSlider" type="range" min="-9" max="9" step="1" value="${v}" />
            <div class="sliderMeta"><span class="leftPref">Left</span><strong class="pairValue">${v}</strong><span class="rightPref">Right</span></div>
          </div>
          <article class="compareSide right"><span>${escapeHtml(labels[j])}</span>${itemDescription(items[j])}</article>
        </div>`;
    }
  }
  html += `</div>`;
  setTimeout(()=>{
    document.querySelectorAll(".compareCard").forEach(row=>{
      const input=row.querySelector(".pairSlider");
      const val=row.querySelector(".pairValue");
      function clean(raw){ let x=Number(raw); if(x===0)x=1; if(x===-1)x=-2; if(x<0)x=Math.max(-9,Math.min(-2,x)); else x=Math.max(1,Math.min(9,x)); return x; }
      input.addEventListener("input",()=>{ const x=clean(input.value); input.value=x; val.textContent=x; });
      input.addEventListener("change",()=>{ const x=clean(input.value); onUpdate(setPairwise(A, Number(row.dataset.i), Number(row.dataset.j), x)); });
    });
  },0);
  return html;
}

function matrixSvg(title, labels, A){
  const n=labels.length;
  const cell = n >= 5 ? 66 : n === 4 ? 78 : 88;
  const left = 185, top = 112;
  const width = left + n*cell + 22;
  const height = top + n*cell + 24;
  let maxAbs=0;
  for(let i=0;i<n;i++) for(let j=0;j<n;j++) maxAbs=Math.max(maxAbs, Math.abs(Math.log(A[i][j])));
  if(maxAbs===0) maxAbs=1;
  function color(v){
    const t=Math.min(1,Math.abs(Math.log(v))/maxAbs);
    if(Math.abs(v-1)<1e-8) return "#ffffff";
    if(v>1) return `rgba(44, 132, 154, ${0.28 + t*0.60})`; // row preferred
    return `rgba(221, 137, 83, ${0.24 + t*0.55})`; // column preferred
  }
  function short(s){ return s.length>26 ? s.slice(0,24)+"…" : s; }
  const cols = labels.map((l,j)=>`<g transform="translate(${left+j*cell+cell/2},88) rotate(-32)"><text class="mLabel col" text-anchor="start">${escapeHtml(short(l))}</text></g>`).join("");
  const rows = labels.map((l,i)=>`<text class="mLabel row" x="${left-16}" y="${top+i*cell+cell/2+5}" text-anchor="end">${escapeHtml(short(l))}</text>`).join("");
  let cells="";
  for(let i=0;i<n;i++) for(let j=0;j<n;j++){
    const x=left+j*cell, y=top+i*cell;
    cells += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="10" fill="${color(A[i][j])}" stroke="#d8dee8"/><text class="mVal" x="${x+cell/2}" y="${y+cell/2+6}" text-anchor="middle">${A[i][j] >= 1 ? A[i][j].toFixed(A[i][j]===1?0:2) : A[i][j].toFixed(2)}</text>`;
  }
  return `<div class="matrixPanel"><div class="matrixHead"><div><h3>${escapeHtml(title)}</h3><p>Pairwise comparison matrix</p></div><button class="infoBtn" title="Values above 1 indicate preference for the row element over the column element. Values below 1 indicate the opposite.">ⓘ</button></div><div class="svgScroller"><svg class="matrixSvg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(title)}"><text class="axisHint" x="${left}" y="28">${escapeHtml(title)}</text>${cols}${rows}${cells}</svg></div></div>`;
}

function renderCriteria(){
  const solve = ahpSolve(state.criteriaMatrix);
  const labels = CONFIG.criteria.map(c=>c.name);
  app.innerHTML = `
    <section class="sectionTitle"><span>Step 1</span><h2>Criteria weighting</h2><p>Compare the evaluation criteria using Saaty's scale.</p></section>
    <div class="twoCol">
      <section class="card">
        <h2>Criteria comparisons</h2>
        ${pairwiseEditor(labels, CONFIG.criteria, state.criteriaMatrix, B=>{state.criteriaMatrix=B; renderCriteria();})}
      </section>
      <section class="card sticky">
        <div class="statusBadge ${crLabel(solve.cr).cls}">${crLabel(solve.cr).text}</div>
        ${matrixSvg("Criteria", labels, state.criteriaMatrix)}
        ${weightsList("Criteria weights", labels, solve.weights)}
      </section>
    </div>
    <div class="pager"><button class="btn ghost" data-route="overview">Back</button><button class="btn primary" data-route="policies">Continue to policies</button></div>
  `;
}

function weightsList(title, labels, weights){
  const rows=labels.map((l,i)=>({label:l, value:weights[i]})).sort((a,b)=>b.value-a.value);
  return `<div class="miniTable"><h3>${escapeHtml(title)}</h3>${rows.map((r,idx)=>`<div><span>${idx+1}. ${escapeHtml(r.label)}</span><strong>${(r.value*100).toFixed(1)}%</strong></div>`).join("")}</div>`;
}

function policyTabs(){ return `<div class="policyTabs">${CONFIG.policies.map((p,i)=>`<button class="policyTab ${i===state.activePolicy?'active':''}" data-policy="${i}">${iconSvg(p.icon)}<span>${p.code}</span></button>`).join("")}</div>`; }
function criterionTabs(){ return `<div class="criterionTabs">${CONFIG.criteria.map((c,i)=>`<button class="criterionTab ${i===state.activeActionCriterion?'active':''}" data-criterion="${i}">${escapeHtml(c.name)}</button>`).join("")}</div>`; }

function renderPolicies(){
  const p = CONFIG.policies[state.activePolicy];
  const pm = state.policyMatrices[state.activePolicy];
  const cidx = state.activeActionCriterion;
  const A = pm.actionMatrices[cidx];
  const solve = ahpSolve(A);
  const labels = p.actions.map(a=>`${a.code} ${a.name}`);
  app.innerHTML = `
    <section class="sectionTitle"><span>Step 2</span><h2>Policy assessment</h2><p>Compare actions within each policy area under each criterion.</p></section>
    ${policyTabs()}
    <section class="policyHero card">
      <div class="policyIcon">${iconSvg(p.icon)}</div>
      <div><span class="eyebrow">${escapeHtml(p.code)}</span><h2>${escapeHtml(p.name)}</h2><p>${escapeHtml(p.objective)}</p></div>
    </section>
    ${criterionTabs()}
    <div class="twoCol">
      <section class="card">
        <h2>${escapeHtml(CONFIG.criteria[cidx].name)} comparisons</h2>
        ${pairwiseEditor(labels, p.actions, A, B=>{pm.actionMatrices[cidx]=B; renderPolicies();})}
      </section>
      <section class="card sticky">
        <div class="statusBadge ${crLabel(solve.cr).cls}">${crLabel(solve.cr).text}</div>
        ${matrixSvg(`${p.code} · ${CONFIG.criteria[cidx].name}`, labels, A)}
        ${weightsList("Action weights", labels, solve.weights)}
      </section>
    </div>
    <div class="pager"><button class="btn ghost" data-route="criteria">Back to criteria</button><button class="btn primary" data-route="results">View results</button></div>
  `;
  setTimeout(()=>{
    document.querySelectorAll("[data-policy]").forEach(b=>b.addEventListener("click",()=>{state.activePolicy=Number(b.dataset.policy); state.activeActionCriterion=0; renderPolicies();}));
    document.querySelectorAll("[data-criterion]").forEach(b=>b.addEventListener("click",()=>{state.activeActionCriterion=Number(b.dataset.criterion); renderPolicies();}));
  },0);
}

function computePolicy(pidx){
  const p=CONFIG.policies[pidx];
  const crit=ahpSolve(state.criteriaMatrix);
  const pm=state.policyMatrices[pidx];
  const actionSolves=pm.actionMatrices.map(A=>ahpSolve(A));
  const scores=p.actions.map((a,i)=>CONFIG.criteria.reduce((s,c,j)=>s + crit.weights[j]*actionSolves[j].weights[i],0));
  const ranking=p.actions.map((a,i)=>({code:a.code,name:a.name,score:scores[i]})).sort((a,b)=>b.score-a.score);
  const crs=actionSolves.map(s=>s.cr);
  return {p, critWeights:crit.weights, actionSolves, scores, ranking, avgCR:crs.reduce((a,b)=>a+b,0)/crs.length};
}
function horizontalChart(rows){
  const max=Math.max(...rows.map(r=>r.score),0.00001);
  return `<div class="hChart">${rows.map((r,i)=>`<div class="hRow ${i===0?'top':''}"><div class="hLabel"><b>${i+1}</b><span>${escapeHtml(r.code)} ${escapeHtml(r.name)}</span></div><div class="hBarWrap"><div class="hBar" style="width:${(r.score/max*100).toFixed(2)}%"></div></div><strong>${(r.score*100).toFixed(1)}%</strong></div>`).join("")}</div>`;
}
function resultsTable(rows){ return `<table class="rankTable"><thead><tr><th>Rank</th><th>Action</th><th>Priority</th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td>${i+1}</td><td>${escapeHtml(r.code)} ${escapeHtml(r.name)}</td><td>${(r.score*100).toFixed(1)}%</td></tr>`).join("")}</tbody></table>`; }

function renderResults(){
  const crit=ahpSolve(state.criteriaMatrix);
  const blocks=CONFIG.policies.map((p,idx)=>{
    const res=computePolicy(idx);
    return `<section class="resultBlock card">
      <div class="resultHead"><div class="policyIcon smallIcon">${iconSvg(p.icon)}</div><div><span class="eyebrow">${escapeHtml(p.code)}</span><h2>${escapeHtml(p.name)}</h2><p>Final action priority ranking</p></div><div class="statusBadge ${crLabel(res.avgCR).cls}">Average CR ${res.avgCR.toFixed(3)}</div></div>
      ${horizontalChart(res.ranking)}
      ${resultsTable(res.ranking)}
    </section>`;
  }).join("");
  app.innerHTML = `
    <section class="sectionTitle"><span>Step 3</span><h2>Results dashboard</h2><p>Report-ready rankings for Deliverable D.3.2.1 policy recommendations.</p></section>
    <section class="card deliverableBox"><h2>Deliverable-ready summary</h2><p>The AHP assessment provides a transparent prioritisation of policy actions supporting the Adriatic-Ionian Cycling Corridor. The results below can be used to structure Section 3, Key policy recommendations, and Section 4, Conclusions and key recommendations.</p></section>
    <section class="card">${weightsList("Criteria weights", CONFIG.criteria.map(c=>c.name), crit.weights)}</section>
    ${blocks}
  `;
}

function exportJson(){
  const out={ problem:CONFIG.problem, criteria:CONFIG.criteria, policies:CONFIG.policies, criteriaMatrix:state.criteriaMatrix, policyMatrices:state.policyMatrices, generatedAt:new Date().toISOString() };
  const blob=new Blob([JSON.stringify(out,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a"); a.href=url; a.download="cyros_ahp_results.json"; a.click(); URL.revokeObjectURL(url);
}
function reset(){ state=makeState(); render(); }

const app=document.getElementById("app");
function render(){
  updateNav();
  const r=route();
  if(r==="criteria") renderCriteria();
  else if(r==="policies") renderPolicies();
  else if(r==="results") renderResults();
  else renderOverview();
  document.querySelectorAll("[data-route]").forEach(el=>el.onclick=()=>setRoute(el.dataset.route));
}
window.addEventListener("hashchange", render);
document.getElementById("btnReset").addEventListener("click", reset);
document.getElementById("btnExport").addEventListener("click", exportJson);
render();
