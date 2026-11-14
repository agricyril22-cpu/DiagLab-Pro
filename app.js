/* DiagLab Pro — application */
(function(){
"use strict";
const DESKTOP = !!(window.diaglab && window.diaglab.desktop);   // application Windows (.exe)
const PWA = !!window.DL_PWA && !DESKTOP;                          // site installé ou installable
const FULL = PWA || DESKTOP;                                       // impression, export, téléchargements
const VERSION = "2.2.0";
const RELEASES = "https://github.com/agricyril22-cpu/DiagLab-Pro/releases/latest";

/* ---------- utilitaires ---------- */
const store = {
  get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},
  set(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
};
const $ = s=>document.querySelector(s);
const $$ = s=>[...document.querySelectorAll(s)];
const esc = s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform==="MacIntel" && navigator.maxTouchPoints>1);
const standalone = ()=> (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone===true;
let toastTimer=null;
function toast(msg, actLabel, act){
  let t=$("#toast"); if(t) t.remove();
  t=document.createElement("div"); t.id="toast"; t.setAttribute("role","status");
  t.innerHTML=`<span>${esc(msg)}</span>`+(actLabel?`<button>${esc(actLabel)}</button>`:"");
  document.body.appendChild(t);
  if(actLabel) t.querySelector("button").onclick=()=>{t.remove();act()};
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.remove(), actLabel?12000:3500);
}
function copyText(text, btn, el){
  const done=()=>{if(btn){const o=btn.textContent;btn.textContent="Copié";setTimeout(()=>btn.textContent=o,1500)}};
  const fallback=()=>{if(el){const r=document.createRange();r.selectNodeContents(el);const s=getSelection();s.removeAllRanges();s.addRange(r)} if(btn) btn.textContent="Texte sélectionné"};
  try{navigator.clipboard.writeText(text).then(done).catch(fallback)}catch(e){fallback()}
}
function download(name, text, type){
  const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([text],{type:type||"application/json"}));
  a.download=name; document.body.appendChild(a); a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000);
}

/* ---------- installation (PWA) ---------- */
let installEvt=null;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();installEvt=e;updateInstallBtn();if(curView()==="installer")render()});
window.addEventListener("appinstalled",()=>{installEvt=null;updateInstallBtn();toast("DiagLab Pro est installé.")});
function updateInstallBtn(){
  const b=$("#installBtn"); if(!b) return;
  b.hidden = !PWA || standalone();
}
async function doInstall(){
  if(installEvt){installEvt.prompt();const r=await installEvt.userChoice;installEvt=null;updateInstallBtn();if(r.outcome!=="accepted")toast("Installation annulée.");}
  else go("installer");
}
if(PWA && "serviceWorker" in navigator && location.protocol.startsWith("http")){
  const hadController=!!navigator.serviceWorker.controller; // faux à la première installation
  window.addEventListener("load",()=>{
    navigator.serviceWorker.register("sw.js").then(reg=>{
      reg.addEventListener("updatefound",()=>{
        const w=reg.installing; if(!w) return;
        w.addEventListener("statechange",()=>{
          if(w.state==="activated" && hadController) toast("Nouvelle version de DiagLab Pro disponible.","Recharger",()=>location.reload());
        });
      });
    }).catch(()=>{});
  });
}

/* ---------- structure ---------- */
const VIEWS = [
 ["dash","Tableau de bord","Atelier"],["fiche","Fiches clients","Atelier"],["check","Checklist","Atelier"],
 ["diag","Diagnostic guidé","Diagnostic"],["phone","Diagnostic téléphone","Diagnostic"],["tests","Tests de l'appareil","Diagnostic"],
 ["rapport","Rapport PC","Diagnostic"],["ia","Assistant IA","Diagnostic"],
 ["faq","Pannes & FAQ","Ressources"],["reset","Réinitialisation","Ressources"],["iso","Systèmes & ISO","Ressources"],
 ["boot","Outils de boot","Ressources"],["outils","Logiciels","Ressources"],["cmd","Commandes","Ressources"],
 ["calc","Calculateurs","Ressources"],["bios","BIOS & accès","Ressources"],
 ["installer","Installer l'appli","Application"]
];
const ICON = `<svg class="brand-mark" viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="14" fill="#0f151b"/><rect x="12" y="12" width="40" height="40" rx="6" fill="none" stroke="#2a3642" stroke-width="3"/><polyline points="6,34 20,34 25,22 32,46 38,28 42,34 58,34" fill="none" stroke="#3cc6cf" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
document.getElementById("root").innerHTML = `<div class="app">
<nav class="side" aria-label="Sections">
  <div class="brand">${ICON}<div><b>DiagLab Pro</b><small>Atelier technicien</small></div></div>
  <div class="navlist" id="nav"></div>
  <div class="side-foot">
    <button class="install-btn" id="installBtn" hidden>Installer l'application</button>
    <button class="theme-btn" id="themeBtn">Basculer clair / sombre</button>
  </div>
</nav>
<main id="main"></main>
</div>`;

let state = {dev:"pc", sym:null, brand:null};
const R={}, AFTER={};
const known = v=>VIEWS.some(x=>x[0]===v) && !!R[v];
const curView = ()=>{const v=(location.hash||"").slice(1);return known(v)?v:"dash"};

/* ---------- historique : flèches précédent / suivant ---------- */
let navIdx=0, navMax=0;
try{const n=JSON.parse(sessionStorage.getItem("dl-nav")||"null"); if(n&&typeof n.max==="number") navMax=n.max}catch(e){}
const saveNav=()=>{try{sessionStorage.setItem("dl-nav",JSON.stringify({max:navMax}))}catch(e){}};
function go(v){
  if(!known(v)) return;
  if(v===curView()){window.scrollTo(0,0);return}
  navIdx++; navMax=navIdx; saveNav();
  history.pushState({dl:navIdx},"","#"+v);
  render(); window.scrollTo(0,0);
}
window.addEventListener("popstate",e=>{
  if(e.state && typeof e.state.dl==="number") navIdx=e.state.dl;
  else { navIdx=navMax+1; navMax=navIdx; saveNav(); try{history.replaceState({dl:navIdx},"",location.hash)}catch(err){} }
  render(); window.scrollTo(0,0);
});
document.addEventListener("click",e=>{
  const a=e.target.closest && e.target.closest('a[href^="#"]');
  if(!a) return; const v=a.getAttribute("href").slice(1);
  if(known(v)){e.preventDefault();go(v)}
});
document.addEventListener("keydown",e=>{
  if(!e.altKey || e.ctrlKey || e.metaKey) return;
  if(e.key==="ArrowLeft"){e.preventDefault();history.back()}
  if(e.key==="ArrowRight"){e.preventDefault();history.forward()}
});
const CHEV_L='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CHEV_R='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function nav(){
  const cur=curView(); let g="", h="";
  VIEWS.filter(x=>R[x[0]]).forEach(([id,l,grp])=>{
    if(grp!==g){ h+=`<div class="navgroup">${esc(grp)}</div>`; g=grp; }
    h+=`<button data-v="${id}" aria-current="${id===cur}">${l}</button>`;
  });
  $("#nav").innerHTML=h;
  $$("#nav button").forEach(b=>b.onclick=()=>go(b.dataset.v));
  const a=$(`#nav button[data-v="${cur}"]`); if(a && a.scrollIntoView && window.innerWidth<=820) a.scrollIntoView({block:"nearest",inline:"center"});
}
function render(){
  const v=curView(), meta=VIEWS.find(x=>x[0]===v);
  nav();
  $("#main").innerHTML = `<div class="topbar noprint">
    <button class="navbtn" id="navBack" aria-label="Écran précédent" title="Précédent (Alt + ←)" ${navIdx<=0?"disabled":""}>${CHEV_L}</button>
    <button class="navbtn" id="navFwd" aria-label="Écran suivant" title="Suivant (Alt + →)" ${navIdx>=navMax?"disabled":""}>${CHEV_R}</button>
    <span class="crumb">${esc(meta[2])} <span aria-hidden="true">›</span> <b>${esc(meta[1])}</b></span>
  </div><div class="view">${R[v]()}</div>`;
  const ns=$("nav.side"); if(ns) document.documentElement.style.setProperty("--navh",(window.innerWidth<=820?ns.offsetHeight:0)+"px");
  $("#navBack").onclick=()=>history.back();
  $("#navFwd").onclick=()=>history.forward();
  (AFTER[v]||(()=>{}))();
}

