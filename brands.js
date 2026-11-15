/* DiagLab Pro — pannes récurrentes par marque (ordinateurs et téléphones) */
(function(){
"use strict";
const {R, AFTER, $, $$, esc, store, toast, go} = window.DL;
let kind="pc", brand=null;
const norm=s=>String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");

function faultHTML(b,f,k){
  return `<details class="acc"><summary><span>${esc(f[0])}</span></summary><div class="body"><dl class="kv">
    <dt>Symptômes</dt><dd>${esc(f[1])}</dd><dt>Cause</dt><dd>${esc(f[2])}</dd><dt>Solution</dt><dd>${esc(f[3])}</dd></dl>
    <div class="actions"><button class="btn ghost" data-fiche="${esc(b)}|${k}">Ajouter à la fiche</button><button class="btn ghost" data-ia="${esc(b)}|${k}">Demander à l'IA</button></div></div></details>`;
}
R.marques = ()=>{
  const list=BRAND_FAULTS[kind], names=Object.keys(list);
  if(!brand || !list[brand]) brand=names[0];
  const b=list[brand], total=Object.values(BRAND_FAULTS).reduce((s,g)=>s+Object.values(g).reduce((t,x)=>t+x.faults.length,0),0);
  return `<div class="eyebrow">Base de connaissances</div><h1>Pannes par marque</h1>
  <p class="lede">${total} pannes récurrentes relevées en atelier, marque par marque, avec l'outil de diagnostic du constructeur et les touches utiles. Les pannes communes à toutes les marques sont dans le <a href="#diag">diagnostic guidé</a>.</p>
  <input class="search" id="bq" type="search" placeholder="Rechercher dans toutes les marques : charnière, ligne verte, batterie, 3F0…">
  <div id="bres"></div>
  <div id="bmain">
  <div class="chips"><button class="chip" data-k="pc" aria-pressed="${kind==="pc"}">Ordinateurs</button><button class="chip" data-k="phone" aria-pressed="${kind==="phone"}">Téléphones et tablettes</button></div>
  <div class="chips">${names.map(n=>`<button class="chip" data-b="${esc(n)}" aria-pressed="${n===brand}">${esc(n)}</button>`).join("")}</div>
  <div class="card"><h3>${esc(brand)}</h3><p>${esc(b.models)}</p>
   <dl class="kv"><dt>Diagnostic constructeur</dt><dd>${esc(b.tool)}</dd><dt>Touches et modes</dt><dd>${esc(b.keys)}</dd></dl></div>
  <h2 class="sub">Pannes récurrentes</h2>
  ${b.faults.map((f,i)=>faultHTML(brand,f,i)).join("")}
  </div>`;
};
AFTER.marques = ()=>{
  $$("[data-k]").forEach(x=>x.onclick=()=>{kind=x.dataset.k;brand=null;DL.render()});
  $$("[data-b]").forEach(x=>x.onclick=()=>{brand=x.dataset.b;DL.render()});
  const bind=()=>{
    $$("[data-fiche]").forEach(x=>x.onclick=()=>{ const [bn,i]=x.dataset.fiche.split("|"); const k=BRAND_FAULTS.pc[bn]?"pc":"phone"; const f=BRAND_FAULTS[k][bn].faults[+i];
      const d=DL.draft(); if(!d.modele) d.modele=bn+" "; const t=`${bn} — ${f[0]}\nCause probable : ${f[2]}\nSolution : ${f[3]}`; d.diagnostic=d.diagnostic?d.diagnostic+"\n\n"+t:t; DL.saveDraft(d); go("fiche"); setTimeout(()=>toast("Panne ajoutée à la fiche."),50); });
    $$("[data-ia]").forEach(x=>x.onclick=()=>{ const [bn,i]=x.dataset.ia.split("|"); const k=BRAND_FAULTS.pc[bn]?"pc":"phone"; const f=BRAND_FAULTS[k][bn].faults[+i];
      store.set("dl-ia-prefill",`${bn} : ${f[0]}. Symptômes : ${f[1]}\nComment confirmer cette panne et la réparer étape par étape ? Quelles pièces prévoir ?`); go("ia"); });
  };
  bind();
  $("#bq").oninput=e=>{
    const q=norm(e.target.value.trim());
    $("#bmain").hidden=!!q;
    if(!q){ $("#bres").innerHTML=""; return; }
    const hits=[]; ["pc","phone"].forEach(k=>Object.entries(BRAND_FAULTS[k]).forEach(([bn,b])=>b.faults.forEach((f,i)=>{ if(norm(bn+" "+b.models+" "+f.join(" ")).includes(q)) hits.push([bn,f,i]); })));
    $("#bres").innerHTML=hits.length?`<p class="fine">${hits.length} résultat(s)</p>`+hits.map(([bn,f,i])=>faultHTML(bn,[bn+" · "+f[0],f[1],f[2],f[3]],i)).join(""):`<div class="card"><p>Aucune panne ne correspond. Essayez un mot plus court, ou l'<a href="#ia">assistant IA</a>.</p></div>`;
    bind();
  };
};
})();
