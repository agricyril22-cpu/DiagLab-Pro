/* DiagLab Pro — données complémentaires : schémas de cartes, correspondances pannes → composants, systèmes et ISO.
   Composant : [id, libellé (\n = retour à la ligne), x, y, largeur, hauteur, rôle, symptômes typiques, comment tester, solution] */

const BOARDS = {
 phone:{
  title:"Smartphone / tablette", view:"0 0 360 740",
  note:"Schéma de principe : la disposition réelle varie selon le modèle (carte principale en haut, batterie au centre, sous-carte en bas sur la plupart des téléphones).",
  zones:[
   {x:30,y:30,w:300,h:330,label:"Carte principale"},
   {x:30,y:630,w:300,h:85,label:"Sous-carte"}
  ],
  parts:[
   ["frontcam","Caméra avant\n/ Face ID",45,45,80,40,"Caméra frontale, et sur iPhone le module TrueDepth (Face ID).","Selfie noir, Face ID indisponible.","Test Caméras ; vérifier la nappe et la lentille.","Remplacer le module. Face ID ne fonctionne qu'avec le module d'origine apparié."],
   ["sensors","Capteurs\nproximité",135,45,90,40,"Proximité, luminosité, accéléromètre, gyroscope.","Écran qui reste allumé contre l'oreille, rotation absente.","Test Capteurs.","Nettoyer la vitre au-dessus du capteur, vérifier la nappe ; remplacer la nappe capteurs."],
   ["camrear","Caméras\narrière",235,45,80,90,"Modules photo principaux (grand-angle, ultra grand-angle, téléobjectif).","Image noire, floue, tremblante (stabilisateur), clic métallique.","Test Caméras sur chaque objectif.","Remplacer la vitre si fissurée, sinon le module concerné."],
   ["dispconn","Écran\n+ connecteur",45,95,80,40,"Dalle, tactile et leur connecteur sur la carte.","Écran noir, lignes, tactile mort ou fantôme.","Tests Écran et Tactile ; essai avec un écran de test.","Reconnecter la nappe ; remplacer le bloc écran. Si le défaut persiste avec un écran de test : carte (connecteur, rétroéclairage)."],
   ["soc","Processeur\n+ RAM",135,95,90,90,"Processeur (SoC) avec la RAM empilée au-dessus.","Redémarrages, bootloop, chauffe, appareil mort.","Consommation à l'alimentation de labo, point chaud à la caméra thermique.","Micro-soudure spécialisée (rebillage) ou remplacement de la carte."],
   ["wifi","Wi-Fi / BT\n/ GPS",45,145,80,40,"Puce de connectivité sans fil.","Wi-Fi grisé, Bluetooth absent, GPS imprécis.","Tests Réseau et GPS ; adresse MAC Wi-Fi visible dans À propos ?","Réinitialiser les réglages réseau, reflasher ; sinon réparation carte."],
   ["audio","Codec\naudio",235,145,80,40,"Convertit et amplifie le son (haut-parleurs, micros).","Aucun son ni micro, haut-parleur grisé en appel.","Tests Haut-parleurs et Micro, aussi en Bluetooth.","Réparation carte (codec ou ampli audio)."],
   ["ufs","Stockage\nUFS / NAND",45,195,80,45,"Mémoire de stockage : système et données.","Bootloop, erreurs de flash, lenteurs extrêmes.","Échecs de flash répétés, erreurs 4013/9 sur iPhone.","Reprogrammation ou remplacement de la mémoire (micro-soudure), ou carte."],
   ["pmic","PMIC",135,195,90,45,"Gestion de l'alimentation de tous les circuits.","Ne s'allume pas, s'éteint seul, chauffe.","Consommation anormale, courts-circuits sur les lignes d'alimentation.","Micro-soudure spécialisée."],
   ["modem","Modem / RF",235,195,80,45,"Réseau mobile, IMEI, amplis radio.","Pas de service, IMEI absent ou nul, recherche réseau permanente.","*#06# ; réglages réseau ; test avec une autre SIM.","Reflasher le firmware officiel ; sinon réparation carte (baseband)."],
   ["sim","Lecteur\nSIM",45,250,80,40,"Lecteur de carte SIM (et eSIM).","SIM non détectée.","Tester une autre SIM, inspecter les broches.","Nettoyer, redresser les broches ; remplacer le lecteur."],
   ["chargeic","Circuit\nde charge",135,250,90,40,"Gère la charge (Tristar/Hydra sur iPhone, contrôleur de charge sur Android).","Ne charge pas, charge lente, « accessoire non pris en charge ».","Testeur USB : courant absent ou faible avec un câble neuf.","Micro-soudure (circuit de charge)."],
   ["battconn","Connecteur\nbatterie",235,250,80,40,"Liaison batterie ↔ carte.","Ne s'allume pas sur batterie, mais démarre sur alimentation de labo.","Mesurer la tension au connecteur (3,7–4,4 V).","Reconnecter, remplacer le connecteur."],
   ["buttons","Boutons\nPower / volume",45,300,130,40,"Nappe des boutons latéraux.","Bouton sans effet, redémarrages en boucle (bouton bloqué).","Test Boutons ; observer si l'appareil réagit.","Nettoyer, remplacer la nappe boutons."],
   ["earpiece","Écouteur\ninterne",185,300,130,40,"Haut-parleur d'appel en haut de l'écran.","Correspondant inaudible en appel.","Appel test, mode haut-parleur désactivé.","Nettoyer la grille, remplacer l'écouteur."],
   ["nfc","Antenne NFC / recharge sans fil",30,375,300,32,"Bobines plates au dos (sur la batterie ou le capot) : NFC à 13,56 MHz et recharge sans fil Qi.","Paiement sans contact refusé, recharge sans fil absente.","Test NFC de DiagLab (Chrome Android), essai de recharge sans fil, contrôle des contacts à ressort.","Reconnecter ou remplacer l'antenne ; transférer l'antenne lors d'un changement de capot."],
   ["battery","Batterie",30,415,300,200,"Accumulateur lithium.","Autonomie faible, extinctions à 20–30 %, batterie gonflée.","Santé de la batterie, cycles ; inspection visuelle (gonflement).","Remplacer. Batterie gonflée : retirer immédiatement, risque d'incendie."],
   ["mic","Micro",45,645,60,55,"Micro principal (en bas).","Correspondant ne vous entend pas, mémos vocaux muets.","Test Micro.","Nettoyer la grille ; remplacer la sous-carte ou la nappe qui porte le micro."],
   ["vibrator","Vibreur",110,645,60,55,"Moteur de vibration (Taptic Engine sur iPhone).","Pas de vibration, bruit anormal.","Test Vibreur.","Remplacer le vibreur."],
   ["port","Port de\ncharge",175,645,70,55,"Connecteur USB-C ou Lightning.","Ne charge pas, câble qui tient mal, charge intermittente.","Inspection à la lampe (peluches), testeur USB, câble neuf.","Nettoyer ; remplacer la sous-carte ou le connecteur."],
   ["speaker","Haut-\nparleur",250,645,65,55,"Haut-parleur principal.","Son faible, grésillant ou absent.","Test Haut-parleurs (gauche/droite).","Nettoyer la grille, remplacer le haut-parleur."]
  ]
 },
 pc:{
  title:"Ordinateur (carte mère)", view:"0 0 600 500",
  note:"Schéma de principe d'une carte mère : sur un portable, les mêmes éléments sont présents mais disposés autrement, souvent soudés.",
  zones:[{x:10,y:10,w:580,h:480,label:""}],
  parts:[
   ["eps","EPS 8 broches\n(CPU)",120,20,100,32,"Alimentation 12 V du processeur.","Ventilateurs qui tournent mais rien ne démarre.","Câble EPS bien branché ? Tension 12 V.","Brancher le câble EPS, tester une autre alimentation."],
   ["io","Ports\narrière\nUSB / vidéo",20,20,90,200,"Connecteurs du panneau arrière.","USB ou sortie vidéo morte.","Tester chaque port avec un périphérique sûr.","Nettoyer ; réparation du connecteur."],
   ["vrm","VRM\n(alimentation\nCPU)",120,62,100,110,"Convertit le 12 V pour le processeur.","Extinctions sous charge, odeur de brûlé, gonflement de condensateurs.","Inspection visuelle, température des MOSFET sous charge.","Améliorer le refroidissement ; remplacement des composants ou de la carte."],
   ["cpu","Processeur",232,62,120,110,"Exécute tout le système.","Écrans bleus WHEA, aucun affichage, extinctions.","Stress test OCCT, codes de débogage, erreurs WHEA.","Retirer l'overclocking, mettre à jour le BIOS, tester un autre processeur."],
   ["cooling","Refroidissement\nCPU",232,180,120,36,"Radiateur, ventilateur, pâte thermique.","Surchauffe, ventilateur bruyant, extinctions.","Températures HWiNFO au repos et sous charge.","Dépoussiérer, remplacer la pâte thermique et le ventilateur."],
   ["ram","Mémoire\nRAM",366,40,90,176,"Barrettes de mémoire vive.","Écrans bleus MEMORY_MANAGEMENT, bips, aucun affichage.","MemTest86, test barrette par barrette.","Réinsérer, désactiver XMP/EXPO, remplacer la barrette fautive."],
   ["atx","ATX\n24 br.",470,40,50,176,"Alimentation principale de la carte.","Rien ne s'allume.","Testeur d'alimentation, tensions 3,3 / 5 / 12 V.","Remplacer l'alimentation, rebrancher le connecteur."],
   ["psu","Bloc\nalim.",530,40,50,176,"Alimentation (PC fixe) ou chargeur (portable).","Ne s'allume pas, redémarrages sous charge.","Testeur ATX, autre alimentation ; sur portable, tension du chargeur.","Remplacer l'alimentation ou le chargeur."],
   ["lan","Réseau\nLAN / Wi-Fi",20,232,90,60,"Contrôleur Ethernet et carte Wi-Fi.","Pas de réseau, lien à 100 Mb/s, Wi-Fi absent.","Gestionnaire de périphériques, vitesse du lien, autre câble.","Pilote du constructeur ; remplacer la carte Wi-Fi M.2 ; carte réseau USB en dépannage."],
   ["audio","Codec\naudio",20,304,90,60,"Son de la carte mère.","Pas de son, grésillements.","Tester avec un casque, pilote Realtek.","Réinstaller le pilote ; carte son USB en dépannage."],
   ["pcie","PCIe x16 : carte graphique",120,232,232,32,"Emplacement de la carte graphique.","Aucun affichage, artefacts, écran bleu VIDEO_TDR.","Tester la puce graphique intégrée, une autre carte.","Réinsérer, alimenter (8 broches), DDU puis pilote propre ; remplacer la carte."],
   ["m2","SSD M.2 NVMe",120,276,232,32,"Disque système principal.","Lenteurs, disque introuvable, erreurs disque, usure.","CrystalDiskInfo (SMART, usure), BIOS.","Sauvegarder et remplacer ; vérifier la vis et le mode VMD/RAID."],
   ["sata","Ports\nSATA",366,232,90,76,"Disques durs et SSD SATA.","Disque non détecté, erreurs disque.","Changer de câble et de port.","Remplacer le câble ; remplacer le disque."],
   ["chipset","Chipset\n(PCH)",470,232,110,76,"Relie le processeur aux périphériques (USB, SATA, PCIe).","Ports multiples morts, chauffe, pilotes en erreur.","Pilotes chipset, température.","Installer le pilote chipset ; réparation carte."],
   ["battery","Batterie (portable)",120,320,232,60,"Batterie d'un ordinateur portable.","Autonomie faible, s'éteint débranché, gonflement.","powercfg /batteryreport, Rapport PC.","Remplacer la batterie. Gonflée : retirer immédiatement."],
   ["bios","Puce BIOS\n+ TPM",366,320,90,60,"Micrologiciel de démarrage et puce de sécurité.","Pas de POST après mise à jour, TPM absent, BitLocker qui demande la clé.","Reset CMOS ; BIOS Flashback.","Reflasher le BIOS (Flashback, programmateur CH341A) ; activer le TPM dans le BIOS."],
   ["cmos","Pile\nCMOS",470,320,110,60,"Pile CR2032 qui garde l'heure et les réglages.","Date réinitialisée, réglages BIOS perdus.","Tension de la pile (≥ 3 V).","Remplacer la pile CR2032."],
   ["display","Écran / nappe vidéo",120,392,232,40,"Dalle et nappe (portable) ou câble vidéo.","Écran noir avec écran externe fonctionnel, lignes, scintillement.","Brancher un écran externe.","Reconnecter ou remplacer la nappe, remplacer la dalle."],
   ["keyboard","Clavier /\npavé tactile",366,392,214,40,"Clavier et pavé tactile (portable).","Touches mortes, pavé inactif.","Test Clavier.","Pilote I2C HID ; remplacer le clavier ; vérifier une batterie gonflée sous le pavé."],
   ["front","Façade : Power, USB, audio",120,444,460,36,"Connecteurs du boîtier.","Bouton Power sans effet, USB façade morts.","Court-circuiter PWR_SW pour démarrer.","Rebrancher les connecteurs façade."]
  ]
 }
};

