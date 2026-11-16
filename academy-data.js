/* DiagLab Pro — Académie : contenu des cours (partie 1 : matériel, téléphones, imprimantes, NFC, IA).
   Blocs : ["p",t] ["h",t] ["ul",[..]] ["ol",[..]] ["fig",id] ["cmd",t] ["tip",t] ["warn",t] ["table",[en-têtes],[[ligne]..]] ["tool",id] ["link",vue,libellé]
   Quiz : [question, [réponses], index de la bonne, explication] */
const ACADEMY = [];

ACADEMY.push({id:"pc", title:"Maintenance informatique", desc:"Architecture, électronique, démarrage, méthode de diagnostic, nouvelles technologies.", modules:[
 {id:"pc1", title:"Architecture d'un ordinateur", min:25, body:[
  ["p","Un ordinateur réunit toujours les mêmes blocs. Savoir à quoi sert chacun permet de deviner, à partir d'un symptôme, lequel est en cause."],
  ["table",["Composant","Rôle","Symptômes quand il est défaillant"],[
   ["Processeur (CPU)","Exécute les instructions","Aucun affichage, écrans bleus WHEA, extinctions sous charge"],
   ["Mémoire vive (RAM)","Données en cours d'utilisation","Bips, aucun affichage, écrans bleus MEMORY_MANAGEMENT"],
   ["Stockage (SSD, HDD)","Système et fichiers","Lenteurs, « No bootable device », erreurs disque"],
   ["Carte mère","Relie et alimente tout","Rien ne s'allume, ports morts, comportements aléatoires"],
   ["Alimentation","Convertit le 230 V en 12, 5 et 3,3 V","Rien ne s'allume, redémarrages sous charge"],
   ["Carte graphique (GPU)","Calcule l'image","Artefacts, écran noir, VIDEO_TDR_FAILURE"],
   ["Refroidissement","Évacue la chaleur","Ventilateurs bruyants, extinctions, lenteurs"]]],
  ["fig","socket"],
  ["h","La mémoire vive"],
  ["p","**DDR4** (1,2 V) et **DDR5** (1,1 V) ne sont pas interchangeables : l'encoche est à une position différente. La DDR5 intègre sa propre gestion d'alimentation (PMIC) et un hub SPD. Sur PC portable, on trouve des barrettes SO-DIMM, de plus en plus souvent de la mémoire soudée (LPDDR5X) ou des modules CAMM2."],
  ["fig","dimm"],
  ["tip","Deux barrettes se placent dans les emplacements A2 et B2 (bi-canal) : vérifier le manuel de la carte mère. Les profils XMP (Intel) et EXPO (AMD) augmentent la fréquence : à désactiver en premier en cas d'instabilité."],
  ["h","Le stockage"],
  ["table",["Type","Débit typique","Usage"],[["Disque dur (HDD)","≈ 150 Mo/s","Archives, gros volumes"],["SSD SATA 2,5\"","≈ 550 Mo/s","Remplacement d'un disque dur"],["SSD NVMe PCIe 3.0","≈ 3 500 Mo/s","PC courants"],["SSD NVMe PCIe 4.0","≈ 7 000 Mo/s","PC récents"],["SSD NVMe PCIe 5.0","jusqu'à ≈ 14 000 Mo/s","PC haut de gamme (dissipateur obligatoire)"]]],
  ["fig","m2"],
  ["h","Les bus PCI Express"],
  ["p","Le PCIe relie le processeur à la carte graphique, aux SSD NVMe, aux cartes réseau. Chaque génération double le débit par voie (≈ 1 Go/s en 3.0, 2 Go/s en 4.0, 4 Go/s en 5.0). Une carte graphique utilise 16 voies (x16), un SSD 4 voies (x4)."],
  ["h","L'alimentation"],
  ["p","Une alimentation ATX fournit 12 V (processeur, carte graphique), 5 V et 3,3 V. Le label 80 PLUS indique le rendement. Les normes ATX 3.x encadrent les pics de consommation des cartes graphiques récentes et le connecteur **12V-2x6**."],
  ["fig","alim"]],
  quiz:[
   ["Une barrette DDR4 peut-elle aller dans un emplacement DDR5 ?",["Oui, avec un réglage du BIOS","Non, l'encoche et les tensions sont différentes","Oui, mais en mode lent"],1,"Le détrompeur est placé différemment : on ne peut pas l'insérer, et il ne faut jamais forcer."],
   ["Quel stockage atteint environ 7 000 Mo/s ?",["SSD SATA","SSD NVMe PCIe 4.0","Disque dur 7 200 tr/min"],1,"Le SATA plafonne vers 550 Mo/s ; le NVMe PCIe 4.0 atteint ≈ 7 000 Mo/s."],
   ["Les ventilateurs tournent mais rien ne s'affiche après un montage. Premier oubli à vérifier ?",["Le câble SATA","Le connecteur EPS 12 V du processeur","La pile CMOS"],1,"Sans EPS, le processeur n'est pas alimenté : ventilateurs actifs, aucune image."],
   ["Où installer deux barrettes pour le bi-canal sur la plupart des cartes à 4 emplacements ?",["A1 et A2","A2 et B2","B1 et B2"],1,"A2 et B2 est la règle la plus courante, à confirmer dans le manuel."]]},

 {id:"pc2", title:"Électronique de base et composants", min:40, body:[
  ["p","Réparer une carte demande de reconnaître ses composants et de savoir les mesurer. Touchez chaque zone des illustrations pour son explication."],
  ["h","La loi d'Ohm"],
  ["p","**U = R × I** (tension en volts = résistance en ohms × courant en ampères) et **P = U × I** (puissance en watts). Un court-circuit, c'est une résistance proche de 0 Ω : le courant devient énorme et la protection coupe."],
  ["tool","link:calc:Calculateur loi d'Ohm"],
  ["h","Le multimètre"],
  ["ul",["**Tension (V)** : appareil sous tension, pointe noire à la masse.","**Continuité** (bip) : hors tension, vérifie un fusible, une piste, un câble.","**Mode diode** : hors tension ; mesure la chute de tension d'une jonction. Sur une carte, on compare les valeurs « à la masse » avec une carte saine.","**Résistance (Ω)** : toujours hors tension, sinon mesure fausse et risque pour l'appareil.","**Courant (A)** : en série dans le circuit ; préférer une alimentation de labo qui l'affiche."]],
  ["fig","resistance"],
  ["tool","resistor"],
  ["fig","condensateurs"],
  ["fig","diodes"],
  ["fig","transistors"],
  ["fig","inductance"],
  ["fig","boitiers"],
  ["h","Le VRM : là où les cartes meurent souvent"],
  ["fig","vrm"],
  ["warn","Un MOSFET en court-circuit dans le VRM met la ligne 12 V à la masse : l'alimentation se coupe aussitôt. Mesurer la résistance entre le 12 V (EPS) et la masse, carte débranchée : quelques ohms ou moins signale un court-circuit."],
  ["h","Fusibles et protections"],
  ["p","Les cartes portent des fusibles CMS (marqués F) sur l'entrée d'alimentation, les ports USB et le clavier. Un fusible ouvert (pas de continuité) coupe une fonction entière ; on cherche d'abord pourquoi il a sauté (court-circuit en aval) avant de le remplacer."]],
  quiz:[
   ["Une résistance porte les bandes marron, noir, rouge, or. Sa valeur ?",["10 Ω","1 kΩ ±5 %","10 kΩ ±5 %"],1,"Marron 1, noir 0, rouge ×100 : 10 × 100 = 1 000 Ω, or = ±5 %."],
   ["Quel mode utiliser pour comparer une ligne d'alimentation à la masse sur une carte éteinte ?",["Tension continue","Mode diode","Courant alternatif"],1,"Le mode diode, carte hors tension, donne des valeurs comparables à une carte saine."],
   ["Un condensateur électrolytique au sommet bombé est…",["Normal sur une vieille carte","Défaillant, à remplacer par une valeur identique","Un condensateur polymère"],1,"Le gonflement trahit un électrolyte qui a chauffé : capacité perdue, alimentation instable."],
   ["Que signifie le marquage CMS « 4R7 » ?",["47 Ω","4,7 Ω","4,7 kΩ"],1,"Le R remplace la virgule : 4,7 Ω."],
   ["Quel composant forme une phase de VRM avec une self et des condensateurs ?",["Le quartz","Le MOSFET","La diode LED"],1,"Le MOSFET (ou étage DrMOS) commute le 12 V ; la self et les condensateurs lissent."]]},

 {id:"pc3", title:"Démarrage : du bouton Power à Windows", min:25, body:[
  ["fig","boot"],
  ["h","Le POST et ses signaux"],
  ["p","Pendant le POST, le firmware teste le matériel. En cas d'échec, il le signale par des **bips** (codes selon le BIOS : AMI, Award, ou constructeur), des **voyants de débogage** (CPU, DRAM, VGA, BOOT) ou un **afficheur de codes** à deux chiffres sur les cartes haut de gamme. Sur portable, voyant d'alimentation ou Verr. Maj qui clignotent selon un motif décrit dans le manuel de service."],
  ["h","UEFI ou Legacy, GPT ou MBR"],
  ["table",["","UEFI (moderne)","Legacy / BIOS (ancien)"],[["Partitionnement","GPT","MBR"],["Disque de démarrage","> 2 To possible","2 To maximum"],["Démarrage sécurisé","Secure Boot","Non"],["Windows 11","Obligatoire","Non pris en charge"]]],
  ["tip","Un Windows installé en UEFI ne démarre pas si le BIOS est passé en Legacy (et inversement) : c'est une cause fréquente de « No bootable device » après une réinitialisation du BIOS."],
  ["h","Secure Boot, TPM et BitLocker"],
  ["p","**Secure Boot** n'autorise que des chargeurs de démarrage signés. Le **TPM 2.0** (puce ou fonction du processeur : Intel PTT, AMD fTPM) stocke des clés ; Windows 11 l'exige. **BitLocker** chiffre le disque avec le TPM : toute modification du BIOS, de la carte mère ou de l'ordre de démarrage peut faire demander la clé de récupération de 48 chiffres."],
  ["warn","Avant toute intervention sur le BIOS ou la carte mère d'un PC chiffré, vérifier que le client possède sa clé BitLocker (aka.ms/myrecoverykey). Sans elle, les données sont perdues."],
  ["h","Réparer le démarrage"],
  ["cmd","mountvol S: /S\nbcdboot C:\\Windows /s S: /f UEFI"],
  ["tool","link:rescue:Clé de secours (menu de réparation)"]],
  quiz:[
   ["Windows 11 exige…",["Le mode Legacy","UEFI, Secure Boot et TPM 2.0","Un disque MBR"],1,"Ce sont les prérequis de sécurité de Windows 11."],
   ["Après remplacement de la carte mère, Windows demande une clé de 48 chiffres. Pourquoi ?",["Licence Windows","BitLocker a détecté un changement matériel","Mot de passe du BIOS"],1,"BitLocker demande la clé de récupération quand l'environnement de démarrage change."],
   ["Le voyant DRAM de débogage reste allumé. Que tester d'abord ?",["Le disque","La mémoire : une barrette, réinsérée, contacts nettoyés","La carte réseau"],1,"Le voyant indique l'étape bloquante : la mémoire."]]},

 {id:"pc4", title:"Méthode : détecter n'importe quelle panne", min:30, body:[
  ["p","Aucun outil ne détecte seul toutes les pannes. Ce qui permet d'en trouver n'importe laquelle, c'est une **méthode** appliquée dans l'ordre, sur ordinateur, téléphone, imprimante ou réseau."],
  ["ol",["**Écouter et reproduire** : que s'est-il passé avant (chute, mise à jour, orage, liquide) ? Reproduire le défaut devant soi.","**Observer** : voyants, bips, odeur de brûlé, chaleur, bruit, messages exacts (les photographier).","**Lister les hypothèses** du plus probable et du plus simple au plus rare : câble avant carte mère, logiciel avant matériel.","**Isoler** : logiciel ou matériel ? Démarrer sur une clé live (Linux, Hiren's) : si le défaut disparaît, c'est le système.","**Diviser pour régner** : configuration minimale (processeur, une barrette, puce graphique intégrée, pas de disque), puis ajouter les éléments un à un.","**Mesurer et échanger** : multimètre, alimentation de labo, pièce de test connue bonne.","**Réparer, vérifier, documenter** : tests de sortie complets et fiche d'intervention."]],
  ["table",["Symptôme","Première vérification"],[["Rien ne s'allume","Prise, chargeur, bouton Power, alimentation"],["S'allume sans image","Mémoire, câble et sortie vidéo, écran externe"],["Écrans bleus","Code d'arrêt, minidump, MemTest86"],["Lenteurs","Disque (SMART), démarrage, malwares, températures"],["Coupures","Températures, alimentation ou batterie, Kernel-Power 41"],["Pas d'internet","Voyants de la box, IP, ping passerelle puis 8.8.8.8, DNS"]]],
  ["tip","Les outils DiagLab suivent cette méthode : diagnostic guidé pour les hypothèses, Rapport PC et tests de l'appareil pour mesurer, tableau de bord pour localiser, fiche pour documenter."],
  ["tool","link:diag:Diagnostic guidé"],["tool","link:tests:Tests de l'appareil"],["tool","link:dash:Tableau de bord"]],
  quiz:[
   ["Le défaut disparaît en démarrant sur une clé Linux. Conclusion ?",["Le matériel est en cause","Le système ou un pilote est en cause","La clé est défectueuse"],1,"Le matériel fonctionne sous un autre système : la cause est logicielle."],
   ["Qu'est-ce que la configuration minimale ?",["Le BIOS par défaut","Processeur, une barrette, graphique intégré, sans périphériques","Windows en mode sans échec"],1,"On retire tout le superflu, puis on ajoute un élément à la fois."],
   ["Dans quel ordre traiter les hypothèses ?",["De la plus chère à la moins chère","De la plus probable et simple à la plus rare","Au hasard"],1,"Commencer par le simple évite de démonter pour un câble mal branché."]]},

 {id:"pc5", title:"Sécurité et maintenance préventive", min:20, body:[
  ["h","Électricité statique (ESD)"],
  ["p","Une décharge invisible peut détruire un composant. Bracelet antistatique relié à la masse, tapis ESD, manipuler les cartes par les bords, sachets antistatiques."],
  ["h","Batteries lithium"],
  ["warn","Une batterie gonflée, percée ou chaude peut s'enflammer. Ne jamais la percer ni la tordre ; la retirer par ses languettes ou avec de l'alcool isopropylique, la stocker dans un bac ignifuge ou du sable, et la déposer en point de collecte."],
  ["h","Pâte thermique"],
  ["ol",["Nettoyer l'ancienne pâte à l'alcool isopropylique (90 % ou plus) et un chiffon non pelucheux.","Déposer une noisette (petit pois) au centre ou une croix fine : le serrage étale.","Serrer le radiateur en croix, progressivement.","Contrôler les températures au repos et sous charge (HWiNFO, OCCT)."]],
  ["h","Plan d'entretien"],
  ["table",["Fréquence","Action"],[["Chaque intervention","Dépoussiérage, mises à jour Windows et pilotes, SMART, températures"],["Tous les 2–3 ans","Pâte thermique sur PC fixe ou portable de jeu"],["Toujours","Sauvegarde 3-2-1 : 3 copies, 2 supports, 1 hors site"]]]],
  quiz:[
   ["Quelle règle de sauvegarde recommande-t-on ?",["1-1-1","3-2-1","2-2-2"],1,"3 copies, sur 2 supports différents, dont 1 hors site."],
   ["Que faire d'une batterie de portable gonflée ?",["La percer pour la dégonfler","La retirer avec précaution et la stocker dans un bac ignifuge","La laisser en place"],1,"Elle peut s'enflammer : retrait immédiat, stockage sûr, recyclage."]]},

 {id:"pc6", title:"Nouvelles technologies (2025–2026)", min:35, body:[
  ["p","Le matériel évolue vite. Ce module résume les plateformes récentes et ce qu'elles changent pour le technicien. Vérifiez toujours la fiche technique du constructeur pour un modèle précis."],
  ["h","Intel"],
  ["ul",["**Core Ultra 200S (Arrow Lake)** : PC de bureau, socket **LGA1851** (cartes Z890, B860), DDR5 uniquement, pas d'Hyper-Threading sur les cœurs performants, NPU intégré. Prend en charge les barrettes **CUDIMM** (horloge intégrée) pour les hautes fréquences.","**Core Ultra 200V (Lunar Lake)** : portables fins, mémoire LPDDR5X **intégrée au boîtier du processeur** : aucune évolution possible de la RAM.","**Core Ultra série 3 (Panther Lake)** : portables, gravure Intel 18A, lancés début 2026 ; graphique et NPU renforcés."]],
  ["h","AMD"],
  ["ul",["**Ryzen 9000 (Zen 5)** : socket **AM5** (LGA, comme Intel désormais), DDR5 uniquement. AMD maintient AM5 sur plusieurs générations : une mise à jour du BIOS suffit souvent pour un nouveau processeur.","**Ryzen 9000X3D** : cache 3D V-Cache, référence en jeu.","**Ryzen AI 300 (Strix Point)** : portables, NPU XDNA 2 d'environ 50 TOPS (PC Copilot+).","**Ryzen AI Max (Strix Halo)** : grosse puce graphique intégrée et mémoire unifiée jusqu'à 128 Go, pour stations de travail mobiles et IA locale."]],
  ["h","Windows sur ARM"],
  ["p","Les PC à **Snapdragon X** (Qualcomm) font tourner Windows 11 ARM, avec émulation (Prism) des applications x86. Pour le technicien : vérifier la disponibilité des pilotes ARM64 des imprimantes, scanners et logiciels métier, et utiliser l'ISO Windows 11 ARM64."],
  ["h","Cartes graphiques"],
  ["ul",["**NVIDIA GeForce RTX 50** (Blackwell) : mémoire GDDR7, connecteur 12V-2x6, DLSS 4.","**AMD Radeon RX 9000** (RDNA 4) : FSR 4.","**Intel Arc B** (Battlemage) : entrée et milieu de gamme."]],
  ["warn","Connecteur 12V-2x6 : l'enfoncer jusqu'au clic, sans courbure du câble à la sortie du connecteur. Une connexion partielle chauffe et peut fondre."],
  ["h","Mémoire, stockage, connectique"],
  ["table",["Technologie","Ce qui change"],[["DDR5 CUDIMM","Horloge régénérée sur la barrette : fréquences plus hautes, compatibilité à vérifier"],["CAMM2 / LPCAMM2","Module mémoire plat et vissé pour portables, remplaçable (contrairement à la mémoire soudée)"],["SSD PCIe 5.0","Jusqu'à ≈ 14 Go/s, dissipateur indispensable"],["USB4 / Thunderbolt 4","40 Gb/s, écrans et stations d'accueil"],["USB4 v2 / Thunderbolt 5","80 Gb/s (jusqu'à 120 Gb/s dans un sens pour les écrans)"],["Wi-Fi 7 (802.11be)","Canaux de 320 MHz en 6 GHz, MLO (plusieurs bandes à la fois)"],["Bluetooth 6.0","Channel Sounding : mesure précise de distance"]]],
  ["h","PC IA (Copilot+)"],
  ["p","Microsoft réserve l'appellation **Copilot+ PC** aux machines dotées d'un NPU d'au moins **40 TOPS**. Le NPU exécute localement les fonctions d'IA (sous-titres, effets caméra, recherche) en consommant peu."],
  ["tool","link:ia:Assistant IA"]],
  quiz:[
   ["Sur un portable Lunar Lake (Core Ultra 200V), peut-on ajouter de la RAM ?",["Oui, un emplacement SO-DIMM est libre","Non, la mémoire est intégrée au boîtier du processeur","Oui, en CAMM2"],1,"La LPDDR5X est sur le boîtier du processeur : la capacité est définitive."],
   ["Quel socket utilisent les Ryzen 9000 ?",["AM4","AM5","LGA1700"],1,"AM5, avec DDR5 uniquement."],
   ["Quel seuil de NPU définit un PC Copilot+ ?",["10 TOPS","40 TOPS","100 TOPS"],1,"Au moins 40 TOPS."],
   ["Quel est le risque d'un connecteur 12V-2x6 mal enfoncé ?",["Aucun","Échauffement voire fusion du connecteur","Baisse des FPS seulement"],1,"La résistance de contact augmente et le connecteur chauffe."]]}
]});

