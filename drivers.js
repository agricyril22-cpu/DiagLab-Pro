/* DiagLab Pro — pilotes : périphériques sans pilote, installation hors connexion, sauvegarde */
(function(){
"use strict";
const {R, AFTER, $, $$, esc, toast, copyText, DESKTOP, FULL} = window.DL;
const api = DESKTOP && window.diaglab.drivers;
let scan=null, busy=false, out="";

/* Identifie le fabricant et la catégorie à partir d'un identifiant matériel */
function identify(id){
  const s=String(id||"").toUpperCase();
  const m=/(?:VEN|VID)_([0-9A-F]{4})/.exec(s), d=/(?:DEV|PID)_([0-9A-F]{4})/.exec(s);
  const bus=/^PCI\\/.test(s)?"PCI":/^USB\\/.test(s)?"USB":/^HID\\/.test(s)?"HID":/^ACPI\\/.test(s)?"ACPI":/^(INTELAUDIO|HDAUDIO)\\/.test(s)?"Audio":/^BTH/.test(s)?"Bluetooth":/^SWD\\|ROOT\\/.test(s)?"Logiciel":"";
  const cls=/CC_0300|CC_0302/.test(s)?"carte graphique":/CC_0200/.test(s)?"carte réseau Ethernet":/CC_0280/.test(s)?"carte Wi-Fi":/CC_0403|HDAUDIO/.test(s)?"audio":/CC_0106|CC_0104|CC_0108/.test(s)?"contrôleur de stockage (SATA / RAID / NVMe)":/CC_0C03/.test(s)?"contrôleur USB":/CC_0C05/.test(s)?"contrôleur SMBus":/CC_0805/.test(s)?"lecteur de cartes SD":/CC_0780/.test(s)?"contrôleur de communication (souvent Intel ME / série)":/CC_1180|CC_11/.test(s)?"capteurs / gestion":"";
  return {vendor:m?(VENDOR_IDS[m[1]]||"fabricant "+m[1]):"", ven:m&&m[1], dev:d&&d[1], bus, cls};
}
/* Identifiant raccourci pour la recherche dans le Catalogue Microsoft */
function shortId(id){
  const s=String(id||""); const m=/^(PCI\\VEN_[0-9A-F]{4}&DEV_[0-9A-F]{4})/i.exec(s)||/^(USB\\VID_[0-9A-F]{4}&PID_[0-9A-F]{4})/i.exec(s)||/^(ACPI\\[A-Z0-9]+)/i.exec(s)||/^(HID\\[A-Z0-9_]+)/i.exec(s);
  return m?m[1]:s;
}
const catalog = id=>"https://www.catalog.update.microsoft.com/Search.aspx?q="+encodeURIComponent(shortId(id));

function devRow(d){
  const id=d.Ids[0]||d.Instance, info=identify(id);
  return `<div class="finding"><span class="lvl lvl-${d.Code===28||d.Code===1?"attention":"critique"}">Code ${d.Code}</span><div>
    <b>${esc(d.Name||"Périphérique inconnu")}</b>${info.vendor?` · ${esc(info.vendor)}`:""}${info.cls?` · ${esc(info.cls)}`:""}
    <div class="adv">${esc(PNP_CODES[d.Code]||"erreur")}${d.Class?" · classe "+esc(d.Class):""}</div>
    <div class="cmd" style="margin-top:6px"><code>${esc(shortId(id))}</code><button data-copy>Copier</button></div>
    <a href="${catalog(id)}" target="_blank" rel="noopener">Chercher ce pilote dans le Catalogue Microsoft ↗</a></div></div>`;
}
R.drivers = ()=>`<div class="eyebrow">Pilotes</div><h1>Pilotes de périphériques</h1>
 <p class="lede">Repérer les périphériques sans pilote, les identifier par leur ID matériel, et installer les pilotes même sans internet depuis la clé de secours. Les pilotes viennent toujours d'une source officielle (constructeur, Catalogue Microsoft) ou d'une sauvegarde faite sur un PC du même modèle.</p>
 ${DESKTOP?`<div class="card stepc"><h3>Ce PC</h3>
   <div class="actions" style="margin-top:0"><button class="btn" id="dvScan" ${busy?"disabled":""}>Analyser les pilotes</button>
   <button class="btn ghost" id="dvDir" ${busy?"disabled":""}>Installer depuis un dossier (clé USB)…</button>
   <button class="btn ghost" id="dvFiles" ${busy?"disabled":""}>Installer des fichiers .inf / .cab…</button>
   <button class="btn ghost" id="dvExp" ${busy?"disabled":""}>Sauvegarder les pilotes de ce PC…</button>
   <button class="btn ghost" id="dvWu">Windows Update : pilotes facultatifs</button></div>
   ${busy?`<p class="fine">Opération en cours : acceptez la demande des droits administrateur de Windows…</p>`:""}
   ${scan?`<p style="margin-top:12px"><b>${esc([scan.Manufacturer,scan.Model].filter(Boolean).join(" "))}</b> · ${scan.Total} périphériques, <b>${scan.Devices.length}</b> sans pilote ou en erreur.</p>
     ${scan.Devices.length?`<div class="findings">${scan.Devices.map(devRow).join("")}</div>`:`<p class="tst r-pass">Tous les périphériques fonctionnent.</p>`}`:""}
   ${out?`<details class="acc" open style="margin-top:12px"><summary>Journal de la dernière opération</summary><div class="body"><div class="out">${esc(out)}</div></div></details>`:""}
 </div>`
 :`<div class="infobox">L'analyse et l'installation en un clic sont dans la <a href="https://github.com/agricyril22-cpu/DiagLab-Pro/releases/latest" target="_blank" rel="noopener">version Windows (.exe)</a>. Sur un PC sans DiagLab, utilisez l'outil <b>Pilotes</b> de la trousse de la clé de secours${FULL?` (<a href="outils/DiagLab-Cle-Secours.zip" download>trousse .zip</a>)`:""}.</div>`}
 <h2 class="sub">Identifier un périphérique par son ID matériel</h2>
 <div class="card"><p>Gestionnaire de périphériques → clic droit sur le périphérique → Propriétés → Détails → « ID du matériel ». Collez la première ligne :</p>
  <div class="tool-in"><input id="hwId" class="mono" style="flex:1" value="PCI\\VEN_8086&amp;DEV_51F0&amp;SUBSYS_00748086&amp;REV_01" aria-label="ID matériel"></div>
  <div class="out" id="hwOut"></div></div>
 <h2 class="sub">Installer des pilotes sans internet</h2>
 <div class="grid g2">
  <div class="card"><h3>1. Dossier PILOTES de la clé</h3><p>Sur un PC qui fonctionne, « Sauvegarder les pilotes de ce PC » vers le dossier PILOTES de la clé. Sur un PC du même modèle sans internet : « Installer depuis un dossier », ou l'outil Pilotes de la trousse (option 2).</p></div>
  <div class="card"><h3>2. Pack du constructeur</h3><p>Dell, HP et Lenovo publient pour chaque modèle professionnel un pack contenant tous les pilotes. Téléchargez-le une fois, décompressez-le dans PILOTES.</p></div>
  <div class="card"><h3>3. Catalogue Microsoft Update</h3><p>Recherchez l'ID matériel, téléchargez le fichier .cab depuis un autre appareil, puis « Installer des fichiers .inf / .cab ».</p></div>
  <div class="card"><h3>4. Windows ne démarre pas</h3><p>Disque introuvable après un changement de carte ou INACCESSIBLE_BOOT_DEVICE : injecter le pilote de stockage depuis la <a href="#rescue">clé de secours</a> (menu Réparation, option 5), ou « Charger un pilote » pendant l'installation de Windows.</p></div>
 </div>
 <h2 class="sub">Sources officielles</h2>
 <div class="grid g2">${DRIVER_SOURCES.map(s=>`<div class="card tool"><h3>${esc(s[0])}</h3><div class="meta"><span class="pill">${esc(s[3])}</span></div><p>${esc(s[1])}</p><p style="margin-top:10px"><a href="${s[2]}" target="_blank" rel="noopener">Ouvrir ↗</a></p></div>`).join("")}</div>
 <h2 class="sub">Pilotes USB des téléphones</h2>
 <div class="grid g2">${PHONE_DRIVERS.map(s=>`<div class="card tool"><h3>${esc(s[0])}</h3><p>${esc(s[1])}</p><p style="margin-top:10px"><a href="${s[2]}" target="_blank" rel="noopener">Page officielle ↗</a></p></div>`).join("")}</div>`;

AFTER.drivers = ()=>{
  const hw=()=>{ const v=$("#hwId").value.trim(); if(!v){$("#hwOut").textContent="Collez un ID matériel.";return}
    const i=identify(v); $("#hwOut").innerHTML=`${esc(i.vendor||"Fabricant non reconnu")}${i.cls?" · "+esc(i.cls):""}${i.bus?" · bus "+esc(i.bus):""}${i.dev?" · modèle "+esc(i.dev):""}\n<a href="${catalog(v)}" target="_blank" rel="noopener">Chercher « ${esc(shortId(v))} » dans le Catalogue Microsoft ↗</a>`; };
  $("#hwId").oninput=hw; hw();
  $$("[data-copy]").forEach(b=>b.onclick=()=>copyText(b.previousElementSibling.textContent,b,b.previousElementSibling));
  if(!DESKTOP) return;
  const doit=async(fn,after)=>{ busy=true; DL.render(); let r; try{ r=await fn(); }catch(e){ r={ok:false,error:e.message}; } busy=false;
    if(r&&r.ok) after(r); else if(r&&!r.cancelled) toast(r.error||"Échec."); DL.render(); };
  $("#dvScan").onclick=()=>doit(api.scan, r=>{scan=r;});
  $("#dvDir").onclick=()=>doit(()=>api.install("folder"), async r=>{ out=r.log; toast("Installation terminée : vérifiez le journal."); const s=await api.scan(); if(s.ok){scan=s;DL.render();} });
  $("#dvFiles").onclick=()=>doit(()=>api.install("files"), async r=>{ out=r.log; toast("Installation terminée : vérifiez le journal."); const s=await api.scan(); if(s.ok){scan=s;DL.render();} });
  $("#dvExp").onclick=()=>doit(api.exportTo, r=>{ out=`${r.count} pilote(s) sauvegardé(s) dans ${r.folder}`; toast("Pilotes sauvegardés."); });
  $("#dvWu").onclick=()=>api.windowsUpdate();
};
window.DLIdentify = identify;
})();
