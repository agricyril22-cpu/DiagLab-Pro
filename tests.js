/* DiagLab Pro — tests matériels exécutés sur l'appareil qui ouvre l'application */
(function(){
"use strict";
const {R, AFTER, $, $$, esc, store, toast, go} = window.DL;
const MOBILE = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform==="MacIntel" && navigator.maxTouchPoints>1);
const KIND = MOBILE ? "phone" : "pc";

/* [id, nom, ce que ça vérifie, composants téléphone, composants ordinateur] */
const TESTS = [
 ["info","Informations de l'appareil","Modèle, système, écran, processeur, mémoire, puce graphique.",[],[]],
 ["ecran","Écran : pixels et couleurs","Pixels morts, taches, teinte, rétroéclairage.",["dispconn"],["display"]],
 ["tactile","Tactile","Zones mortes et nombre de doigts reconnus.",["dispconn"],["display"]],
 ["hp","Haut-parleurs","Gauche, droite, grave et aigu.",["speaker","audio"],["audio"]],
 ["micro","Micro","Niveau sonore et enregistrement réécouté.",["mic","audio"],["audio"]],
 ["camera","Caméras","Chaque caméra, avant et arrière.",["camrear","frontcam"],[]],
 ["vibreur","Vibreur","Moteur de vibration.",["vibrator"],[]],
 ["capteurs","Capteurs de mouvement","Accéléromètre et gyroscope.",["sensors"],[]],
 ["batterie","Batterie et charge","Niveau et détection du chargeur.",["battery","port","chargeic"],["battery","psu"]],
 ["boutons","Boutons et clavier","Chaque touche détectée s'affiche.",["buttons"],["keyboard"]],
 ["reseau","Réseau et internet","Connexion, latence, débit.",["wifi"],["lan"]],
 ["nfc","NFC","Lecture d'un tag ou d'une carte sans contact.",["nfc"],[]],
 ["gps","Localisation (GPS)","Position et précision.",["wifi"],[]]
];
const T = id=>TESTS.find(t=>t[0]===id);
const LBL = {pass:"Fonctionne", fail:"Défaillant", skip:"Non testé"};

let session = store.get("dl-tests-cur", null);
const newSession = ()=>({date:new Date().toLocaleString("fr-FR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}), kind:KIND, info:{}, results:{}});
const saveSession = ()=>{ store.set("dl-tests-cur",session); store.set("dl-tests",session); };

let cleanup = [];
const clean = ()=>{ cleanup.forEach(f=>{try{f()}catch(e){}}); cleanup=[]; const o=$("#ovl"); if(o) o.remove(); if(document.fullscreenElement) document.exitFullscreen().catch(()=>{}); };

function verdict(id, st, note){
  if(!session) session=newSession();
  const t=T(id);
  session.results[id]={st, note:note||"", name:t[1], parts: KIND==="phone"?t[3]:t[4]};
  saveSession();
  if(window.DLBoard && st!=="skip") DLBoard.applyTests({[id]:session.results[id]}, KIND);
}

/* ---------- vue ---------- */
let current=null, queue=[];
R.tests = ()=>{
  const res=(session&&session.results)||{};
  const done=Object.keys(res).length, fails=Object.values(res).filter(r=>r.st==="fail");
  return `<div class="eyebrow">Tests matériels</div><h1>Tests de l'appareil</h1>
  <p class="lede">Ouvrez DiagLab Pro <b>sur l'appareil à tester</b> (le téléphone ou la tablette du client, ou ce PC), puis lancez les tests. Chaque résultat met à jour le <a href="#dash">tableau de bord</a>. ${MOBILE?"Appareil mobile détecté.":"Ordinateur détecté : les tests vibreur, capteurs et GPS concernent surtout les téléphones."}</p>
  <div class="actions" style="margin:0 0 16px">
    <button class="btn" id="tAll">${done?"Reprendre les tests":"Lancer tous les tests"}</button>
    ${done?'<button class="btn ghost" id="tNew">Nouvelle série de tests</button>':""}
  </div>
  <div id="stage"></div>
  <div class="grid g3" id="tlist">${TESTS.map(t=>{const r=res[t[0]];return `<button class="pick tcard" data-test="${t[0]}"><span class="t">${t[1]}</span><span class="s">${t[2]}</span>
    <span class="tst ${r?"r-"+r.st:""}">${r?LBL[r.st]+(r.note?" · "+esc(r.note):""):"À faire"}</span></button>`}).join("")}</div>
  ${done?summary():""}`;
};
function summary(){
  const res=session.results, fails=Object.entries(res).filter(([,r])=>r.st==="fail");
  const kind=session.kind||KIND;
  const fixes=[...new Set(fails.flatMap(([,r])=>r.parts||[]))].map(id=>BOARDS[kind].parts.find(p=>p[0]===id)).filter(Boolean);
  return `<h2 class="sub">Résultat</h2>
  <div class="card">
   <p><b>${Object.values(res).filter(r=>r.st==="pass").length}</b> réussi(s), <b>${fails.length}</b> défaillant(s), <b>${Object.values(res).filter(r=>r.st==="skip").length}</b> non testé(s) — série du ${esc(session.date)}${session.info&&session.info.modele?" · "+esc(session.info.modele):""}.</p>
   ${fixes.length?`<div class="findings">${fixes.map(p=>`<div class="finding"><span class="lvl lvl-critique">À réparer</span><div><b>${esc(p[1].replace(/\n/g," "))}</b><div class="adv">Tester : ${esc(p[8])}</div><div>${esc(p[9])}</div></div></div>`).join("")}</div>`:`<p style="margin-top:8px">Aucun composant défaillant parmi les tests effectués.</p>`}
   <div class="actions"><button class="btn" id="tDash">Voir sur le tableau de bord</button><button class="btn ghost" id="tFiche">Ajouter à la fiche</button><button class="btn ghost" id="tIa" ${fails.length?"":"disabled"}>Demander à l'IA</button></div>
  </div>`;
}
AFTER.tests = ()=>{
  current=null;
  $$("[data-test]").forEach(b=>b.onclick=()=>{queue=[]; start(b.dataset.test)});
  $("#tAll").onclick=()=>{ if(!session) session=newSession(); queue=TESTS.map(t=>t[0]).filter(id=>!session.results[id]); if(!queue.length) queue=TESTS.map(t=>t[0]); start(queue.shift()); };
  if($("#tNew")) $("#tNew").onclick=()=>{session=newSession();saveSession();DL.render()};
  if($("#tDash")) $("#tDash").onclick=()=>go("dash");
  if($("#tFiche")) $("#tFiche").onclick=()=>{
    const d=DL.draft(), res=session.results;
    const txt="Tests de l'appareil ("+session.date+") :\n"+Object.values(res).map(r=>`- ${r.name} : ${LBL[r.st]}${r.note?" ("+r.note+")":""}`).join("\n");
    d.diagnostic=d.diagnostic?d.diagnostic+"\n\n"+txt:txt;
    if(!d.modele && session.info.modele) d.modele=session.info.modele;
    if(!d.type) d.type=MOBILE?"Smartphone":"Ordinateur portable";
    DL.saveDraft(d); go("fiche"); setTimeout(()=>toast("Résultats des tests ajoutés à la fiche."),50);
  };
  if($("#tIa")) $("#tIa").onclick=()=>{
    const res=session.results;
    store.set("dl-ia-prefill",`Tests effectués sur ${session.info.modele||"l'appareil"} (${session.info.systeme||""}). Tests défaillants :\n`+Object.values(res).filter(r=>r.st==="fail").map(r=>`- ${r.name}${r.note?" : "+r.note:""}`).join("\n")+"\nQuelles réparations proposer, et dans quel ordre ?");
    go("ia");
  };
};

function start(id){
  clean(); if(!session) session=newSession();
  current=id; const t=T(id);
  const st=$("#stage"); if(!st) return;
  st.innerHTML=`<div class="card stage"><div class="stage-head"><h3>${esc(t[1])}</h3><span class="pill">${queue.length?queue.length+" test(s) ensuite":"test seul"}</span></div><div id="sbody"></div>
   <div class="actions" id="sverdict"><button class="btn ok" data-v="pass">Fonctionne</button><button class="btn danger" data-v="fail">Défaillant</button><button class="btn ghost" data-v="skip">Passer</button><button class="btn ghost" data-v="stop">Arrêter</button></div></div>`;
  st.scrollIntoView({behavior:"smooth",block:"start"});
  $$("#sverdict [data-v]").forEach(b=>b.onclick=()=>finish(b.dataset.v));
  (RUN[id]||(()=>{}))($("#sbody"));
}
function finish(v, note){
  const id=current; const n=note || ($("#snote")&&$("#snote").dataset.note) || "";
  clean();
  if(v==="stop"){ queue=[]; DL.render(); return; }
  verdict(id, v, n);
  if(queue.length){ const nx=queue.shift(); DL.render(); start(nx); } else { DL.render(); toast("Tests terminés."); const s=$(".sub"); if(s) s.scrollIntoView({behavior:"smooth"}); }
}
const setNote = t=>{ let n=$("#snote"); if(!n){ n=document.createElement("p"); n.id="snote"; n.className="fine"; $("#sbody").appendChild(n);} n.dataset.note=t; n.textContent="Constat : "+t; };
function overlay(){ const o=document.createElement("div"); o.id="ovl"; o.className="ovl"; document.body.appendChild(o); if(o.requestFullscreen) o.requestFullscreen().catch(()=>{}); return o; }

/* ---------- tests ---------- */
const RUN = {};

RUN.info = async el=>{
  const ua=navigator.userAgent, i={};
  i.systeme = /Windows NT 10/.test(ua)?"Windows 10/11":/Android ([\d.]+)/.test(ua)?"Android "+RegExp.$1:/(iPhone|iPad).*OS ([\d_]+)/.test(ua)?"iOS "+RegExp.$2.replace(/_/g,"."):/Mac OS X/.test(ua)?"macOS":/Linux/.test(ua)?"Linux":"Inconnu";
  try{ if(navigator.userAgentData && navigator.userAgentData.getHighEntropyValues){ const h=await navigator.userAgentData.getHighEntropyValues(["model","platform","platformVersion"]); if(h.model) i.modele=h.model; if(h.platform==="Windows") i.systeme = parseInt(h.platformVersion)>=13 ? "Windows 11" : "Windows 10"; else if(h.platform==="Android" && h.platformVersion) i.systeme="Android "+h.platformVersion; } }catch(e){}
  if(!i.modele && /iPhone/.test(ua)) i.modele="iPhone (modèle exact : Réglages → Général → Informations)";
  if(!i.modele && /iPad|Macintosh/.test(ua) && navigator.maxTouchPoints>1) i.modele="iPad";
  i.ecran = `${screen.width} × ${screen.height} (${Math.round(screen.width*devicePixelRatio)} × ${Math.round(screen.height*devicePixelRatio)} pixels réels)`;
  i.coeurs = navigator.hardwareConcurrency || "?";
  i.memoire = navigator.deviceMemory ? "≥ "+navigator.deviceMemory+" Go" : "non communiquée par le navigateur";
  try{ const c=document.createElement("canvas").getContext("webgl"); const d=c&&c.getExtension("WEBGL_debug_renderer_info"); i.gpu = d ? c.getParameter(d.UNMASKED_RENDERER_WEBGL) : "non communiquée"; }catch(e){ i.gpu="non communiquée"; }
  i.tactile = navigator.maxTouchPoints ? navigator.maxTouchPoints+" points" : "non";
  try{ if(navigator.getBattery){ const b=await navigator.getBattery(); i.batterie=Math.round(b.level*100)+" %"+(b.charging?" (en charge)":""); } }catch(e){}
  const cn=navigator.connection; if(cn) i.connexion=[cn.type,cn.effectiveType,cn.downlink?cn.downlink+" Mb/s":""].filter(Boolean).join(" · ");
  i.langue=navigator.language; i.navigateur=/Edg\//.test(ua)?"Edge":/SamsungBrowser/.test(ua)?"Samsung Internet":/Chrome\//.test(ua)?"Chrome":/Firefox\//.test(ua)?"Firefox":/Safari\//.test(ua)?"Safari":"autre";
  session.info=i; saveSession();
  const L={modele:"Modèle",systeme:"Système",navigateur:"Navigateur",ecran:"Écran",coeurs:"Cœurs processeur",memoire:"Mémoire vive",gpu:"Puce graphique",tactile:"Tactile",batterie:"Batterie",connexion:"Connexion",langue:"Langue"};
  el.innerHTML=`<dl class="kv">${Object.keys(L).filter(k=>i[k]!=null).map(k=>`<dt>${L[k]}</dt><dd>${esc(i[k])}</dd>`).join("")}</dl>
   <p class="fine">Le modèle exact n'est communiqué que par Chrome et Edge sur Android et Windows. Sur iPhone, le navigateur le masque.</p>`;
  setNote(i.modele?("Modèle "+i.modele):"Informations relevées");
};

RUN.ecran = el=>{
  el.innerHTML=`<p>L'écran va passer en plein écran et afficher des couleurs unies. Touchez ou cliquez pour passer à la couleur suivante, et cherchez les pixels morts (points fixes), les taches et les zones plus sombres.</p><div class="actions"><button class="btn" id="go">Démarrer</button></div>`;
  $("#go").onclick=()=>{
    const cols=["#000000","#ffffff","#ff0000","#00ff00","#0000ff","#808080","linear-gradient(90deg,#000,#fff)"];
    const o=overlay(); let k=0;
    const show=()=>{ o.style.background=cols[k]; o.innerHTML=k===0?`<div class="ovl-hint">Touchez pour la couleur suivante (${cols.length} écrans)</div>`:""; };
    show();
    o.onclick=()=>{ k++; if(k>=cols.length){ clean(); setNote("Contrôle visuel terminé : choisissez le résultat"); return; } show(); };
  };
};

RUN.tactile = el=>{
  el.innerHTML=`<p>Passez le doigt sur toute la surface pour colorer chaque case. Posez ensuite plusieurs doigts à la fois pour compter les points reconnus. Une case qui reste grise signale une zone morte.</p><div class="actions"><button class="btn" id="go">Démarrer</button></div>`;
  $("#go").onclick=()=>{
    const o=overlay(); o.style.background="#111";
    const W=window.innerWidth, H=window.innerHeight, size=Math.max(36,Math.round(Math.min(W,H)/9));
    const cols=Math.ceil(W/size), rows=Math.ceil(H/size), total=cols*rows, hit=new Set(), ptrs=new Set(); let maxP=0;
    o.innerHTML=`<canvas id="tc" width="${W}" height="${H}" style="touch-action:none;display:block"></canvas><div class="ovl-bar"><span id="tcp">0 %</span><span id="tcm">0 doigt</span><button id="tcq">Terminer</button></div>`;
    const c=$("#tc"), g=c.getContext("2d");
    const draw=()=>{ g.clearRect(0,0,W,H); for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){ g.fillStyle=hit.has(y*cols+x)?"#1f8a4c":"#2a3642"; g.fillRect(x*size+1,y*size+1,size-2,size-2);} };
    draw();
    const mark=e=>{ const x=Math.floor(e.clientX/size), y=Math.floor(e.clientY/size); if(x>=0&&y>=0&&x<cols&&y<rows&&!hit.has(y*cols+x)){ hit.add(y*cols+x); g.fillStyle="#1f8a4c"; g.fillRect(x*size+1,y*size+1,size-2,size-2); $("#tcp").textContent=Math.round(hit.size/total*100)+" %"; if(hit.size===total) end(); } };
    c.onpointerdown=e=>{ ptrs.add(e.pointerId); maxP=Math.max(maxP,ptrs.size); $("#tcm").textContent=maxP+(maxP>1?" doigts":" doigt"); mark(e); };
    c.onpointermove=e=>{ if(e.buttons||e.pointerType==="touch") mark(e); };
    c.onpointerup=c.onpointercancel=e=>ptrs.delete(e.pointerId);
    const end=()=>{ const pct=Math.round(hit.size/total*100); clean(); setNote(`${pct} % de la surface réagit, ${maxP} point(s) simultané(s)`); if(pct===100) toast("Toute la surface réagit."); };
    $("#tcq").onclick=e=>{ e.stopPropagation(); end(); };
  };
};

RUN.hp = el=>{
  el.innerHTML=`<p>Écoutez chaque son. Un grésillement, un son faible ou absent d'un côté indique un haut-parleur ou une grille à contrôler. Montez le volume.</p>
   <div class="actions"><button class="btn ghost" data-pan="-1">Gauche</button><button class="btn ghost" data-pan="1">Droite</button><button class="btn ghost" data-pan="0">Les deux</button><button class="btn ghost" id="sweep">Balayage grave → aigu</button></div>`;
  let ctx=null; const ac=()=>{ if(!ctx){ ctx=new (window.AudioContext||window.webkitAudioContext)(); cleanup.push(()=>ctx.close()); } return ctx; };
  const tone=(pan,f0,f1,dur)=>{ const a=ac(), o=a.createOscillator(), g=a.createGain(), p=a.createStereoPanner?a.createStereoPanner():null; o.frequency.setValueAtTime(f0,a.currentTime); if(f1) o.frequency.exponentialRampToValueAtTime(f1,a.currentTime+dur); g.gain.setValueAtTime(0.0001,a.currentTime); g.gain.exponentialRampToValueAtTime(0.35,a.currentTime+0.05); g.gain.exponentialRampToValueAtTime(0.0001,a.currentTime+dur); if(p){p.pan.value=pan;o.connect(g).connect(p).connect(a.destination)}else o.connect(g).connect(a.destination); o.start(); o.stop(a.currentTime+dur+0.05); };
  $$("[data-pan]").forEach(b=>b.onclick=()=>{tone(+b.dataset.pan,440,0,1.2); setNote("Sons joués : choisissez le résultat")});
  $("#sweep").onclick=()=>{tone(0,60,12000,6); setNote("Balayage joué : choisissez le résultat")};
};

RUN.micro = async el=>{
  el.innerHTML=`<p>Parlez près du micro : la barre doit bouger. Enregistrez ensuite 4 secondes et réécoutez.</p><div class="meter"><i id="lvl"></i></div>
   <div class="actions"><button class="btn ghost" id="rec">Enregistrer 4 s</button><select id="mics" class="sel" hidden aria-label="Micro"></select></div><audio id="play" controls hidden></audio>`;
  let stream=null, ctx=null, raf=0;
  const startMic=async(devId)=>{
    if(stream) stream.getTracks().forEach(t=>t.stop());
    try{ stream=await navigator.mediaDevices.getUserMedia({audio:devId?{deviceId:{exact:devId}}:true}); }
    catch(e){ el.insertAdjacentHTML("beforeend",`<div class="warnbox">Accès au micro impossible (${esc(e.name)}). Autorisez le micro dans le navigateur, ou indiquez « Défaillant » si aucun micro n'est détecté.</div>`); setNote("Micro inaccessible : "+e.name); return; }
    if(!ctx){ ctx=new (window.AudioContext||window.webkitAudioContext)(); }
    const an=ctx.createAnalyser(); an.fftSize=512; ctx.createMediaStreamSource(stream).connect(an);
    const buf=new Uint8Array(an.fftSize); let peak=0;
    cancelAnimationFrame(raf);
    const loop=()=>{ an.getByteTimeDomainData(buf); let m=0; for(const v of buf) m=Math.max(m,Math.abs(v-128)); peak=Math.max(peak,m); const l=$("#lvl"); if(!l) return; l.style.width=Math.min(100,m/1.28*1.6)+"%"; if(peak>20) setNote("Le micro capte le son"); raf=requestAnimationFrame(loop); };
    loop();
    const devs=(await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==="audioinput");
    const s=$("#mics"); if(s && devs.length>1){ s.hidden=false; s.innerHTML=devs.map((d,k)=>`<option value="${esc(d.deviceId)}">${esc(d.label||"Micro "+(k+1))}</option>`).join(""); s.onchange=()=>startMic(s.value); }
  };
  cleanup.push(()=>{cancelAnimationFrame(raf); if(stream) stream.getTracks().forEach(t=>t.stop()); if(ctx) ctx.close();});
  await startMic();
  $("#rec").onclick=()=>{
    if(!stream || !window.MediaRecorder){ toast("Enregistrement non pris en charge ici."); return; }
    const mr=new MediaRecorder(stream), chunks=[]; mr.ondataavailable=e=>chunks.push(e.data);
    mr.onstop=()=>{ const a=$("#play"); if(!a) return; a.src=URL.createObjectURL(new Blob(chunks,{type:mr.mimeType})); a.hidden=false; a.play().catch(()=>{}); $("#rec").textContent="Enregistrer 4 s"; };
    mr.start(); $("#rec").textContent="Enregistrement…"; setTimeout(()=>mr.state!=="inactive"&&mr.stop(),4000);
  };
};

RUN.camera = async el=>{
  el.innerHTML=`<div class="chips" id="cams"></div><video id="vid" class="vid" playsinline autoplay muted></video><p class="fine">Vérifiez la netteté, les taches, les lignes et l'autofocus en approchant un objet.</p>`;
  let stream=null; cleanup.push(()=>{ if(stream) stream.getTracks().forEach(t=>t.stop()); });
  const open=async(c)=>{ if(stream) stream.getTracks().forEach(t=>t.stop());
    try{ stream=await navigator.mediaDevices.getUserMedia({video:c}); const v=$("#vid"); if(v){ v.srcObject=stream; } setNote("Image reçue de "+((stream.getVideoTracks()[0]||{}).label||"la caméra")); }
    catch(e){ el.insertAdjacentHTML("beforeend",`<div class="warnbox">Caméra inaccessible (${esc(e.name)}). Autorisez la caméra, ou indiquez « Défaillant ».</div>`); setNote("Caméra inaccessible : "+e.name); return false; } return true; };
  if(!navigator.mediaDevices){ el.innerHTML=`<div class="warnbox">Ce navigateur ne donne pas accès aux caméras.</div>`; return; }
  if(!(await open({facingMode:"environment"}))) return;
  const cams=(await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==="videoinput");
  const box=$("#cams"); if(box) { box.innerHTML=cams.map((d,k)=>`<button class="chip" data-cam="${esc(d.deviceId)}">${esc(d.label||"Caméra "+(k+1))}</button>`).join("");
    $$("[data-cam]").forEach(b=>b.onclick=()=>{ $$("[data-cam]").forEach(x=>x.setAttribute("aria-pressed",x===b)); open({deviceId:{exact:b.dataset.cam}}); }); }
};

RUN.vibreur = el=>{
  if(!navigator.vibrate){ el.innerHTML=`<div class="infobox">Ce navigateur ne permet pas de piloter le vibreur (c'est le cas sur iPhone, iPad et ordinateur). Testez-le à la main : basculez le mode silencieux ou passez un appel.</div>`; return; }
  el.innerHTML=`<p>Le téléphone doit vibrer trois fois.</p><div class="actions"><button class="btn ghost" id="vib">Faire vibrer</button></div>`;
  $("#vib").onclick=()=>{ const ok=navigator.vibrate([400,200,400,200,400]); setNote(ok?"Commande de vibration envoyée":"Vibration refusée par le navigateur"); };
};

RUN.capteurs = el=>{
  el.innerHTML=`<p>Inclinez et tournez l'appareil : les valeurs et le point doivent bouger.</p><div class="actions"><button class="btn ghost" id="sgo">Activer les capteurs</button></div>
   <div class="sensor"><div class="level"><i id="dot"></i></div><dl class="kv" id="sv"><dt>Accélération</dt><dd>—</dd><dt>Orientation</dt><dd>—</dd></dl></div>`;
  let seen=0;
  const mot=e=>{ const a=e.accelerationIncludingGravity||{}; if(a.x==null) return; seen++; const d=$("#dot"); if(d){ d.style.transform=`translate(${Math.max(-45,Math.min(45,-a.x*5))}px,${Math.max(-45,Math.min(45,a.y*5))}px)`; }
    const v=$("#sv"); if(v) v.children[1].textContent=`x ${a.x.toFixed(1)} · y ${a.y.toFixed(1)} · z ${(a.z||0).toFixed(1)} m/s²`; if(seen===20) setNote("Accéléromètre actif"); };
  const ori=e=>{ if(e.beta==null) return; const v=$("#sv"); if(v) v.children[3].textContent=`α ${Math.round(e.alpha||0)}° · β ${Math.round(e.beta)}° · γ ${Math.round(e.gamma||0)}°`; };
  $("#sgo").onclick=async()=>{
    try{ if(window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission==="function"){ const r=await DeviceMotionEvent.requestPermission(); if(r!=="granted"){ setNote("Accès aux capteurs refusé"); return; } } }catch(e){}
    window.addEventListener("devicemotion",mot); window.addEventListener("deviceorientation",ori);
    cleanup.push(()=>{window.removeEventListener("devicemotion",mot);window.removeEventListener("deviceorientation",ori)});
    setTimeout(()=>{ if(!seen && $("#sv")) setNote(MOBILE?"Aucune donnée reçue des capteurs":"Pas de capteurs de mouvement (ordinateur)"); },3000);
  };
};

RUN.batterie = async el=>{
  if(!navigator.getBattery){ el.innerHTML=`<div class="infobox">Ce navigateur ne donne pas l'état de la batterie (iPhone, iPad, Firefox). Sur iPhone : Réglages → Batterie → État. Branchez le chargeur et vérifiez que l'éclair apparaît.</div>`; return; }
  const b=await navigator.getBattery(); let sawCharge=false;
  const draw=()=>{ const s=$("#bst"); if(!s) return; s.innerHTML=`<dt>Niveau</dt><dd>${Math.round(b.level*100)} %</dd><dt>En charge</dt><dd>${b.charging?"oui":"non"}</dd>${b.charging&&isFinite(b.chargingTime)?`<dt>Pleine charge dans</dt><dd>${Math.round(b.chargingTime/60)} min</dd>`:""}${!b.charging&&isFinite(b.dischargingTime)?`<dt>Autonomie estimée</dt><dd>${Math.round(b.dischargingTime/60)} min</dd>`:""}`; };
  el.innerHTML=`<p>${b.charging?"Débranchez puis rebranchez":"Branchez"} le chargeur : la détection valide le port et le circuit de charge.</p><dl class="kv" id="bst"></dl><p class="fine">Le navigateur ne donne ni la santé ni les cycles : utilisez Paramètres → Batterie, le Rapport PC ou AccuBattery.</p>`;
  draw();
  const ch=()=>{ draw(); if(b.charging){ sawCharge=true; setNote("Charge détectée au branchement"); toast("Chargeur détecté."); } };
  b.addEventListener("chargingchange",ch); b.addEventListener("levelchange",draw);
  cleanup.push(()=>{b.removeEventListener("chargingchange",ch);b.removeEventListener("levelchange",draw)});
};

RUN.boutons = el=>{
  el.innerHTML=`<p>Appuyez sur les touches ou boutons à vérifier : chaque touche reçue s'affiche ci-dessous. Sur téléphone, seuls certains boutons (volume) sont transmis au navigateur selon le modèle.</p><div class="keys" id="keys"><span class="fine">En attente d'une touche…</span></div>`;
  const seen=new Set();
  const kd=e=>{ if(e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return; e.preventDefault(); const k=e.code||e.key; if(seen.has(k)) return; seen.add(k); const box=$("#keys"); if(!box) return; if(seen.size===1) box.innerHTML=""; box.insertAdjacentHTML("beforeend",`<span class="key">${esc(e.key===" "?"Espace":e.key)}</span>`); setNote(seen.size+" touche(s) détectée(s)"); };
  window.addEventListener("keydown",kd,true); cleanup.push(()=>window.removeEventListener("keydown",kd,true));
};

RUN.reseau = async el=>{
  const cn=navigator.connection;
  el.innerHTML=`<dl class="kv" id="net"><dt>Connexion</dt><dd>${navigator.onLine?"en ligne":"hors ligne"}${cn?" · "+esc([cn.type,cn.effectiveType].filter(Boolean).join(" ")):""}</dd><dt>Latence</dt><dd id="lat">mesure…</dd><dt>Débit descendant</dt><dd id="dl">mesure…</dd></dl>`;
  if(!navigator.onLine){ setNote("Aucune connexion"); $("#lat").textContent=$("#dl").textContent="—"; return; }
  const times=[];
  for(let k=0;k<5;k++){ const t0=performance.now(); try{ await fetch("https://www.gstatic.com/generate_204?"+Date.now(),{mode:"no-cors",cache:"no-store"}); times.push(performance.now()-t0); }catch(e){} }
  const lat=$("#lat"); if(!lat) return;
  if(times.length){ times.sort((a,b)=>a-b); lat.textContent=Math.round(times[Math.floor(times.length/2)])+" ms (médiane sur "+times.length+")"; } else lat.textContent="serveur de test injoignable";
  try{
    const t0=performance.now(), r=await fetch("https://speed.cloudflare.com/__down?bytes=8000000",{cache:"no-store"}); const rd=r.body.getReader(); let n=0;
    for(;;){ const {done,value}=await rd.read(); if(done) break; n+=value.length; if(performance.now()-t0>8000) { rd.cancel(); break; } }
    const s=(performance.now()-t0)/1000, mbps=n*8/s/1e6; const d=$("#dl"); if(d) d.textContent=mbps.toFixed(1)+" Mb/s";
    setNote(`Latence ${times.length?Math.round(times[Math.floor(times.length/2)])+" ms":"?"}, débit ${mbps.toFixed(1)} Mb/s`);
  }catch(e){ const d=$("#dl"); if(d) d.textContent="non mesurable depuis ce navigateur"; setNote(times.length?"Connexion active, débit non mesuré":"Pas de réponse des serveurs de test"); }
};

RUN.nfc = el=>{
  if(!("NDEFReader" in window)){
    el.innerHTML=`<div class="infobox">Ce navigateur ne donne pas accès au NFC. Le test automatique fonctionne avec <b>Chrome sur Android</b>. Sur iPhone : tester un paiement Apple Pay ou la lecture d'un tag avec l'app Raccourcis. Vérifiez aussi que le NFC est activé dans les paramètres.</div>`;
    setNote("Test NFC non disponible dans ce navigateur"); return;
  }
  el.innerHTML=`<p>Activez le NFC du téléphone, retirez la coque, puis approchez un tag ou une carte sans contact du dos de l'appareil (zone de l'antenne, souvent au centre ou en haut).</p><div class="actions"><button class="btn ghost" id="nfcGo">Démarrer la lecture</button></div><dl class="kv" id="nfcOut"><dt>État</dt><dd>en attente</dd></dl>`;
  const ctl=new AbortController(); cleanup.push(()=>ctl.abort());
  $("#nfcGo").onclick=async()=>{
    const o=$("#nfcOut");
    try{
      const r=new NDEFReader(); await r.scan({signal:ctl.signal});
      o.innerHTML=`<dt>État</dt><dd>lecture active : approchez le tag</dd>`;
      r.onreadingerror=()=>{ const x=$("#nfcOut"); if(x) x.innerHTML=`<dt>État</dt><dd>tag détecté mais illisible (format non NDEF : carte bancaire ou badge chiffré). Le NFC fonctionne.</dd>`; setNote("Tag détecté (format non lisible) : antenne fonctionnelle"); };
      r.onreading=e=>{ const x=$("#nfcOut"); if(!x) return; const recs=[...e.message.records].map(rc=>{ try{ return rc.recordType+(rc.data?" : "+new TextDecoder(rc.encoding||"utf-8").decode(rc.data).slice(0,60):""); }catch(err){ return rc.recordType; } });
        x.innerHTML=`<dt>Numéro du tag</dt><dd class="mono">${esc(e.serialNumber||"non communiqué")}</dd><dt>Contenu</dt><dd>${recs.length?recs.map(esc).join("<br>"):"vide"}</dd>`; setNote("Tag lu : NFC fonctionnel"); toast("Tag NFC lu."); };
    }catch(err){ o.innerHTML=`<dt>État</dt><dd>${esc(err.name==="NotAllowedError"?"autorisation NFC refusée":err.name==="NotSupportedError"?"NFC absent ou désactivé sur cet appareil":err.message)}</dd>`; setNote("NFC : "+(err.name==="NotSupportedError"?"absent ou désactivé":"erreur")); }
  };
};

RUN.gps = el=>{
  if(!navigator.geolocation){ el.innerHTML=`<div class="warnbox">Ce navigateur ne donne pas accès à la localisation.</div>`; return; }
  el.innerHTML=`<p>Placez-vous près d'une fenêtre. La précision doit descendre sous 50 m en quelques secondes sur un téléphone.</p><dl class="kv" id="geo"><dt>Position</dt><dd>recherche…</dd></dl>`;
  const id=navigator.geolocation.watchPosition(p=>{ const g=$("#geo"); if(!g) return; const a=Math.round(p.coords.accuracy);
    g.innerHTML=`<dt>Position</dt><dd>${p.coords.latitude.toFixed(5)}, ${p.coords.longitude.toFixed(5)}</dd><dt>Précision</dt><dd>${a} m</dd>`; setNote("Précision "+a+" m"); },
    e=>{ const g=$("#geo"); if(g) g.innerHTML=`<dt>Position</dt><dd>indisponible (${esc(e.message||e.code)})</dd>`; setNote("Localisation indisponible"); },
    {enableHighAccuracy:true, timeout:30000, maximumAge:0});
  cleanup.push(()=>navigator.geolocation.clearWatch(id));
};

window.addEventListener("popstate",clean);
})();