/* Symptôme du diagnostic guidé → composants concernés ([id, poids 3 = principal, 2 = possible, 1 = rare]) */
const SYMPTOM_PARTS = {
 "pc|Ne s'allume pas":[["psu",3],["front",2],["vrm",1],["eps",1]],
 "pc|Allumé mais pas d'affichage":[["ram",3],["pcie",2],["display",2],["bios",1]],
 "pc|Écran bleu (BSOD)":[["ram",3],["m2",2],["cpu",1]],
 "pc|Lenteur extrême":[["m2",3],["ram",2],["cooling",1]],
 "pc|Surchauffe / s'éteint seul":[["cooling",3],["battery",2],["vrm",1]],
 "pc|Disque non détecté":[["m2",3],["sata",3],["chipset",1]],
 "pc|Wi-Fi absent ou inutilisable":[["lan",3]],
 "pc|Clavier ou pavé tactile HS":[["keyboard",3],["battery",1]],
 "pc|Mac ne démarre pas":[["psu",2],["m2",2],["bios",2]],
 "pc|Pas de son":[["audio",3]],
 "android|Ne s'allume pas / ne charge pas":[["port",3],["battery",2],["chargeic",2],["pmic",1]],
 "android|Bootloop (redémarre en boucle)":[["ufs",2],["battery",2],["buttons",1],["soc",1]],
 "android|Batterie qui se vide vite":[["battery",3],["modem",1]],
 "android|Pas de réseau / SIM non détectée":[["sim",3],["modem",2]],
 "android|Écran cassé : récupérer les données":[["dispconn",3]],
 "android|Micro ou haut-parleur":[["mic",3],["speaker",3],["audio",1]],
 "android|Appareil photo ne marche pas":[["camrear",3],["frontcam",2]],
 "android|Wi-Fi ou Bluetooth ne s'active pas":[["wifi",3]],
 "android|Tactile ne répond pas":[["dispconn",3]],
 "android|Surchauffe":[["soc",2],["battery",2],["pmic",1]],
 "iphone|Ne s'allume pas":[["battery",3],["port",2],["dispconn",2],["chargeic",1],["pmic",1]],
 "iphone|Bloqué sur la pomme":[["ufs",2],["soc",1]],
 "iphone|Redémarre tout seul (toutes les 3 min)":[["port",3],["battery",3],["sensors",1]],
 "iphone|Ne charge pas":[["port",3],["chargeic",2]],
 "iphone|Batterie qui se vide vite":[["battery",3]],
 "iphone|Face ID / Touch ID indisponible":[["frontcam",3],["buttons",1]],
 "iphone|Pas de service":[["sim",3],["modem",2]],
 "iphone|Écran : lignes ou tactile fantôme":[["dispconn",3]],
 "iphone|Pas de son / micro":[["speaker",3],["mic",2],["audio",1]]
};