/* ================= Diagnostic ================= */
R.diag = ()=>{
  if(!DIAG[state.dev]) state.dev="pc";
  const syms=Object.keys(DIAG[state.dev]);
  if(!state.sym || !DIAG[state.dev][state.sym]) state.sym=syms[0];
  const causes=DIAG[state.dev][state.sym];
  const lbl={h:"Élevée",m:"Moyenne",l:"Faible"};
  let extra="";
  if(state.dev==="android"){
    const names=Object.keys(BRANDS);
    extra=`<div class="step-label">Marque (facultatif)</div>
    <div class="chips">${names.map(n=>`<button class="chip" data-brand="${esc(n)}" aria-pressed="${n===state.brand}">${esc(n)}</button>`).join("")}</div>`;
    if(state.brand && BRANDS[state.brand]){
      const b=BRANDS[state.brand];
      extra+=`<div class="card brandcard"><h3>Fiche marque · ${esc(state.brand)}</h3><dl class="kv">
        <dt>Recovery</dt><dd>${esc(b.rec)}</dd><dt>Fastboot / Download</dt><dd>${esc(b.dl)}</dd>
        <dt>Test usine</dt><dd class="mono">${esc(b.code)}</dd><dt>Firmware officiel</dt><dd>${esc(b.flash)}</dd>
        <dt>À savoir</dt><dd>${esc(b.note)}</dd></dl>
        <p style="margin-top:10px;font-size:12.5px">Les combinaisons peuvent varier selon le modèle et la version d'Android.</p></div>`;
    }
  }
  if(state.dev==="iphone"){
    extra=`<details class="acc"><summary>Modes de l'iPhone et de l'iPad : redémarrage forcé, récupération, DFU</summary><div class="body"><dl class="kv">${IPHONE_MODES.map(m=>`<dt>${esc(m[0])}</dt><dd>${esc(m[1])}</dd>`).join("")}</dl></div></details>`;
  }
  return `<div class="eyebrow">Diagnostic guidé</div>
  <h1>Quelle est la panne ?</h1>
  <p class="lede">Choisissez l'appareil puis le symptôme. Le rapport classe les causes de la plus probable à la plus rare, avec le test à faire et la réparation. Commencez par le haut : les causes simples règlent la majorité des cas.</p>
  <div class="step-label">1 · Appareil</div>
  <div class="grid g3">${Object.entries(DEVICES).map(([k,d])=>`<button class="pick" data-dev="${k}" aria-pressed="${k===state.dev}"><span class="t">${d.t}</span><span class="s">${d.s}</span></button>`).join("")}</div>
  ${extra}
  <div class="step-label">2 · Symptôme</div>
  <div class="chips">${syms.map(s=>`<button class="chip" data-sym="${esc(s)}" aria-pressed="${s===state.sym}">${esc(s)}</button>`).join("")}</div>
  <div class="report">
    <div class="report-head"><h2>${DEVICES[state.dev].t}${state.dev==="android"&&state.brand?" ("+esc(state.brand)+")":""} · ${esc(state.sym)}</h2><span class="pill">${causes.length} causes classées</span></div>
    ${causes.map((c,i)=>`<div class="cause"><div class="prob p-${c[0]}">${lbl[c[0]]}</div><div>
      <h4>${i+1}. ${esc(c[1])}</h4><p class="test"><b>Tester :</b> ${esc(c[2])}</p><p class="fix"><b>Réparer :</b> ${esc(c[3])}</p></div></div>`).join("")}
  </div>
  <div class="actions"><button class="btn" id="toFiche">Créer une fiche client avec ce diagnostic</button>
  ${SYMPTOM_PARTS[state.dev+"|"+state.sym]?'<button class="btn ghost" id="toBoard">Voir sur la carte mère</button>':""}
  <span style="color:var(--muted);font-size:13.5px">Aucune cause ne correspond ? Voir <a href="#faq">Pannes &amp; FAQ</a> ou le <a href="#rapport">Rapport PC</a>.</span></div>`;
};
AFTER.diag = ()=>{
  $$("[data-dev]").forEach(b=>b.onclick=()=>{state.dev=b.dataset.dev;state.sym=null;store.set("dl-dev",state.dev);render()});
  $$("[data-sym]").forEach(b=>b.onclick=()=>{state.sym=b.dataset.sym;render()});
  $$("[data-brand]").forEach(b=>b.onclick=()=>{state.brand=state.brand===b.dataset.brand?null:b.dataset.brand;render()});
  if($("#toBoard")) $("#toBoard").onclick=()=>{ if(window.DLBoard){DLBoard.applySymptoms(state.dev,[state.sym]); go("dash")} };
  $("#toFiche").onclick=()=>{
    const d=draft();
    const typeMap={pc:"Ordinateur portable",android:"Smartphone",iphone:"Smartphone",reseau:"Box / réseau",imprimante:"Imprimante"};
    if(!d.type) d.type=typeMap[state.dev];
    if(!d.modele && state.dev==="android" && state.brand) d.modele=state.brand+" ";
    if(!d.modele && state.dev==="iphone") d.modele="Apple ";
    if(!d.panne) d.panne=state.sym;
    const causes=DIAG[state.dev][state.sym];
    const txt="Causes probables ("+state.sym+") :\n"+causes.slice(0,3).map((c,i)=>`${i+1}. ${c[1]}`).join("\n");
    d.diagnostic = d.diagnostic ? d.diagnostic+"\n\n"+txt : txt;
    saveDraft(d);
    go("fiche");
    setTimeout(()=>toast("Diagnostic ajouté à la fiche en cours."),50);
  };
};

/* ================= Fiches clients ================= */
const STATUTS=["Reçu","En diagnostic","Devis envoyé","En attente de pièce","En réparation","Réparé","Rendu","Irréparable"];
const FIELDS=[
 ["client","Nom du client","text"],
 ["tel","Téléphone","tel"],
 ["type","Type d'appareil","select",["","Smartphone","Tablette","Ordinateur portable","Ordinateur fixe","Mac","Imprimante","Box / réseau","Autre"]],
 ["modele","Marque et modèle","text"],
 ["serie","IMEI ou numéro de série","text"],
 ["accessoires","Accessoires laissés","text","Chargeur, coque, carte SIM…"],
 ["etat","État visuel à la réception","textarea","Rayures, écran fissuré, traces d'oxydation…"],
 ["panne","Panne déclarée par le client","textarea"],
 ["diagnostic","Diagnostic du technicien","textarea"],
 ["travaux","Travaux et pièces","textarea"],
 ["montant","Montant du devis","number"],
 ["acompte","Acompte versé","number"],
 ["garantie","Garantie (jours)","number"],
 ["code","Code de déverrouillage","select",["Non nécessaire","Fourni par le client","Refusé par le client"]],
 ["sauvegarde","Sauvegarde des données","select",["Non nécessaire","Faite par l'atelier","Faite par le client","Refusée par le client"]],
 ["statut","Statut","select",STATUTS]
];
const WIDE=new Set(["etat","panne","diagnostic","travaux"]);
const DEFAULT_ATELIER={nom:"Mon atelier",adresse:"",tel:"",devise:"€",conditions:"Le client reste responsable de la sauvegarde de ses données. L'atelier n'est pas responsable des pannes préexistantes non signalées ni des données perdues. Tout appareil non récupéré 90 jours après l'avis de fin de travaux pourra être recyclé. La garantie couvre uniquement la pièce remplacée et la main-d'œuvre associée, hors casse et oxydation."};
const atelier=()=>Object.assign({},DEFAULT_ATELIER,store.get("dl-atelier",{}));
const fiches=()=>store.get("dl-fiches",[]);
const draft=()=>store.get("dl-draft",{statut:"Reçu",garantie:90,code:"Non nécessaire",sauvegarde:"Non nécessaire"});
const saveDraft=d=>store.set("dl-draft",d);
const money=v=>{const n=parseFloat(v);return isNaN(n)?"—":n.toLocaleString("fr-FR",{minimumFractionDigits:0,maximumFractionDigits:2})+" "+atelier().devise};
const fmtDate=iso=>iso?new Date(iso).toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit",year:"numeric"}):"";
function luhnOk(v){if(!/^\d{15}$/.test(v))return null;let s=0;for(let i=0;i<15;i++){let d=+v[i];if(i%2){d*=2;if(d>9)d-=9}s+=d}return s%10===0}

