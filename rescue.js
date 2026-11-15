/* DiagLab Pro — clé USB de secours : Ventoy + systèmes + trousse de réparation */
(function(){
"use strict";
const {R, AFTER, $, $$, esc, toast, go, copyText, DESKTOP, FULL} = window.DL;
const api = DESKTOP && window.diaglab.usb;
const GB = n=>(n/1e9).toLocaleString("fr-FR",{maximumFractionDigits:1})+" Go";
let disks=null, sel=null, busy=false, journal=[];

const RESCUE_ISOS = [
 ["Hiren's BootCD PE","Windows de secours avec outils de récupération, partitionnement, sauvegarde, diagnostic. Le plus utile pour réparer.","https://www.hirensbootcd.org/download/","≈ 3 Go"],
 ["Windows 11 (ISO officielle)","Réinstallation, réparation sur place, invite de commandes de récupération.","https://www.microsoft.com/software-download/windows11","≈ 7 Go"],
 ["MemTest86","Test complet de la mémoire vive (image .img, prise en charge par Ventoy).","https://www.memtest86.com/download.htm","≈ 50 Mo"],
 ["SystemRescue","Linux de dépannage : TestDisk, PhotoRec, GParted, réseau.","https://www.system-rescue.org/Download/","≈ 1 Go"],
 ["Clonezilla","Clonage et images de disques (migration vers SSD).","https://clonezilla.org/downloads.php","≈ 400 Mo"],
 ["Ubuntu Desktop","Démarrage sans installation pour récupérer des données.","https://ubuntu.com/download/desktop","≈ 6 Go"]
];
const FIXES = [
 ["Le PC affiche « No bootable device » ou reste sur un écran noir après le logo","Démarrer sur la clé → Hiren's BootCD PE → lancer DiagLab\\Reparation\\DiagLab-Reparation.cmd → option 1 (réparer le démarrage)."],
 ["Écran bleu au démarrage, réparation automatique en boucle","Option 2 (SFC hors ligne) puis option 4 (DISM). Si le code est INACCESSIBLE_BOOT_DEVICE : option 5 (injecter le pilote de stockage Intel RST/VMD depuis PILOTES)."],
 ["Disque qui fait des clics ou erreurs de lecture","D'abord option 6 (sauvegarder les documents sur la clé), ensuite seulement option 3 (CHKDSK)."],
 ["Windows détruit, il faut réinstaller","Option 6 pour sauvegarder, puis démarrer sur l'ISO Windows 11 de la clé."],
 ["Suspicion de mémoire défectueuse","Démarrer MemTest86 depuis le menu Ventoy, 4 passes."]
];
const CMDS = [
 ["Réparer le démarrage UEFI (Windows sur C:)","mountvol S: /S && bcdboot C:\\Windows /s S: /f UEFI"],
 ["Vérifier les fichiers système hors ligne","sfc /scannow /offbootdir=C:\\ /offwindir=C:\\Windows"],
 ["Réparer l'image Windows hors ligne","dism /Image:C:\\ /Cleanup-Image /RestoreHealth"],
 ["Injecter des pilotes dans Windows hors ligne (clé en E:)","dism /Image:C:\\ /Add-Driver /Driver:E:\\PILOTES /Recurse"],
 ["Vérifier le disque","chkdsk C: /f"]
];

function bar(){ return `<div class="progress" id="rqBar" hidden><i></i></div><div class="fine" id="rqLbl"></div>`; }
function diskCards(){
  if(!disks) return `<p class="fine">Branchez la clé (16 Go minimum, 64 Go conseillés) puis lancez la recherche.</p>`;
  if(!disks.length) return `<div class="warnbox">Aucune clé USB détectée. Branchez-la directement sur le PC (pas sur un hub), puis relancez la recherche.</div>`;
  return `<div class="grid g3">${disks.map(d=>`<button class="pick" data-disk="${d.Index}" aria-pressed="${sel&&sel.Index===d.Index}"><span class="t">${esc(d.Model)}</span><span class="s">${GB(d.Size)} · ${esc(d.Letters.join(", ")||"sans lettre")}</span>${d.ventoy?'<span class="tst r-pass">Ventoy installé</span>':""}</button>`).join("")}</div>`;
}
R.rescue = ()=>{
  const vl = sel && sel.ventoy ? sel.Letters[sel.Labels.findIndex(x=>/^ventoy$/i.test(x))] : null;
  return `<div class="eyebrow">Clé USB de dépannage</div><h1>Clé de secours</h1>
  <p class="lede">Une clé qui démarre n'importe quel PC, même quand Windows ne démarre plus : réparation du démarrage, SFC et DISM hors ligne, vérification du disque, sauvegarde des documents, pilotes hors connexion, test de la mémoire et réinstallation. Elle repose sur <b>Ventoy</b> (libre) : vous copiez plusieurs systèmes sur la même clé et choisissez au démarrage.</p>
  ${DESKTOP?`
  <div class="card stepc"><h3>1 · Choisir la clé USB</h3>${diskCards()}<div class="actions"><button class="btn ghost" id="rqScan">${disks?"Relancer la recherche":"Rechercher les clés USB"}</button></div></div>
  ${sel?`<div class="card stepc"><h3>2 · Installer Ventoy sur « ${esc(sel.Model)} »</h3>
    ${sel.ventoy?`<p>Ventoy est déjà installé sur cette clé (${esc(vl||"")}). Vous pouvez passer à l'étape 3, ou le mettre à jour sans perdre les fichiers.</p><div class="actions"><button class="btn ghost" id="rqUpd">Mettre à jour Ventoy</button></div>`
    :`<div class="warnbox"><b>Tout le contenu de cette clé (${GB(sel.Size)}) sera effacé.</b> Copiez d'abord ce qui doit être conservé.</div>
     <div class="form"><div class="field"><label for="rqConf">Tapez EFFACER pour confirmer</label><input id="rqConf" autocomplete="off"></div>
     <div class="field"><label for="rqGpt">Style de partition</label><select id="rqGpt"><option value="mbr">MBR : compatible anciens et nouveaux PC (conseillé)</option><option value="gpt">GPT : PC récents uniquement</option></select></div></div>
     <div class="actions"><button class="btn danger" id="rqInst" disabled>Installer Ventoy et effacer la clé</button></div>`}
    <p class="fine">Ventoy est téléchargé depuis sa page officielle et son empreinte SHA-256 est vérifiée. Windows demande les droits administrateur. En cas d'échec : <button class="mini" id="rqGui">Ouvrir l'interface Ventoy</button></p></div>`:""}
  ${vl?`<div class="card stepc"><h3>3 · Ajouter des systèmes et outils (${esc(vl)})</h3>
    <div class="actions"><button class="btn" id="rqIso">Ajouter des ISO depuis cet ordinateur…</button><button class="btn ghost" id="rqHbcd">Télécharger Hiren's BootCD PE sur la clé (≈ 3 Go)</button></div>
    <p class="fine">Autres systèmes conseillés, à télécharger puis ajouter : ${RESCUE_ISOS.slice(1).map(x=>`<a href="${x[2]}" target="_blank" rel="noopener">${esc(x[0])}</a>`).join(" · ")}</p></div>
   <div class="card stepc"><h3>4 · Copier la trousse DiagLab</h3><p>Ajoute le menu de réparation, le Rapport PC, l'outil Pilotes, le dossier PILOTES${window.diaglab&&window.diaglab.version?" et DiagLab Pro portable (si vous utilisez la version portable)":""}.</p>
    <div class="actions"><button class="btn" id="rqKit">Copier la trousse sur ${esc(vl)}</button></div></div>`:""}
  <div class="card stepc" id="rqProg" ${busy||journal.length?"":"hidden"}><h3>Progression</h3>${bar()}<div class="actions" style="margin-top:8px"><button class="btn ghost" id="rqStop" ${busy?"":"hidden"}>Annuler</button></div>
    <div class="out" id="rqLog">${journal.map(esc).join("\n")}</div></div>`
  :`<div class="infobox">La création automatique de la clé est intégrée à la <b>version Windows (.exe)</b> de DiagLab Pro : <a href="${"https://github.com/agricyril22-cpu/DiagLab-Pro/releases/latest"}" target="_blank" rel="noopener">la télécharger</a>. Sans elle, suivez la méthode manuelle ci-dessous.</div>
  <details class="acc" open><summary>Méthode manuelle (5 minutes)</summary><div class="body"><ol>
    <li>Télécharger <a href="https://www.ventoy.net/en/download.html" target="_blank" rel="noopener">Ventoy</a>, lancer Ventoy2Disk.exe, choisir la clé, cliquer sur Installer (la clé est effacée).</li>
    <li>Copier sur la clé les ISO voulues (liste ci-dessous), simplement par copier-coller.</li>
    <li>${FULL?`Télécharger la <a href="outils/DiagLab-Cle-Secours.zip" download>trousse DiagLab (.zip)</a>`:"Télécharger la trousse DiagLab (version installée de DiagLab)"} et la décompresser à la racine de la clé.</li>
    <li>Copier vos pilotes dans le dossier PILOTES de la clé (voir <a href="#drivers">Pilotes</a>).</li></ol></div></details>`}
  <h2 class="sub">Systèmes à mettre sur la clé</h2>
  <div class="grid g2">${RESCUE_ISOS.map(x=>`<div class="card tool"><h3>${esc(x[0])}</h3><div class="meta"><span class="pill">${esc(x[3])}</span></div><p>${esc(x[1])}</p><p style="margin-top:10px"><a href="${x[2]}" target="_blank" rel="noopener">Page officielle ↗</a></p></div>`).join("")}</div>
  <h2 class="sub">Démarrer un PC sur la clé et le réparer</h2>
  <div class="card"><ol class="steps">
    <li>Brancher la clé, allumer et appuyer sur la touche du menu de démarrage (F12, F9, F11, Échap… voir <a href="#boot">Outils de boot</a>).</li>
    <li>Choisir la clé USB (« UEFI: … » sur les PC récents). Le menu Ventoy s'affiche.</li>
    <li>Choisir Hiren's BootCD PE, puis « Boot in normal mode ».</li>
    <li>Ouvrir la clé dans l'explorateur et lancer <span class="mono">DiagLab\\Reparation\\DiagLab-Reparation.cmd</span>.</li></ol>
    <p class="fine">Secure Boot bloque le démarrage ? Au premier démarrage, Ventoy propose d'enrôler sa clé (« Enroll key ») ; sinon, désactivez temporairement Secure Boot dans le BIOS.</p></div>
  ${FIXES.map(f=>`<details class="acc"><summary>${esc(f[0])}</summary><div class="body">${esc(f[1])}</div></details>`).join("")}
  <details class="acc"><summary>Commandes de réparation manuelles</summary><div class="body">${CMDS.map(c=>`<div style="margin:10px 0 2px;font-size:13.5px;color:var(--muted)">${esc(c[0])}</div><div class="cmd"><code>${esc(c[1])}</code><button data-copy>Copier</button></div>`).join("")}<p class="fine">Dans WinPE, la lettre de Windows n'est pas toujours C: : vérifiez avec <span class="mono">dir D:\\Windows</span>, etc.</p></div></details>`;
};

let off=null;
function log(t){ journal.push(t); const l=$("#rqLog"); if(l) l.textContent=journal.join("\n"); }
function progress(d){
  const b=$("#rqBar"), lb=$("#rqLbl"); if(!b) return;
  if(d.label){ lb.textContent=d.label; }
  if(d.pct!=null){ b.hidden=false; b.querySelector("i").style.width=Math.max(0,Math.min(100,d.pct))+"%"; }
  if(d.done!=null && d.total) lb.textContent=(d.file?d.file+" · ":"")+`${(d.done/1048576).toFixed(0)} / ${(d.total/1048576).toFixed(0)} Mo`;
}
async function task(label, fn){
  if(busy) return; busy=true; log("▶ "+label); DL.render();
  try{ const r=await fn(); if(r&&r.ok){ log("✔ "+(r.msg||"Terminé.")); } else if(r&&!r.cancelled){ log("✘ "+(r.error||"Échec.")+(r.detail?"\n"+r.detail:"")); } else log("· Annulé."); return r; }
  catch(e){ log("✘ "+e.message); }
  finally{ busy=false; DL.render(); }
}
AFTER.rescue = ()=>{
  $$("[data-copy]").forEach(b=>b.onclick=()=>copyText(b.previousElementSibling.textContent,b,b.previousElementSibling));
  if(!DESKTOP) return;
  if(off) off(); off=window.diaglab.onProgress(progress);
  $("#rqScan").onclick=async()=>{ const r=await api.list(); if(!r.ok){toast(r.error);return} disks=r.disks; if(sel) sel=disks.find(d=>d.Index===sel.Index)||null; if(!sel&&disks.length===1) sel=disks[0]; DL.render(); };
  $$("[data-disk]").forEach(b=>b.onclick=()=>{ sel=disks.find(d=>d.Index===+b.dataset.disk); DL.render(); });
  if($("#rqConf")) $("#rqConf").oninput=e=>{ $("#rqInst").disabled = e.target.value.trim().toUpperCase()!=="EFFACER"; };
  if($("#rqInst")) $("#rqInst").onclick=()=>task(`Installation de Ventoy sur ${sel.Model}`, async()=>{ const r=await api.ventoy(sel.Index,{gpt:$("#rqGpt").value==="gpt"}); if(r.disks){disks=r.disks; sel=disks.find(d=>d.Index===sel.Index)||sel;} if(r.ok) r.msg=`Ventoy ${r.ver} installé. Passez à l'étape 3.`; return r; });
  if($("#rqUpd")) $("#rqUpd").onclick=()=>task("Mise à jour de Ventoy", async()=>{ const r=await api.ventoy(sel.Index,{update:true}); if(r.disks){disks=r.disks; sel=disks.find(d=>d.Index===sel.Index)||sel;} if(r.ok) r.msg=`Ventoy ${r.ver} à jour.`; return r; });
  if($("#rqGui")) $("#rqGui").onclick=async()=>{ const r=await api.ventoyGui(); if(!r.ok) toast(r.error); };
  const vl = sel && sel.ventoy ? sel.Letters[sel.Labels.findIndex(x=>/^ventoy$/i.test(x))] : null;
  if($("#rqIso")) $("#rqIso").onclick=()=>task("Copie d'ISO sur la clé", async()=>{ const r=await api.addIso(vl); if(r.ok) r.msg=`Copié : ${r.copied.join(", ")}`; return r; });
  if($("#rqHbcd")) $("#rqHbcd").onclick=()=>task("Téléchargement de Hiren's BootCD PE", async()=>{ const r=await api.hirens(vl); if(r.ok) r.msg="Hiren's BootCD PE est sur la clé."; return r; });
  if($("#rqKit")) $("#rqKit").onclick=()=>task("Copie de la trousse DiagLab", async()=>{ const r=await api.kit(vl); if(r.ok) r.msg="Trousse copiée : dossiers DiagLab et PILOTES"+(r.portable?", avec DiagLab Pro portable.":"."); return r; });
  if($("#rqStop")) $("#rqStop").onclick=()=>api.cancel();
};
window.addEventListener("popstate",()=>{ if(off){off();off=null} });
})();