ACADEMY.push({id:"tel", title:"Maintenance des téléphones", desc:"Architecture, démontage, diagnostic de carte, oxydation, logiciel.", modules:[
 {id:"t1", title:"Architecture et outils", min:20, body:[
  ["fig","phone"],
  ["p","Un smartphone concentre sur une carte : le **SoC** (processeur, graphique, NPU, souvent le modem), la **RAM** empilée sur le SoC, le stockage **UFS**, le **PMIC** (alimentation), le circuit de charge, les puces radio et audio."],
  ["tool","link:dash:Schéma interactif de la carte (tableau de bord)"],
  ["h","L'établi du réparateur"],
  ["table",["Outil","Usage"],[["Station à air chaud + fer fin","Dessouder et souder les composants CMS"],["Microscope stéréo","Inspection des soudures et des composants"],["Alimentation de labo","Alimenter la carte sans batterie et lire le courant"],["Multimètre","Mode diode, continuité, tensions"],["Caméra thermique / colophane","Localiser un court-circuit"],["Plaque chauffante (séparateur)","Décoller écrans et capots"],["Bac à ultrasons + alcool isopropylique 99 %","Nettoyer une carte oxydée"],["Tournevis Pentalobe, Tri-point, Phillips 000","Vis Apple et Android"]]]],
  quiz:[
   ["Où se trouve généralement la RAM d'un smartphone ?",["Sur une barrette amovible","Empilée sur le SoC","Sous la batterie"],1,"La RAM est en « PoP » (Package on Package) au-dessus du processeur."],
   ["Quel outil sert à localiser un composant en court-circuit ?",["Caméra thermique ou colophane","Tournevis Pentalobe","Ventouse"],0,"Le composant en court chauffe : la caméra thermique ou la vapeur de colophane le révèlent."]]},
 {id:"t2", title:"Démontage et remplacement de pièces", min:30, body:[
  ["ol",["Éteindre, retirer le tiroir SIM, photographier l'appareil (état à la réception).","Chauffer l'adhésif à ≈ 80 °C (plaque ou pistolet), ouvrir à la ventouse et au médiator, sans dépasser 3 mm sous la vitre.","**Déconnecter la batterie en premier**.","Ranger les vis par emplacement (tapis magnétique) : une vis longue au mauvais endroit perce la carte.","Déclipser les nappes au levier plastique, perpendiculairement au connecteur.","Remonter, tester avant de recoller (écran, tactile, caméras, charge, Face ID / empreinte).","Recoller avec un adhésif neuf, presser."]],
  ["h","Écran"],
  ["p","Un écran OLED se fissure s'il est plié : le soulever par le cadre. Sur les modèles récents, le lecteur d'empreinte est sous l'écran et peut demander un calibrage après remplacement (outil constructeur)."],
  ["h","Batterie"],
  ["p","Tirer les languettes d'adhésif lentement, à plat. Si elles cassent : quelques gouttes d'alcool isopropylique sous la batterie, puis une carte plastique. Jamais d'outil métallique."],
  ["h","Pièces appariées (iPhone, certains Android)"],
  ["p","Écran, batterie, caméras et biométrie sont liés au numéro de série de la carte. Une pièce d'une autre unité peut afficher « Pièce inconnue » ou perdre des fonctions (True Tone, Face ID). Depuis iOS 18, l'**Assistant de réparation des pièces** calibre les pièces Apple d'origine."]],
  quiz:[
   ["Que déconnecter en premier après ouverture ?",["L'écran","La batterie","La caméra"],1,"Toujours la batterie, pour éviter tout court-circuit."],
   ["Pourquoi ranger les vis par emplacement ?",["Pour gagner du temps","Une vis trop longue peut percer la carte","Elles sont toutes identiques"],1,"C'est une cause connue de carte détruite."]]},
 {id:"t3", title:"Diagnostic de carte", min:35, body:[
  ["h","Alimentation de labo"],
  ["p","Alimenter la carte au connecteur batterie (≈ 3,8–4,2 V selon la batterie) avec un courant limité. Le courant au démarrage raconte la panne :"],
  ["table",["Ce qu'on voit","Interprétation"],[["0 mA à l'appui sur Power","Ligne d'alimentation coupée, bouton, PMIC qui ne démarre pas"],["Fort courant immédiat, carte chaude","Court-circuit sur une ligne d'alimentation"],["Le courant monte puis retombe en boucle","Démarrage qui échoue : mémoire, SoC, logiciel"],["Courant normal mais écran noir","Écran, nappe, rétroéclairage"]]],
  ["h","Trouver un court-circuit"],
  ["ol",["Mesurer la ligne à la masse en mode diode : 0,000 = court franc.","Injecter une tension basse (1 à 4 V) avec courant limité sur la ligne.","Repérer le composant qui chauffe : caméra thermique, colophane (la vapeur se dissipe au point chaud) ou alcool qui sèche plus vite.","Retirer le composant (souvent un condensateur céramique) et remesurer."]],
  ["warn","Ne jamais injecter plus que la tension nominale de la ligne : on détruirait le processeur ou le PMIC."],
  ["h","Schémas et boardviews"],
  ["p","Les schémas électriques et boardviews (plans de carte cliquables) montrent où passe chaque ligne et les valeurs attendues en mode diode. Ce sont des outils payants, indispensables pour la micro-soudure avancée."]],
  quiz:[
   ["Fort courant dès la connexion et carte chaude : quelle panne ?",["Écran","Court-circuit sur une ligne d'alimentation","Logiciel"],1,"Le courant s'écoule à la masse par un composant défectueux."],
   ["Quel est le composant le plus souvent en court sur une ligne ?",["Un condensateur céramique","Le haut-parleur","Le capot"],0,"Les MLCC de découplage se fissurent et passent en court."]]},
 {id:"t4", title:"Oxydation et dégâts des eaux", min:15, body:[
  ["ol",["Ne pas allumer, ne pas charger. Le riz ne sert à rien.","Ouvrir et déconnecter la batterie au plus vite.","Démonter la carte, retirer les blindages si possible.","Bain à ultrasons dans l'alcool isopropylique 99 %, puis brosse douce.","Sécher (air chaud doux), inspecter au microscope : corrosion verte ou blanche, composants rongés.","Mesurer les lignes d'alimentation avant le premier allumage, à l'alimentation de labo."]],
  ["tip","Les pannes d'oxydation réapparaissent souvent après quelques semaines : prévenir le client et limiter la garantie à la pièce remplacée."]],
  quiz:[["Premier geste sur un téléphone tombé dans l'eau ?",["Le mettre dans du riz","Ne pas l'allumer, ouvrir et déconnecter la batterie","Le charger pour vérifier"],1,"Le courant accélère la corrosion : déconnecter la batterie au plus vite."]]},
 {id:"t5", title:"Logiciel, sécurité et éthique", min:20, body:[
  ["p","Modes de maintenance : Recovery et Fastboot/Download (Android), récupération et DFU (iPhone). Toujours utiliser le **firmware officiel** du modèle exact (Smart Switch, Mi Flash, Android Flash Tool, Finder / Apple Devices)."],
  ["tool","link:phone:Diagnostic téléphone (fiches par marque)"],
  ["h","Verrous antivol"],
  ["p","FRP (compte Google), Verrouillage d'activation (iCloud), comptes Mi, Samsung, Huawei : ils rendent un appareil volé inutilisable. On ne les lève qu'avec les identifiants du propriétaire ou par la procédure du constructeur sur preuve d'achat."],
  ["warn","Contourner un verrou antivol sans preuve de propriété peut constituer un recel d'objet volé. Vérifier l'IMEI, exiger une facture, refuser en cas de doute."]],
  quiz:[["Un client sans facture demande de retirer un compte iCloud. Que faire ?",["Utiliser un logiciel de contournement","Refuser et l'orienter vers la procédure Apple avec preuve d'achat","Changer la carte mère"],1,"Seul le propriétaire, ou Apple sur preuve d'achat, peut lever le verrou."]]}
]});