function sheetHTML(f){
  const a=atelier();
  const reste=(parseFloat(f.montant)||0)-(parseFloat(f.acompte)||0);
  const blk=(t,v)=>v?`<h3>${t}</h3><p>${esc(v)}</p>`:"";
  return `<div class="sheet" id="sheet">
   <header><div><h2>${esc(a.nom)}</h2><p>${esc(a.adresse)}</p><p>${esc(a.tel)}</p></div>
   <div class="no">Fiche d'intervention<br>${esc(f.no||"(brouillon)")}<br><span style="font-weight:400;font-size:13px">Déposé le ${fmtDate(f.date||new Date().toISOString())}</span></div></header>
   <div class="cols">
    <div><h3>Client</h3><p>${esc(f.client||"—")}\n${esc(f.tel||"")}</p></div>
    <div><h3>Appareil</h3><p>${esc([f.type,f.modele].filter(Boolean).join(" · ")||"—")}\n${f.serie?"IMEI / série : "+esc(f.serie):""}</p></div>
    <div><h3>Statut</h3><p>${esc(f.statut||"Reçu")}</p></div>
   </div>
   <div class="cols">
    <div>${blk("Accessoires laissés",f.accessoires)}</div>
    <div><h3>Code de déverrouillage</h3><p>${esc(f.code||"—")}</p></div>
    <div><h3>Sauvegarde des données</h3><p>${esc(f.sauvegarde||"—")}</p></div>
   </div>
   ${blk("État visuel à la réception",f.etat)}${blk("Panne déclarée",f.panne)}${blk("Diagnostic",f.diagnostic)}${blk("Travaux et pièces",f.travaux)}
   <h3>Montants</h3><div class="money"><span>Devis : <b>${money(f.montant)}</b></span><span>Acompte : <b>${money(f.acompte)}</b></span><span>Reste à payer : <b>${f.montant?money(reste):"—"}</b></span><span>Garantie : <b>${f.garantie?esc(f.garantie)+" jours":"—"}</b></span></div>
   <div class="cond">${esc(a.conditions)}</div>
   <div class="sign"><div>Signature du client au dépôt</div><div>Signature du client au retrait</div></div>
  </div>`;
}
function sheetText(f){
  const a=atelier();const L=[];
  L.push(`${a.nom} — Fiche d'intervention ${f.no||"(brouillon)"} — ${fmtDate(f.date||new Date().toISOString())}`);
  L.push(`Client : ${f.client||"—"} ${f.tel||""}`);
  L.push(`Appareil : ${[f.type,f.modele].filter(Boolean).join(" · ")||"—"}${f.serie?" — IMEI/série "+f.serie:""}`);
  L.push(`Statut : ${f.statut||"Reçu"}`);
  [["Panne",f.panne],["Diagnostic",f.diagnostic],["Travaux",f.travaux],["État",f.etat],["Accessoires",f.accessoires]].forEach(([k,v])=>{if(v)L.push(`${k} : ${v}`)});
  if(f.montant) L.push(`Devis : ${money(f.montant)} · Acompte : ${money(f.acompte)} · Reste : ${money((parseFloat(f.montant)||0)-(parseFloat(f.acompte)||0))}`);
  if(f.garantie) L.push(`Garantie : ${f.garantie} jours`);
  return L.join("\n");
}

function reportToDraft(j,d){
  d=d||draft();
  d.type=d.type||(j.Portable?"Ordinateur portable":"Ordinateur fixe");
  d.modele=d.modele||[j.Fabricant,j.Modele].filter(Boolean).join(" ");
  d.serie=d.serie||j.NumeroSerie||"";
  const cs=(j.Constats||[]).filter(c=>c.Niveau==="critique"||c.Niveau==="attention");
  const txt=`Rapport DiagLab du ${j.Date||""} — score ${j.Score}/100 (${j.Verdict})\n`+(cs.length?cs.map(c=>`- [${c.Niveau==="critique"?"Critique":"Attention"}] ${c.Message}`).join("\n"):"- Aucun problème détecté");
  d.diagnostic=d.diagnostic?d.diagnostic+"\n\n"+txt:txt;
  saveDraft(d); return d;
}

