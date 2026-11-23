/* DiagLab Pro — disques internes et externes : santé, SMART, tests, réparation */
(function(){
"use strict";
const {R, AFTER, $, $$, esc, toast, go, store, DESKTOP, FULL} = window.DL;
const api = DESKTOP && window.diaglab.disks;
const GB = n=>n>=1e12?(n/1e12).toLocaleString("fr-FR",{maximumFractionDigits:2})+" To":(n/1e9).toLocaleString("fr-FR",{maximumFractionDigits:1})+" Go";
let data=null, busy=null, prog=null, result=null, open=null, offProg=null;

/* ---------- verdict de santé ---------- */
function verdict(d){
  const out=[], s=d.Smart||{}, ssd=/SSD/i.test(d.Media||"")||/NVMe/i.test(d.Bus||"");
  const add=(lv,m,a)=>out.push({lv,m,a});
  if(d.Health && d.Health!=="Healthy") add("critique",`Windows signale l'état « ${d.Health} »`,"Copier les données immédiatement, puis remplacer le disque.");
  if(s.Passed===false) add("critique","Le SMART du disque est en échec","Le disque annonce lui-même sa panne : copier les données en priorité, puis le remplacer.");
  const inst=(s.Pending||0)+(s.Uncorr||0);
  if(inst>0) add("critique",`${inst} secteur(s) instable(s) ou illisible(s)`,"Copier les données tout de suite, AVANT tout CHKDSK /r ou test complet qui fatigueraient le disque. Remplacer ensuite.");
  if(s.Realloc>100) add("critique",`${s.Realloc} secteurs réalloués`,"Usure mécanique avancée : sauvegarder et remplacer.");
  else if(s.Realloc>0) add("attention",`${s.Realloc} secteur(s) réalloué(s)`,"Le disque a déjà mis de côté des secteurs défectueux : sauvegarde régulière, test de surface, surveiller l'évolution.");
  if(s.Crc>0) add("attention",`${s.Crc} erreur(s) de transmission (CRC)`,"Le plus souvent le câble, le port ou le boîtier USB, pas le disque : changer de câble ou de port, tester le disque branché en SATA direct.");
  const used=s.Used!=null?s.Used:d.Wear;
  if(used>=90) add("critique",`Usure du SSD : ${used} %`,"Fin de vie proche : sauvegarder et remplacer.");
  else if(used>=70) add("attention",`Usure du SSD : ${used} %`,"Prévoir le remplacement.");
  if(s.MediaErr>0) add("attention",`${s.MediaErr} erreur(s) de support NVMe`,"Sauvegarder ; surveiller l'évolution, remplacer si le nombre augmente.");
  if(s.Spare!=null && s.Spare<10) add("critique",`Réserve du SSD presque épuisée (${s.Spare} %)`,"Remplacer le SSD.");
  if(d.ReadErr>0) add("critique",`${d.ReadErr} erreur(s) de lecture non corrigées`,"Copier les données en priorité, puis remplacer.");
  const t=s.Temp!=null?s.Temp:d.Temp;
  if(t!=null && t>=(ssd?75:60)) add("attention",`Température élevée : ${t} °C`,ssd?"Ajouter un dissipateur ou ventiler le boîtier.":"Boîtier externe mal ventilé ou disque fatigué : le poser à l'air libre, vérifier le ventilateur du PC.");
  if(d.Style==="RAW") add("attention","Disque non initialisé","S'il contenait des données : NE PAS l'initialiser, récupérer d'abord avec TestDisk. Sinon, l'initialiser (GPT) dans la Gestion des disques.");
  if(d.Offline) add("info","Disque hors ligne : Windows ne le monte pas","Bouton « Mettre en ligne ». Cause fréquente : deux disques avec la même signature (clone).");
  if(d.ReadOnly) add("info","Disque en lecture seule","Bouton « Retirer la lecture seule ». Sur une carte SD, vérifier aussi le petit verrou sur le côté.");
  (d.Volumes||[]).filter(v=>!v.Hidden).forEach(v=>{
    if(!v.FS && v.Size>1e8) add("attention",`Partition ${v.Partition} sans système de fichiers reconnu (RAW)`,"Ne pas formater si les données comptent : TestDisk peut réparer la partition, PhotoRec récupère les fichiers. Formater seulement ensuite.");
    else if(v.FS && !v.Letter) add("info",`Volume « ${v.Label||v.FS} » sans lettre de lecteur`,"Bouton « Attribuer une lettre » pour le faire apparaître dans l'Explorateur.");
    if(v.FS && v.Size>0 && v.Free/v.Size<0.1) add("attention",`Volume ${v.Letter?v.Letter+":":v.Label} presque plein (${Math.round(v.Free/v.Size*100)} % libres)`,"Libérer de la place : un disque plein ralentit et fragmente.");
  });
  if(!d.Smart && /USB/i.test(d.Bus||"")) add("info","SMART non transmis par le boîtier USB","Installez smartmontools (il lit la plupart des boîtiers), ou branchez le disque en SATA interne pour un diagnostic complet.");
  const lv=out.some(x=>x.lv==="critique")?"critique":out.some(x=>x.lv==="attention")?"attention":"ok";
  return {lv, items:out};
}
const LV={ok:"Bon état",attention:"À surveiller",critique:"En danger"};
const busLabel=d=>/USB/i.test(d.Bus)?"Externe USB":/NVMe/i.test(d.Bus)?"NVMe":/SATA/i.test(d.Bus)?"SATA":/SD|MMC/i.test(d.Bus)?"Carte SD":d.Bus||"?";

/* ---------- vue ---------- */
const TOOLS=[
 ["smartmontools (smartctl)","Lit le SMART complet, y compris sur la plupart des boîtiers USB. Une fois installé, DiagLab l'utilise automatiquement.","https://www.smartmontools.org/wiki/Download","Libre"],
 ["CrystalDiskInfo","Santé SMART en un coup d'œil, compatible avec de nombreux ponts USB.","https://crystalmark.info/en/software/crystaldiskinfo/","Gratuit"],
 ["CrystalDiskMark","Mesure des débits séquentiels et aléatoires.","https://crystalmark.info/en/software/crystaldiskmark/","Gratuit"],
 ["TestDisk / PhotoRec","Réparer une table de partitions, récupérer des fichiers d'un disque RAW ou formaté.","https://www.cgsecurity.org/","Libre"],
 ["Victoria","Test de surface détaillé et réaffectation des secteurs (disques durs).","https://hdd.by/victoria/","Gratuit"],
 ["SeaTools (Seagate)","Tests constructeur des disques Seagate.","https://www.seagate.com/support/downloads/seatools/","Officiel"],
 ["Samsung Magician","Santé, firmware et outils des SSD Samsung.","https://semiconductor.samsung.com/consumer-storage/magician/","Officiel"],
 ["Western Digital / SanDisk","Dashboard : santé et firmware des disques WD et SanDisk.","https://www.westerndigital.com/support","Officiel"],
 ["Crucial Storage Executive","Santé et firmware des SSD Crucial.","https://www.crucial.com/support/storage-executive","Officiel"]
];
const GUIDE=[
 ["Le disque externe n'apparaît pas du tout",["Essayer un autre câble (beaucoup de câbles micro-USB ou USB-C ne font que la charge) et un port USB à l'arrière du PC.","Disque 2,5 pouces : le port doit fournir assez de courant ; essayer un port USB 3, un câble en Y ou un hub alimenté.","Disque 3,5 pouces : vérifier l'alimentation secteur du boîtier et que le disque tourne (vibration légère).","Ouvrir la Gestion des disques : le disque y est-il, hors ligne, non initialisé ou sans lettre ? Lancer l'analyse DiagLab.","Toujours absent : sortir le disque du boîtier et le brancher en SATA direct (ou dans un autre boîtier). Le pont USB du boîtier tombe souvent en panne avant le disque."]],
 ["Le disque fait des clics, bips ou grincements",["Débrancher immédiatement : chaque mise sous tension peut aggraver l'endommagement des têtes.","Ne lancer ni CHKDSK, ni test de surface, ni logiciel de récupération.","Données importantes : orienter le client vers un laboratoire de récupération (salle blanche)."]],
 ["« Vous devez formater le disque » ou disque RAW",["Ne pas formater : c'est la table de partitions ou le système de fichiers qui est abîmé, les données sont souvent intactes.","Vérifier le SMART : s'il signale des secteurs instables, copier d'abord une image du disque.","TestDisk : rechercher et réécrire la table de partitions. PhotoRec : récupérer les fichiers vers un autre disque.","Formater seulement une fois les données sauvées."]],
 ["Disque WD ou boîtier chiffré illisible hors de son boîtier",["Certains disques externes (WD My Passport, My Book…) chiffrent les données par leur boîtier : sortis du boîtier, ils semblent vides ou RAW.","Garder le boîtier d'origine ; si le pont est mort, utiliser un pont identique.","Ne jamais initialiser ni formater ces disques avant d'avoir vérifié."]],
 ["Copies très lentes ou qui se bloquent",["Lancer le test de surface rapide : des zones « très lentes » annoncent des secteurs faibles.","Vérifier le compteur CRC : élevé = câble ou boîtier.","Disque SMR (certains disques durs de grande capacité) : les écritures longues ralentissent fortement, c'est normal."]]
];
const SMART_TABLE=[["5","Secteurs réalloués","Secteurs défectueux remplacés par la réserve. Doit rester à 0 ; s'il augmente, le disque se dégrade."],["9","Heures de fonctionnement","Âge réel du disque."],["187","Erreurs non corrigibles signalées","Lectures échouées : sauvegarder."],["188","Délais de commande dépassés","Souvent câble ou alimentation."],["194","Température","Disque dur : idéalement moins de 50 °C."],["197","Secteurs en attente","Secteurs instables non encore réalloués : signe grave, copier les données."],["198","Secteurs non corrigibles hors ligne","Secteurs illisibles : signe grave."],["199","Erreurs CRC (UDMA)","Erreurs de transmission : câble, port ou boîtier USB."],["NVMe","Pourcentage utilisé, réserve, erreurs de support","Usure du SSD et réserve de cellules."]];

function diskCard(d){
  const v=verdict(d), s=d.Smart||{}, t=s.Temp!=null?s.Temp:d.Temp, h=s.Hours!=null?s.Hours:d.Hours;
  const vols=(d.Volumes||[]).filter(x=>!x.Hidden || !x.Letter && !x.FS && x.Size>1e9);
  const usb=/USB/i.test(d.Bus);
  const m=(k,val)=>val==null||val===""?"":`<div><dt>${k}</dt><dd>${val}</dd></div>`;
  return `<div class="card dcard lv-${v.lv}" id="disk${d.Number}">
   <div class="dhead"><div><h3>${esc(d.Model||"Disque "+d.Number)}</h3><p class="fine">Disque ${d.Number} · ${GB(d.Size)} · ${esc(d.Media||"")} ${d.Serial?"· n° "+esc(d.Serial):""}${d.System?" · <b>disque système</b>":""}</p></div>
    <div class="dpills"><span class="pill${usb?" usb":""}">${esc(busLabel(d))}</span><span class="lvl lvl-${v.lv==="ok"?"ok":v.lv}">${LV[v.lv]}</span></div></div>
   <dl class="metrics">${m("Santé Windows",esc(d.Health||"?"))}${m("SMART",d.Smart?(s.Passed===false?"<b class='c-crit'>échec</b>":"lu"):"non disponible")}${m("Température",t!=null?t+" °C":null)}${m("Heures",h!=null?Number(h).toLocaleString("fr-FR")+" h":null)}${m("Réalloués",s.Realloc)}${m("Instables",s.Pending!=null||s.Uncorr!=null?(s.Pending||0)+(s.Uncorr||0):null)}${m("Erreurs CRC",s.Crc)}${m("Usure",s.Used!=null?s.Used+" %":d.Wear!=null?d.Wear+" %":null)}</dl>
   ${v.items.length?`<div class="findings">${v.items.map(x=>`<div class="finding"><span class="lvl lvl-${x.lv}">${x.lv==="critique"?"Critique":x.lv==="attention"?"Attention":"Info"}</span><div><b>${esc(x.m)}</b><div class="adv">${esc(x.a)}</div></div></div>`).join("")}</div>`:`<p class="tst r-pass">Aucun problème détecté par l'analyse.</p>`}
   ${vols.length?`<div class="tw"><table class="t vols"><thead><tr><th>Volume</th><th>Système</th><th>Espace</th><th></th></tr></thead><tbody>${vols.map(x=>volRow(d,x)).join("")}</tbody></table></div>`:""}
   <div class="actions">
    <button class="btn ghost" data-act="surface" data-d="${d.Number}">Test de surface rapide</button>
    <button class="btn ghost" data-act="surfacefull" data-d="${d.Number}">Test de surface complet</button>
    ${d.Offline?`<button class="btn" data-act="online" data-d="${d.Number}">Mettre en ligne</button>`:""}
    ${d.ReadOnly?`<button class="btn" data-act="readonly" data-d="${d.Number}">Retirer la lecture seule</button>`:""}
    <button class="btn ghost" data-act="fiche" data-d="${d.Number}">Ajouter à la fiche</button>
   </div>
   ${open&&open.d===d.Number?inlinePanel(d):""}
   ${s.Attrs&&s.Attrs.length?`<details class="acc" style="margin-top:12px"><summary>Attributs SMART (${s.Attrs.length})</summary><div class="body tw"><table class="t"><thead><tr><th>ID</th><th>Attribut</th><th>Valeur</th><th>Pire</th><th>Seuil</th><th>Brut</th></tr></thead><tbody>${s.Attrs.map(a=>`<tr class="${[5,187,197,198].includes(a.Id)&&a.Raw>0?"bad":""}"><td class="num">${a.Id}</td><td>${esc(a.Name)}</td><td class="num">${a.Value}</td><td class="num">${a.Worst}</td><td class="num">${a.Thresh}</td><td class="num">${Number(a.Raw).toLocaleString("fr-FR")}</td></tr>`).join("")}</tbody></table></div></details>`:""}
  </div>`;
}
function volRow(d,x){
  const pct=x.Size?Math.round((1-x.Free/x.Size)*100):0, L=x.Letter;
  return `<tr><td><b>${L?L+":":"(sans lettre)"}</b> ${esc(x.Label||"")}</td><td>${esc(x.FS||"RAW / inconnu")}</td>
   <td>${x.FS?`<div class="vbar"><i style="width:${pct}%"></i></div><span class="fine">${GB(x.Free)} libres sur ${GB(x.Size)}</span>`:GB(x.Size)}</td>
   <td class="vact">${L?`<button class="mini" data-act="chk" data-l="${L}">Vérifier</button>${d.System?"":`<button class="mini" data-act="fix" data-l="${L}" data-d="${d.Number}">Réparer</button>`}<button class="mini" data-act="speed" data-l="${L}">Vitesse</button><button class="mini" data-act="copy" data-l="${L}">Copier les données</button>${/USB/i.test(d.Bus)&&!d.System?`<button class="mini" data-act="eject" data-l="${L}">Éjecter</button>`:""}${d.System?"":`<button class="mini danger" data-act="format" data-l="${L}" data-d="${d.Number}">Formater…</button>`}`
     :`<button class="mini" data-act="letter" data-d="${d.Number}" data-p="${x.Partition}">Attribuer une lettre</button>`}</td></tr>`;
}
function inlinePanel(d){
  if(open.kind==="fix"){ const v=verdict(d), danger=v.items.some(x=>/instable|illisible|échec|lecture non/.test(x.m));
    return `<div class="card inl"><h4>Réparer ${esc(open.l)}: avec CHKDSK</h4>
     ${danger?`<div class="warnbox"><b>Ce disque présente des secteurs instables.</b> Copiez d'abord les données (bouton « Copier les données ») : une réparation peut faire perdre des fichiers sur un disque qui se dégrade.</div>`:""}
     <label class="ctx"><input type="checkbox" id="fixR"> Rechercher aussi les secteurs défectueux (/r : plusieurs heures sur un grand disque)</label>
     <div class="actions"><button class="btn" id="fixGo">Lancer la réparation</button><button class="btn ghost" data-act="close">Annuler</button></div></div>`; }
  if(open.kind==="format") return `<div class="card inl"><h4>Formater ${esc(open.l)}:</h4><div class="warnbox"><b>Toutes les données de ${esc(open.l)}: seront effacées.</b></div>
     <div class="form"><div class="field"><label for="fmFs">Système de fichiers</label><select id="fmFs"><option value="exFAT">exFAT : Windows, Mac, TV, fichiers de plus de 4 Go (conseillé)</option><option value="NTFS">NTFS : Windows uniquement</option><option value="FAT32">FAT32 : très compatible, fichiers de 4 Go maximum</option></select></div>
     <div class="field"><label for="fmLb">Nom du volume</label><input id="fmLb" value="DONNEES" maxlength="32"></div>
     <div class="field"><label for="fmOk">Tapez EFFACER pour confirmer</label><input id="fmOk" autocomplete="off"></div></div>
     <div class="actions"><button class="btn danger" id="fmGo" disabled>Formater ${esc(open.l)}:</button><button class="btn ghost" data-act="close">Annuler</button></div></div>`;
  return "";
}
function progPanel(){
  if(!busy && !result) return "";
  const p=prog||{};
  return `<div class="card stepc" id="dkProg"><h3>${busy?esc(p.label||busy):"Résultat"}</h3>
   ${busy?`<div class="progress"${p.Pct==null&&p.pct==null?' style="opacity:.5"':""}><i style="width:${p.Pct!=null?p.Pct:p.pct!=null?p.pct:100}%"${p.Pct==null&&p.pct==null?' class="indet"':""}></i></div>`:""}
   ${p.Total?`<p class="fine">${Number(p.Done).toLocaleString("fr-FR")} / ${Number(p.Total).toLocaleString("fr-FR")} blocs · ${p.Speed} Mo/s · normaux ${p.Ok} · lents ${p.Slow} · très lents ${p.VerySlow} · <b class="${p.Errors?"c-crit":""}">erreurs ${p.Errors}</b></p>`:""}
   ${busy?`<p class="fine">Acceptez la demande des droits administrateur de Windows si elle s'affiche.</p><div class="actions"><button class="btn ghost" id="dkStop">Annuler</button></div>`:""}
   ${result?`<div class="out ${result.cls||""}">${esc(result.text)}</div>`:""}</div>`;
}
R.disques = ()=>`<div class="eyebrow">Stockage</div><h1>Disques internes et externes</h1>
 <p class="lede">Diagnostic et réparation des disques durs, SSD, clés USB et cartes SD, branchés en interne ou en externe (USB, boîtier, station d'accueil) : santé, SMART, test de surface, vitesse, CHKDSK, remise en ligne, lettre de lecteur, formatage et copie des données d'un disque qui faiblit.</p>
 ${DESKTOP?`<div class="actions" style="margin:0 0 14px"><button class="btn" id="dkScan" ${busy?"disabled":""}>${data?"Relancer l'analyse":"Analyser les disques"}</button><button class="btn ghost" id="dkMgmt">Gestion des disques Windows</button></div>
   ${data&&!data.Smartctl?`<div class="infobox">Pour lire le SMART des disques externes USB, installez <a href="https://www.smartmontools.org/wiki/Download" target="_blank" rel="noopener">smartmontools</a> (gratuit) puis relancez l'analyse : DiagLab l'utilise automatiquement.</div>`:""}
   ${progPanel()}
   ${data?`<p class="fine">Analyse du ${esc(data.Date)} · ${data.Disks.length} disque(s) · les disques externes sont listés en premier.</p>${[...data.Disks].sort((a,b)=>(/USB/i.test(b.Bus)?1:0)-(/USB/i.test(a.Bus)?1:0)||a.Number-b.Number).map(diskCard).join("")}`
     :`<p class="fine">Branchez le disque externe, puis cliquez sur « Analyser les disques » et acceptez la demande d'administrateur.</p>`}`
 :`<div class="infobox">L'analyse et la réparation en un clic sont dans la <a href="https://github.com/agricyril22-cpu/DiagLab-Pro/releases/latest" target="_blank" rel="noopener">version Windows (.exe)</a>. Sur un PC sans DiagLab, lancez <span class="mono">DiagLab\\Disques\\Lancer-Disques.bat</span> depuis la ${FULL?`<a href="outils/DiagLab-Cle-Secours.zip" download>trousse de la clé de secours</a>`:"trousse de la clé de secours"}.</div>`}
 <h2 class="sub">Dépannage pas à pas</h2>
 ${GUIDE.map(g=>`<details class="acc"><summary>${esc(g[0])}</summary><div class="body"><ol>${g[1].map(x=>`<li>${esc(x)}</li>`).join("")}</ol></div></details>`).join("")}
 <h2 class="sub">Comprendre le SMART</h2>
 <div class="tw card" style="padding:0"><table class="t"><thead><tr><th>ID</th><th>Attribut</th><th>Signification</th></tr></thead><tbody>${SMART_TABLE.map(r=>`<tr><td class="num">${r[0]}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join("")}</tbody></table></div>
 <h2 class="sub">Outils spécialisés</h2>
 <div class="grid g2">${TOOLS.map(x=>`<div class="card tool"><h3>${esc(x[0])}</h3><div class="meta"><span class="pill">${esc(x[3])}</span></div><p>${esc(x[1])}</p><p style="margin-top:10px"><a href="${x[2]}" target="_blank" rel="noopener">Page officielle ↗</a></p></div>`).join("")}</div>`;

async function op(label, fn, fmt){
  if(busy) return; busy=label; prog={label}; result=null; DL.render();
  let r; try{ r=await fn(); }catch(e){ r={ok:false,error:e.message}; }
  busy=null; prog=null;
  if(r && r.cancelled && !r.error){ DL.render(); return r; }
  result = r && r.ok ? fmt(r) : {cls:"bad", text:"✘ "+((r&&r.error)||"Échec.")+(r&&r.detail?"\n"+r.detail:"")};
  DL.render(); const p=$("#dkProg"); if(p) p.scrollIntoView({behavior:"smooth",block:"start"});
  return r;
}
AFTER.disques = ()=>{
  if(!DESKTOP) return;
  if(offProg) offProg(); offProg=api.onProgress(d=>{ prog=Object.assign({},prog,d); const box=$("#dkProg"); if(box && busy){ box.outerHTML=progPanel(); const st=$("#dkStop"); if(st) st.onclick=()=>api.cancel(); } });
  $("#dkScan").onclick=()=>op("Analyse des disques…", api.analyse, r=>{ data=r.data; if(window.DLBoard) markBoard(); const bad=data.Disks.filter(d=>verdict(d).lv!=="ok").length;
    return {cls:bad?"":"good", text:`${data.Disks.length} disque(s) analysé(s) : ${bad?bad+" à surveiller ou en danger.":"tous en bon état."}`}; });
  $("#dkMgmt").onclick=()=>api.manager();
  const st=$("#dkStop"); if(st) st.onclick=()=>api.cancel();
  const D=n=>data.Disks.find(x=>x.Number===+n);
  $$("[data-act]").forEach(b=>b.onclick=()=>{
    const a=b.dataset.act, n=b.dataset.d, L=b.dataset.l;
    if(a==="close"){ open=null; DL.render(); return; }
    if(a==="surface"||a==="surfacefull") return op(`Test de surface ${a==="surface"?"rapide":"complet"}…`, ()=>api.surface(n, a==="surface"?"quick":"full"), r=>{ const x=r.result, bad=x.Errors>0, slow=x.VerySlow>0;
      return {cls:bad?"bad":slow?"":"good", text:`${x.Stopped?"Test arrêté":"Test terminé"} (${x.Done}/${x.Total} blocs, ${x.Speed} Mo/s, ${x.Seconds} s)\nNormaux : ${x.Ok} · lents : ${x.Slow} · très lents : ${x.VerySlow} · erreurs de lecture : ${x.Errors}\n`+
        (bad?"✘ Secteurs illisibles : copier les données au plus vite, puis remplacer le disque.":slow?"⚠ Zones très lentes : secteurs fragiles probables, sauvegarder et surveiller.":"✔ Aucune zone faible détectée.")+(x.Zones.length?"\nZones : "+x.Zones.join(" · "):"")}; });
    if(a==="online"||a==="readonly") return op(a==="online"?"Mise en ligne du disque…":"Retrait de la lecture seule…", ()=>api.fixDisk(n,a), r=>({cls:"good",text:"✔ "+(r.log||"Fait.")+"\nRelancez l'analyse pour voir le résultat."}));
    if(a==="letter") return op("Attribution d'une lettre…", ()=>api.letter(n,b.dataset.p), r=>({cls:"good",text:`✔ Le volume est maintenant accessible en ${r.letter}:`}));
    if(a==="chk") return op(`Vérification de ${L}:…`, ()=>api.chkdsk(L,false,false), r=>({cls:r.code===0?"good":"", text:(r.code===0?"✔ Aucune erreur trouvée.\n":"⚠ Des erreurs ont été trouvées : utilisez « Réparer ».\n")+r.log}));
    if(a==="speed") return op(`Mesure de vitesse de ${L}:…`, ()=>api.speed(L), r=>({cls:"good", text:`Lecture séquentielle : ${r.seqRead??"?"} Mo/s\nÉcriture séquentielle : ${r.seqWrite??"?"} Mo/s\nLecture aléatoire : ${r.ranRead??"?"} Mo/s\nRepères : disque dur USB 3 ≈ 100–200 Mo/s ; SSD USB 3.2 ≈ 400–1 000 Mo/s ; moins de 40 Mo/s = port USB 2, câble ou disque fatigué.`}));
    if(a==="copy") return op(`Copie des données de ${L}:…`, ()=>api.copy(L), r=>({cls:r.ok?"good":"bad", text:`✔ Données copiées dans ${r.dest}\n${r.log}`}));
    if(a==="eject") return op(`Éjection de ${L}:…`, ()=>api.eject(L), ()=>({cls:"good",text:`✔ ${L}: peut être débranché si Windows l'a confirmé.`}));
    if(a==="fix"||a==="format"){ open={kind:a,l:L,d:+n}; DL.render(); const c=$(`#disk${n} .inl`); if(c) c.scrollIntoView({behavior:"smooth",block:"center"}); return; }
    if(a==="fiche"){ const d=D(n), v=verdict(d), dr=DL.draft();
      const t=`Disque ${d.Model} (${busLabel(d)}, ${GB(d.Size)}) : ${LV[v.lv].toLowerCase()}\n`+(v.items.length?v.items.map(x=>"- "+x.m+" → "+x.a).join("\n"):"- Aucun problème détecté");
      dr.diagnostic=dr.diagnostic?dr.diagnostic+"\n\n"+t:t; if(!dr.type) dr.type=/USB/i.test(d.Bus)?"Autre":"Ordinateur fixe"; if(!dr.modele && /USB/i.test(d.Bus)) dr.modele=d.Model;
      DL.saveDraft(dr); go("fiche"); setTimeout(()=>toast("Diagnostic du disque ajouté à la fiche."),50); }
  });
  if($("#fixGo")) $("#fixGo").onclick=()=>{ const L=open.l, r=$("#fixR").checked; open=null; op(`Réparation de ${L}:…`, ()=>api.chkdsk(L,true,r), x=>({cls:"good", text:"✔ Réparation terminée.\n"+x.log})); };
  if($("#fmOk")) $("#fmOk").oninput=e=>{ $("#fmGo").disabled=e.target.value.trim().toUpperCase()!=="EFFACER"; };
  if($("#fmGo")) $("#fmGo").onclick=()=>{ const L=open.l, f=$("#fmFs").value, lb=$("#fmLb").value; open=null; op(`Formatage de ${L}:…`, ()=>api.format(L,f,lb), x=>({cls:"good", text:"✔ "+x.log})); };
};
/* Disques internes → schéma de carte mère du tableau de bord */
function markBoard(){
  const b=store.get("dl-board",{}); b.pc=b.pc||{};
  data.Disks.filter(d=>!/USB/i.test(d.Bus)).forEach(d=>{
    const id=/NVMe/i.test(d.Bus)?"m2":"sata", v=verdict(d); if(v.lv==="ok" || (b.pc[id]&&b.pc[id].manual)) return;
    b.pc[id]={st:v.lv==="critique"?"defect":"suspect", src:["Disques : "+d.Model+" — "+v.items.filter(x=>x.lv!=="info").map(x=>x.m).join(", ")], manual:false, at:new Date().toLocaleString("fr-FR")};
  });
  store.set("dl-board",b);
}
window.addEventListener("popstate",()=>{ if(offProg && !$("#dkScan")){ offProg(); offProg=null; } });
window.DLDiskVerdict = verdict;
})();
