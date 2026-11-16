/* DiagLab Pro — assistant IA : base locale instantanée + Claude (clé API de l'utilisateur) */
(function(){
"use strict";
const {R, AFTER, $, $$, esc, store, toast, go} = window.DL;
const SDK_URL = "./vendor/anthropic-sdk-1.3.0.js";
const MODELS = [
  ["claude-opus-5-5","Claude Opus 5.5 (recommandé)"],
  ["claude-sonnet-5-5","Claude Sonnet 5.5 (plus rapide)"],
  ["claude-haiku-5-5","Claude Haiku 5.5 (le plus économique)"]
];
const SYSTEM = `Tu es l'assistant de DiagLab Pro, un expert en maintenance et réparation : ordinateurs (Windows, macOS, Linux), smartphones et tablettes (Android, iPhone, iPad), réseaux et imprimantes. Tu aides un technicien d'atelier.

Réponds en français, de façon concrète et structurée :
1. Causes probables, de la plus fréquente à la plus rare.
2. Vérifications à faire, de la plus simple à la plus poussée (logiciel avant matériel, sans démontage avant démontage), avec les valeurs attendues quand elles existent (tensions, codes, menus exacts).
3. Réparation recommandée, pièces et outils nécessaires.
4. Précautions de sécurité quand c'est utile (batterie lithium gonflée, alimentation secteur, décharges électrostatiques, sauvegarde des données avant toute opération risquée).

Si une photo est jointe, décris ce que tu observes (composant brûlé, oxydation, connecteur abîmé, message d'erreur) avant de conclure. S'il manque une information décisive (modèle exact, message d'erreur, ce qui a déjà été essayé), pose une ou deux questions précises.

Pour les verrous de sécurité (compte Google FRP, Verrouillage d'activation iCloud, mot de passe BIOS superviseur, MDM, BitLocker), donne uniquement les procédures officielles réservées au propriétaire légitime, qui passent par le propriétaire ou par le constructeur sur preuve d'achat. Ne propose jamais de contournement : ces verrous protègent contre le vol.

Si le contexte de l'atelier est fourni (fiche client, tests, tableau de bord), sers-t'en. Ne prétends pas avoir accès à l'appareil : tu raisonnes à partir de ce que le technicien te transmet.`;

/* ---------- base locale : recherche par mots-clés dans toute la base DiagLab ---------- */
const norm = s=>String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"");
const STOP = new Set("le la les un une des de du d l et ou a au aux en sur pour par avec sans ne pas plus mon ma mes son sa ses ce cette ces qui que quoi est sont il elle je j on nous vous ils elles se s y quand comment pourquoi tres fait faire".split(" "));
const words = s=>norm(s).split(/[^a-z0-9#*]+/).filter(w=>w.length>2&&!STOP.has(w));
let INDEX=null;
function buildIndex(){
  INDEX=[];
  const devName={pc:"Ordinateur",android:"Android",iphone:"iPhone / iPad",reseau:"Réseau",imprimante:"Imprimante"};
  Object.entries(DIAG).forEach(([dev,syms])=>Object.entries(syms).forEach(([sym,causes])=>causes.forEach(c=>
    INDEX.push({kind:"Diagnostic · "+devName[dev], title:c[1], ctx:sym, body:`Tester : ${c[2]}\nRéparer : ${c[3]}`, text:words(dev+" "+devName[dev]+" "+sym+" "+sym+" "+c[1]+" "+c[2]+" "+c[3]), link:"diag"}))));
  FAQ.forEach(f=>INDEX.push({kind:"FAQ · "+f[0], title:f[1], ctx:"", body:f[2], text:words(f[0]+" "+f[1]+" "+f[1]+" "+f[2]), link:"faq"}));
  ["phone","pc"].forEach(k=>BOARDS[k].parts.forEach(p=>INDEX.push({kind:"Composant · "+(k==="phone"?"téléphone":"ordinateur"), title:p[1].replace(/\n/g," "), ctx:p[7], body:`Tester : ${p[8]}\nRéparer : ${p[9]}`, text:words(p[1]+" "+p[6]+" "+p[7]+" "+p[8]), link:"dash"})));
  if(typeof BRAND_FAULTS!=="undefined") ["pc","phone"].forEach(k=>Object.entries(BRAND_FAULTS[k]).forEach(([bn,b])=>b.faults.forEach(f=>INDEX.push({kind:"Marque · "+bn, title:f[0], ctx:f[1], body:`Cause : ${f[2]}\nSolution : ${f[3]}`, text:words(bn+" "+bn+" "+b.models+" "+f.join(" ")), link:"marques"}))));
  if(typeof ACADEMY!=="undefined") ACADEMY.forEach(t=>t.modules.forEach(m=>{ const txt=m.body.filter(b=>["p","tip","warn","ul","ol"].includes(b[0])).map(b=>Array.isArray(b[1])?b[1].join(" "):b[1]).join(" ").replace(/\*\*/g,"");
    if(txt) INDEX.push({kind:"Cours · "+t.title, title:m.title, ctx:"Académie", body:txt.slice(0,320)+(txt.length>320?"…":""), text:words(m.title+" "+m.title+" "+txt), link:"academie"}); }));
  RESETS.forEach(r=>INDEX.push({kind:"Réinitialisation", title:r[0], ctx:r[1], body:r[2].join("\n"), text:words("reinitialiser reset usine formater "+r[0]+" "+r[2].join(" ")), link:"reset"}));
}
function localSearch(q){
  if(!INDEX) buildIndex();
  const qs=words(q); if(!qs.length) return [];
  const df={}; INDEX.forEach(d=>new Set(d.text).forEach(w=>{df[w]=(df[w]||0)+1}));
  return INDEX.map(d=>{ let s=0; const set=new Set(d.text);
    qs.forEach(w=>{ if(set.has(w)) s+=Math.log(1+INDEX.length/(df[w]||1)); else if(w.length>4 && d.text.some(t=>t.startsWith(w.slice(0,5)))) s+=0.5; });
    return {d,s}; }).filter(x=>x.s>0).sort((a,b)=>b.s-a.s).slice(0,4).map(x=>x.d);
}

/* ---------- rendu Markdown minimal et sûr (texte échappé d'abord) ---------- */
function md(src){
  const out=[]; let list=null, code=null;
  const inline=t=>esc(t).replace(/`([^`]+)`/g,"<code>$1</code>").replace(/\*\*([^*]+)\*\*/g,"<b>$1</b>").replace(/(^|[^*])\*([^*\n]+)\*/g,"$1<i>$2</i>");
  const close=()=>{ if(list){ out.push(`</${list}>`); list=null; } };
  String(src).split("\n").forEach(line=>{
    if(code!==null){ if(/^```/.test(line)){ out.push(`<pre class="script">${esc(code)}</pre>`); code=null; } else code+=(code?"\n":"")+line; return; }
    if(/^```/.test(line)){ close(); code=""; return; }
    let m;
    if((m=line.match(/^#{1,4}\s+(.*)/))){ close(); out.push(`<h4>${inline(m[1])}</h4>`); return; }
    if((m=line.match(/^\s*[-*•]\s+(.*)/))){ if(list!=="ul"){ close(); out.push("<ul>"); list="ul"; } out.push(`<li>${inline(m[1])}</li>`); return; }
    if((m=line.match(/^\s*\d+[.)]\s+(.*)/))){ if(list!=="ol"){ close(); out.push("<ol>"); list="ol"; } out.push(`<li>${inline(m[1])}</li>`); return; }
    close(); if(line.trim()) out.push(`<p>${inline(line)}</p>`);
  });
  if(code!==null) out.push(`<pre class="script">${esc(code)}</pre>`);
  close(); return out.join("");
}

/* ---------- contexte de l'atelier ---------- */
function context(){
  const parts=[];
  const d=DL.draft(); if(d.client||d.modele||d.panne) parts.push(`Fiche en cours : appareil ${[d.type,d.modele].filter(Boolean).join(" ")||"?"} ; panne déclarée : ${d.panne||"?"}${d.diagnostic?" ; diagnostic : "+d.diagnostic.slice(0,800):""}`);
  const ph=store.get("dl-phone",null); if(ph&&ph.brand) parts.push(`Diagnostic téléphone : ${[ph.brand,ph.model,ph.os].filter(Boolean).join(" ")} ; symptômes : ${(ph.syms||[]).join(", ")||"aucun"}`);
  const t=store.get("dl-tests",null); if(t) parts.push(`Tests de l'appareil (${t.date}, ${t.info&&t.info.modele||""}) : `+Object.values(t.results).map(r=>`${r.name} ${r.st==="pass"?"OK":r.st==="fail"?"DÉFAILLANT":"non testé"}${r.note?" ("+r.note+")":""}`).join(" ; "));
  const b=store.get("dl-board",null);
  if(b) ["phone","pc"].forEach(k=>{ const l=Object.entries(b[k]||{}).filter(([,v])=>v.st==="defect"||v.st==="suspect"); if(l.length) parts.push(`Tableau de bord (${k==="phone"?"téléphone":"ordinateur"}) : `+l.map(([id,v])=>{const p=BOARDS[k].parts.find(x=>x[0]===id);return (p?p[1].replace(/\n/g," "):id)+" "+(v.st==="defect"?"défectueux":"suspect")}).join(", ")); });
  if(b&&b.scan) parts.push(`Rapport PC : ${b.scan.model}, note ${b.scan.score}/100 (${b.scan.verdict})`);
  return parts.join("\n");
}

/* ---------- état de la conversation (gardé pendant la session) ---------- */
let msgs=[], view=[], busy=false, stream=null, pendingImg=null;
const key=()=>store.get("dl-ia-key","");
const model=()=>store.get("dl-ia-model",MODELS[0][0]);

R.ia = ()=>{
  const k=key();
  return `<div class="eyebrow">Intelligence artificielle</div><h1>Assistant IA</h1>
  <p class="lede">Décrivez la panne comme à un collègue, avec le modèle, les symptômes et ce que vous avez déjà essayé. Vous pouvez joindre une photo (carte, écran d'erreur, oxydation). La base DiagLab répond tout de suite, même hors connexion ; Claude complète ensuite si une clé API est configurée.</p>
  <details class="acc" ${k?"":"open"}><summary>Réglages de l'IA ${k?'<span class="pill">clé configurée</span>':'<span class="pill">clé à configurer</span>'}</summary><div class="body">
    <div class="form">
      <div class="field"><label for="iaKey">Clé API Anthropic</label><input id="iaKey" type="password" autocomplete="off" placeholder="${k?"•••••••• (enregistrée)":"sk-ant-…"}"></div>
      <div class="field"><label for="iaModel">Modèle</label><select id="iaModel">${MODELS.map(m=>`<option value="${m[0]}"${m[0]===model()?" selected":""}>${m[1]}</option>`).join("")}</select></div>
    </div>
    <div class="actions"><button class="btn" id="iaSave">Enregistrer</button>${k?'<button class="btn ghost" id="iaDel">Effacer la clé</button>':""}</div>
    <p class="fine">Créez une clé sur <a href="https://platform.claude.com/settings/keys" target="_blank" rel="noopener">platform.claude.com</a> (compte API, facturé à l'usage). La clé reste enregistrée sur cet appareil seulement et part uniquement vers l'API d'Anthropic. N'utilisez pas cette fonction sur un ordinateur partagé.</p>
  </div></details>
  <div class="chat" id="chat">${view.length?view.map(bubble).join(""):`<div class="chat-empty"><p><b>Exemples :</b></p><div class="chips">${["Samsung A55 qui redémarre en boucle après une chute","PC portable HP : bips au démarrage, écran noir","iPhone 15 : pas de son pendant les appels","Imprimante Epson : lignes blanches à l'impression"].map(x=>`<button class="chip" data-ex="${esc(x)}">${esc(x)}</button>`).join("")}</div></div>`}</div>
  <div class="composer card">
    <textarea id="iaQ" rows="3" placeholder="Décrivez la panne…"></textarea>
    <div id="iaImg"></div>
    <div class="actions" style="margin-top:8px">
      <button class="btn" id="iaSend">Envoyer</button>
      <button class="btn ghost" id="iaStop" hidden>Arrêter</button>
      <label class="btn ghost" style="cursor:pointer">Joindre une photo<input type="file" id="iaFile" accept="image/*" hidden></label>
      <label class="ctx"><input type="checkbox" id="iaCtx" ${store.get("dl-ia-ctx",true)?"checked":""}> Joindre le contexte de l'atelier</label>
      ${view.length?'<button class="btn ghost" id="iaNew">Nouvelle conversation</button>':""}
    </div>
  </div>`;
};
function bubble(m){
  if(m.who==="user") return `<div class="msg me">${m.img?`<img src="${m.img}" alt="Photo jointe">`:""}<p>${esc(m.text).replace(/\n/g,"<br>")}</p></div>`;
  if(m.who==="local") return `<div class="msg local"><div class="who">Base DiagLab · réponse immédiate</div>${m.items.length?m.items.map(d=>`<div class="hit"><span class="tag">${esc(d.kind)}</span><b>${esc(d.title)}</b>${d.ctx?` <span class="fine">· ${esc(d.ctx)}</span>`:""}<p>${esc(d.body).replace(/\n/g,"<br>")}</p></div>`).join(""):"<p>Rien de précis dans la base pour cette description.</p>"}</div>`;
  return `<div class="msg ai"><div class="who">Claude${m.model?" · "+esc(m.model):""}</div><div class="mdout">${m.html||(m.text?md(m.text):'<p class="fine">Réflexion en cours…</p>')}</div>${m.meta?`<div class="fine">${esc(m.meta)}</div>`:""}</div>`;
}
function draw(){ const c=$("#chat"); if(!c) return; c.innerHTML=view.map(bubble).join(""); c.scrollTop=c.scrollHeight; const last=c.lastElementChild; if(last && busy) last.scrollIntoView({block:"end"}); }

async function resizeImage(file){
  const url=URL.createObjectURL(file);
  try{
    const img=await new Promise((ok,ko)=>{const i=new Image(); i.onload=()=>ok(i); i.onerror=ko; i.src=url;});
    const s=Math.min(1,1568/Math.max(img.width,img.height)), c=document.createElement("canvas");
    c.width=Math.round(img.width*s); c.height=Math.round(img.height*s); c.getContext("2d").drawImage(img,0,0,c.width,c.height);
    const data=c.toDataURL("image/jpeg",0.85); return {data:data.split(",")[1], preview:data};
  } finally { URL.revokeObjectURL(url); }
}

async function send(){
  const q=$("#iaQ").value.trim(); if(!q && !pendingImg) return; if(busy) return;
  const img=pendingImg; pendingImg=null; $("#iaQ").value=""; $("#iaImg").innerHTML="";
  view.push({who:"user", text:q||"(photo)", img:img&&img.preview});
  view.push({who:"local", items:localSearch(q)});
  draw();
  const k=key();
  if(!k){ view.push({who:"ai", html:`<p>Pour une analyse détaillée par Claude, ajoutez votre clé API dans <b>Réglages de l'IA</b> ci-dessus. La réponse de la base DiagLab reste disponible sans clé.</p>`}); draw(); return; }
  if(!navigator.onLine){ view.push({who:"ai", html:"<p>Pas de connexion internet : seule la base DiagLab est disponible.</p>"}); draw(); return; }

  const withCtx=$("#iaCtx").checked, ctx=withCtx?context():"";
  const content=[];
  if(img) content.push({type:"image", source:{type:"base64", media_type:"image/jpeg", data:img.data}});
  content.push({type:"text", text:(ctx&&msgs.length===0?`Contexte de l'atelier :\n${ctx}\n\n`:"")+(q||"Que vois-tu sur cette photo ? Quelle panne cela indique-t-il ?")});
  msgs.push({role:"user", content});
  const m=model(), out={who:"ai", text:"", model:MODELS.find(x=>x[0]===m)[1].replace(/ \(.*/,"")}; view.push(out); draw();
  busy=true; $("#iaSend").disabled=true; $("#iaStop").hidden=false;
  let Anthropic;
  try{ Anthropic=(await import(SDK_URL)).default; }
  catch(e){ out.html="<p>Impossible de charger le module d'IA. Rechargez l'application.</p>"; finishTurn(); msgs.pop(); return; }
  const client=new Anthropic({apiKey:k, dangerouslyAllowBrowser:true, timeout:45000, maxRetries:1});
  const params={model:m, max_tokens:16000, system:SYSTEM, messages:msgs, thinking:{type:"adaptive"}, output_config:{effort:"medium"}};
  if(m!=="claude-haiku-5-5"){ params.betas=["server-side-fallback-2026-07-01"]; params.fallbacks="default"; }
  try{
    stream=client.beta.messages.stream(params);
    stream.on("text",d=>{ out.text+=d; out.html=null; const el=$("#chat .msg.ai:last-child .mdout"); if(el) el.innerHTML=md(out.text); else draw(); });
    const fin=await stream.finalMessage();
    if(fin.stop_reason==="refusal"){ out.html=(out.text?md(out.text):"")+"<p><b>Claude n'a pas pu répondre à cette demande.</b> Reformulez la question en décrivant la panne et l'appareil.</p>"; msgs.pop(); }
    else {
      msgs.push({role:"assistant", content:fin.content});
      if(fin.stop_reason==="max_tokens") out.text+="\n\n*(réponse tronquée : demandez la suite)*";
      out.html=md(out.text||"(réponse vide)");
      const u=fin.usage||{}; out.meta=`${(u.input_tokens||0)+(u.cache_read_input_tokens||0)} jetons envoyés · ${u.output_tokens||0} reçus${fin.model&&fin.model!==m?" · servi par "+fin.model:""}`;
    }
  }catch(err){
    msgs.pop();
    let t="Erreur inattendue : "+(err&&err.message||err);
    if(err instanceof Anthropic.APIUserAbortError) t="Réponse arrêtée.";
    else if(err instanceof Anthropic.AuthenticationError) t="Clé API refusée : vérifiez-la dans Réglages de l'IA.";
    else if(err instanceof Anthropic.PermissionDeniedError) t="Cette clé n'a pas accès à ce modèle. Choisissez un autre modèle dans Réglages de l'IA.";
    else if(err instanceof Anthropic.RateLimitError) t="Trop de demandes ou crédit épuisé : patientez une minute, ou vérifiez le solde du compte API.";
    else if(err instanceof Anthropic.BadRequestError) t="Demande refusée par l'API : "+(err.message||"")+".";
    else if(err instanceof Anthropic.APIConnectionError) t="Connexion à l'API impossible : vérifiez internet.";
    else if(err instanceof Anthropic.APIError && err.status>=500) t="Le service est momentanément indisponible : réessayez dans un instant.";
    out.html=(out.text?md(out.text):"")+`<p><b>${esc(t)}</b></p>`;
  }
  finishTurn();
}
function finishTurn(){ busy=false; stream=null; draw(); const s=$("#iaSend"); if(s){ s.disabled=false; $("#iaStop").hidden=true; } }

AFTER.ia = ()=>{
  const pre=store.get("dl-ia-prefill",""); if(pre){ $("#iaQ").value=pre; store.set("dl-ia-prefill",""); }
  draw(); if(busy){ $("#iaSend").disabled=true; $("#iaStop").hidden=false; }
  $("#iaSave").onclick=()=>{ const v=$("#iaKey").value.trim(); if(v) store.set("dl-ia-key",v); store.set("dl-ia-model",$("#iaModel").value); toast(v?"Clé enregistrée.":"Modèle enregistré."); DL.render(); };
  if($("#iaDel")) $("#iaDel").onclick=()=>{ store.set("dl-ia-key",""); toast("Clé effacée."); DL.render(); };
  $("#iaModel").onchange=e=>store.set("dl-ia-model",e.target.value);
  $("#iaCtx").onchange=e=>store.set("dl-ia-ctx",e.target.checked);
  $("#iaSend").onclick=send;
  $("#iaStop").onclick=()=>{ if(stream) stream.abort(); };
  $("#iaQ").onkeydown=e=>{ if(e.key==="Enter" && (e.ctrlKey||e.metaKey)){ e.preventDefault(); send(); } };
  $$("[data-ex]").forEach(b=>b.onclick=()=>{ $("#iaQ").value=b.dataset.ex; send(); });
  if($("#iaNew")) $("#iaNew").onclick=()=>{ if(busy && stream) stream.abort(); msgs=[]; view=[]; DL.render(); };
  $("#iaFile").onchange=async e=>{ const f=e.target.files[0]; if(!f) return; try{ pendingImg=await resizeImage(f); $("#iaImg").innerHTML=`<div class="thumb"><img src="${pendingImg.preview}" alt="Photo à envoyer"><button class="mini" id="iaImgX">Retirer</button></div>`; $("#iaImgX").onclick=()=>{pendingImg=null;$("#iaImg").innerHTML=""}; }catch(err){ toast("Image illisible."); } };
};
})();
