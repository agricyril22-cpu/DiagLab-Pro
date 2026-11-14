/* DiagLab Pro — tableau de bord et schéma de carte mère */
(function(){
"use strict";
const {R, AFTER, $, $$, esc, store, toast, go} = window.DL;
const ST = {defect:"Défectueux", suspect:"Suspect", ok:"Fonctionne", none:"Non testé"};
const ORDER = {defect:0, suspect:1, ok:2, none:3};

const load = ()=>Object.assign({phone:{}, pc:{}, kind:"phone"}, store.get("dl-board",{}));
const save = b=>store.set("dl-board",b);
const parts = kind=>BOARDS[kind].parts;
const part = (kind,id)=>parts(kind).find(p=>p[0]===id);
const stamp = ()=>new Date().toLocaleString("fr-FR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"});

/* Pose un statut sans écraser un statut plus grave ni une décision manuelle du technicien. */
function mark(b, kind, id, st, src, force){
  if(!part(kind,id)) return;
  const cur=b[kind][id];
  if(cur && cur.manual && !force) { if(src && !cur.src.includes(src)) cur.src.push(src); return; }
  if(cur && !force && ORDER[cur.st] < ORDER[st]) { if(src && !cur.src.includes(src)) cur.src.push(src); return; }
  const prev = cur ? cur.src : [];
  b[kind][id] = {st, src: src ? [...new Set([...(force?[]:prev), src])] : prev, manual: !!force, at: stamp()};
}

window.DLBoard = {
  applySymptoms(dev, syms){
    const kind = dev==="pc" ? "pc" : (dev==="android"||dev==="iphone") ? "phone" : null;
    if(!kind) return 0;
    const b=load(); let n=0;
    syms.forEach(sym=>(SYMPTOM_PARTS[dev+"|"+sym]||[]).forEach(([id,w])=>{ if(w>=2){ mark(b,kind,id,"suspect","Symptôme : "+sym); n++; } }));
    b.kind=kind; save(b); return n;
  },
  applyTests(results, kind){
    const b=load(); kind=kind||"phone";
    Object.values(results).forEach(r=>{
      (r.parts||[]).forEach(id=>{
        if(r.st==="fail") mark(b,kind,id,"defect","Test : "+r.name);
        else if(r.st==="pass") mark(b,kind,id,"ok","Test : "+r.name);
      });
    });
    b.kind=kind; save(b);
  },
  applyScan(j){
    const b=load();
    (j.Constats||[]).forEach(c=>{
      const id=SCAN_PARTS[c.Domaine]; if(!id) return;
      if(c.Domaine==="Batterie" && !j.Portable) return;
      if(c.Niveau==="critique") mark(b,"pc",id,"defect","Rapport PC : "+c.Message);
      else if(c.Niveau==="attention") mark(b,"pc",id,"suspect","Rapport PC : "+c.Message);
      else if(c.Niveau==="ok") mark(b,"pc",id,"ok","Rapport PC : "+c.Message);
    });
    b.kind="pc"; b.scan={score:j.Score, verdict:j.Verdict, date:j.Date, model:[j.Fabricant,j.Modele].filter(Boolean).join(" ")};
    save(b);
  },
  status(kind){ return load()[kind]; }
};

/* Rendu SVG du schéma : chaque composant est un bouton accessible au clavier. */
function svgBoard(kind, b, sel){
  const B=BOARDS[kind];
  const zones=B.zones.map(z=>`<rect class="pcb" x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}" rx="10"/>${z.label?`<text class="zlabel" x="${z.x+8}" y="${z.y+z.h-6}">${esc(z.label)}</text>`:""}`).join("");
  const shell = kind==="phone" ? `<rect class="shell" x="10" y="10" width="340" height="720" rx="42"/>` : "";
  const ps=B.parts.map(p=>{
    const [id,label,x,y,w,h]=p; const st=(b[kind][id]||{}).st||"none";
    const lines=label.split("\n"), lh=11, cy=y+h/2-(lines.length-1)*lh/2+4;
    const isBat = id==="battery" && kind==="phone";
    return `<g class="part st-${st}${sel===id?" sel":""}" data-part="${id}" tabindex="0" role="button" aria-label="${esc(label.replace(/\n/g," "))} : ${ST[st]}">
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${isBat?18:5}"/>
      ${lines.map((t,i)=>`<text x="${x+w/2}" y="${cy+i*lh}" text-anchor="middle">${esc(t)}</text>`).join("")}
      ${st==="defect"?`<circle class="pulse" cx="${x+w-7}" cy="${y+7}" r="4.5"/>`:""}
    </g>`;
  }).join("");
  return `<svg class="board board-${kind}" viewBox="${B.view}" role="group" aria-label="${esc(B.title)}">${shell}${zones}${ps}</svg>`;
}

let selPart=null;
R.dash = ()=>{
  const b=load(), kind=b.kind||"phone";
  const all=[...Object.entries(b.phone).map(([k,v])=>["phone",k,v]), ...Object.entries(b.pc).map(([k,v])=>["pc",k,v])];
  const nDef=all.filter(x=>x[2].st==="defect").length, nSus=all.filter(x=>x[2].st==="suspect").length;
  const tests=store.get("dl-tests",null);
  const fiches=store.get("dl-fiches",[]); const enCours=fiches.filter(f=>!["Rendu","Irréparable"].includes(f.statut)).length;
  const tPass=tests?Object.values(tests.results).filter(r=>r.st==="pass").length:0, tDone=tests?Object.values(tests.results).filter(r=>r.st!=="skip").length:0;
  const list=Object.entries(b[kind]).filter(([,v])=>v.st==="defect"||v.st==="suspect").sort((a,c)=>ORDER[a[1].st]-ORDER[c[1].st]);
  return `<div class="eyebrow">Vue d'ensemble</div><h1>Tableau de bord</h1>
  <p class="lede">Le schéma s'allume en fonction des tests de l'appareil, des symptômes choisis dans le diagnostic et du Rapport PC. Touchez un composant pour voir comment le tester et le réparer, ou pour fixer vous-même son état.</p>
  <div class="kpis">
    <div class="kpi"><b class="c-crit">${nDef}</b><span>composant(s) défectueux</span></div>
    <div class="kpi"><b class="c-warn">${nSus}</b><span>composant(s) suspect(s)</span></div>
    <div class="kpi"><b>${tests?tPass+"/"+tDone:"—"}</b><span>${tests?"tests réussis ("+esc(tests.date)+")":"aucun test d'appareil"}</span></div>
    <div class="kpi"><b>${b.scan?esc(b.scan.score):"—"}</b><span>${b.scan?"note du Rapport PC":"aucun Rapport PC"}</span></div>
    <div class="kpi"><b>${enCours}</b><span>appareil(s) en atelier</span></div>
    <div class="kpi"><b>${fiches.length}</b><span>fiche(s) enregistrée(s)</span></div>
  </div>
  <div class="chips" role="tablist">
    <button class="chip" data-kind="phone" aria-pressed="${kind==="phone"}">Téléphone / tablette</button>
    <button class="chip" data-kind="pc" aria-pressed="${kind==="pc"}">Ordinateur</button>
  </div>
  <div class="dash-grid">
    <div class="card board-card">
      <div class="board-wrap">${svgBoard(kind,b,selPart)}</div>
      <div class="legend"><span><i class="lg st-defect"></i>Défectueux</span><span><i class="lg st-suspect"></i>Suspect</span><span><i class="lg st-ok"></i>Fonctionne</span><span><i class="lg st-none"></i>Non testé</span></div>
      <p class="fine">${esc(BOARDS[kind].note)}</p>
    </div>
    <div class="side-col">
      <div class="card" id="partPanel">${panel(kind,b,selPart)}</div>
      <div class="card"><h3>Pannes détectées</h3>
        ${list.length?`<ul class="faults">${list.map(([id,v])=>{const p=part(kind,id);return `<li><button class="linklike" data-pick="${id}"><span class="lvl lvl-${v.st==="defect"?"critique":"attention"}">${ST[v.st]}</span> ${esc(p[1].replace(/\n/g," "))}</button><div class="fine">${esc(p[9])}</div></li>`}).join("")}</ul>`
          :`<p>Aucune panne enregistrée pour ${kind==="phone"?"le téléphone":"l'ordinateur"}. Lancez les <a href="#tests">tests de l'appareil</a>, le <a href="#phone">diagnostic téléphone</a> ou le <a href="#rapport">Rapport PC</a>.</p>`}
        <div class="actions">
          <button class="btn ghost" id="bFiche" ${list.length?"":"disabled"}>Ajouter à la fiche</button>
          <button class="btn ghost" id="bIa" ${list.length?"":"disabled"}>Demander à l'IA</button>
          <button class="btn ghost" id="bReset">Effacer ce schéma</button>
        </div></div>
    </div>
  </div>`;
};
function panel(kind,b,id){
  if(!id || !part(kind,id)) return `<h3>Composant</h3><p>Touchez un composant du schéma pour afficher son rôle, ses symptômes, la façon de le tester et la réparation.</p>`;
  const p=part(kind,id), v=b[kind][id]||{st:"none",src:[]};
  return `<h3>${esc(p[1].replace(/\n/g," "))} <span class="lvl lvl-${{defect:"critique",suspect:"attention",ok:"ok",none:"info"}[v.st]}">${ST[v.st]}</span></h3>
   <dl class="kv"><dt>Rôle</dt><dd>${esc(p[6])}</dd><dt>Symptômes</dt><dd>${esc(p[7])}</dd><dt>Tester</dt><dd>${esc(p[8])}</dd><dt>Réparer</dt><dd>${esc(p[9])}</dd>
   ${v.src&&v.src.length?`<dt>Détecté par</dt><dd>${v.src.map(esc).join("<br>")}</dd>`:""}</dl>
   <div class="step-label">Fixer l'état</div>
   <div class="chips" style="margin-bottom:0">${["defect","suspect","ok","none"].map(s=>`<button class="chip" data-set="${s}" aria-pressed="${v.st===s}">${ST[s]}</button>`).join("")}</div>`;
}
AFTER.dash = ()=>{
  const b=load(), kind=b.kind||"phone";
  $$("[data-kind]").forEach(x=>x.onclick=()=>{const nb=load();nb.kind=x.dataset.kind;save(nb);selPart=null;DL.render()});
  const pick=id=>{selPart=id;DL.render(); const pp=$("#partPanel"); if(pp&&window.innerWidth<=980) pp.scrollIntoView({behavior:"smooth",block:"start"})};
  $$("[data-part]").forEach(g=>{g.onclick=()=>pick(g.dataset.part); g.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();pick(g.dataset.part)}}});
  $$("[data-pick]").forEach(x=>x.onclick=()=>pick(x.dataset.pick));
  $$("[data-set]").forEach(x=>x.onclick=()=>{
    const nb=load(); const s=x.dataset.set;
    if(s==="none") delete nb[kind][selPart]; else mark(nb,kind,selPart,s,"Réglé par le technicien",true);
    save(nb); DL.render();
  });
  $("#bReset").onclick=e=>{
    const btn=e.currentTarget;
    if(!btn.dataset.armed){btn.dataset.armed="1";btn.textContent="Confirmer l'effacement";setTimeout(()=>{if(btn.isConnected){delete btn.dataset.armed;btn.textContent="Effacer ce schéma"}},4000);return}
    const nb=load(); nb[kind]={}; if(kind==="pc") delete nb.scan; save(nb); selPart=null; DL.render(); toast("Schéma effacé.");
  };
  const summary=()=>Object.entries(load()[kind]).filter(([,v])=>v.st==="defect"||v.st==="suspect")
    .map(([id,v])=>`- ${part(kind,id)[1].replace(/\n/g," ")} : ${ST[v.st].toLowerCase()} (${(v.src||[]).join(" ; ")})`).join("\n");
  $("#bFiche").onclick=()=>{const d=DL.draft(); const t="Composants en cause (tableau de bord) :\n"+summary(); d.diagnostic=d.diagnostic?d.diagnostic+"\n\n"+t:t; DL.saveDraft(d); go("fiche"); setTimeout(()=>toast("Composants ajoutés à la fiche."),50)};
  $("#bIa").onclick=()=>{store.set("dl-ia-prefill",`Sur ${kind==="phone"?"un téléphone":"un ordinateur"}, le tableau de bord signale :\n${summary()}\nQuelle est la cause la plus probable et dans quel ordre dois-je intervenir ?`); go("ia")};
};
})();