ACADEMY.push({id:"imp", title:"Maintenance des imprimantes", desc:"Jet d'encre, laser, thermique : fonctionnement, pannes, entretien.", modules:[
 {id:"i1", title:"Technologies d'impression", min:20, body:[
  ["table",["Technologie","Principe","Points faibles"],[["Jet d'encre thermique (HP, Canon)","Une résistance chauffe l'encre et projette une goutte","Têtes qui sèchent, souvent dans la cartouche"],["Jet d'encre piézo (Epson)","Un cristal se déforme et éjecte la goutte","Tête fixe coûteuse, buses bouchées, tampons absorbants saturés"],["Laser","Toner fixé par chaleur (voir schéma)","Four, tambour, rouleaux d'entraînement"],["Thermique directe","Papier sensible à la chaleur (tickets, étiquettes)","Tête usée, papier inadapté"]]],
  ["fig","laser"],
  ["p","Les imprimantes à réservoirs (EcoTank, MegaTank, InkTank…) réduisent le coût de l'encre mais gardent les mêmes points faibles de tête d'impression."]],
  quiz:[["Le toner s'efface au doigt après impression. Quelle pièce est en cause ?",["Le tambour","Le four (unité de fixation)","Le laser"],1,"Le four fixe le toner par chaleur et pression."],
   ["Quelle technologie utilise un cristal piézoélectrique ?",["Jet d'encre Epson","Laser","Thermique directe"],0,"Les têtes Epson sont piézoélectriques."]]},
 {id:"i2", title:"Pannes et entretien", min:20, body:[
  ["table",["Panne","Cause probable","Action"],[["Bourrages répétés","Rouleaux d'entraînement lisses, papier humide","Nettoyer ou remplacer le kit de rouleaux, papier sec"],["Bandes ou lignes blanches (jet d'encre)","Buses bouchées","Motif de buses, 2 nettoyages maximum puis repos"],["Défaut à intervalle régulier (laser)","Rouleau ou tambour","Mesurer l'écart, comparer aux circonférences du manuel"],["Message « tampons absorbants en fin de vie »","Tampons de purge saturés (fréquent sur Epson)","Remplacement des tampons ou kit de maintenance, réinitialisation par l'outil du constructeur ou le service agréé"],["Hors ligne","IP changée, spouleur bloqué","IP réservée dans la box, redémarrer le Spouleur"]]],
  ["tool","link:diag:Diagnostic imprimante"]],
  quiz:[["Une imprimante réseau passe régulièrement « hors ligne ». Meilleure solution durable ?",["Réinstaller le pilote chaque semaine","Réserver son adresse IP dans le DHCP de la box","Changer le câble USB"],1,"Une IP fixe ou réservée évite que le port d'impression pointe vers une ancienne adresse."]]}
]});

