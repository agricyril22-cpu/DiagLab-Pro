/* DiagLab Pro — systèmes et ISO officiels + vérification SHA-256 */
(function(){
"use strict";
const {R, AFTER, $, $$, esc, toast} = window.DL;

/* SHA-256 incrémental (FIPS 180-4), pour les fichiers trop gros pour être lus d'un bloc */
const K=new Uint32Array([0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2]);
class Sha256{
  constructor(){ this.h=new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]); this.buf=new Uint8Array(64); this.bl=0; this.len=0; this.w=new Int32Array(64); }
  block(b,o){
    const w=this.w, H=this.h;
    for(let i=0;i<16;i++) w[i]=(b[o+4*i]<<24)|(b[o+4*i+1]<<16)|(b[o+4*i+2]<<8)|b[o+4*i+3];
    for(let i=16;i<64;i++){ const x=w[i-15], y=w[i-2];
      w[i]=(w[i-16]+(((x>>>7)|(x<<25))^((x>>>18)|(x<<14))^(x>>>3))+w[i-7]+(((y>>>17)|(y<<15))^((y>>>19)|(y<<13))^(y>>>10)))|0; }
    let a=H[0]|0,b2=H[1]|0,c=H[2]|0,d=H[3]|0,e=H[4]|0,f=H[5]|0,g=H[6]|0,h=H[7]|0;
    for(let i=0;i<64;i++){
      const t1=(h+(((e>>>6)|(e<<26))^((e>>>11)|(e<<21))^((e>>>25)|(e<<7)))+((e&f)^(~e&g))+K[i]+w[i])|0;
      const t2=((((a>>>2)|(a<<30))^((a>>>13)|(a<<19))^((a>>>22)|(a<<10)))+((a&b2)^(a&c)^(b2&c)))|0;
      h=g; g=f; f=e; e=(d+t1)|0; d=c; c=b2; b2=a; a=(t1+t2)|0;
    }
    H[0]+=a; H[1]+=b2; H[2]+=c; H[3]+=d; H[4]+=e; H[5]+=f; H[6]+=g; H[7]+=h;
  }
  update(data){
    let i=0; const n=data.length; this.len+=n;
    if(this.bl){ while(this.bl<64 && i<n) this.buf[this.bl++]=data[i++]; if(this.bl===64){ this.block(this.buf,0); this.bl=0; } }
    for(; i+64<=n; i+=64) this.block(data,i);
    while(i<n) this.buf[this.bl++]=data[i++];
    return this;
  }
  hex(){
    const bits=this.len*8, pad=new Uint8Array(((this.bl<56)?56:120)-this.bl+8); pad[0]=0x80;
    const hi=Math.floor(bits/0x100000000), lo=bits>>>0, L=pad.length;
    pad[L-8]=hi>>>24; pad[L-7]=hi>>>16; pad[L-6]=hi>>>8; pad[L-5]=hi; pad[L-4]=lo>>>24; pad[L-3]=lo>>>16; pad[L-2]=lo>>>8; pad[L-1]=lo;
    const saveLen=this.len; this.update(pad); this.len=saveLen;
    return Array.from(this.h,v=>v.toString(16).padStart(8,"0")).join("");
  }
}
window.DLSha256 = Sha256;

let cat="Tout", job=null;
R.iso = ()=>`<div class="eyebrow">Téléchargements</div><h1>Systèmes &amp; ISO</h1>
 <p class="lede">Windows, Office, macOS, Linux, firmwares de téléphones et pilotes : uniquement les pages de téléchargement officielles, qui proposent toujours la dernière version. Vérifiez ensuite l'empreinte du fichier, puis créez la clé avec <a href="#boot">Rufus ou Ventoy</a>.</p>
 <div class="warnbox"><b>Licences :</b> Windows et Office téléchargés ici s'activent avec la licence du client (clé produit, licence numérique liée au compte ou au matériel). N'utilisez jamais d'ISO modifiée ou « pré-activée » trouvée ailleurs : ce sont un vecteur courant de logiciels malveillants.</div>
 <input class="search" id="isoQ" type="search" placeholder="Rechercher : Windows 11, Ubuntu, Office, pilotes…">
 <div class="chips" id="isoCat">${["Tout",...ISOS.map(c=>c[0])].map(c=>`<button class="chip" data-c="${esc(c)}" aria-pressed="${c===cat}">${esc(c)}</button>`).join("")}</div>
 <div id="isoList"></div>
 <h2 class="sub">Vérifier une ISO téléchargée (SHA-256)</h2>
 <div class="card">
  <p>Choisissez le fichier et collez l'empreinte SHA-256 publiée sur la page officielle. Le calcul se fait sur cet appareil : le fichier n'est envoyé nulle part.</p>
  <div class="form" style="margin-top:10px">
   <div class="field"><label for="shaFile">Fichier ISO, IMG ou DMG</label><input id="shaFile" type="file"></div>
   <div class="field"><label for="shaRef">Empreinte officielle (facultatif)</label><input id="shaRef" class="mono" placeholder="64 caractères hexadécimaux" autocomplete="off"></div>
  </div>
  <div class="actions"><button class="btn" id="shaGo">Calculer l'empreinte</button><button class="btn ghost" id="shaStop" hidden>Arrêter</button></div>
  <div class="progress" id="shaBar" hidden><i></i></div>
  <div class="out" id="shaOut" hidden></div>
  <p class="fine">Sous Windows, même résultat avec <span class="mono">certutil -hashfile fichier.iso SHA256</span> ; sous macOS et Linux, <span class="mono">shasum -a 256 fichier.iso</span>.</p>
 </div>`;
