/* DiagLab Pro — diagnostic téléphone : identification, symptômes multiples, plan de réparation */
(function(){
"use strict";
const {R, AFTER, $, $$, esc, store, toast, go, luhnOk} = window.DL;
const BRAND_LIST = ["Apple", ...Object.keys(BRANDS), "Autre marque Android"];
const W = {h:3, m:2, l:1};
const P = ()=>Object.assign({brand:"", model:"", imei:"", os:"", syms:[]}, store.get("dl-phone",{}));
const save = p=>store.set("dl-phone",p);
const platform = p=>p.brand==="Apple"?"iphone":"android";

/* Classe les causes : une cause commune à plusieurs symptômes monte dans le classement. */
function plan(p){
  const dev=platform(p), map=new Map();
  p.syms.forEach(sym=>(DIAG[dev][sym]||[]).forEach(([lv,cause,test,fix])=>{
    const e=map.get(cause)||{cause,test,fix,score:0,syms:[]};
    e.score+=W[lv]; e.syms.push(sym); map.set(cause,e);
  }));
  const tests=store.get("dl-tests",null);
  if(tests && tests.kind==="phone") Object.values(tests.results).filter(r=>r.st==="fail").forEach(r=>{
    (r.parts||[]).forEach(id=>{ const pt=BOARDS.phone.parts.find(x=>x[0]===id); if(!pt) return;
      const cause=`${pt[1].replace(/\n/g," ")} : test « ${r.name} » défaillant`;
      map.set(cause,{cause,test:pt[8],fix:pt[9],score:4,syms:["Test de l'appareil"]}); });
  });
  return [...map.values()].sort((a,b)=>b.score-a.score || b.syms.length-a.syms.length);
}
function partsFor(p){
  const dev=platform(p), sc={}, cnt={};
  p.syms.forEach(sym=>(SYMPTOM_PARTS[dev+"|"+sym]||[]).forEach(([id,w])=>{sc[id]=(sc[id]||0)+w; cnt[id]=(cnt[id]||0)+1}));
  return Object.entries(sc).sort((a,b)=>cnt[b[0]]-cnt[a[0]]||b[1]-a[1]).map(([id])=>{const pt=BOARDS.phone.parts.find(x=>x[0]===id); return pt?{pt,n:cnt[id]}:null}).filter(Boolean);
}

R.phone = ()=>{
  const p=P(), dev=platform(p), tests=store.get("dl-tests",null), info=tests&&tests.info;
  const syms=p.brand?Object.keys(DIAG[dev]):[];
  const pl=p.brand&&p.syms.length?plan(p):[];
  const pts=p.brand&&p.syms.length?partsFor(p):[];
  const lv=pl.length?pl[0].score:1;
  const imei=(p.imei||"").replace(/\D/g,""), ok=luhnOk(imei);
  const b=BRANDS[p.brand];
  return `<div class="eyebrow">Smartphones et tablettes</div><h1>Diagnostic téléphone</h1>
  <p class="lede">Identifiez l'appareil, cochez tous les symptômes constatés : DiagLab croise les symptômes et les tests matériels pour classer les causes, désigner les composants en cause et proposer la réparation. Fonctionne pour toutes les marques, y compris les modèles récents : les pannes suivent les mêmes familles d'un modèle à l'autre.</p>
  ${info&&info.modele&&!p.model?`<div class="infobox">Appareil détecté par les tests : <b>${esc(info.modele)}</b> (${esc(info.systeme||"")}). <button class="mini" id="useDet">Utiliser</button></div>`:""}
  <div class="card"><h3>1 · Identification</h3>
   <div class="form" style="margin-top:10px">
    <div class="field"><label for="pBrand">Marque</label><select id="pBrand"><option value="">Choisir…</option>${BRAND_LIST.map(x=>`<option${x===p.brand?" selected":""}>${esc(x)}</option>`).join("")}</select></div>
    <div class="field"><label for="pModel">Modèle</label><input id="pModel" value="${esc(p.model)}" placeholder="ex. Galaxy S26, iPhone 17, Redmi Note 15"></div>
    <div class="field"><label for="pImei">IMEI (*#06#)</label><input id="pImei" value="${esc(p.imei)}" inputmode="numeric" placeholder="15 chiffres">
      <span class="hint ${ok===true?"good":ok===false?"bad":""}">${ok===true?"IMEI valide · TAC "+imei.slice(0,8):ok===false?"IMEI invalide : vérifiez la saisie":""}</span></div>
    <div class="field"><label for="pOs">Version du système</label><input id="pOs" value="${esc(p.os)}" placeholder="ex. Android 16, iOS 26"></div>
   </div></div>
  ${p.brand?`<div class="card" style="margin-top:14px"><h3>2 · Symptômes constatés</h3><p>Cochez tout ce qui s'applique.</p>
   <div class="chips">${syms.map(s=>`<button class="chip" data-sym="${esc(s)}" aria-pressed="${p.syms.includes(s)}">${esc(s)}</button>`).join("")}</div>
   ${tests&&tests.kind==="phone"?`<p class="fine">Les tests de l'appareil du ${esc(tests.date)} sont pris en compte (${Object.values(tests.results).filter(r=>r.st==="fail").length} défaillant(s)).</p>`:`<p class="fine">Pour aller plus loin, ouvrez DiagLab sur le téléphone et lancez les <a href="#tests">tests de l'appareil</a> : leurs résultats s'ajoutent ici.</p>`}
  </div>`:""}
  ${pl.length?`<h2 class="sub">3 · Plan de réparation</h2>
   <div class="report"><div class="report-head"><h2>${esc([p.brand,p.model].filter(Boolean).join(" "))||"Téléphone"}</h2><span class="pill">${pl.length} cause(s) classée(s)</span></div>
   ${pl.slice(0,8).map((c,i)=>{const r=c.score/lv; const cls=r>0.66?"p-h":r>0.33?"p-m":"p-l"; return `<div class="cause"><div class="prob ${cls}">${r>0.66?"Élevée":r>0.33?"Moyenne":"Faible"}</div><div>
     <h4>${i+1}. ${esc(c.cause)}</h4>${c.syms.length>1?`<p class="test"><b>Explique ${c.syms.length} symptômes :</b> ${c.syms.map(esc).join(", ")}</p>`:""}
     <p class="test"><b>Tester :</b> ${esc(c.test)}</p><p class="fix"><b>Réparer :</b> ${esc(c.fix)}</p></div></div>`}).join("")}
   </div>
   ${pts.length?`<h2 class="sub">Composants en cause</h2><div class="chips">${pts.map(x=>`<span class="chip static${x.n>1?" multi":""}">${esc(x.pt[1].replace(/\n/g," "))}${x.n>1?` · ${x.n} symptômes`:""}</span>`).join("")}</div>
   ${pts.some(x=>x.n>1)?`<p class="fine">Un composant lié à plusieurs symptômes est le premier suspect : commencez par lui.</p>`:""}`:""}
   ${b?`<details class="acc"><summary>Fiche ${esc(p.brand)} : Recovery, test usine, firmware</summary><div class="body"><dl class="kv"><dt>Recovery</dt><dd>${esc(b.rec)}</dd><dt>Fastboot / Download</dt><dd>${esc(b.dl)}</dd><dt>Test usine</dt><dd class="mono">${esc(b.code)}</dd><dt>Firmware officiel</dt><dd>${esc(b.flash)}</dd><dt>À savoir</dt><dd>${esc(b.note)}</dd></dl></div></details>`:""}
   ${p.brand==="Apple"?`<details class="acc"><summary>Modes de l'iPhone : redémarrage forcé, récupération, DFU</summary><div class="body"><dl class="kv">${IPHONE_MODES.map(m=>`<dt>${esc(m[0])}</dt><dd>${esc(m[1])}</dd>`).join("")}</dl></div></details>`:""}
   <div class="actions"><button class="btn" id="pBoard">Voir sur la carte</button><button class="btn ghost" id="pFiche">Créer la fiche client</button><button class="btn ghost" id="pIa">Demander à l'IA</button><button class="btn ghost" id="pReset">Nouveau téléphone</button></div>`
  : p.brand?`<p class="fine" style="margin-top:14px">Cochez au moins un symptôme pour obtenir le plan de réparation.</p>`:""}`;
};
AFTER.phone = ()=>{
  const upd=(k,v,rerender)=>{const p=P();p[k]=v;save(p);if(rerender)DL.render()};
  $("#pBrand").onchange=e=>{const p=P(); const was=platform(p); p.brand=e.target.value; if(platform(p)!==was) p.syms=[]; save(p); DL.render()};
  $("#pModel").oninput=e=>upd("model",e.target.value);
  $("#pOs").oninput=e=>upd("os",e.target.value);
  $("#pImei").onchange=e=>upd("imei",e.target.value,true);
  if($("#useDet")) $("#useDet").onclick=()=>{const t=store.get("dl-tests",{}),p=P(); p.model=t.info.modele; p.os=p.os||t.info.systeme||""; if(!p.brand) p.brand=/iPhone|iPad/.test(t.info.modele)?"Apple":/^SM-/.test(t.info.modele)?"Samsung":""; save(p); DL.render()};
  $$("[data-sym]").forEach(b=>b.onclick=()=>{const p=P(),s=b.dataset.sym; p.syms=p.syms.includes(s)?p.syms.filter(x=>x!==s):[...p.syms,s]; save(p); DL.render()});
  if(!$("#pBoard")) return;
  const p=P(), pl=plan(p);
  $("#pBoard").onclick=()=>{ if(window.DLBoard) DLBoard.applySymptoms(platform(p),p.syms); go("dash") };
  $("#pFiche").onclick=()=>{
    const d=DL.draft();
    d.type=d.type||(/iPad|Tab|tablette/i.test(p.model)?"Tablette":"Smartphone");
    d.modele=d.modele||[p.brand,p.model].filter(Boolean).join(" ");
    d.serie=d.serie||(p.imei||"").replace(/\s/g,"");
    d.panne=d.panne||p.syms.join(", ");
    const t="Plan de réparation (diagnostic téléphone) :\n"+pl.slice(0,4).map((c,i)=>`${i+1}. ${c.cause} — ${c.fix}`).join("\n");
    d.diagnostic=d.diagnostic?d.diagnostic+"\n\n"+t:t;
    DL.saveDraft(d); go("fiche"); setTimeout(()=>toast("Fiche pré-remplie avec le diagnostic."),50);
  };
  $("#pIa").onclick=()=>{ store.set("dl-ia-prefill",`Téléphone : ${[p.brand,p.model].filter(Boolean).join(" ")}${p.os?" ("+p.os+")":""}.\nSymptômes : ${p.syms.join(" ; ")}.\nCauses déjà envisagées : ${pl.slice(0,3).map(c=>c.cause).join(" ; ")}.\nComment confirmer la panne et la réparer, étape par étape ?`); go("ia") };
  $("#pReset").onclick=()=>{ save({}); DL.render(); window.scrollTo(0,0) };
};
})();