R.fiche = ()=>{
  const d=draft(), list=fiches(), a=atelier();
  const enCours=list.filter(f=>!["Rendu","Irréparable"].includes(f.statut)).length;
  const prets=list.filter(f=>f.statut==="Réparé").length;
  const field=([k,l,t,o])=>{
    const v=d[k]==null?"":d[k];
    let inp;
    if(t==="select") inp=`<select id="f_${k}">${o.map(x=>`<option${x===v?" selected":""}>${esc(x)}</option>`).join("")}</select>`;
    else if(t==="textarea") inp=`<textarea id="f_${k}" placeholder="${esc(o||"")}">${esc(v)}</textarea>`;
    else inp=`<input id="f_${k}" type="${t}" value="${esc(v)}" ${t==="number"?'min="0" step="any" inputmode="decimal"':""} placeholder="${esc(o||"")}">`;
    return `<div class="field${WIDE.has(k)?" wide":""}"><label for="f_${k}">${l}${k==="montant"||k==="acompte"?" ("+esc(a.devise)+")":""}</label>${inp}${k==="serie"?'<span class="hint" id="serieHint"></span>':""}</div>`;
  };
  return `<div class="noprint"><div class="eyebrow">Atelier</div><h1>Fiches clients</h1>
  <p class="lede">Créez la fiche au dépôt de l'appareil, suivez son statut, imprimez-la pour signature. Les fiches restent sur cet appareil${FULL?" ; exportez-les régulièrement pour les sauvegarder":""}.</p>
  <div class="kpis"><div class="kpi"><b>${list.length}</b><span>fiches enregistrées</span></div><div class="kpi"><b>${enCours}</b><span>appareils en atelier</span></div><div class="kpi"><b>${prets}</b><span>prêts à rendre</span></div></div>
  <div class="card">
   <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:12px">
    <h3>${d.no?"Fiche "+esc(d.no):"Nouvelle fiche"}</h3>
    <label class="btn ghost" style="cursor:pointer;font-size:13.5px;padding:7px 12px">Importer un rapport PC (.json)<input type="file" id="impRapport" accept=".json,application/json" hidden></label>
   </div>
   <div class="form">${FIELDS.map(field).join("")}</div>
   <div class="actions">
    <button class="btn" id="fSave">Enregistrer la fiche</button>
    ${FULL?'<button class="btn ghost" id="fPrint">Imprimer / PDF</button>':""}
    <button class="btn ghost" id="fCopy">Copier le texte</button>
    <button class="btn ghost" id="fNew">Nouvelle fiche</button>
   </div>
  </div>
  <h2 class="sub">Aperçu de la fiche</h2></div>
  <div id="sheetWrap">${sheetHTML(d)}</div>
  <div class="noprint">
  <h2 class="sub">Historique</h2>
  <input class="search" id="hq" type="search" placeholder="Rechercher un client, un modèle, un numéro de fiche…">
  <div class="card tw" style="padding:0" id="hist"></div>
  <div class="actions">
   ${FULL?'<button class="btn ghost" id="exp">Exporter les fiches (.json)</button>':""}
   <label class="btn ghost" style="cursor:pointer">Importer des fiches (.json)<input type="file" id="impFiches" accept=".json,application/json" hidden></label>
  </div>
  <details class="acc" style="margin-top:18px"><summary>Coordonnées de l'atelier et conditions</summary><div class="body"><div class="form">
   <div class="field"><label for="a_nom">Nom de l'atelier</label><input id="a_nom" value="${esc(a.nom)}"></div>
   <div class="field"><label for="a_tel">Téléphone</label><input id="a_tel" value="${esc(a.tel)}"></div>
   <div class="field"><label for="a_devise">Devise</label><input id="a_devise" value="${esc(a.devise)}" placeholder="€, FCFA, MAD, DA, $…"></div>
   <div class="field wide"><label for="a_adresse">Adresse</label><input id="a_adresse" value="${esc(a.adresse)}"></div>
   <div class="field wide"><label for="a_conditions">Conditions imprimées sur la fiche</label><textarea id="a_conditions" style="min-height:110px">${esc(a.conditions)}</textarea></div>
  </div></div></details></div>`;
};
AFTER.fiche = ()=>{
  const read=()=>{const d=draft();FIELDS.forEach(([k])=>{const el=$("#f_"+k);if(el)d[k]=el.value});return d};
  const refresh=()=>{const d=read();saveDraft(d);$("#sheetWrap").innerHTML=sheetHTML(d);serieHint(d.serie)};
  const serieHint=v=>{const h=$("#serieHint");if(!h)return;v=(v||"").replace(/\s/g,"");const r=luhnOk(v);
    h.className="hint"+(r===true?" good":r===false?" bad":"");h.textContent=r===true?"IMEI valide":r===false?"IMEI invalide : vérifiez la saisie":""};
  FIELDS.forEach(([k])=>{const el=$("#f_"+k);if(el)el.addEventListener("input",refresh)});
  serieHint(draft().serie);

  $("#fSave").onclick=()=>{
    const d=read();
    if(!d.client.trim()){toast("Indiquez le nom du client.");$("#f_client").focus();return}
    const list=fiches();
    if(!d.id){
      const y=new Date().getFullYear(), cnt=store.get("dl-counter",{});
      cnt[y]=(cnt[y]||0)+1; store.set("dl-counter",cnt);
      d.id=Date.now().toString(36)+Math.random().toString(36).slice(2,6);
      d.no=`FI-${y}-${String(cnt[y]).padStart(4,"0")}`; d.date=new Date().toISOString();
      list.unshift(d);
    } else {
      const i=list.findIndex(x=>x.id===d.id); if(i>=0) list[i]=d; else list.unshift(d);
    }
    d.maj=new Date().toISOString();
    if(!store.set("dl-fiches",list)){toast("Enregistrement impossible : le stockage de ce navigateur est bloqué ou plein.");return}
    saveDraft(d); render(); toast(`Fiche ${d.no} enregistrée.`);
  };
  if($("#fPrint")) $("#fPrint").onclick=()=>{refresh();window.print()};
  $("#fCopy").onclick=e=>copyText(sheetText(read()),e.currentTarget,$("#sheet"));
  $("#fNew").onclick=()=>{saveDraft({statut:"Reçu",garantie:90,code:"Non nécessaire",sauvegarde:"Non nécessaire"});render();$("#f_client").focus()};

  $("#impRapport").onchange=e=>{
    const file=e.target.files[0]; if(!file) return;
    const r=new FileReader();
    r.onload=()=>{
      try{
        const j=JSON.parse(String(r.result).replace(/^\uFEFF/,""));
        if(!j.Ordinateur && !j.Constats) throw new Error("format");
        reportToDraft(j,read()); if(window.DLBoard) DLBoard.applyScan(j); render(); toast("Rapport PC importé dans la fiche (et sur le tableau de bord).");
      }catch(err){toast("Ce fichier n'est pas un rapport DiagLab (.json produit par le script Rapport PC).")}
    };
    r.readAsText(file);
  };

  const drawHist=()=>{
    const q=($("#hq").value||"").toLowerCase().trim();
    const list=fiches().filter(f=>!q||[f.no,f.client,f.tel,f.modele,f.serie,f.panne].join(" ").toLowerCase().includes(q));
    if(!fiches().length){$("#hist").innerHTML=`<p style="padding:16px;margin:0;color:var(--muted)">Aucune fiche pour l'instant. Remplissez le formulaire ci-dessus puis « Enregistrer la fiche » : elle apparaîtra ici avec son numéro.</p>`;return}
    if(!list.length){$("#hist").innerHTML=`<p style="padding:16px;margin:0;color:var(--muted)">Aucune fiche ne correspond à « ${esc(q)} ».</p>`;return}
    $("#hist").innerHTML=`<table class="t"><thead><tr><th>N°</th><th>Date</th><th>Client</th><th>Appareil</th><th>Statut</th><th></th></tr></thead><tbody>${
      list.map(f=>`<tr><td class="mono num">${esc(f.no)}</td><td class="num">${fmtDate(f.date)}</td><td>${esc(f.client)}<br><span style="color:var(--muted);font-size:12.5px">${esc(f.tel||"")}</span></td><td>${esc([f.type,f.modele].filter(Boolean).join(" · "))}</td>
      <td><select class="st st-${Math.max(0,STATUTS.indexOf(f.statut))}" data-st="${f.id}" aria-label="Statut de ${esc(f.no)}">${STATUTS.map(s=>`<option${s===f.statut?" selected":""}>${s}</option>`).join("")}</select></td>
      <td style="white-space:nowrap"><button class="mini" data-open="${f.id}">Ouvrir</button> <button class="mini danger" data-del="${f.id}">Supprimer</button></td></tr>`).join("")
    }</tbody></table>`;
    $$("[data-st]").forEach(s=>s.onchange=()=>{const l=fiches();const f=l.find(x=>x.id===s.dataset.st);if(f){f.statut=s.value;f.maj=new Date().toISOString();store.set("dl-fiches",l);const d=draft();if(d.id===f.id){d.statut=f.statut;saveDraft(d)}render();toast(`${f.no} : ${f.statut}`)}});
    $$("[data-open]").forEach(b=>b.onclick=()=>{const f=fiches().find(x=>x.id===b.dataset.open);if(f){saveDraft(f);render();window.scrollTo({top:0,behavior:"smooth"})}});
    $$("[data-del]").forEach(b=>b.onclick=()=>{
      if(b.dataset.armed){const l=fiches().filter(x=>x.id!==b.dataset.del);store.set("dl-fiches",l);const d=draft();if(d.id===b.dataset.del){delete d.id;delete d.no;saveDraft(d)}render();toast("Fiche supprimée.");return}
      b.dataset.armed="1";b.textContent="Confirmer ?";setTimeout(()=>{if(b.isConnected){delete b.dataset.armed;b.textContent="Supprimer"}},4000);
    });
  };
  $("#hq").oninput=drawHist; drawHist();

  if($("#exp")) $("#exp").onclick=()=>download(`diaglab-fiches-${new Date().toISOString().slice(0,10)}.json`,JSON.stringify({app:"DiagLab Pro",version:VERSION,atelier:atelier(),fiches:fiches()},null,2));
  $("#impFiches").onchange=e=>{
    const file=e.target.files[0]; if(!file) return;
    const r=new FileReader();
    r.onload=()=>{try{const j=JSON.parse(String(r.result).replace(/^\uFEFF/,""));const inc=Array.isArray(j)?j:j.fiches;if(!Array.isArray(inc))throw 0;
      const l=fiches();let n=0;inc.forEach(f=>{if(f&&f.id&&!l.some(x=>x.id===f.id)){l.push(f);n++}});
      l.sort((a,b)=>(b.date||"").localeCompare(a.date||""));store.set("dl-fiches",l);render();toast(`${n} fiche(s) importée(s).`)}
      catch(err){toast("Fichier non reconnu : choisissez un export de fiches DiagLab.")}};
    r.readAsText(file);
  };
  ["nom","tel","devise","adresse","conditions"].forEach(k=>{$("#a_"+k).addEventListener("input",()=>{const a=atelier();a[k]=$("#a_"+k).value;store.set("dl-atelier",a);$("#sheetWrap").innerHTML=sheetHTML(read())})});
};