ACADEMY.push({id:"nfc", title:"NFC et sans contact", desc:"Principe, normes, tags, diagnostic et sécurité.", modules:[
 {id:"n1", title:"Comprendre le NFC", min:20, body:[
  ["fig","nfc"],
  ["p","Le **NFC** (Near Field Communication) communique par induction magnétique à **13,56 MHz**, sur quelques centimètres, à 106–424 kbit/s. Il dérive du RFID haute fréquence."],
  ["table",["Mode","Exemple"],[["Lecture / écriture","Lire un tag (affiche, étiquette produit), écrire un lien"],["Émulation de carte","Paiement sans contact, titre de transport, badge dans le téléphone"],["Pair-à-pair","Échange entre deux appareils (appairage Bluetooth)"]]],
  ["h","Tags et cartes"],
  ["table",["Type","Mémoire","Usage"],[["NTAG213 / 215 / 216","144 / 504 / 888 octets","Liens, cartes de visite, automatisations"],["MIFARE Classic","1 ou 4 Ko","Anciens badges : sécurité cassée, à remplacer"],["MIFARE DESFire EV2/EV3","2 à 8 Ko, chiffrement AES","Badges et transports sécurisés"]]],
  ["p","Les données suivent le format **NDEF** (lien web, texte, Wi-Fi, contact). À ne pas confondre avec les badges **125 kHz** (basse fréquence), que les téléphones ne lisent pas."]],
  quiz:[["Quelle est la fréquence du NFC ?",["125 kHz","13,56 MHz","2,4 GHz"],1,"13,56 MHz, bande HF."],
   ["Un tag NFC a-t-il besoin d'une pile ?",["Oui","Non, il est alimenté par le champ du lecteur","Seulement pour écrire"],1,"Il est alimenté par induction."]]},
 {id:"n2", title:"Diagnostiquer le NFC", min:15, body:[
  ["ol",["Vérifier que le NFC est activé (Android : Paramètres → Appareils connectés).","Retirer la coque : métal, aimants et porte-cartes bloquent le champ.","Paiement : vérifier l'appli de paiement par défaut et la carte enregistrée.","Lancer le test NFC de DiagLab (Chrome sur Android) avec un tag ou une carte.","Toujours en panne : contrôler l'antenne (sur le capot ou la batterie) et ses contacts à ressort ; un capot de remplacement sans antenne supprime le NFC."]],
  ["tool","link:tests:Test NFC (Tests de l'appareil)"],
  ["p","Sur iPhone, le NFC sert à Apple Pay et à la lecture de tags (Raccourcis, applis) ; les navigateurs n'y ont pas accès."],
  ["warn","Copier un badge d'accès ou une carte sans l'autorisation de son émetteur est interdit. Ne proposer ces services qu'avec un mandat écrit du gestionnaire du site."]],
  quiz:[["Après remplacement du capot arrière, le NFC ne marche plus. Cause probable ?",["Le processeur","L'antenne NFC, collée sur l'ancien capot, n'a pas été transférée","La SIM"],1,"Sur beaucoup de modèles, l'antenne est sur le capot ou la batterie."]]}
]});