AFTER.iso = ()=>{
  const draw=()=>{
    const q=($("#isoQ").value||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").trim();
    const groups=ISOS.filter(g=>cat==="Tout"||g[0]===cat).map(g=>[g[0],g[1].filter(x=>!q||(g[0]+" "+x[0]+" "+x[1]).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").includes(q))]).filter(g=>g[1].length);
    $("#isoList").innerHTML=groups.length?groups.map(g=>`<h3 class="grp">${esc(g[0])}</h3><div class="grid g2">${g[1].map(x=>`<div class="card tool"><h3>${esc(x[0])}</h3><div class="meta"><span class="pill">${esc(x[2])}</span><span class="pill">${esc(x[4])}</span></div><p>${esc(x[1])}</p><p style="margin-top:10px"><a href="${x[3]}" target="_blank" rel="noopener">Page officielle ↗</a></p></div>`).join("")}</div>`).join(""):`<div class="card"><p>Aucun résultat pour cette recherche.</p></div>`;
  };
  $("#isoQ").oninput=draw;
  $$("#isoCat .chip").forEach(b=>b.onclick=()=>{cat=b.dataset.c;$$("#isoCat .chip").forEach(x=>x.setAttribute("aria-pressed",x===b));draw()});
  draw();

  $("#shaGo").onclick=async()=>{
    const f=$("#shaFile").files[0]; if(!f){ toast("Choisissez d'abord un fichier."); return; }
    const ref=($("#shaRef").value||"").trim().toLowerCase().replace(/\s/g,"");
    const out=$("#shaOut"), bar=$("#shaBar"), fill=bar.querySelector("i");
    out.hidden=false; bar.hidden=false; fill.style.width="0"; $("#shaGo").disabled=true; $("#shaStop").hidden=false;
    const my={stop:false}; job=my; const t0=performance.now();
    $("#shaStop").onclick=()=>{my.stop=true};
    try{
      const sha=new Sha256(), CH=8*1024*1024;
      for(let pos=0; pos<f.size; pos+=CH){
        if(my.stop) throw new Error("stop");
        sha.update(new Uint8Array(await f.slice(pos,pos+CH).arrayBuffer()));
        const done=Math.min(f.size,pos+CH), s=(performance.now()-t0)/1000;
        if(!$("#shaOut")) return;
        fill.style.width=(done/f.size*100)+"%"; out.textContent=`Calcul… ${(done/1048576).toFixed(0)} / ${(f.size/1048576).toFixed(0)} Mo · ${(done/1048576/Math.max(s,0.01)).toFixed(0)} Mo/s`;
      }
      const hex=sha.hex();
      out.textContent=`${f.name}\nSHA-256 : ${hex}\n`+(ref?(ref===hex?"✔ Identique à l'empreinte officielle : le fichier est intact.":"✘ Différent de l'empreinte officielle : fichier corrompu ou modifié. Ne l'utilisez pas, retéléchargez-le."):"Comparez cette empreinte avec celle de la page officielle.");
      out.className="out "+(ref?(ref===hex?"good":"bad"):"");
    }catch(e){ if($("#shaOut")) out.textContent=e.message==="stop"?"Calcul arrêté.":"Lecture du fichier impossible : "+e.message; }
    finally{ if($("#shaGo")){ $("#shaGo").disabled=false; $("#shaStop").hidden=true; } job=null; }
  };
};
})();