/* Domaine d'un constat du Rapport PC → composant */
const SCAN_PARTS = {"Disque":"m2","Batterie":"battery","Mémoire":"ram","Température":"cooling","Matériel":"cpu","Réseau":"lan","Pilotes":"chipset","Stabilité":"ram"};

/* Systèmes, logiciels et ISO : uniquement des pages de téléchargement officielles. */
const ISOS = [
 ["Windows",[
  ["Windows 11 (64 bits)","ISO officielle multi-éditions (Famille, Pro…). Choisir « Télécharger l'image disque (ISO) » puis la langue.","ISO","https://www.microsoft.com/software-download/windows11","Licence requise"],
  ["Windows 11 ARM64","Pour les PC à processeur Snapdragon / ARM.","ISO","https://www.microsoft.com/software-download/windows11arm64","Licence requise"],
  ["Outil de création de média Windows 11","Crée directement une clé USB d'installation.","Outil","https://www.microsoft.com/software-download/windows11","Officiel"],
  ["Windows 10","Support terminé le 14 octobre 2025 : à réserver aux cas particuliers (ESU, compatibilité).","ISO","https://www.microsoft.com/software-download/windows10","Fin de support"],
  ["Windows 11 Entreprise (évaluation)","Version d'évaluation de 90 jours pour les tests.","ISO","https://www.microsoft.com/evalcenter/evaluate-windows-11-enterprise","Évaluation"],
  ["Windows Server (évaluation)","Versions d'évaluation de 180 jours.","ISO","https://www.microsoft.com/evalcenter/evaluate-windows-server","Évaluation"],
  ["Windows ADK et WinPE","Pour créer un environnement de dépannage WinPE.","Outil","https://learn.microsoft.com/windows-hardware/get-started/adk-install","Officiel"]]],
 ["Microsoft Office",[
  ["Microsoft 365 / Office 2024","Pas d'ISO grand public : l'installation se fait depuis le compte Microsoft du client, où la licence est enregistrée.","Installateur","https://account.microsoft.com/services","Licence du client"],
  ["Office LTSC 2024 (entreprises)","Installation par l'Outil de déploiement d'Office (ODT) avec un fichier de configuration ; licence en volume requise.","Outil","https://learn.microsoft.com/microsoft-365-apps/deploy/overview-office-deployment-tool","Licence en volume"],
  ["Configurateur ODT","Génère le fichier de configuration (langues, applications, édition).","Outil","https://config.office.com/deploymentsettings","Officiel"],
  ["LibreOffice","Suite bureautique gratuite et libre, compatible avec les fichiers Office.","Installateur","https://www.libreoffice.org/download/download-libreoffice/","Gratuit"]]],
 ["macOS",[
  ["Télécharger macOS (toutes versions)","Page Apple listant chaque version avec son lien App Store ou image disque.","DMG / App Store","https://support.apple.com/102662","Officiel"],
  ["Créer une clé d'installation macOS","Commande createinstallmedia, étape par étape.","Guide","https://support.apple.com/101578","Officiel"],
  ["Réinstaller macOS depuis la récupération","Apple Silicon : maintenir Power ; Intel : Cmd + R.","Guide","https://support.apple.com/HT204904","Officiel"],
  ["Apple Configurator (raviver / restaurer)","Restaure le firmware d'un Mac Apple Silicon ou T2, depuis un autre Mac.","Outil","https://apps.apple.com/app/apple-configurator/id1037126344","Officiel"]]],
 ["Linux",[
  ["Ubuntu Desktop","La distribution la plus répandue ; prendre la dernière version LTS (support 5 ans).","ISO","https://ubuntu.com/download/desktop","Gratuit"],
  ["Ubuntu Server","Pour serveurs et machines virtuelles.","ISO","https://ubuntu.com/download/server","Gratuit"],
  ["Linux Mint","Très proche de Windows, idéale pour un client qui quitte Windows 10.","ISO","https://linuxmint.com/download.php","Gratuit"],
  ["Debian","Stable et légère, référence pour les serveurs.","ISO","https://www.debian.org/download","Gratuit"],
  ["Fedora Workstation","Récente et soignée.","ISO","https://fedoraproject.org/workstation/download","Gratuit"],
  ["Zorin OS","Interface proche de Windows, pour débutants.","ISO","https://zorin.com/os/download/","Gratuit"],
  ["Lubuntu","Version légère d'Ubuntu pour vieux PC (2 à 4 Go de RAM).","ISO","https://lubuntu.me/downloads/","Gratuit"],
  ["Rocky Linux / AlmaLinux","Compatibles Red Hat Enterprise Linux, pour serveurs.","ISO","https://rockylinux.org/download","Gratuit"],
  ["Kali Linux","Audit de sécurité, réservé aux tests autorisés.","ISO","https://www.kali.org/get-kali/","Gratuit"],
  ["Tails","Système amnésique sur clé USB, pour la confidentialité.","IMG","https://tails.net/install/","Gratuit"]]],
 ["Autres systèmes",[
  ["ChromeOS Flex","Redonne vie à un vieux PC ou Mac en Chromebook.","IMG","https://chromeos.google/products/chromeos-flex/","Gratuit"],
  ["Proxmox VE","Virtualisation (machines virtuelles et conteneurs).","ISO","https://www.proxmox.com/en/downloads","Gratuit"],
  ["TrueNAS","Serveur de stockage réseau (NAS).","ISO","https://www.truenas.com/download/","Gratuit"],
  ["OPNsense","Pare-feu et routeur.","ISO","https://opnsense.org/download/","Gratuit"],
  ["FreeBSD","Système Unix libre.","ISO","https://www.freebsd.org/where/","Gratuit"]]],
 ["Téléphones (firmwares officiels)",[
  ["Google Pixel","Images d'usine et Android Flash Tool.","IMG","https://developers.google.com/android/images","Officiel"],
  ["Samsung Smart Switch","Mise à jour et restauration du firmware officiel.","Outil","https://www.samsung.com/fr/apps/smart-switch/","Officiel"],
  ["iPhone / iPad","Restauration iOS par Finder (Mac) ou Apple Devices (Windows).","Guide","https://support.apple.com/HT201263","Officiel"],
  ["Motorola","Réparation du système avec Software Fix / Rescue and Smart Assistant, depuis le support Motorola.","Outil","https://en-us.support.motorola.com/","Officiel"]]],
 ["Pilotes",[
  ["Intel Driver & Support Assistant","Pilotes Intel (chipset, Wi-Fi, graphique).","Outil","https://www.intel.com/content/www/us/en/support/detect.html","Officiel"],
  ["AMD Pilotes et support","Pilotes chipset et Radeon.","Outil","https://www.amd.com/en/support/download/drivers.html","Officiel"],
  ["NVIDIA Pilotes","Pilotes GeForce et RTX.","Outil","https://www.nvidia.com/drivers/","Officiel"],
  ["Dell / HP / Lenovo","Pilotes par numéro de série : Dell SupportAssist, HP Support Assistant, Lenovo Vantage.","Outil","https://www.dell.com/support/home/","Officiel"]]]
];