ACADEMY.push({id:"ia", title:"Intelligence artificielle", desc:"Comprendre l'IA, bien l'utiliser dans DiagLab, ses limites.", modules:[
 {id:"a1", title:"Comprendre l'IA", min:15, body:[
  ["table",["Type","Exemples"],[["IA prédictive","Prévoir une panne de disque à partir du SMART, détecter une anomalie réseau"],["IA générative","Assistant qui rédige un diagnostic, un script, une explication"],["Vision","Analyser la photo d'une carte, lire un code d'erreur sur un écran"]]],
  ["p","Un **grand modèle de langage** (LLM) comme Claude prédit le texte le plus probable à partir de très nombreux exemples. Il raisonne bien, mais peut se tromper avec assurance (« hallucination ») : une réponse se **vérifie par la mesure**."],
  ["p","Les **NPU** des processeurs récents exécutent des modèles localement. Leur puissance s'exprime en **TOPS** (milliers de milliards d'opérations par seconde)."]],
  quiz:[["Une réponse de l'IA indique une tension précise sur une carte. Que faire ?",["L'appliquer telle quelle","La vérifier sur le schéma ou par la mesure","L'ignorer"],1,"L'IA peut se tromper : on confirme toujours."]]},
 {id:"a2", title:"Utiliser l'assistant IA de DiagLab", min:15, body:[
  ["p","L'assistant répond d'abord avec la **base DiagLab** (instantané, hors connexion), puis avec **Claude** si une clé API est enregistrée. Il peut joindre automatiquement le contexte de l'atelier : fiche en cours, tests, tableau de bord."],
  ["h","Bien formuler une demande"],
  ["ul",["Le **modèle exact** (référence au dos, Paramètres → À propos).","Les **symptômes précis** et depuis quand.","Le **message d'erreur** mot pour mot, ou une photo nette.","Ce qui a **déjà été essayé** et le résultat.","Ce que vous voulez : causes, procédure, liste de pièces."]],
  ["tip","Exemple : « HP Pavilion 15-eh1xxx, s'éteint au bout de 10 minutes en jeu, températures 98 °C relevées dans HWiNFO, ventilateur nettoyé. Que vérifier ensuite ? »"],
  ["h","Confidentialité et coût"],
  ["ul",["N'envoyez pas de données personnelles du client (mots de passe, documents).","Chaque échange consomme des jetons facturés sur votre compte API : Opus est le plus précis, Sonnet plus rapide, Haiku le plus économique.","La clé API reste sur votre appareil ; ne l'utilisez pas sur un poste partagé."]],
  ["tool","link:ia:Ouvrir l'assistant IA"]],
  quiz:[["Quelle demande donnera la meilleure réponse ?",["« Mon PC marche pas »","« Dell Latitude 5440, écran noir, voyant 2 orange 3 blanc, RAM réinsérée »","« Aide »"],1,"Modèle, symptômes, codes et essais déjà faits."]]},
 {id:"a3", title:"L'IA dans le métier de technicien", min:10, body:[
  ["ul",["**Maintenance prédictive** : surveiller SMART, températures et journaux pour intervenir avant la panne.","**Analyse de journaux** : faire résumer un minidump ou des événements par l'IA, puis vérifier.","**Scripts** : faire écrire un script PowerShell, mais le **relire et le comprendre avant de l'exécuter**.","**Documentation et formation** : fiches clients, procédures, explications pédagogiques."]],
  ["warn","Ne jamais exécuter un script ou une commande proposés par une IA sans les comprendre, surtout en administrateur : une commande de formatage ou de suppression ne se rattrape pas."]],
  quiz:[["L'IA propose un script de nettoyage à lancer en administrateur. Bonne pratique ?",["L'exécuter directement","Le lire, le comprendre et le tester sur une machine sans risque","Le lancer deux fois"],1,"On reste responsable de ce qu'on exécute."]]}
]});
