/* DiagLab Pro — illustrations interactives des cours (SVG dessinés, fond « tapis antistatique »).
   Chaque zone .hot porte data-t (titre) et data-d (explication) : un toucher l'affiche sous la figure. */
const FIGS = (function(){
const H=(t,d,inner)=>`<g class="hot" tabindex="0" role="button" data-t="${t}" data-d="${d}">${inner}</g>`;
const L=(x,y,t,a)=>`<text class="fl" x="${x}" y="${y}"${a?` text-anchor="${a}"`:""}>${t}</text>`;
const S=(vb,body,cap)=>({svg:`<svg viewBox="${vb}" class="figsvg" role="img" aria-label="${cap}"><rect class="mat" x="0" y="0" width="100%" height="100%"/>${body}</svg>`,cap});
const band=(x,c)=>`<rect x="${x}" y="31" width="7" height="38" fill="${c}"/>`;
return {
 resistance: S("0 0 520 200",
  `<line x1="20" y1="50" x2="120" y2="50" class="lead"/><line x1="300" y1="50" x2="400" y2="50" class="lead"/>
  ${H("Corps de la résistance","Film de carbone ou métal enroulé sur un cylindre céramique. Plus la résistance est grande (en ohms, Ω), moins le courant passe.",`<rect x="120" y="28" width="180" height="44" rx="20" fill="#d9c7a3" stroke="#8a7650"/>`)}
  ${H("1re bande : 1er chiffre","Marron = 1. Code : noir 0, marron 1, rouge 2, orange 3, jaune 4, vert 5, bleu 6, violet 7, gris 8, blanc 9.",band(140,"#7a4a1e"))}
  ${H("2e bande : 2e chiffre","Noir = 0. On lit donc « 10 ».",band(160,"#111"))}
  ${H("3e bande : multiplicateur","Orange = ×1 000. 10 × 1 000 = 10 000 Ω = 10 kΩ.",band(180,"#e8741c"))}
  ${H("Bande de tolérance","Or = ±5 %, argent ±10 %, marron ±1 %. Elle est un peu écartée des autres : on lit depuis l'autre côté.",band(270,"#c9a43a"))}
  ${L(210,95,"10 kΩ ±5 % (traversante)","middle")}
  ${H("Résistance CMS (SMD)","Sur les cartes modernes. Code « 103 » = 10 suivi de 3 zéros = 10 kΩ. « 4R7 » = 4,7 Ω. Les très petites (0402, 0201) ne portent aucun marquage : on mesure, hors tension.",`<rect x="400" y="120" width="70" height="36" rx="3" fill="#111" stroke="#9aa"/><rect x="396" y="120" width="10" height="36" fill="#c8ccd0"/><rect x="464" y="120" width="10" height="36" fill="#c8ccd0"/><text x="435" y="144" class="mark" text-anchor="middle">103</text>`)}
  ${L(435,180,"CMS 0805 : « 103 »","middle")}
  ${H("Panne typique","Une résistance brûlée noircit ou se fend. Mesure hors tension à l'ohmmètre ; sur la carte, comparer avec une carte saine car les composants voisins faussent la mesure.",`<circle cx="70" cy="150" r="26" class="note"/><text x="70" y="156" class="noteT" text-anchor="middle">!</text>`)}
  ${L(105,155,"Panne typique")}`,
  "Résistances : code couleur et marquage CMS"),

 condensateurs: S("0 0 560 220",
  `${H("Condensateur électrolytique","Stocke l'énergie et lisse les tensions (alimentations, VRM). Polarisé : la bande grise marque le −. Valeur en µF et tension max (ex. 470 µF 16 V). Panne classique : sommet bombé ou fuite brune → le remplacer par même capacité et tension égale ou supérieure.",`<rect x="30" y="40" width="80" height="120" rx="8" fill="#2a4fa8"/><rect x="30" y="40" width="20" height="120" fill="#9fb3d8"/><path d="M42 40 l0 120" stroke="#2a4fa8"/><text x="40" y="105" class="mark" fill="#2a4fa8">−</text><path d="M50 52 h52 M76 40 v20" stroke="#cfd8e6" stroke-width="2"/><line x1="55" y1="160" x2="55" y2="195" class="lead"/><line x1="90" y1="160" x2="90" y2="185" class="lead"/>`)}
  ${L(70,212,"Électrolytique","middle")}
  ${H("Condensateur polymère solide","Plus durable, ne gonfle pas : très utilisé sur les cartes mères récentes autour du processeur.",`<rect x="140" y="70" width="60" height="80" rx="6" fill="#4d4f55"/><rect x="140" y="70" width="60" height="14" fill="#7b2cbf"/>`)}
  ${L(170,175,"Polymère","middle")}
  ${H("Céramique CMS (MLCC)","Minuscules, par centaines sur une carte de téléphone (découplage). Non polarisés, sans marquage. Panne : court-circuit franc sur une ligne d'alimentation, à trouver à la caméra thermique ou à la colophane.",`<rect x="245" y="100" width="44" height="24" rx="2" fill="#c49a6c"/><rect x="241" y="100" width="8" height="24" fill="#c8ccd0"/><rect x="285" y="100" width="8" height="24" fill="#c8ccd0"/>`)}
  ${L(267,150,"MLCC","middle")}
  ${H("Tantale CMS","Polarisé : la bande marque le +. Peut griller en court-circuit si on l'inverse.",`<rect x="330" y="96" width="60" height="32" rx="2" fill="#e0b321"/><rect x="330" y="96" width="12" height="32" fill="#8a6a10"/><text x="370" y="118" class="mark" text-anchor="middle" fill="#3a2a00">107</text>`)}
  ${L(360,150,"Tantale","middle")}
  ${H("Mesurer un condensateur","Décharger d'abord (alimentation débranchée). Au multimètre : mode capacité, hors circuit. En place : vérifier surtout l'absence de court-circuit vers la masse.",`<circle cx="470" cy="110" r="30" class="note"/><text x="470" y="117" class="noteT" text-anchor="middle">µF</text>`)}
  ${L(470,160,"Mesure","middle")}`,
  "Condensateurs : électrolytique, polymère, céramique, tantale"),

 diodes: S("0 0 560 210",
  `${H("Diode de redressement","Ne laisse passer le courant que dans un sens. La bague marque la cathode. En mode diode du multimètre : 0,5 à 0,7 V dans le sens passant, OL dans l'autre.",`<line x1="20" y1="60" x2="70" y2="60" class="lead"/><rect x="70" y="45" width="90" height="30" rx="6" fill="#222"/><rect x="140" y="45" width="10" height="30" fill="#ccc"/><line x1="160" y1="60" x2="210" y2="60" class="lead"/>`)}
  ${L(115,100,"Diode (bague = cathode)","middle")}
  ${H("Symbole","Le triangle pointe dans le sens du courant, la barre est la cathode (K). A = anode.",`<path d="M80 150 l40 20 l-40 20 z" fill="none" stroke="#fff" stroke-width="2.5"/><line x1="120" y1="148" x2="120" y2="192" stroke="#fff" stroke-width="2.5"/><line x1="40" y1="170" x2="80" y2="170" class="lead"/><line x1="120" y1="170" x2="160" y2="170" class="lead"/>`)}
  ${L(70,200,"A")}${L(122,200,"K")}
  ${H("LED","Diode qui émet de la lumière. Patte longue = anode (+). Rétroéclairages d'écrans et voyants. Tension directe 1,8 à 3,3 V selon la couleur.",`<path d="M270 60 a30 30 0 0 1 60 0 v40 h-60 z" fill="#ff5c5c" opacity=".9"/><rect x="262" y="100" width="76" height="8" fill="#ff8a8a"/><line x1="285" y1="108" x2="285" y2="175" class="lead"/><line x1="315" y1="108" x2="315" y2="160" class="lead"/>`)}
  ${L(300,195,"LED","middle")}
  ${H("Diode Zener / TVS","Protège contre les surtensions (ports USB, broches de charge). En cas de surtension elle passe en court-circuit : symptôme fréquent après un mauvais chargeur, l'appareil ne s'allume plus et l'alimentation de labo montre un courant élevé.",`<rect x="400" y="80" width="56" height="30" rx="2" fill="#111" stroke="#9aa"/><rect x="400" y="80" width="10" height="30" fill="#d8d8d8"/><rect x="446" y="80" width="10" height="30" fill="#d8d8d8"/><rect x="412" y="80" width="6" height="30" fill="#bbb"/>`)}
  ${L(428,135,"TVS / Zener CMS","middle")}`,
  "Diodes, LED et protections TVS"),

 transistors: S("0 0 560 220",
  `${H("Transistor bipolaire (TO-92)","Amplifie ou commute un courant. Trois pattes : émetteur, base, collecteur (vérifier la fiche technique : l'ordre varie).",`<path d="M40 50 h70 v40 a35 20 0 0 1 -70 0 z" fill="#222"/><line x1="55" y1="110" x2="55" y2="170" class="lead"/><line x1="75" y1="110" x2="75" y2="170" class="lead"/><line x1="95" y1="110" x2="95" y2="170" class="lead"/>`)}
  ${L(55,190,"E","middle")}${L(75,190,"B","middle")}${L(95,190,"C","middle")}
  ${H("MOSFET de puissance","Interrupteur commandé en tension : grille (G), drain (D), source (S). Composant central des VRM et des alimentations. Panne typique : court-circuit drain-source → la ligne 12 V ou VCORE tombe en court, l'alimentation se coupe aussitôt.",`<rect x="180" y="55" width="100" height="80" rx="4" fill="#2b2b2b" stroke="#888"/><rect x="200" y="40" width="60" height="16" fill="#c8ccd0"/><rect x="190" y="135" width="16" height="30" fill="#c8ccd0"/><rect x="254" y="135" width="16" height="30" fill="#c8ccd0"/><text x="230" y="100" class="mark" text-anchor="middle">4C10N</text>`)}
  ${L(198,185,"G","middle")}${L(230,30,"D (languette)","middle")}${L(262,185,"S","middle")}
  ${H("SOT-23 (CMS)","Petit boîtier à 3 broches pour transistors et régulateurs sur les cartes de téléphone et de PC portable. Marquage codé de 2 à 3 caractères.",`<rect x="350" y="80" width="50" height="34" rx="2" fill="#1a1a1a" stroke="#888"/><rect x="356" y="114" width="8" height="12" fill="#c8ccd0"/><rect x="386" y="114" width="8" height="12" fill="#c8ccd0"/><rect x="371" y="68" width="8" height="12" fill="#c8ccd0"/>`)}
  ${L(375,150,"SOT-23","middle")}
  ${H("Tester un MOSFET","Hors circuit, en mode diode : diode interne S→D vers 0,4–0,7 V ; D–S ne doit jamais afficher ~0 V dans les deux sens. Sur carte : chercher un court-circuit entre la ligne d'alimentation et la masse.",`<circle cx="480" cy="97" r="30" class="note"/><text x="480" y="104" class="noteT" text-anchor="middle">Ω</text>`)}`,
  "Transistors bipolaires et MOSFET"),

 inductance: S("0 0 520 190",
  `${H("Inductance de puissance (self)","Bloc gris marqué R47, R22… = 0,47 µH, 0,22 µH. Avec le MOSFET et les condensateurs, elle forme une phase d'alimentation. Une self qui siffle (coil whine) n'est pas une panne ; une self fissurée ou brûlée, si.",`<rect x="40" y="40" width="110" height="100" rx="8" fill="#5b5f66" stroke="#9aa0a8"/><text x="95" y="98" class="mark" text-anchor="middle">R47</text>`)}
  ${L(95,165,"Self CMS","middle")}
  ${H("Bobine sur tore","Fil de cuivre enroulé sur un tore de ferrite : filtrage dans les alimentations ATX et les blocs secteur.",`<circle cx="270" cy="90" r="50" fill="#333" stroke="#777" stroke-width="10"/>${Array.from({length:14},(_,i)=>{const a=i/14*6.283;return `<line x1="${270+38*Math.cos(a)}" y1="${90+38*Math.sin(a)}" x2="${270+62*Math.cos(a)}" y2="${90+62*Math.sin(a)}" stroke="#c87533" stroke-width="5"/>`}).join("")}`)}
  ${L(270,165,"Bobine torique","middle")}
  ${H("Quartz / oscillateur","Donne la fréquence de référence : 32,768 kHz pour l'horloge, 24 ou 25 MHz pour le processeur et le réseau. Un quartz mort empêche le démarrage (pas d'horloge).",`<rect x="390" y="65" width="90" height="46" rx="20" fill="#cfd4da" stroke="#8a9098"/><text x="435" y="94" class="mark" text-anchor="middle" fill="#333">24.000</text>`)}
  ${L(435,140,"Quartz","middle")}`,
  "Inductances, bobines et quartz"),

 boitiers: S("0 0 600 220",
  `${H("DIP (traversant)","Ancien boîtier à pattes traversantes : facile à dessouder. Encoche ou point = broche 1.",`<rect x="30" y="60" width="110" height="60" rx="3" fill="#1d1d1d"/>${[0,1,2,3,4].map(i=>`<rect x="${40+i*20}" y="48" width="8" height="12" fill="#c8ccd0"/><rect x="${40+i*20}" y="120" width="8" height="12" fill="#c8ccd0"/>`).join("")}<circle cx="44" cy="72" r="4" fill="#555"/>`)}
  ${L(85,160,"DIP","middle")}
  ${H("SOIC / SOP","Broches en « ailes de mouette » sur deux côtés : puces BIOS (25Q128…), EEPROM. Reprogrammables avec une pince SOIC8 et un programmateur CH341A.",`<rect x="180" y="70" width="80" height="44" rx="2" fill="#1d1d1d"/>${[0,1,2,3].map(i=>`<rect x="${188+i*19}" y="60" width="7" height="10" fill="#c8ccd0"/><rect x="${188+i*19}" y="114" width="7" height="10" fill="#c8ccd0"/>`).join("")}<circle cx="190" cy="80" r="3" fill="#666"/><text x="220" y="97" class="mark" text-anchor="middle">25Q64</text>`)}
  ${L(220,160,"SOIC-8 (BIOS)","middle")}
  ${H("QFN","Broches sous le boîtier, sur les bords, avec un pavé de masse central. Contrôleurs de charge, codecs audio. Se ressoude à l'air chaud avec du flux.",`<rect x="310" y="60" width="70" height="70" rx="3" fill="#2a2a2a" stroke="#999"/>${[0,1,2,3,4].map(i=>`<rect x="${318+i*12}" y="126" width="6" height="4" fill="#c8ccd0"/><rect x="${318+i*12}" y="60" width="6" height="4" fill="#c8ccd0"/>`).join("")}`)}
  ${L(345,160,"QFN","middle")}
  ${H("BGA","Billes de soudure sous la puce : processeur, mémoire, stockage, PMIC. Fissures de billes après chute ou chauffe → redémarrages, pas d'image. Réparation : reballage (station à air chaud ou infrarouge, pochoir, billes), travail de spécialiste.",`<rect x="430" y="50" width="120" height="90" rx="4" fill="#1d3b2a" stroke="#4c8"/>${Array.from({length:6},(_,r)=>Array.from({length:8},(_,c)=>`<circle cx="${444+c*13.5}" cy="${62+r*13.5}" r="4" fill="#c8ccd0"/>`).join("")).join("")}`)}
  ${L(490,160,"BGA (vue de dessous)","middle")}`,
  "Boîtiers de circuits intégrés"),

 vrm: S("0 0 560 260",
  `${H("Socket du processeur","Le VRM entoure le socket : il convertit le 12 V en VCORE (≈ 0,7 à 1,5 V) avec des dizaines d'ampères.",`<rect x="190" y="70" width="180" height="150" rx="6" fill="#3a3f46" stroke="#999"/><rect x="215" y="95" width="130" height="100" fill="#2c3036"/>`)}
  ${L(280,240,"Socket CPU","middle")}
  ${[0,1,2,3,4].map(i=>H("Phase d'alimentation n°"+(i+1),"Une phase = MOSFET (ou étage de puissance « DrMOS ») + self + condensateurs. Plus de phases = courant mieux réparti, moins de chauffe.",`<rect x="${70+i*90}" y="18" width="40" height="22" fill="#2b2b2b" stroke="#888"/><rect x="${70+i*90}" y="44" width="40" height="18" rx="3" fill="#5b5f66" stroke="#9aa0a8"/><text x="${90+i*90}" y="57" class="mark" text-anchor="middle" font-size="8">R22</text>`)).join("")}
  ${[0,1,2].map(i=>H("Condensateurs de sortie","Polymères : lissent la tension VCORE. Ne gonflent quasiment jamais.",`<rect x="${100+i*25}" y="${120}" width="18" height="30" rx="3" fill="#4d4f55"/><rect x="${100+i*25}" y="120" width="18" height="6" fill="#7b2cbf"/>`)).join("")}
  ${H("Contrôleur PWM","Pilote les phases selon la demande du processeur (signal SVID / SVI3).",`<rect x="420" y="130" width="40" height="40" fill="#222" stroke="#888"/>`)}
  ${L(440,190,"PWM","middle")}
  ${H("Connecteur EPS 12 V","Arrivée du 12 V du processeur (8 broches, parfois 8+4 ou 8+8). Oubli fréquent au montage : ventilateurs qui tournent, aucun affichage.",`<rect x="20" y="90" width="50" height="30" fill="#111" stroke="#aaa"/>${[0,1,2,3].map(i=>`<rect x="${25+i*11}" y="96" width="7" height="7" fill="#e8e8e8"/><rect x="${25+i*11}" y="107" width="7" height="7" fill="#e8e8e8"/>`).join("")}`)}
  ${L(45,140,"EPS 8 br.","middle")}`,
  "VRM : l'alimentation du processeur"),

 dimm: S("0 0 620 230",
  `${H("Barrette DDR5 (DIMM 288 broches)","DDR5 : 1,1 V, deux sous-canaux de 32 bits par barrette, fréquences de 4 800 à plus de 8 000 MT/s. Incompatible physiquement avec la DDR4 (encoche décalée).",`<rect x="20" y="40" width="580" height="120" rx="6" fill="#0f5132" stroke="#3aa877"/>`)}
  ${[0,1,2,3].map(i=>H("Puce mémoire DRAM","Puces de 16 ou 24 Gbit. Une puce défaillante provoque des erreurs MemTest86 et des écrans bleus.",`<rect x="${45+i*60}" y="62" width="44" height="56" fill="#1a1a1a" stroke="#666"/>`)).join("")}
  ${[0,1,2,3].map(i=>H("Puce mémoire DRAM","Puces de 16 ou 24 Gbit. Une puce défaillante provoque des erreurs MemTest86 et des écrans bleus.",`<rect x="${355+i*60}" y="62" width="44" height="56" fill="#1a1a1a" stroke="#666"/>`)).join("")}
  ${H("PMIC (gestion d'alimentation)","Nouveau en DDR5 : la régulation de tension est sur la barrette et non plus sur la carte mère.",`<rect x="290" y="70" width="34" height="26" fill="#222" stroke="#e6a23c"/>`)}
  ${H("Hub SPD / capteur","Mémorise les profils (JEDEC, XMP pour Intel, EXPO pour AMD) et la température.",`<rect x="293" y="104" width="28" height="16" fill="#222" stroke="#4cc77f"/>`)}
  ${H("Encoche (détrompeur)","Sa position diffère entre DDR4 et DDR5 : impossible d'insérer la mauvaise génération. Ne jamais forcer.",`<rect x="300" y="146" width="14" height="16" class="mat"/>`)}
  ${H("Contacts dorés","Nettoyer à la gomme blanche et à l'alcool isopropylique en cas d'oxydation : cause fréquente de « pas d'affichage ».",`<rect x="24" y="146" width="272" height="12" fill="#d4a940"/><rect x="318" y="146" width="278" height="12" fill="#d4a940"/>`)}
  ${L(310,190,"Toucher chaque zone pour l'explication","middle")}
  ${L(310,212,"Bi-canal : 2 barrettes dans A2 et B2 (voir le manuel)","middle")}`,
  "Barrette mémoire DDR5"),

 m2: S("0 0 620 200",
  `${H("SSD M.2 2280","22 mm de large, 80 mm de long. Interface NVMe (PCIe) : jusqu'à ≈ 3,5 Go/s en PCIe 3.0, 7 Go/s en 4.0, 14 Go/s en 5.0. Attention : certains M.2 sont en SATA (≈ 550 Mo/s, clé B+M).",`<rect x="30" y="50" width="540" height="100" rx="6" fill="#123d2c" stroke="#3aa877"/>`)}
  ${H("Contrôleur","Le cerveau du SSD (Phison, Samsung, SMI…). Il chauffe : dissipateur recommandé en PCIe 5.0.",`<rect x="130" y="70" width="70" height="60" fill="#1a1a1a" stroke="#888"/>`)}
  ${H("Cache DRAM","Accélère les petites écritures. Les SSD « DRAM-less » utilisent la mémoire du PC (HMB).",`<rect x="220" y="80" width="50" height="40" fill="#1a1a1a" stroke="#666"/>`)}
  ${H("Puces NAND","Stockent les données (TLC, QLC). Leur usure (TBW) se lit dans le SMART : CrystalDiskInfo ou le Rapport PC.",`<rect x="300" y="68" width="80" height="64" fill="#1a1a1a" stroke="#666"/><rect x="400" y="68" width="80" height="64" fill="#1a1a1a" stroke="#666"/>`)}
  ${H("Encoche clé M","Clé M = PCIe x4 (NVMe). Clé B+M = souvent SATA. Vérifier la compatibilité du slot de la carte mère.",`<rect x="30" y="50" width="30" height="100" fill="#d4a940"/><rect x="38" y="62" width="14" height="10" class="mat"/>`)}
  ${H("Vis et entretoise","Une vis manquante = SSD mal plaqué, non détecté par intermittence. Les cartes récentes ont des fixations sans outil.",`<circle cx="560" cy="100" r="12" fill="#bfc5cc" stroke="#777"/><path d="M552 100 h16 M560 92 v16" stroke="#555" stroke-width="2"/>`)}`,
  "SSD M.2 NVMe"),

 socket: S("0 0 620 240",
  `${H("LGA (Intel et AMD AM5)","Les broches sont dans le socket de la carte mère, le processeur n'a que des pastilles. Une broche tordue = mémoire ou canal absent, voire pas de démarrage : à redresser à la loupe avec une aiguille. Toujours remettre le capot de protection.",`<rect x="30" y="30" width="250" height="170" rx="6" fill="#3a3f46" stroke="#aaa"/>${Array.from({length:9},(_,r)=>Array.from({length:14},(_,c)=>`<circle cx="${52+c*15}" cy="${50+r*15}" r="2.4" fill="#d4a940"/>`).join("")).join("")}`)}
  ${L(155,225,"Socket LGA (broches côté carte)","middle")}
  ${H("PGA (AMD AM4 et anciens)","Les broches sont sous le processeur. Elles se tordent facilement au démontage (processeur collé au radiateur par la pâte : tourner légèrement avant de tirer).",`<rect x="350" y="30" width="240" height="170" rx="6" fill="#1f5f3f" stroke="#7c9"/>${Array.from({length:9},(_,r)=>Array.from({length:13},(_,c)=>`<circle cx="${372+c*16}" cy="${50+r*15}" r="2.4" fill="#e8d07a"/>`).join("")).join("")}`)}
  ${L(470,225,"Processeur PGA (broches côté CPU)","middle")}
  ${H("Triangle d'orientation","Un triangle doré marque la broche 1 : à aligner avec le repère du socket. Le processeur se pose sans aucune force.",`<path d="M36 36 l16 0 l-16 16 z" fill="#ffd34d"/>`)}`,
  "Sockets LGA et PGA"),

 alim: S("0 0 640 240",
  `${H("ATX 24 broches","Alimente la carte mère : 3,3 V, 5 V, 12 V, et le fil vert PS_ON (relié à la masse = démarrage). Le fil gris PWR_OK signale une alimentation stable.",`<rect x="20" y="40" width="160" height="56" fill="#111" stroke="#aaa"/>${Array.from({length:12},(_,i)=>`<rect x="${26+i*12.8}" y="48" width="9" height="9" fill="#e8e8e8"/><rect x="${26+i*12.8}" y="78" width="9" height="9" fill="#e8e8e8"/>`).join("")}<rect x="26" y="48" width="9" height="9" fill="#4cc77f"/>`)}
  ${L(100,115,"ATX 24 broches","middle")}
  ${H("EPS 8 broches (CPU)","12 V du processeur, en haut à gauche de la carte mère. Ne pas confondre avec le PCIe 8 broches (détrompeurs différents).",`<rect x="210" y="40" width="70" height="40" fill="#111" stroke="#aaa"/>${[0,1,2,3].map(i=>`<rect x="${216+i*15}" y="46" width="9" height="9" fill="#e8e8e8"/><rect x="${216+i*15}" y="64" width="9" height="9" fill="#e8e8e8"/>`).join("")}`)}
  ${L(245,100,"EPS 8 br.","middle")}
  ${H("PCIe 8 broches (6+2)","Alimente les cartes graphiques (150 W par connecteur).",`<rect x="310" y="40" width="70" height="40" fill="#111" stroke="#aaa"/>${[0,1,2,3].map(i=>`<rect x="${316+i*15}" y="46" width="9" height="9" fill="#e8e8e8"/><rect x="${316+i*15}" y="64" width="9" height="9" fill="#e8e8e8"/>`).join("")}`)}
  ${L(345,100,"PCIe 6+2","middle")}
  ${H("12V-2x6 (ex 12VHPWR)","Connecteur 16 broches des cartes graphiques récentes (jusqu'à 600 W). Il doit être enfoncé à fond, sans câble plié près de la prise : un connecteur mal inséré peut fondre.",`<rect x="410" y="40" width="120" height="44" fill="#111" stroke="#e6a23c"/>${Array.from({length:6},(_,i)=>`<rect x="${416+i*18}" y="46" width="10" height="10" fill="#e8e8e8"/><rect x="${416+i*18}" y="62" width="10" height="10" fill="#e8e8e8"/>`).join("")}${[0,1,2,3].map(i=>`<rect x="${418+i*12}" y="76" width="6" height="5" fill="#9aa"/>`).join("")}`)}
  ${L(470,104,"12V-2x6 (16 broches)","middle")}
  ${H("SATA alimentation","15 broches, pour disques SATA et périphériques.",`<rect x="560" y="50" width="64" height="20" fill="#111" stroke="#aaa"/>`)}
  ${L(592,90,"SATA","middle")}
  ${H("Sécurité","Ne jamais ouvrir un bloc d'alimentation : ses condensateurs gardent une tension dangereuse (plus de 300 V) même débranché. Une alimentation défaillante se remplace.",`<circle cx="320" cy="180" r="30" class="warnC"/><text x="320" y="190" class="noteT" text-anchor="middle">⚡</text>`)}`,
  "Connecteurs d'alimentation"),

 boot: S("0 0 640 170",
  ["Bouton Power|Signal PWR_SW vers la carte mère, qui allume l'alimentation (PS_ON).","Alimentation OK|Les tensions se stabilisent, PWR_OK est envoyé.","POST|Le firmware UEFI teste processeur, mémoire, graphique. Échec = bips, voyants de débogage ou code.","UEFI|Lit les réglages, applique Secure Boot, cherche un chargeur de démarrage sur le disque (partition EFI).","Gestionnaire de démarrage|Windows Boot Manager lit le BCD. Endommagé = « No bootable device » : bcdboot répare.","Système|Noyau, pilotes, services. Écran bleu ici = pilote, disque ou mémoire."].map((s,i)=>{const [t,d]=s.split("|");return H(t,d,`<rect x="${10+i*105}" y="55" width="95" height="60" rx="8" class="flow"/><text x="${57+i*105}" y="90" class="flT" text-anchor="middle">${t.length>13?t.slice(0,12)+"…":t}</text>`)+(i<5?`<path d="M${105+i*105} 85 h10" stroke="#3cc6cf" stroke-width="3" marker-end="url(#ar)"/>`:"")}).join("")+`<defs><marker id="ar" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="#3cc6cf"/></marker></defs>`+L(320,150,"Touchez chaque étape : où la panne se produit indique quoi tester","middle"),
  "Séquence de démarrage d'un PC"),

 rj45: S("0 0 600 230",
  `${["#f4f4f4|#e8741c|Blanc-orange|Émission + (TX+) en 10/100 Mb/s","#e8741c|#e8741c|Orange|Émission − (TX−)","#f4f4f4|#2c9a4f|Blanc-vert|Réception + (RX+)","#2a64c8|#2a64c8|Bleu|Paire utilisée en 1 Gb/s et pour le PoE","#f4f4f4|#2a64c8|Blanc-bleu|Paire utilisée en 1 Gb/s et pour le PoE","#2c9a4f|#2c9a4f|Vert|Réception − (RX−)","#f4f4f4|#7a4a1e|Blanc-marron|Paire utilisée en 1 Gb/s","#7a4a1e|#7a4a1e|Marron|Paire utilisée en 1 Gb/s"].map((s,i)=>{const [a,b,n,d]=s.split("|");return H("Broche "+(i+1)+" : "+n,"Norme T568B. "+d+". Les deux bouts identiques = câble droit (le cas normal).",`<rect x="${120+i*45}" y="40" width="30" height="120" fill="${a}"/><rect x="${120+i*45}" y="40" width="30" height="120" fill="${b}" ${a!==b?'mask="url(#st)"':""}/><text x="${135+i*45}" y="185" class="fl" text-anchor="middle">${i+1}</text>`)}).join("")}
  <defs><pattern id="stp" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><rect width="6" height="12" fill="#fff"/></pattern><mask id="st"><rect x="0" y="0" width="600" height="230" fill="url(#stp)"/></mask></defs>
  ${L(300,215,"Connecteur vu de face, languette en dessous : broche 1 à gauche (T568B)","middle")}
  ${L(60,100,"T568B","middle")}`,
  "Câblage RJ45 T568B"),

 osi: S("0 0 640 330",
  [["7","Application","HTTP, DNS, DHCP, SMTP","Services réseau utilisés par les applications."],["6","Présentation","TLS, JPEG, ASCII","Format et chiffrement des données."],["5","Session","RPC, NetBIOS","Ouverture et maintien des échanges."],["4","Transport","TCP, UDP (ports)","Segments : fiabilité (TCP) ou rapidité (UDP)."],["3","Réseau","IP, ICMP, OSPF — routeur","Paquets et adresses IP : routage entre réseaux."],["2","Liaison","Ethernet, Wi-Fi, VLAN — switch","Trames et adresses MAC sur le réseau local."],["1","Physique","Câble, fibre, ondes — hub","Bits : signaux électriques, lumineux ou radio."]].map((l,i)=>H("Couche "+l[0]+" : "+l[1],l[3]+" Protocoles et équipements : "+l[2]+". Dépanner de bas en haut : câble (1), lien (2), IP (3), port (4), service (7).",`<rect x="60" y="${15+i*44}" width="520" height="38" rx="6" class="layer l${l[0]}"/><text x="80" y="${39+i*44}" class="flT">${l[0]} · ${l[1]}</text><text x="560" y="${39+i*44}" class="fl" text-anchor="end">${l[2]}</text>`)).join(""),
  "Modèle OSI"),

 vlan: S("0 0 640 280",
  `${H("Routeur (router-on-a-stick)","Une interface physique découpée en sous-interfaces (G0/0.10, G0/0.20) avec encapsulation dot1Q : il route entre les VLAN.",`<rect x="270" y="20" width="100" height="44" rx="8" class="dev"/><text x="320" y="47" class="flT" text-anchor="middle">Routeur</text>`)}
  <line x1="320" y1="64" x2="320" y2="110" class="trunk"/>
  ${H("Lien trunk 802.1Q","Transporte plusieurs VLAN : chaque trame porte une étiquette de 4 octets avec le numéro de VLAN (sauf le VLAN natif).",`<rect x="330" y="78" width="120" height="20" rx="4" class="tag"/><text x="390" y="92" class="fl" text-anchor="middle">trunk 802.1Q</text>`)}
  ${H("Switch SW1","Ports d'accès dans un seul VLAN (switchport mode access), port vers le routeur en trunk.",`<rect x="220" y="110" width="200" height="44" rx="8" class="dev"/><text x="320" y="137" class="flT" text-anchor="middle">SW1</text>`)}
  <line x1="260" y1="154" x2="140" y2="210" class="acc10"/><line x1="380" y1="154" x2="500" y2="210" class="acc20"/>
  ${H("VLAN 10 — Comptabilité","192.168.10.0/24, passerelle 192.168.10.1 (sous-interface du routeur). Les PC du VLAN 10 ne voient pas directement ceux du VLAN 20.",`<rect x="70" y="210" width="140" height="44" rx="8" class="v10"/><text x="140" y="237" class="flT" text-anchor="middle">PC · VLAN 10</text>`)}
  ${H("VLAN 20 — Atelier","192.168.20.0/24, passerelle 192.168.20.1. Domaine de diffusion séparé : moins de trafic, plus de sécurité.",`<rect x="430" y="210" width="140" height="44" rx="8" class="v20"/><text x="500" y="237" class="flT" text-anchor="middle">PC · VLAN 20</text>`)}`,
  "VLAN, trunk et routage inter-VLAN"),

 laser: S("0 0 640 300",
  `<circle cx="320" cy="150" r="70" class="drum"/>${L(320,155,"Tambour (OPC)","middle")}
  ${[["1. Charge","Le rouleau de charge dépose une charge négative uniforme sur le tambour.",320,40],["2. Exposition","Le laser décharge les points à imprimer : l'image devient électrostatique.",470,80],["3. Développement","Le toner, chargé, se colle aux zones déchargées.",500,200],["4. Transfert","Le rouleau de transfert attire le toner sur le papier.",320,265],["5. Fixation (four)","Chaleur (≈ 180–200 °C) et pression fondent le toner dans le papier. Toner qui s'efface au doigt = four défaillant.",140,200],["6. Nettoyage","Une lame racle le toner résiduel ; une lampe efface les charges.",170,80]].map(([t,d,x,y])=>H(t,d,`<rect x="${x-60}" y="${y-18}" width="120" height="36" rx="8" class="flow"/><text x="${x}" y="${y+5}" class="flT" text-anchor="middle">${t}</text>`)).join("")}
  ${H("Défauts répétitifs","Un défaut qui se répète à intervalle régulier vient d'un rouleau : mesurer l'écart et le comparer à la circonférence des rouleaux (tambour, four, transfert) dans le manuel de service.",`<circle cx="590" cy="270" r="22" class="note"/><text x="590" y="277" class="noteT" text-anchor="middle">↕</text>`)}`,
  "Les 6 étapes de l'impression laser"),

 nfc: S("0 0 640 260",
  `${H("Téléphone","Le lecteur NFC génère un champ magnétique à 13,56 MHz.",`<rect x="40" y="30" width="140" height="210" rx="20" class="dev"/>`)}
  ${H("Antenne NFC (bobine)","Bobine plate collée au dos, sur la batterie ou sur le capot arrière, reliée à la carte par des contacts à ressort. Capot changé ou contacts oxydés = NFC mort.",`<rect x="60" y="120" width="100" height="70" rx="6" fill="none" stroke="#c87533" stroke-width="3"/><rect x="68" y="128" width="84" height="54" rx="5" fill="none" stroke="#c87533" stroke-width="3"/><rect x="76" y="136" width="68" height="38" rx="4" fill="none" stroke="#c87533" stroke-width="3"/>`)}
  ${[0,1,2].map(i=>`<path d="M${200+i*40} 90 q30 65 0 130" fill="none" stroke="#3cc6cf" stroke-width="3" opacity="${1-i*.25}"/>`).join("")}
  ${H("Champ à 13,56 MHz","Portée de quelques centimètres (≈ 4 cm, 10 cm au maximum). Le métal (coque, aimant, plaque) bloque le champ.",`<rect x="210" y="235" width="100" height="1" fill="none"/><text x="260" y="250" class="fl" text-anchor="middle">≈ 4 cm</text>`)}
  ${H("Tag ou carte NFC","Pas de pile : le tag est alimenté par le champ du lecteur (induction). Il renvoie son identifiant et ses données (NDEF).",`<rect x="350" y="90" width="120" height="120" rx="12" fill="#f4f4f4" stroke="#999"/><rect x="368" y="108" width="84" height="84" rx="6" fill="none" stroke="#c87533" stroke-width="2.5"/><rect x="404" y="140" width="14" height="14" fill="#222"/>`)}
  ${H("Terminal de paiement","Le paiement sans contact utilise le NFC (norme EMV) : le téléphone émule une carte (HCE ou élément sécurisé).",`<rect x="510" y="70" width="100" height="150" rx="12" class="dev"/><rect x="525" y="90" width="70" height="40" rx="4" fill="#3cc6cf" opacity=".5"/>`)}`,
  "Fonctionnement du NFC"),

 phone: S("0 0 640 300",
  [["Vitre et écran (OLED / LCD)","Bloc écran collé : chauffer l'adhésif (≈ 80 °C) puis ouvrir à la ventouse et au médiator. Ne jamais faire levier sur la dalle OLED.",30],["Châssis","Cadre métallique qui porte la carte, la batterie et les nappes.",120],["Carte mère","Processeur, mémoire, PMIC, modem. Souvent en sandwich (deux cartes soudées) sur les iPhone récents.",210],["Batterie","Lithium-ion ou silicium-carbone. Toujours la déconnecter en premier. Retirer les adhésifs par les languettes, jamais de levier métallique.",300],["Bobine NFC et recharge sans fil","Bobines plates au dos : recharge Qi / Qi2 et NFC.",390],["Capot arrière","Verre ou plastique collé ; sur iPhone récents, verre arrière démontable sur certains modèles.",480]].map(([t,d,x],i)=>H(t,d,`<path d="M${x} ${70+i*6} l120 0 l40 -40 l-120 0 z" class="layerF l${i+1}"/><text x="${x+60}" y="${100+i*6+ (i%2?18:0)}" class="fl" text-anchor="middle">${t.split(" ")[0]}</text>`)).join("")+L(320,270,"Vue éclatée d'un smartphone : touchez chaque couche","middle"),
  "Vue éclatée d'un smartphone")
};
})();
