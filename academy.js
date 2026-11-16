/* DiagLab Pro — Académie : parcours, cours, quiz, examen blanc CCNA, outils d'entraînement */
(function(){
"use strict";
const {R, AFTER, $, $$, esc, store, toast, go, copyText, FULL} = window.DL;
const P = ()=>Object.assign({done:{}, quiz:{}, name:"", last:null}, store.get("dl-acad",{}));
const saveP = p=>store.set("dl-acad",p);
const PASS = 70;
const md = t=>esc(t).replace(/\*\*([^*]+)\*\*/g,"<b>$1</b>");
const findMod = id=>{ for(const t of ACADEMY){ const i=t.modules.findIndex(m=>m.id===id); if(i>=0) return {t,m:t.modules[i],i}; } return null; };
let curMod=null, exam=null, examTimer=null;
const modAt={};  // numéro d'étape d'historique → module affiché
let fresh=false; // vrai pendant l'ouverture d'un module : ignorer l'éventuelle étape périmée
function openMod(id){ curMod=id; fresh=true; go("cours", true); fresh=false; if(history.state) modAt[history.state.dl]=id; }
const trackDone = (t,p)=>t.modules.every(m=>p.done[m.id] && (!m.quiz.length || (p.quiz[m.id]||0)>=PASS));

/* ---------- accueil ---------- */
R.academie = ()=>{
  const p=P(), all=ACADEMY.flatMap(t=>t.modules), nDone=all.filter(m=>p.done[m.id]).length;
  const nQuiz=all.filter(m=>m.quiz.length).length, nOk=all.filter(m=>m.quiz.length&&(p.quiz[m.id]||0)>=PASS).length;
  const nTracks=ACADEMY.filter(t=>trackDone(t,p)).length, mins=all.reduce((s,m)=>s+m.min,0);
  const last=p.last&&findMod(p.last);
  return `<div class="eyebrow">Formation</div><h1>Académie DiagLab</h1>
  <p class="lede">${ACADEMY.length} parcours, ${all.length} modules (environ ${Math.round(mins/60)} heures) : maintenance informatique et électronique, réseaux, préparation au CCNA, téléphones, imprimantes, NFC et intelligence artificielle. Chaque cours renvoie vers l'outil DiagLab qui le met en pratique. Les illustrations sont interactives : touchez un composant pour son explication.</p>
  <div class="kpis"><div class="kpi"><b>${nDone}/${all.length}</b><span>modules terminés</span></div><div class="kpi"><b>${nOk}/${nQuiz}</b><span>quiz réussis (${PASS} %)</span></div><div class="kpi"><b>${nTracks}/${ACADEMY.length}</b><span>parcours validés</span></div></div>
  ${last?`<div class="actions" style="margin:0 0 18px"><button class="btn" data-open="${last.m.id}">Reprendre : ${esc(last.m.title)}</button></div>`:""}
  <div class="tracks">${ACADEMY.map(t=>{const d=t.modules.filter(m=>p.done[m.id]).length, pct=Math.round(d/t.modules.length*100), ok=trackDone(t,p);
    return `<div class="card track"><div class="track-head"><h3>${esc(t.title)}</h3>${ok?'<span class="lvl lvl-ok">Validé</span>':`<span class="pill">${d}/${t.modules.length}</span>`}</div>
     <p>${esc(t.desc)}</p><div class="progress"><i style="width:${pct}%"></i></div>
     <ol class="modlist">${t.modules.map(m=>{const q=p.quiz[m.id]; return `<li><button class="linklike" data-open="${m.id}"><span class="mstate ${p.done[m.id]?"ok":""}" aria-hidden="true">${p.done[m.id]?"✓":""}</span><span>${esc(m.title)}</span></button><span class="fine">${m.min} min${q!=null?` · quiz ${q} %`:""}</span></li>`}).join("")}</ol>
     ${ok?`<div class="actions"><button class="btn ghost" data-cert="${t.id}">Attestation de parcours</button></div>`:""}</div>`}).join("")}</div>
  <div id="certBox"></div>`;
};
AFTER.academie = ()=>{
  $$("[data-open]").forEach(b=>b.onclick=()=>openMod(b.dataset.open));
  $$("[data-cert]").forEach(b=>b.onclick=()=>cert(b.dataset.cert));
};
function cert(tid){
  const t=ACADEMY.find(x=>x.id===tid), p=P();
  $("#certBox").innerHTML=`<h2 class="sub">Attestation</h2><div class="card noprint"><div class="form"><div class="field"><label for="certName">Nom à faire figurer</label><input id="certName" value="${esc(p.name)}"></div></div>
   <div class="actions">${FULL?'<button class="btn" id="certPrint">Imprimer / PDF</button>':""}</div>
   <p class="fine">Attestation interne de suivi du parcours DiagLab, sans valeur de certification officielle.</p></div>
   <div class="sheet cert" id="cert"></div>`;
  const draw=()=>{ const n=$("#certName").value.trim(); const pp=P(); pp.name=n; saveP(pp);
    const avg=Math.round(t.modules.filter(m=>m.quiz.length).reduce((s,m,_,a)=>s+(pp.quiz[m.id]||0)/a.length,0));
    $("#cert").innerHTML=`<div class="cert-in"><div class="eyebrow">DiagLab Pro · Académie</div><h2>Attestation de parcours</h2><p>Nous attestons que</p><p class="cert-name">${esc(n||"…")}</p><p>a suivi l'intégralité du parcours</p><p class="cert-track">${esc(t.title)}</p><p>${t.modules.length} modules · moyenne aux quiz : ${avg} % · le ${new Date().toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"})}</p></div>`; };
  $("#certName").oninput=draw; draw();
  if($("#certPrint")) $("#certPrint").onclick=()=>{ document.body.classList.add("print-cert"); window.addEventListener("afterprint",()=>document.body.classList.remove("print-cert"),{once:true}); window.print(); };
  $("#certBox").scrollIntoView({behavior:"smooth"});
}

/* ---------- blocs de cours ---------- */
function block(b,k){
  const [type,a,c]=b;
  switch(type){
    case "p": return `<p>${md(a)}</p>`;
    case "h": return `<h3 class="ch">${esc(a)}</h3>`;
    case "ul": return `<ul>${a.map(x=>`<li>${md(x)}</li>`).join("")}</ul>`;
    case "ol": return `<ol>${a.map(x=>`<li>${md(x)}</li>`).join("")}</ol>`;
    case "tip": return `<div class="infobox">${md(a)}</div>`;
    case "warn": return `<div class="warnbox">${md(a)}</div>`;
    case "cmd": return `<div class="cmdblock"><pre>${esc(a)}</pre><button class="mini" data-copy>Copier</button></div>`;
    case "table": return `<div class="tw card" style="padding:0;margin:12px 0"><table class="t"><thead><tr>${a.map(h=>`<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${c.map(r=>`<tr>${r.map(x=>`<td>${md(x)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
    case "fig": { const f=FIGS[a]; if(!f) return ""; return `<figure class="fig" data-fig="${k}"><div class="figwrap">${f.svg}</div><figcaption><b>${esc(f.cap)}</b><span class="figinfo" id="fi${k}">Touchez une zone de l'illustration pour son explication.</span></figcaption></figure>`; }
    case "tool": {
      if(a==="resistor") return toolResistor(k);
      if(a==="subnet") return `<div class="card tool-card" data-tool="subnet"><h3>Entraînement : sous-réseaux</h3><div id="sn${k}"></div></div>`;
      if(a==="ccna-exam") return `<div class="card tool-card" id="examBox"></div>`;
      if(a.startsWith("link:")){ const [,v,l]=a.split(":"); return `<a class="golink" href="#${v}">→ ${esc(l)}</a>`; }
      return "";
    }
  }
  return "";
}
const COLORS=[["noir","#111",0],["marron","#7a4a1e",1],["rouge","#d33",2],["orange","#e8741c",3],["jaune","#e8c51c",4],["vert","#2c9a4f",5],["bleu","#2a64c8",6],["violet","#7b2cbf",7],["gris","#888",8],["blanc","#f4f4f4",9]];
function toolResistor(k){
  const sel=(id,opts,v)=>`<select id="${id}" class="sel">${opts.map((o,i)=>`<option value="${i}"${i===v?" selected":""}>${o}</option>`).join("")}</select>`;
  return `<div class="card tool-card"><h3>Calculateur : code couleur des résistances</h3>
   <div class="tool-in">${sel("rb1",COLORS.map(c=>c[0]),1)}${sel("rb2",COLORS.map(c=>c[0]),0)}${sel("rbm",["×1 (noir)","×10 (marron)","×100 (rouge)","×1 k (orange)","×10 k (jaune)","×100 k (vert)","×1 M (bleu)","×0,1 (or)","×0,01 (argent)"],3)}${sel("rbt",["±1 % (marron)","±2 % (rouge)","±5 % (or)","±10 % (argent)"],2)}</div>
   <svg viewBox="0 0 300 60" class="rprev"><line x1="0" y1="30" x2="300" y2="30" stroke="#aaa" stroke-width="4"/><rect x="60" y="10" width="180" height="40" rx="18" fill="#d9c7a3"/><rect id="rc1" x="85" y="10" width="12" height="40"/><rect id="rc2" x="110" y="10" width="12" height="40"/><rect id="rc3" x="135" y="10" width="12" height="40"/><rect id="rc4" x="205" y="10" width="12" height="40"/></svg>
   <div class="out" id="rout"></div>
   <h4 style="margin:14px 0 4px">Marquage CMS</h4><div class="tool-in"><input id="smd" value="472" class="mono" style="width:120px" aria-label="Code CMS"><span class="out" id="smdout" style="margin:0;flex:1"></span></div></div>`;
}
function bindResistor(){
  if(!$("#rb1")) return;
  const mult=[1,10,100,1e3,1e4,1e5,1e6,0.1,0.01], tol=["±1 %","±2 %","±5 %","±10 %"], tcol=["#7a4a1e","#d33","#c9a43a","#c0c0c0"], mcol=[...COLORS.slice(0,7).map(c=>c[1]),"#c9a43a","#c0c0c0"];
  const fmt=v=>v>=1e6?(v/1e6).toLocaleString("fr-FR")+" MΩ":v>=1e3?(v/1e3).toLocaleString("fr-FR")+" kΩ":v.toLocaleString("fr-FR")+" Ω";
  const upd=()=>{ const a=+$("#rb1").value,b=+$("#rb2").value,m=+$("#rbm").value,t=+$("#rbt").value;
    $("#rc1").setAttribute("fill",COLORS[a][1]);$("#rc2").setAttribute("fill",COLORS[b][1]);$("#rc3").setAttribute("fill",mcol[m]);$("#rc4").setAttribute("fill",tcol[t]);
    $("#rout").textContent=`${fmt(+((a*10+b)*mult[m]).toPrecision(6))} ${tol[t]}`; };
  const smd=()=>{ const s=$("#smd").value.trim().toUpperCase(); let v=null;
    if(/^\d*R\d+$|^\d+R\d*$/.test(s)) v=parseFloat(s.replace("R","."));
    else if(/^\d{3}$/.test(s)) v=parseInt(s.slice(0,2))*Math.pow(10,+s[2]);
    else if(/^\d{4}$/.test(s)) v=parseInt(s.slice(0,3))*Math.pow(10,+s[3]);
    $("#smdout").textContent=v==null?"Format : 3 chiffres (472), 4 chiffres (4701) ou avec R (4R7)":"= "+fmt(+v.toPrecision(6)); };
  ["#rb1","#rb2","#rbm","#rbt"].forEach(s=>$(s).onchange=upd); $("#smd").oninput=smd; upd(); smd();
}
function bindSubnet(box){
  const ip2s=x=>[x>>>24,(x>>>16)&255,(x>>>8)&255,x&255].join(".");
  let q, score=store.get("dl-subnet",{ok:0,n:0});
  const gen=()=>{ const c=Math.floor(Math.random()*9)+22, base=[10,172,192][Math.floor(Math.random()*3)];
    const ip=((base<<24)|((base===172?16+Math.floor(Math.random()*16):base===192?168:Math.floor(Math.random()*256))<<16)|(Math.floor(Math.random()*256)<<8)|Math.floor(Math.random()*256))>>>0;
    const m=(0xFFFFFFFF<<(32-c))>>>0, n=(ip&m)>>>0, b=(n|(~m>>>0))>>>0; q={ip,c,n,b,h:Math.pow(2,32-c)-2}; draw(); };
  const draw=()=>{ box.innerHTML=`<p>Pour l'adresse <b class="mono">${ip2s(q.ip)}/${q.c}</b>, trouvez :</p>
    <div class="form"><div class="field"><label>Adresse réseau</label><input class="mono" data-a="n"></div><div class="field"><label>Adresse de diffusion</label><input class="mono" data-a="b"></div><div class="field"><label>Hôtes utilisables</label><input class="mono" data-a="h" inputmode="numeric"></div></div>
    <div class="actions"><button class="btn" data-sn="check">Vérifier</button><button class="btn ghost" data-sn="new">Autre adresse</button><span class="pill">${score.ok}/${score.n} réussis</span></div><div class="out" data-sn="out" hidden></div>`;
    box.querySelector('[data-sn="new"]').onclick=gen;
    box.querySelector('[data-sn="check"]').onclick=()=>{ const v=k=>box.querySelector(`[data-a="${k}"]`).value.trim();
      const ok={n:v("n")===ip2s(q.n), b:v("b")===ip2s(q.b), h:v("h").replace(/\s/g,"")===String(q.h)}; const all=ok.n&&ok.b&&ok.h;
      score.n++; if(all) score.ok++; store.set("dl-subnet",score);
      const o=box.querySelector('[data-sn="out"]'); o.hidden=false; o.className="out "+(all?"good":"bad");
      const oct=q.c>=24?4:q.c>=16?3:2, inOct=Math.pow(2,(oct*8)-q.c);
      o.textContent=(all?"✔ Tout est juste.":"✘ À revoir.")+`\nRéseau ${ip2s(q.n)} · diffusion ${ip2s(q.b)} · ${q.h.toLocaleString("fr-FR")} hôtes (2^${32-q.c} − 2)\nMéthode : le masque /${q.c} découpe le ${oct}e octet en blocs de ${inOct} ; le réseau est le multiple de ${inOct} juste inférieur.`;
      box.querySelector(".pill").textContent=`${score.ok}/${score.n} réussis`; };
  };
  gen();
}
function quizHTML(m){
  if(!m.quiz.length) return "";
  const best=P().quiz[m.id];
  return `<h2 class="sub">Quiz${best!=null?` <span class="pill">meilleur score ${best} %</span>`:""}</h2><div class="card" id="quiz">${m.quiz.map((q,i)=>`<fieldset class="qq" data-q="${i}"><legend>${i+1}. ${esc(q[0])}</legend>${q[1].map((o,j)=>`<label class="qopt"><input type="radio" name="q${i}" value="${j}"> ${esc(o)}</label>`).join("")}<p class="qexp" hidden></p></fieldset>`).join("")}
   <div class="actions"><button class="btn" id="qGo">Valider mes réponses</button><span class="out" id="qRes" hidden style="margin:0"></span></div></div>`;
}

/* ---------- lecteur de cours ---------- */
R.cours = ()=>{
  if(!fresh && history.state && modAt[history.state.dl]) curMod=modAt[history.state.dl];
  const f=findMod(curMod||(P().last)||"pc1")||findMod("pc1"); curMod=f.m.id;
  const p=P(); p.last=f.m.id; saveP(p);
  const prev=f.t.modules[f.i-1], next=f.t.modules[f.i+1];
  return `<div class="eyebrow"><a href="#academie">Académie</a> · ${esc(f.t.title)} · module ${f.i+1}/${f.t.modules.length}</div>
  <h1>${esc(f.m.title)}</h1><p class="lede">Durée estimée : ${f.m.min} minutes.${p.done[f.m.id]?" Module terminé.":""}</p>
  <article class="course">${f.m.body.map((b,k)=>block(b,k)).join("")}</article>
  ${quizHTML(f.m)}
  <div class="actions coursenav">
   ${prev?`<button class="btn ghost" data-open="${prev.id}">← ${esc(prev.title)}</button>`:""}
   <button class="btn" id="mDone">${p.done[f.m.id]?"Terminé ✓":"J'ai terminé ce module"}</button>
   <button class="btn ghost" id="mIa">Demander à l'IA d'expliquer</button>
   ${next?`<button class="btn ghost" data-open="${next.id}">${esc(next.title)} →</button>`:`<a class="btn ghost" href="#academie">Retour aux parcours</a>`}
  </div>`;
};
AFTER.cours = ()=>{
  const f=findMod(curMod);
  $$("[data-open]").forEach(b=>b.onclick=()=>openMod(b.dataset.open));
  $$("[data-copy]").forEach(b=>b.onclick=()=>copyText(b.previousElementSibling.textContent,b,b.previousElementSibling));
  $$("figure.fig").forEach(fg=>{ const info=$("#fi"+fg.dataset.fig);
    fg.querySelectorAll(".hot").forEach(h=>{ const show=()=>{ fg.querySelectorAll(".hot.on").forEach(x=>x.classList.remove("on")); h.classList.add("on"); info.innerHTML=`<b>${esc(h.dataset.t)}</b> — ${esc(h.dataset.d)}`; };
      h.onclick=show; h.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();show()}}; }); });
  bindResistor();
  $$('[data-tool="subnet"]').forEach(c=>bindSubnet(c.querySelector("div")));
  if($("#examBox")) examView();
  $("#mDone").onclick=()=>{ const p=P(); p.done[f.m.id]=true; saveP(p); toast("Module terminé."); DL.render(); };
  $("#mIa").onclick=()=>{ store.set("dl-ia-prefill",`J'étudie le cours « ${f.m.title} » (${f.t.title}). Explique-moi simplement les points essentiels, avec un exemple concret d'atelier, puis pose-moi 3 questions pour vérifier ma compréhension.`); go("ia"); };
  if($("#qGo")) $("#qGo").onclick=()=>{
    let ok=0; f.m.quiz.forEach((q,i)=>{ const fs=$(`[data-q="${i}"]`), sel=fs.querySelector("input:checked"), good=sel&&+sel.value===q[2];
      if(good) ok++; fs.classList.toggle("good",!!good); fs.classList.toggle("bad",!good);
      fs.querySelectorAll(".qopt").forEach((l,j)=>l.classList.toggle("right",j===q[2]));
      const e=fs.querySelector(".qexp"); e.hidden=false; e.textContent=(good?"✔ ":"✘ ")+q[3]; });
    const pct=Math.round(ok/f.m.quiz.length*100), p=P(); p.quiz[f.m.id]=Math.max(p.quiz[f.m.id]||0,pct); if(pct>=PASS) p.done[f.m.id]=true; saveP(p);
    const r=$("#qRes"); r.hidden=false; r.className="out "+(pct>=PASS?"good":"bad"); r.textContent=`${ok}/${f.m.quiz.length} (${pct} %) — ${pct>=PASS?"réussi, module validé":"à retravailler ("+PASS+" % requis)"}`;
    $("#mDone").textContent=p.done[f.m.id]?"Terminé ✓":"J'ai terminé ce module";
  };
};

/* ---------- examen blanc CCNA ---------- */
function bank(){ const t=ACADEMY.find(x=>x.id==="ccna"); return [...t.modules.flatMap(m=>m.quiz.map(q=>({q,dom:m.title}))), ...CCNA_EXTRA.map(q=>({q,dom:"Questions complémentaires"}))]; }
function examView(){
  const box=$("#examBox"); if(!box) return;
  if(!exam){ const best=P().quiz["ccna-exam"];
    box.innerHTML=`<h3>Examen blanc</h3><p>${bank().length} questions dans la banque. ${best!=null?`Meilleur score : <b>${best} %</b>.`:""}</p><div class="actions"><button class="btn" id="exStart">Commencer (30 questions, 45 min)</button></div>`;
    $("#exStart").onclick=()=>{ const b=bank().sort(()=>Math.random()-.5).slice(0,30); exam={qs:b,i:0,ans:[],end:Date.now()+45*60000}; clearInterval(examTimer); examTimer=setInterval(tick,1000); examView(); };
    return; }
  if(exam.i>=exam.qs.length || Date.now()>exam.end) return examEnd();
  const {q,dom}=exam.qs[exam.i];
  box.innerHTML=`<div class="exhead"><span class="pill">Question ${exam.i+1}/${exam.qs.length}</span><span class="pill" id="exClock"></span><span class="fine">${esc(dom)}</span></div>
   <fieldset class="qq"><legend>${esc(q[0])}</legend>${q[1].map((o,j)=>`<label class="qopt"><input type="radio" name="ex" value="${j}"> ${esc(o)}</label>`).join("")}</fieldset>
   <div class="actions"><button class="btn" id="exNext">Valider et continuer</button><button class="btn ghost" id="exStop">Abandonner</button></div>`;
  tick();
  $("#exNext").onclick=()=>{ const s=box.querySelector("input:checked"); if(!s){toast("Choisissez une réponse (pas de retour en arrière).");return} exam.ans.push(+s.value); exam.i++; examView(); };
  $("#exStop").onclick=()=>{ exam=null; clearInterval(examTimer); examView(); };
}
function tick(){ const c=$("#exClock"); if(!exam){clearInterval(examTimer);return} const left=Math.max(0,exam.end-Date.now()); if(c) c.textContent=`${Math.floor(left/60000)}:${String(Math.floor(left/1000)%60).padStart(2,"0")} restantes`; if(!left){ clearInterval(examTimer); if($("#examBox")) examEnd(); } }
function examEnd(){
  clearInterval(examTimer);
  const box=$("#examBox"), e=exam; exam=null; if(!box||!e) return;
  const res=e.qs.map((x,i)=>({...x,a:e.ans[i],ok:e.ans[i]===x.q[2]})), ok=res.filter(r=>r.ok).length, pct=Math.round(ok/e.qs.length*100);
  const p=P(); p.quiz["ccna-exam"]=Math.max(p.quiz["ccna-exam"]||0,pct); saveP(p);
  const doms={}; res.forEach(r=>{ doms[r.dom]=doms[r.dom]||[0,0]; doms[r.dom][1]++; if(r.ok) doms[r.dom][0]++; });
  box.innerHTML=`<h3>Résultat : ${ok}/${e.qs.length} (${pct} %)</h3><p class="${pct>=85?"tst r-pass":"tst r-fail"}">${pct>=85?"Niveau attendu pour l'examen atteint.":"Objectif 85 % : retravaillez les domaines les plus faibles."}</p>
   <div class="tw" style="margin:10px 0"><table class="t"><thead><tr><th>Domaine</th><th>Score</th></tr></thead><tbody>${Object.entries(doms).map(([d,[a,n]])=>`<tr><td>${esc(d)}</td><td class="num">${a}/${n}</td></tr>`).join("")}</tbody></table></div>
   ${res.filter(r=>!r.ok).length?`<details class="acc"><summary>Revoir les ${res.filter(r=>!r.ok).length} erreur(s)</summary><div class="body">${res.filter(r=>!r.ok).map(r=>`<p><b>${esc(r.q[0])}</b><br>Votre réponse : ${r.a==null?"aucune (temps écoulé)":esc(r.q[1][r.a])}<br>Bonne réponse : ${esc(r.q[1][r.q[2]])}<br><span class="fine">${esc(r.q[3])}</span></p>`).join("")}</div></details>`:""}
   <div class="actions"><button class="btn" id="exAgain">Nouvel examen</button></div>`;
  $("#exAgain").onclick=()=>examView();
}
window.addEventListener("popstate",()=>{ if(exam && !$("#examBox")){ /* examen abandonné en quittant la page */ exam=null; clearInterval(examTimer); } });
window.DLAcademy = { open:openMod };
})();