/* ================= Rapport PC ================= */
R.rapport = ()=>`<div class="eyebrow">Diagnostic Windows en un clic</div><h1>Rapport PC</h1>
 <p class="lede">${DESKTOP?"Analysez ce PC en un clic : en une à deux minutes, vous obtenez une note sur 100 et la liste des problèmes classés par gravité. Pour un autre PC, utilisez le kit plus bas.":"Un script à lancer sur le PC du client. En une à deux minutes, il analyse la machine et ouvre un rapport avec une note sur 100 et la liste des problèmes classés par gravité. Il ne modifie rien : lecture seule."}</p>
 ${DESKTOP?scanPanel():""}
 <div class="grid g3">
  ${[["Système","Modèle, numéro de série, BIOS, version de Windows, fin de support"],["Mémoire","Quantité, barrettes, saturation"],["Disques","Santé SMART, usure SSD, erreurs, espace libre, disque mécanique"],["Batterie","Capacité restante, cycles"],["Stabilité","Écrans bleus et leur code, coupures brutales, erreurs matérielles WHEA, erreurs disque (30 jours)"],["Pilotes","Périphériques en erreur, pilote graphique générique"],["Sécurité","Antivirus, pare-feu, Secure Boot, TPM, BitLocker"],["Windows","Activation, dernière mise à jour, redémarrage en attente"],["Réseau","IP, passerelle, DNS, vitesse du lien, ping box et internet"],["Températures","Zones thermiques ACPI (si la carte les expose)"]].map(x=>`<div class="card"><h3>${x[0]}</h3><p>${x[1]}</p></div>`).join("")}
 </div>
 <h2 class="sub">Utilisation</h2>
 ${FULL?`<div class="actions" style="margin:0 0 14px"><a class="btn${DESKTOP?" ghost":""}" href="outils/DiagLab-Rapport.zip" download>Télécharger le kit pour un autre PC (.zip)</a><a class="btn ghost" href="outils/DiagLab-Rapport.ps1" download>Script seul (.ps1)</a></div>`:`<div class="infobox">Le téléchargement du kit est disponible dans la version installée de DiagLab Pro. Ici, vous pouvez copier le script plus bas et l'enregistrer sous le nom <span class="mono">DiagLab-Rapport.ps1</span>.</div>`}
 <details class="acc" open><summary>Étapes</summary><div class="body"><ol>
  <li>Copiez le kit sur votre clé USB technicien et décompressez-le sur le PC du client.</li>
  <li>Double-cliquez sur <span class="mono">Lancer-DiagLab.bat</span> et acceptez la demande d'administrateur. Sans droits administrateur, le rapport est produit mais sans SMART, températures, TPM ni BitLocker.</li>
  <li>Le rapport s'ouvre dans le navigateur. Deux fichiers sont créés sur le Bureau : <span class="mono">DiagLab_NOMDUPC_date.html</span> (à montrer au client) et <span class="mono">.json</span>.</li>
  <li>Dans <a href="#fiche">Fiches clients</a>, « Importer un rapport PC » remplit le modèle, le numéro de série et le diagnostic automatiquement.</li>
 </ol>
 <p style="margin:8px 0 0">Windows SmartScreen peut avertir car le script n'est pas signé : « Informations complémentaires » → « Exécuter quand même ». Vous pouvez lire tout le script ci-dessous avant de l'utiliser.</p></div></details>
 <details class="acc"><summary>Lancement manuel et options</summary><div class="body">
  <p>Dans PowerShell ouvert en administrateur, depuis le dossier du script :</p>
  <div class="cmd"><code>powershell -NoProfile -ExecutionPolicy Bypass -File .\\DiagLab-Rapport.ps1</code><button data-copy>Copier</button></div>
  <p>Ajoutez <span class="mono">-Complet</span> pour vérifier aussi l'intégrité de Windows (SFC et DISM, plusieurs minutes), <span class="mono">-Dossier D:\\Rapports</span> pour changer le dossier de sortie, <span class="mono">-NePasOuvrir</span> pour ne pas ouvrir le rapport.</p>
 </div></details>
 <details class="acc"><summary>Voir le script</summary><div class="body"><div class="actions" style="margin:0 0 6px"><button class="mini" id="cpScript">Copier le script</button><span class="pill" id="scriptInfo">chargement…</span></div><pre class="script" id="scriptBox"></pre></div></details>`;
let lastScan=null;
function scanPanel(){
  return `<div class="card scan" id="scanCard"><h3>Analyser ce PC</h3>
   <p>Lance le diagnostic de cet ordinateur et affiche le résultat ici. Lecture seule : rien n'est modifié.</p>
   <div class="opts"><label><input type="checkbox" id="scAdmin" checked> Avec droits administrateur (SMART, températures, TPM, BitLocker)</label>
   <label><input type="checkbox" id="scFull"> Vérifier aussi l'intégrité de Windows (SFC et DISM, plusieurs minutes)</label></div>
   <div class="actions"><button class="btn" id="scGo">Analyser ce PC maintenant</button><span class="pill" id="scState" hidden></span></div>
   <div id="scResult">${lastScan?scanResult(lastScan):""}</div></div>`;
}
function scanResult(j){
  const lib={critique:"Critique",attention:"Attention",info:"Info",ok:"OK"};
  const cs=j.Constats||[];
  const cls=cs.some(c=>c.Niveau==="critique")?"critique":cs.some(c=>c.Niveau==="attention")?"attention":"ok";
  return `<div class="scorebox lvl-${cls}"><b>${esc(j.Score)}</b><div><div class="v">${esc(j.Verdict)}</div><div class="s">${esc([j.Fabricant,j.Modele].filter(Boolean).join(" "))} · ${esc(j.Systeme||"")} · ${esc(j.Date||"")}</div></div></div>
   ${cs.length?`<div class="findings">${cs.map(c=>`<div class="finding"><span class="lvl lvl-${esc(c.Niveau)}">${lib[c.Niveau]||esc(c.Niveau)}</span><div><b>${esc(c.Domaine)}</b> · ${esc(c.Message)}${c.Conseil?`<div class="adv">${esc(c.Conseil)}</div>`:""}</div></div>`).join("")}</div>`:`<p>Aucun problème détecté.</p>`}
   ${j.Admin?"":`<div class="warnbox">Analyse faite sans droits administrateur : SMART, températures, TPM et BitLocker n'ont pas été vérifiés.</div>`}
   <div class="actions"><button class="btn" id="scOpen">Ouvrir le rapport complet</button><button class="btn ghost" id="scFiche">Créer une fiche avec ce résultat</button><button class="btn ghost" id="scSave">Enregistrer le rapport…</button></div>`;
}
function bindScan(){
  const go=$("#scGo"); if(!go) return;
  const bindResult=()=>{
    if(!$("#scOpen")) return;
    $("#scOpen").onclick=()=>window.diaglab.openReport().then(ok=>{if(!ok)toast("Le rapport n'est plus disponible : relancez l'analyse.")});
    $("#scSave").onclick=()=>window.diaglab.saveReport().then(p=>{if(p)toast("Rapport enregistré.")});
    $("#scFiche").onclick=()=>{reportToDraft(lastScan);go("fiche");setTimeout(()=>toast("Résultat ajouté à la fiche en cours."),50)};
  };
  go.onclick=async()=>{
    const st=$("#scState"); go.disabled=true; st.hidden=false;
    const full=$("#scFull").checked;
    st.textContent=full?"Analyse complète en cours (plusieurs minutes)…":"Analyse en cours (1 à 2 minutes)…";
    $("#scResult").innerHTML="";
    let r=null; try{ r=await window.diaglab.runReport({admin:$("#scAdmin").checked,complet:full}); }catch(e){ r={ok:false,error:String(e&&e.message||e)}; }
    go.disabled=false; st.hidden=true;
    if(!r||!r.ok){$("#scResult").innerHTML=`<div class="warnbox">${esc((r&&r.error)||"L'analyse a échoué.")}</div>`;return}
    lastScan=r.data; $("#scResult").innerHTML=scanResult(lastScan); bindResult();
    if(window.DLBoard) DLBoard.applyScan(lastScan);
    $("#scResult").scrollIntoView({behavior:"smooth",block:"start"});
  };
  bindResult();
}
AFTER.rapport = ()=>{
  bindScan();
  $$("[data-copy]").forEach(b=>b.onclick=()=>copyText(b.previousElementSibling.textContent,b,b.previousElementSibling));
  let txt="";
  fetch("outils/DiagLab-Rapport.ps1").then(r=>{if(!r.ok)throw 0;return r.text()}).then(t=>{txt=t.replace(/^\uFEFF/,""); const box=$("#scriptBox"), inf=$("#scriptInfo"); if(!box||!inf) return; box.textContent=txt; inf.textContent=txt.split("\n").length+" lignes · PowerShell 5.1+"})
   .catch(()=>{const inf=$("#scriptInfo"); if(inf) inf.textContent="script indisponible hors connexion";});
  $("#cpScript").onclick=e=>copyText(txt,e.currentTarget,$("#scriptBox"));
};

/* ================= FAQ ================= */
R.faq = ()=>`<div class="eyebrow">Base de connaissances</div><h1>Pannes &amp; FAQ</h1>
 <p class="lede">${FAQ.length} questions fréquentes d'atelier. Tapez un mot-clé : écran, BitLocker, IMEI, DNS, panic…</p>
 <input class="search" id="q" type="search" placeholder="Rechercher une panne, un code, un appareil…">
 <div class="chips" id="fcat">${["Tout","PC","Mobile","iPhone","Réseau","Imprimante"].map((c,i)=>`<button class="chip" data-c="${c}" aria-pressed="${i===0}">${c}</button>`).join("")}</div>
 <div id="flist"></div>`;
AFTER.faq = ()=>{
  let cat="Tout";
  const draw=()=>{
    const q=$("#q").value.toLowerCase().trim();
    const items=FAQ.filter(f=>(cat==="Tout"||f[0]===cat)&&(!q||(f[1]+" "+f[2]).toLowerCase().includes(q)));
    $("#flist").innerHTML=items.length?items.map(f=>`<details class="acc"><summary><span><span class="tag">${f[0]}</span>${esc(f[1])}</span></summary><div class="body">${esc(f[2])}</div></details>`).join(""):`<div class="card"><p>Aucun résultat. Essayez un terme plus court ou une autre catégorie.</p></div>`;
  };
  $("#q").oninput=draw;
  $$("#fcat .chip").forEach(b=>b.onclick=()=>{cat=b.dataset.c;$$("#fcat .chip").forEach(x=>x.setAttribute("aria-pressed",x===b));draw()});
  draw();
};

/* ================= Réinitialisation ================= */
R.reset = ()=>`<div class="eyebrow">Procédures</div><h1>Réinitialisation des appareils</h1>
 <p class="lede">Réinitialisations d'usine officielles, par marque. Sauvegardez toujours avant : ces opérations effacent les données.</p>
 <div class="warnbox"><b>Comptes de protection :</b> Google (FRP), Apple (Verrouillage d'activation), Mi, Samsung, Huawei ID et HeyTap restent actifs après réinitialisation. C'est voulu, contre le vol. Demandez au client de retirer son compte ou de fournir ses identifiants avant l'intervention.</div>
 <div class="chips" id="rcat">${["Tout","Ordinateur","Mobile","Réseau","Périphérique"].map((c,i)=>`<button class="chip" data-c="${c}" aria-pressed="${i===0}">${c}</button>`).join("")}</div>
 <div id="rlist"></div>`;
AFTER.reset = ()=>{
  let cat="Tout";
  const draw=()=>{$("#rlist").innerHTML=RESETS.filter(r=>cat==="Tout"||r[1]===cat).map(r=>`<details class="acc"><summary><span><span class="tag">${r[1]}</span>${esc(r[0])}</span></summary><div class="body"><ol>${r[2].map(s=>`<li>${esc(s)}</li>`).join("")}</ol></div></details>`).join("")};
  $$("#rcat .chip").forEach(b=>b.onclick=()=>{cat=b.dataset.c;$$("#rcat .chip").forEach(x=>x.setAttribute("aria-pressed",x===b));draw()});
  draw();
};

/* ================= Boot ================= */
R.boot = ()=>`<div class="eyebrow">Clé de dépannage</div><h1>Outils de boot</h1>
 <p class="lede">Composez votre clé USB technicien. Méthode recommandée : une clé de 64 Go avec <b>Ventoy</b>, sur laquelle vous copiez les ISO Windows, Hiren's BootCD PE, MemTest86, Clonezilla et SystemRescue, plus le kit Rapport PC. Une seule clé pour tout.</p>
 <div class="grid g2">${BOOTTOOLS.map(t=>`<div class="card tool"><h3>${t[0]}</h3><div class="meta"><span class="pill">${t[1]}</span><span class="pill">${t[4]}</span></div><p>${esc(t[2])}</p><p style="margin-top:10px"><a href="${t[3]}" target="_blank" rel="noopener">Site officiel ↗</a></p></div>`).join("")}</div>
 <h2 class="sub">Rufus ou Ventoy ?</h2>
 <div class="tw card" style="padding:0"><table class="t"><thead><tr><th>Critère</th><th>Rufus</th><th>Ventoy</th></tr></thead><tbody>
 <tr><td>ISO par clé</td><td>Une</td><td>Autant que la place le permet</td></tr>
 <tr><td>Changer d'ISO</td><td>Reformater</td><td>Copier-coller le fichier</td></tr>
 <tr><td>Windows 11 sans TPM</td><td>Oui, option intégrée</td><td>Oui, via plugin</td></tr>
 <tr><td>Fiabilité d'installation</td><td>Excellente</td><td>Très bonne (certaines ISO rares échouent)</td></tr>
 <tr><td>Usage idéal</td><td>Clé d'installation unique</td><td>Trousse multi-outils</td></tr></tbody></table></div>
 <h2 class="sub">Touches d'accès au menu de boot</h2>
 <div class="tw card" style="padding:0"><table class="t"><thead><tr><th>Marque</th><th>Menu de boot</th><th>BIOS / UEFI</th></tr></thead><tbody>
 ${[["ASUS","F8 / Échap","Suppr / F2"],["Acer","F12","F2 / Suppr"],["Dell","F12","F2"],["HP","F9 (ou Échap)","F10"],["Lenovo","F12 / bouton Novo","F1 / F2"],["MSI","F11","Suppr"],["Gigabyte","F12","Suppr"],["ASRock","F11","Suppr / F2"],["Toshiba / Dynabook","F12","F2"],["Samsung","F10 / Échap","F2"],["Huawei / Honor","F12","F2"],["Microsoft Surface","Volume − + Power","Volume + + Power"],["Mac Intel","Option (⌥)","—"],["Mac Apple Silicon","Maintenir Power","—"]].map(r=>`<tr><td>${r[0]}</td><td class="mono">${r[1]}</td><td class="mono">${r[2]}</td></tr>`).join("")}
 </tbody></table></div>`;

/* ================= Logiciels ================= */
R.outils = ()=>`<div class="eyebrow">Logiciels</div><h1>Logiciels de diagnostic</h1>
 <p class="lede">La sélection à installer sur le poste de l'atelier et à garder sur la clé Ventoy.</p>
 <input class="search" id="tq" type="search" placeholder="Filtrer : disque, réseau, iPhone, ADB…">
 <div class="grid g3" id="tlist"></div>`;
AFTER.outils = ()=>{
  const draw=()=>{const q=$("#tq").value.toLowerCase();const l=DIAGTOOLS.filter(t=>(t[0]+" "+t[1]).toLowerCase().includes(q));
    $("#tlist").innerHTML=l.length?l.map(t=>`<div class="card"><h3>${esc(t[0])}</h3><p>${esc(t[1])}</p><p style="margin-top:8px"><a href="${t[2]}" target="_blank" rel="noopener">Site officiel ↗</a></p></div>`).join(""):`<div class="card"><p>Aucun logiciel ne correspond.</p></div>`};
  $("#tq").oninput=draw;draw();
};

/* ================= Commandes ================= */
R.cmd = ()=>`<div class="eyebrow">Terminal</div><h1>Commandes utiles</h1>
 <p class="lede">Copiez puis collez dans l'Invite de commandes (en administrateur), le Terminal ou PowerShell.</p>
 ${CMDS.map(g=>`<details class="acc" open><summary>${g[0]}</summary><div class="body">${g[1].map(c=>`<div style="margin:10px 0 2px;font-size:13.5px;color:var(--muted)">${esc(c[1])}</div><div class="cmd"><code>${esc(c[0])}</code><button data-copy>Copier</button></div>`).join("")}</div></details>`).join("")}`;
AFTER.cmd = ()=>{$$("[data-copy]").forEach(b=>b.onclick=()=>copyText(b.previousElementSibling.textContent,b,b.previousElementSibling))};

/* ================= Calculateurs ================= */
R.calc = ()=>`<div class="eyebrow">Outils de calcul</div><h1>Calculateurs</h1>
 <p class="lede">Calculs courants à l'atelier, directement dans l'application.</p>
 <div class="grid g2">
  <div class="card"><h3>Sous-réseau IPv4</h3><p>Adresse et masque CIDR.</p>
   <div class="tool-in"><input id="ip" value="192.168.1.34" aria-label="Adresse IP" style="flex:1"><span>/</span><input id="cidr" type="number" min="0" max="32" value="24" aria-label="CIDR" style="width:70px"></div>
   <div class="out" id="ipout"></div></div>
  <div class="card"><h3>Usure de la batterie</h3><p>Capacité d'origine et capacité actuelle (powercfg, 3uTools, AccuBattery).</p>
   <div class="tool-in"><input id="bd" type="number" value="5000" aria-label="Capacité d'origine" style="width:110px"><span>mAh ou mWh d'origine</span></div>
   <div class="tool-in"><input id="bc" type="number" value="3900" aria-label="Capacité actuelle" style="width:110px"><span>actuels</span></div>
   <div class="out" id="bout"></div></div>
  <div class="card"><h3>Vérificateur d'IMEI</h3><p>Contrôle la somme de Luhn : détecte un IMEI mal recopié ou incohérent (15 chiffres).</p>
   <div class="tool-in"><input id="imei" value="490154203237518" aria-label="IMEI" style="flex:1" inputmode="numeric"></div>
   <div class="out" id="iout"></div></div>
  <div class="card"><h3>Loi d'Ohm</h3><p>Renseignez deux valeurs sur trois.</p>
   <div class="tool-in"><input id="ou" placeholder="Tension V" aria-label="Tension" style="width:100px"><input id="oi" placeholder="Courant A" aria-label="Courant" style="width:100px"><input id="or" placeholder="Résistance Ω" aria-label="Résistance" style="width:110px"></div>
   <div class="out" id="oout">Exemple : 5 V et 2 A → 2,5 Ω, 10 W</div></div>
 </div>`;
AFTER.calc = ()=>{
  const ipc=()=>{
    const p=$("#ip").value.trim().split(".").map(x=>x===""?NaN:Number(x)),c=Number($("#cidr").value);
    if(p.length!==4||p.some(x=>!Number.isInteger(x)||x<0||x>255)||!Number.isInteger(c)||c<0||c>32){$("#ipout").textContent="Adresse ou masque invalide. Format : 192.168.1.10 et un CIDR entre 0 et 32.";return}
    const ip=((p[0]<<24)|(p[1]<<16)|(p[2]<<8)|p[3])>>>0,m=c===0?0:(0xFFFFFFFF<<(32-c))>>>0,n=(ip&m)>>>0,b=(n|(~m>>>0))>>>0;
    const s=x=>[x>>>24,(x>>>16)&255,(x>>>8)&255,x&255].join(".");
    const h=c===32?1:c===31?2:Math.pow(2,32-c)-2;
    $("#ipout").textContent=`Réseau      ${s(n)}/${c}\nMasque      ${s(m)}\nBroadcast   ${s(b)}\nPremière IP ${c>=31?s(n):s(n+1)}\nDernière IP ${c>=31?s(b):s(b-1)}\nHôtes       ${h.toLocaleString("fr-FR")}`;
  };
  const bat=()=>{const d=+$("#bd").value,c=+$("#bc").value;if(!d||!c){$("#bout").textContent="Saisissez deux capacités.";return}const r=c/d*100;
    $("#bout").textContent=`Santé : ${r.toFixed(1)} %\nUsure : ${Math.max(0,100-r).toFixed(1)} %\nVerdict : ${r>=85?"Bonne batterie":r>=80?"Usure normale, à surveiller":"Remplacement conseillé (sous 80 %)"}`};
  const luhn=()=>{const v=$("#imei").value.replace(/\D/g,"");if(v.length!==15){$("#iout").textContent=`${v.length} chiffre(s) saisi(s) : un IMEI en compte 15.`;return}
    $("#iout").textContent=luhnOk(v)?`IMEI valide (somme de contrôle correcte)\nTAC (identifie le modèle) : ${v.slice(0,8)}\nNuméro de série : ${v.slice(8,14)}`:"IMEI invalide : la somme de contrôle ne correspond pas. Vérifiez la saisie.";};
  const ohm=()=>{const f=x=>{const n=parseFloat($(x).value.replace(",","."));return isNaN(n)?null:n};let U=f("#ou"),I=f("#oi"),Rr=f("#or");
    if(U!==null&&I!==null&&I!==0)Rr=U/I;else if(U!==null&&Rr!==null&&Rr!==0)I=U/Rr;else if(I!==null&&Rr!==null)U=I*Rr;else{$("#oout").textContent="Renseignez deux valeurs (non nulles pour le diviseur).";return}
    const fx=x=>(+x.toFixed(3)).toLocaleString("fr-FR");$("#oout").textContent=`U = ${fx(U)} V\nI = ${fx(I)} A\nR = ${fx(Rr)} Ω\nP = ${fx(U*I)} W`};
  ["#ip","#cidr"].forEach(s=>$(s).oninput=ipc);["#bd","#bc"].forEach(s=>$(s).oninput=bat);$("#imei").oninput=luhn;["#ou","#oi","#or"].forEach(s=>$(s).oninput=ohm);
  ipc();bat();luhn();
};

/* ================= BIOS ================= */
R.bios = ()=>`<div class="eyebrow">Accès & sécurité</div><h1>BIOS, mots de passe et chiffrement</h1>
 <p class="lede">Procédures officielles pour rendre l'accès à un appareil dont le client est propriétaire.</p>
 <div class="warnbox"><b>Règle d'atelier :</b> exigez une preuve de propriété (facture, pièce d'identité correspondante) avant toute levée de mot de passe. Les mots de passe BIOS des portables professionnels et les verrous de compte existent pour rendre les appareils volés inutilisables ; les constructeurs ne les lèvent qu'avec ces justificatifs.</div>
 ${BIOS.map(b=>`<details class="acc"><summary>${esc(b[0])}</summary><div class="body">${esc(b[1])}</div></details>`).join("")}`;

/* ================= Checklist ================= */
R.check = ()=>`<div class="eyebrow">Contrôle qualité</div><h1>Checklist technicien</h1>
 <p class="lede">Cochez au fur et à mesure. La progression reste enregistrée sur cet appareil.</p>
 <div class="kpis"><div class="kpi"><b id="kdone">0</b><span>points validés</span></div><div class="kpi"><b id="ktot">0</b><span>points au total</span></div><div class="kpi"><b id="kpct">0 %</b><span>progression</span></div></div>
 <div class="progress"><i id="pbar"></i></div>
 <div class="grid g2">${CHECKLIST.map((g,gi)=>`<div class="card"><h3 style="margin-bottom:8px">${g[0]}</h3>${g[1].map((it,ii)=>`<div class="check"><input type="checkbox" id="c${gi}_${ii}"><label for="c${gi}_${ii}">${esc(it)}</label></div>`).join("")}</div>`).join("")}</div>
 <div class="actions"><button class="btn ghost" id="creset">Nouvelle intervention (tout décocher)</button></div>`;
AFTER.check = ()=>{
  const saved=store.get("dl-check",{}), boxes=$$(".check input");
  boxes.forEach(b=>b.checked=!!saved[b.id]);
  const upd=()=>{const d=boxes.filter(b=>b.checked).length,t=boxes.length;$("#kdone").textContent=d;$("#ktot").textContent=t;$("#kpct").textContent=Math.round(d/t*100)+" %";$("#pbar").style.width=(d/t*100)+"%";
    const o={};boxes.forEach(b=>{if(b.checked)o[b.id]=1});store.set("dl-check",o)};
  boxes.forEach(b=>b.onchange=upd);
  $("#creset").onclick=()=>{boxes.forEach(b=>b.checked=false);upd()};
  upd();
};

/* ================= Installer ================= */
R.installer = ()=>{
  let top;
  if(DESKTOP) top=`<div class="infobox"><b>Vous utilisez DiagLab Pro pour Windows (version ${esc(window.diaglab.version||"")}).</b> Les nouvelles versions sont publiées sur <a href="${RELEASES}" target="_blank" rel="noopener">la page des versions</a> ; l'application vous prévient au démarrage.</div>`;
  else if(!PWA) top=`<div class="warnbox">Vous consultez une prévisualisation, qui ne peut pas s'installer. Ouvrez l'adresse où DiagLab Pro est hébergé (voir le fichier LISEZMOI du dossier <span class="mono">diaglab-pro</span>), puis suivez les étapes ci-dessous.</div>`;
  else if(standalone()) top=`<div class="infobox"><b>DiagLab Pro est installé sur cet appareil.</b> Il fonctionne aussi hors connexion.</div>`;
  else if(installEvt) top=`<div class="actions" style="margin:0 0 18px"><button class="btn" id="instNow">Installer DiagLab Pro sur cet appareil</button></div>`;
  else if(isIOS) top=`<div class="infobox">Sur iPhone et iPad, l'installation se fait depuis le bouton Partager (voir ci-dessous).</div>`;
  else top=`<div class="infobox">Si aucun bouton d'installation n'apparaît, utilisez le menu du navigateur comme indiqué ci-dessous (Chrome, Edge, Samsung Internet ou Safari).</div>`;
  return `<div class="eyebrow">Installation</div><h1>Installer DiagLab Pro</h1>
  <p class="lede">DiagLab Pro s'installe comme une application : icône sur l'écran d'accueil ou le bureau, fenêtre dédiée, et fonctionnement hors connexion une fois installé.</p>
  ${top}
  <div class="grid g2">
   <div class="card"><h3>Windows : application .exe</h3><p>Téléchargez <b>DiagLab-Pro-Setup</b> (installation avec raccourcis) ou <b>DiagLab-Pro-Portable</b> (sans installation, idéal sur clé USB). Elle ajoute le bouton « Analyser ce PC » dans Rapport PC.</p><p style="margin-top:10px"><a class="btn" href="${RELEASES}" target="_blank" rel="noopener">Télécharger pour Windows</a></p></div>
   <div class="card"><h3>Ordinateur (Windows, macOS, Linux) depuis le navigateur</h3><p>Avec Chrome ou Edge : cliquez sur l'icône d'installation à droite de la barre d'adresse, ou menu ⋮ → « Installer DiagLab Pro ». L'application apparaît dans le menu Démarrer ou le Launchpad. Sur Mac avec Safari 17+ : Fichier → « Ajouter au Dock ».</p></div>
   <div class="card"><h3>Android (téléphone et tablette)</h3><p>Avec Chrome : bouton « Installer » quand il apparaît, ou menu ⋮ → « Installer l'application » / « Ajouter à l'écran d'accueil ». Fonctionne aussi avec Samsung Internet et Edge.</p></div>
   <div class="card"><h3>iPhone et iPad</h3><p>Ouvrez l'adresse dans Safari, touchez Partager (carré avec une flèche) → « Sur l'écran d'accueil » → Ajouter. Depuis iOS 16.4, Chrome et Edge le proposent aussi via Partager.</p></div>
   <div class="card"><h3>Hors connexion et mises à jour</h3><p>Après la première ouverture, toutes les fiches techniques, la FAQ et le kit Rapport PC restent disponibles sans internet. Quand une nouvelle version est publiée, un message propose de recharger.</p></div>
  </div>
  <div class="infobox"><b>Vos données</b> (fiches clients, checklist, réglages) sont enregistrées sur chaque appareil séparément. Pour passer d'un appareil à l'autre, utilisez Exporter puis Importer dans <a href="#fiche">Fiches clients</a>.</div>`;
};
AFTER.installer = ()=>{const b=$("#instNow");if(b)b.onclick=doInstall};

/* ================= Démarrage ================= */
$("#themeBtn").onclick=()=>{
  const r=document.documentElement;
  const dark=r.dataset.theme?r.dataset.theme==="dark":matchMedia("(prefers-color-scheme: dark)").matches;
  r.dataset.theme=dark?"light":"dark"; store.set("dl-theme",r.dataset.theme);
};
$("#installBtn").onclick=doInstall;
const th=store.get("dl-theme",null); if(th) document.documentElement.dataset.theme=th;
state.dev=store.get("dl-dev","pc"); if(!DIAG[state.dev]) state.dev="pc";
window.DL = {R, AFTER, VIEWS, $, $$, esc, store, toast, copyText, download, go, render, state,
  DESKTOP, PWA, FULL, VERSION, draft, saveDraft, reportToDraft, luhnOk,
  getLastScan:()=>lastScan, setLastScan:j=>{lastScan=j}};
function boot(){
  if(!history.state || typeof history.state.dl!=="number"){ try{history.replaceState({dl:0},"",location.hash||"#dash")}catch(e){} }
  navIdx=(history.state&&history.state.dl)||0; if(navMax<navIdx) navMax=navIdx;
  updateInstallBtn();
  render();
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot); else boot();
if(DESKTOP && navigator.onLine){
  fetch("https://api.github.com/repos/agricyril22-cpu/DiagLab-Pro/releases/latest").then(r=>r.ok?r.json():null).then(j=>{
    if(!j||!j.tag_name) return;
    const n=v=>String(v).replace(/^v/,"").split(".").map(x=>parseInt(x,10)||0);
    const a=n(j.tag_name), b=n(window.diaglab.version);
    for(let i=0;i<3;i++){ if((a[i]||0)>(b[i]||0)){toast(`DiagLab Pro ${j.tag_name} est disponible.`,"Télécharger",()=>window.open(RELEASES,"_blank"));return} if((a[i]||0)<(b[i]||0))return }
  }).catch(()=>{});
}
})();
