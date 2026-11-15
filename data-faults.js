/* DiagLab Pro — pannes récurrentes par marque, symptômes fréquents supplémentaires, pilotes */

/* ---------- Symptômes fréquents ajoutés au diagnostic guidé ---------- */
Object.assign(DIAG.pc, {
 "Écran noir au réveil de la veille":[
  ["h","Pilote graphique ou gestion de l'énergie","Le PC répond (verr. num., son) mais l'écran reste noir ; Win + Ctrl + Maj + B relance le pilote graphique.","Mettre à jour le pilote graphique (Intel/AMD/NVIDIA) et le BIOS ; désactiver le démarrage rapide (Options d'alimentation)."],
  ["m","Veille moderne (S0) mal gérée","powercfg /a indique « Veille connectée » ; réveils intempestifs dans l'Observateur d'événements.","Mettre à jour BIOS, chipset et Intel Management Engine ; à défaut, préférer l'hibernation."],
  ["l","Écran ou nappe vidéo","Défaut identique avec un écran externe ?","Contrôler la nappe vidéo, remplacer la dalle."]],
 "Windows Update échoue":[
  ["h","Espace disque insuffisant","Moins de 20 Go libres sur C:.","Nettoyage de disque (fichiers système), déplacer les fichiers volumineux."],
  ["m","Composants Windows Update corrompus","Code d'erreur 0x800… répété sur la même mise à jour.","En administrateur : net stop wuauserv, net stop bits, renommer C:\\Windows\\SoftwareDistribution, net start wuauserv, net start bits ; puis l'utilitaire de résolution des problèmes Windows Update."],
  ["m","Fichiers système endommagés","sfc /scannow signale des erreurs.","DISM /Online /Cleanup-Image /RestoreHealth puis sfc /scannow."],
  ["l","Installation Windows trop abîmée","Échecs persistants malgré les réparations.","Réparation sur place : lancer setup.exe depuis l'ISO Windows et choisir « Conserver les fichiers et les applications »."]],
 "Périphérique USB non reconnu":[
  ["h","Câble, port ou périphérique","Tester un autre port (arrière sur PC fixe) et un autre câble.","Changer de port ou de câble ; éviter les hubs non alimentés."],
  ["m","Gestion de l'alimentation USB","Le périphérique se déconnecte après quelques minutes.","Désactiver la suspension sélective USB (Options d'alimentation) et « Autoriser l'ordinateur à éteindre ce périphérique » dans le Gestionnaire."],
  ["m","Pilote du contrôleur USB","« Périphérique inconnu (échec de la demande de descripteur) ».","Désinstaller le périphérique et les contrôleurs USB dans le Gestionnaire puis redémarrer ; installer le pilote chipset."],
  ["l","Port endommagé","Port branlant, broches tordues, odeur de brûlé.","Réparation du connecteur ou de la carte fille USB."]],
 "Écran qui scintille ou lignes":[
  ["h","Pilote graphique ou fréquence","Le défaut apparaît aussi dans le BIOS ? Sinon, logiciel.","Réinstaller le pilote graphique (DDU), vérifier la fréquence de rafraîchissement."],
  ["m","Nappe vidéo (portable)","Le défaut varie quand on bouge l'écran.","Reconnecter ou remplacer la nappe vidéo."],
  ["l","Dalle défectueuse","Lignes fixes même dans le BIOS, écran externe correct.","Remplacer la dalle (relever la référence au dos)."]],
 "Virus, publicités, navigateur détourné":[
  ["h","Programmes et extensions indésirables","Barre d'outils, page d'accueil modifiée, publicités dans le navigateur.","Désinstaller les programmes récents inconnus, réinitialiser le navigateur, scanner avec Malwarebytes et AdwCleaner."],
  ["m","Logiciel malveillant actif","Antivirus désactivé, processus inconnus gourmands.","Analyse hors ligne Microsoft Defender, ESET Online Scanner ; changer les mots de passe depuis un autre appareil."],
  ["l","Infection profonde (rootkit, rançongiciel)","Fichiers chiffrés, réinfection après nettoyage.","Sauvegarder les données saines, réinstaller Windows proprement ; signaler le rançongiciel (cybermalveillance.gouv.fr en France)."]],
 "Ventilateur très bruyant":[
  ["h","Poussière","Bruit qui monte vite, températures élevées.","Nettoyer à la bombe d'air, ventilateur bloqué pendant le soufflage."],
  ["m","Processus gourmand en arrière-plan","Processeur à 100 % au repos (Gestionnaire des tâches).","Identifier et arrêter le processus, scanner contre les logiciels malveillants."],
  ["l","Roulement usé","Grattement ou cliquetis, même au ralenti.","Remplacer le ventilateur."]]
});
Object.assign(DIAG.android, {
 "Stockage plein":[
  ["h","Photos, vidéos et médias WhatsApp","Paramètres → Stockage : répartition par catégorie.","Sauvegarder sur Google Photos ou un PC, vider les médias WhatsApp, appli Files by Google."],
  ["m","Cache d'applications","Appli de plusieurs Go dans Paramètres → Applis.","Vider le cache des applis les plus lourdes."],
  ["l","Système qui gonfle","« Système » occupe une part anormale après plusieurs mises à jour.","Sauvegarde puis réinitialisation d'usine."]],
 "Applis qui plantent ou se ferment":[
  ["h","Données de l'appli corrompues","Une seule appli concernée.","Vider le cache, puis les données de l'appli ; la réinstaller."],
  ["m","Android System WebView ou services Google","Plusieurs applis plantent en même temps.","Mettre à jour Android System WebView, Chrome et les Services Google Play depuis le Play Store."],
  ["l","Mémoire vive saturée ou stockage défaillant","Plantages partout, lenteurs.","Libérer du stockage ; si cela persiste, sauvegarde et réinitialisation."]],
 "Lignes ou couleurs anormales à l'écran":[
  ["h","Dalle OLED endommagée","Ligne verte, rose ou blanche fixe, parfois après un choc ou une mise à jour.","Remplacer le bloc écran ; vérifier une éventuelle prise en charge par le constructeur."],
  ["m","Nappe d'écran","Le défaut varie quand on appuie près du connecteur.","Reconnecter la nappe, remplacer le bloc écran."],
  ["l","Carte mère (puce graphique)","Défaut identique avec un écran de test.","Réparation carte."]],
 "Charge très lente":[
  ["h","Câble ou chargeur non compatible charge rapide","Le message « Charge rapide » n'apparaît pas.","Utiliser le chargeur et le câble d'origine (protocole propriétaire chez Oppo, OnePlus, Xiaomi…)."],
  ["m","Port de charge encrassé","Câble qui tient mal.","Nettoyer le port."],
  ["m","Protection de la batterie activée","La charge s'arrête à 80–85 %.","Normal : option « Protéger la batterie » ou charge adaptative dans Paramètres → Batterie."],
  ["l","Circuit de charge","Courant faible au testeur USB avec un chargeur sûr.","Réparation de la sous-carte ou de la carte."]],
 "Publicités intrusives ou virus":[
  ["h","Appli publicitaire (adware)","Publicités en plein écran hors des applis.","Mode sans échec, désinstaller les applis récentes (lampes, nettoyeurs, VPN gratuits), Play Protect."],
  ["m","Notifications de sites web","Alertes « virus détecté » dans les notifications.","Chrome → Paramètres → Notifications : retirer les sites inconnus."],
  ["l","Appli administrateur de l'appareil","L'appli ne se désinstalle pas.","Paramètres → Sécurité → Applis d'administration : la désactiver puis la désinstaller."]]
});
Object.assign(DIAG.iphone, {
 "Stockage saturé":[
  ["h","Photos, vidéos et messages","Réglages → Général → Stockage iPhone.","Activer Photos iCloud avec « Optimiser le stockage », supprimer les pièces jointes volumineuses de Messages."],
  ["m","Données système volumineuses","« Données du système » de plusieurs dizaines de Go.","Redémarrer, mettre à jour iOS ; en dernier recours, sauvegarde et restauration."],
  ["l","Applis qui stockent beaucoup","Apps de streaming avec téléchargements hors ligne.","Supprimer les téléchargements dans l'appli."]],
 "Wi-Fi grisé ou instable":[
  ["h","Réglages réseau","Wi-Fi qui se déconnecte sur plusieurs réseaux.","Réinitialiser les réglages réseau ; oublier puis rejoindre le réseau."],
  ["m","Mise à jour iOS","Problème apparu après une mise à jour.","Installer la mise à jour corrective suivante."],
  ["l","Puce Wi-Fi","Interrupteur Wi-Fi grisé, adresse Wi-Fi absente dans Informations.","Réparation carte logique."]],
 "Non reconnu par l'ordinateur":[
  ["h","Câble ou « Faire confiance »","Le message « Faire confiance à cet ordinateur » n'apparaît pas.","Câble Apple ou certifié, déverrouiller l'iPhone, accepter la demande ; Réglages → Général → Transférer ou réinitialiser → Réinitialiser localisation et confidentialité."],
  ["m","Pilote Apple sur Windows","iPhone absent de l'application Apple Devices.","Installer ou réparer Apple Devices (Microsoft Store)."],
  ["l","Port Lightning / USB-C","Charge mais aucune donnée.","Nettoyer, remplacer le connecteur."]]
});
Object.assign(SYMPTOM_PARTS, {
 "pc|Écran noir au réveil de la veille":[["pcie",2],["display",2],["bios",2]],
 "pc|Windows Update échoue":[["m2",2]],
 "pc|Périphérique USB non reconnu":[["io",3],["front",2],["chipset",2]],
 "pc|Écran qui scintille ou lignes":[["display",3],["pcie",2]],
 "pc|Ventilateur très bruyant":[["cooling",3]],
 "android|Lignes ou couleurs anormales à l'écran":[["dispconn",3],["soc",1]],
 "android|Charge très lente":[["port",3],["chargeic",2],["battery",2]],
 "android|Applis qui plantent ou se ferment":[["ufs",2]],
 "android|Stockage plein":[["ufs",2]],
 "iphone|Wi-Fi grisé ou instable":[["wifi",3]],
 "iphone|Non reconnu par l'ordinateur":[["port",3],["chargeic",1]]
});

/* ---------- Pannes récurrentes par marque ----------
   faults : [titre, symptômes, cause, solution] */
const BRAND_FAULTS = {
 pc:{
  "HP":{models:"Pavilion, Envy, Victus, Omen, ProBook, EliteBook",tool:"HP PC Hardware Diagnostics UEFI : à l'allumage, appuyer sur Échap puis F2. Sous Windows : HP Support Assistant.",keys:"Échap au démarrage : F9 démarrage, F10 BIOS, F11 restauration.",faults:[
   ["Charnières cassées, coque d'écran fendue","L'écran se décolle à l'ouverture, craquements.","Les inserts des charnières s'arrachent du plastique (Pavilion, Envy x360).","Remplacer la coque arrière de l'écran (inserts neufs) et les charnières ; conseiller d'ouvrir par le centre."],
   ["Erreur « Boot Device Not Found (3F0) »","Le PC ne trouve pas de système au démarrage.","Disque non détecté ou mode de démarrage modifié (UEFI/Legacy).","Lancer le test du disque (Échap, F2) ; vérifier le disque dans le BIOS ; réinitialiser les réglages du BIOS (F9 dans le BIOS)."],
   ["Verr. Maj qui clignote, écran noir","Le PC s'allume, la touche Verr. Maj clignote un nombre de fois répété.","Code de clignotement HP qui désigne la pièce en cause (mémoire, graphique, BIOS…).","Compter les clignotements et consulter le tableau HP du modèle ; réinsérer la mémoire en premier."],
   ["Batterie gonflée","Pavé tactile qui se soulève, coque déformée.","Batterie lithium vieillissante.","Retirer et remplacer immédiatement ; contrôle avec HP Battery Check."],
   ["Surchauffe (Pavilion Gaming, Victus, Omen)","Ventilateurs à fond, baisse de performances en jeu.","Poussière, pâte thermique sèche.","Nettoyage, remplacement de la pâte thermique, mode de performance adapté dans Omen Gaming Hub."]]},
  "Dell":{models:"Inspiron, Vostro, Latitude, XPS, Precision, Alienware",tool:"SupportAssist / diagnostics ePSA : F12 au démarrage, puis Diagnostics.",keys:"F2 BIOS, F12 menu de démarrage.",faults:[
   ["« The AC power adapter type cannot be determined »","Message au démarrage, charge lente ou absente.","Fil central d'identification du chargeur Dell ou connecteur de charge abîmé.","Tester un chargeur Dell d'origine ; remplacer le chargeur ou le connecteur DC-in."],
   ["Voyant d'alimentation qui clignote orange et blanc","Pas d'affichage, voyant qui clignote selon un motif.","Code de diagnostic Dell (mémoire, carte mère, écran…).","Noter le motif (nombre d'orange puis de blanc) et consulter le tableau Dell du modèle."],
   ["« No bootable devices found »","Le PC ne démarre pas sur Windows.","Mode SATA modifié (RAID/AHCI) ou disque absent.","BIOS → Storage : remettre le mode d'origine (souvent RAID On / Intel VMD) ; test du disque F12 → Diagnostics."],
   ["Batterie gonflée (XPS, Latitude)","Pavé tactile dur ou soulevé.","Batterie usée.","Remplacer immédiatement."],
   ["Charnières fissurées (Inspiron 15)","Coque qui s'écarte près de la charnière.","Fixations plastiques fragiles.","Remplacer la coque et les charnières."]]},
  "Lenovo":{models:"IdeaPad, ThinkPad, ThinkBook, Yoga, Legion",tool:"Lenovo Diagnostics (depuis Lenovo Vantage ou le menu de démarrage).",keys:"ThinkPad : Entrée au démarrage puis F1 BIOS / F12 démarrage. IdeaPad : bouton Novo (petit trou) ou F2 / F12.",faults:[
   ["Ne s'allume plus du tout","Aucune réaction, même sur secteur.","Mode de protection de la batterie bloqué après une décharge complète.","Débrancher le secteur, enfoncer un trombone 10 s dans le trou de réinitialisation d'urgence (dessous de l'appareil sur de nombreux modèles), rebrancher."],
   ["Ne charge plus en USB-C (ThinkPad)","Le chargeur USB-C n'est plus reconnu.","Firmware Thunderbolt / USB-C ou BIOS ancien, ou carte de charge.","Mettre à jour BIOS et firmware Thunderbolt avec Lenovo Vantage ; sinon remplacer la carte de charge."],
   ["Clavier ou TrackPoint défaillant","Touches mortes, pointeur qui dérive.","Usure, liquide renversé.","Calibrer en redémarrant sans toucher le TrackPoint ; remplacer le clavier."],
   ["Charnières (Yoga, IdeaPad)","Écran qui tombe, coque fendue.","Fixations fragilisées.","Remplacer la coque et les charnières."],
   ["Écran noir (Legion)","Le PC tourne, rien ne s'affiche.","Pilote graphique ou commutation graphique (MUX).","Écran externe pour accéder à Windows, réinstaller les pilotes ; réinitialiser le BIOS."]]},
  "ASUS":{models:"VivoBook, ZenBook, TUF, ROG",tool:"MyASUS → Assistance → Diagnostic du système.",keys:"F2 BIOS, Échap menu de démarrage.",faults:[
   ["Bloqué sur le logo ASUS ou rien ne se passe","Le PC ne démarre pas après une coupure.","État électrique bloqué.","Débrancher le secteur, maintenir Power 40 s, rebrancher et rallumer."],
   ["Touches mortes (VivoBook)","Une rangée de touches ne répond plus.","Clavier ou nappe ; clavier souvent fixé au repose-poignets.","Remplacer le clavier (souvent le repose-poignets complet)."],
   ["Surchauffe (TUF, ROG)","Ventilateurs bruyants, chute des performances.","Poussière, profil de performance.","Nettoyer ; régler le mode dans Armoury Crate."],
   ["Wi-Fi instable","Déconnexions fréquentes.","Pilote Wi-Fi ou économie d'énergie.","Pilote depuis MyASUS ou le site du fabricant de la puce ; désactiver l'économie d'énergie de la carte."]]},
  "Acer":{models:"Aspire, Swift, Nitro, Predator",tool:"Acer Care Center.",keys:"F2 BIOS, F12 menu de démarrage (à activer d'abord dans le BIOS : « F12 Boot Menu »).",faults:[
   ["« No bootable device » après une mise à jour du BIOS","Windows ne démarre plus.","L'entrée de démarrage UEFI n'est plus reconnue comme fiable.","BIOS → Security → « Select an UEFI file as trusted for executing » → choisir \\EFI\\Microsoft\\Boot\\bootmgfw.efi."],
   ["Le menu de démarrage F12 ne s'ouvre pas","Impossible de démarrer sur une clé USB.","Option désactivée par défaut.","BIOS (F2) → Main → F12 Boot Menu : Enabled."],
   ["Surchauffe (Nitro, Predator)","Ventilateurs à fond.","Poussière, pâte thermique.","Nettoyer ; NitroSense / PredatorSense pour les ventilateurs."],
   ["Charnières (Aspire)","Coque fendue.","Fixations fragiles.","Remplacer la coque et les charnières."]]},
  "MSI":{models:"Cartes mères, portables GF, Katana, Raider",tool:"MSI Center ; voyants EZ Debug sur les cartes mères.",keys:"Suppr BIOS, F11 menu de démarrage.",faults:[
   ["Voyant EZ Debug allumé (carte mère)","Pas d'affichage, un voyant CPU, DRAM, VGA ou BOOT reste allumé.","Le voyant désigne l'étape bloquante.","DRAM : réinsérer la mémoire, un seul module ; VGA : carte graphique ; CPU : alimentation EPS, processeur ; BOOT : disque."],
   ["Pas d'affichage avec un processeur récent","Carte mère neuve, aucun signal.","BIOS trop ancien pour le processeur.","Mettre à jour le BIOS par Flash BIOS Button (clé USB FAT32, fichier renommé MSI.ROM)."],
   ["Surchauffe (portables)","Bruit, performances qui chutent.","Poussière.","Nettoyage, pâte thermique ; profils dans MSI Center."]]},
  "Apple Mac":{models:"MacBook Air, MacBook Pro, iMac, Mac mini",tool:"Diagnostics Apple : maintenir D au démarrage (Intel) ; Apple Silicon : maintenir Power puis Cmd + D.",keys:"Apple Silicon : maintenir Power pour les options. Intel : Option pour le démarrage, Cmd + R pour la récupération.",faults:[
   ["Clavier papillon (2016–2019)","Touches qui doublent ou ne répondent plus.","Mécanisme papillon sensible à la poussière.","Air sec sous la touche inclinée ; remplacement du clavier (repose-poignets)."],
   ["Rétroéclairage qui disparaît (MacBook Pro 2016–2017)","Effet de rideau en bas de l'écran puis écran noir.","Nappe d'écran usée par l'ouverture (« flexgate »).","Remplacement de la dalle ou réparation de la nappe."],
   ["Revêtement d'écran qui s'écaille","Taches sur l'écran.","Délaminage du revêtement antireflet.","Remplacement de la dalle."],
   ["Ne démarre plus (Apple Silicon)","Écran noir, aucun son.","Firmware endommagé.","Raviver puis restaurer avec Apple Configurator depuis un autre Mac."],
   ["« Service recommandé » pour la batterie","Autonomie faible.","Batterie usée (cycles).","Remplacer la batterie."]]},
  "Microsoft Surface":{models:"Surface Pro, Surface Laptop, Surface Go",tool:"Surface Diagnostic Toolkit ; application Surface.",keys:"Volume − + Power : démarrer sur USB. Volume + + Power : UEFI.",faults:[
   ["Ne s'allume plus","Aucune réaction.","Blocage électrique.","Maintenir Power 20 s, relâcher, rallumer ; recharger 30 min avec le chargeur d'origine."],
   ["Écran qui scintille ou tactile fantôme","Écran tremblant, touches fantômes.","Dalle ou contrôleur tactile.","Mettre à jour le firmware via Windows Update ; remplacer l'écran."],
   ["Batterie gonflée","Écran qui se décolle du châssis.","Batterie usée.","Arrêter l'utilisation, remplacer l'écran et la batterie."]]},
  "PC fixe (toutes marques)":{models:"Tours assemblées et de marque",tool:"Voyants ou afficheur de débogage de la carte mère, OCCT, MemTest86.",keys:"Suppr ou F2 BIOS ; F8, F11 ou F12 menu de démarrage.",faults:[
   ["Rien ne s'allume","Aucun ventilateur.","Alimentation, interrupteur arrière, câble façade.","Tester l'alimentation (testeur ATX), court-circuiter PWR_SW sur la carte."],
   ["Ventilateurs tournent, pas d'image","Bips ou voyant DRAM.","Mémoire, carte graphique, câble écran.","Un module de RAM, écran branché sur la carte graphique, reset CMOS."],
   ["Redémarrages en jeu","Coupures sous charge.","Alimentation sous-dimensionnée ou fatiguée, surchauffe.","Tester sous charge (OCCT), remplacer l'alimentation."],
   ["Date et réglages perdus","Heure fausse à chaque démarrage.","Pile CMOS vide.","Remplacer la pile CR2032."]]}
 },
 phone:{
  "Samsung":{models:"Galaxy S, A, M, Z, Tab",tool:"Samsung Members → Assistance → Diagnostic du téléphone ; code *#0*#.",keys:"Recovery : éteint, câble branché à un PC, Power + Volume haut.",faults:[
   ["Ligne verte ou rose sur l'écran","Ligne verticale fixe, parfois après une mise à jour ou un choc.","Dalle AMOLED défectueuse.","Remplacer l'écran ; vérifier une éventuelle prise en charge Samsung pour le modèle."],
   ["« Humidité détectée » dans le port","La charge filaire est bloquée.","Humidité ou saleté dans le port USB-C.","Sécher, nettoyer le port ; si le message persiste à sec, remplacer la sous-carte de charge."],
   ["Redémarrage en boucle sur le logo","Le logo Samsung revient sans fin.","Mise à jour ou stockage corrompu.","Recovery (wipe cache si disponible), sinon restauration par Smart Switch."],
   ["Batterie gonflée (anciens Galaxy)","Dos ou écran qui se soulève.","Batterie usée.","Remplacer immédiatement."],
   ["Tactile fantôme","Clics tout seuls.","Écran fissuré, protection mal posée.","Retirer la protection, remplacer l'écran."]]},
  "Apple iPhone":{models:"iPhone, iPad",tool:"Réglages → Confidentialité et sécurité → Analyses (panic logs) ; Diagnostics Apple via l'assistance Apple.",keys:"Redémarrage forcé : Volume +, Volume −, maintenir le bouton latéral.",faults:[
   ["Batterie « Service », extinctions","Coupures à 20–30 %, autonomie faible.","Batterie usée.","Remplacer la batterie."],
   ["Redémarre toutes les 3 minutes","Boucle régulière.","Capteur manquant (souvent nappe de charge ou batterie).","Lire le panic-full (« missing sensor ») et remplacer la pièce citée."],
   ["Face ID indisponible","Après une chute ou un contact avec l'eau.","Module TrueDepth endommagé.","Réparation par Apple ou un réparateur agréé (module apparié)."],
   ["Caméra qui tremble ou bourdonne","Image floue, bruit de la caméra arrière.","Stabilisateur optique endommagé (vibrations, chocs).","Remplacer le module caméra."],
   ["Pas de service","Recherche de réseau permanente.","SIM / eSIM, réglages, ou modem.","Réinitialiser les réglages réseau, tester une autre SIM ; sinon réparation carte."]]},
  "Xiaomi / Redmi / POCO":{models:"Redmi, Redmi Note, POCO, Xiaomi",tool:"Test CIT : *#*#6484#*#*.",keys:"Recovery : Power + Volume haut. Fastboot : Power + Volume bas.",faults:[
   ["Redémarrage en boucle après une mise à jour","Bloqué sur le logo MIUI / HyperOS.","Mise à jour interrompue ou corrompue.","Recovery → Wipe data, ou ROM officielle par Mi Flash Tool."],
   ["Mort subite, plus reconnu par le PC","S'éteint d'un coup et ne redémarre plus (cas connus sur certaines séries, ex. POCO X3 Pro).","Défaut de la carte mère (processeur ou mémoire).","Diagnostic au banc ; réparation carte ou remplacement de la carte mère."],
   ["Tactile fantôme","Clics ou défilements aléatoires.","Écran ou chargeur non conforme qui perturbe le tactile.","Tester sans chargeur, remplacer l'écran."],
   ["Surchauffe en charge rapide","Très chaud pendant la charge.","Charge rapide + usage simultané.","Chargeur d'origine, ne pas jouer en chargeant ; contrôler la batterie."],
   ["Compte Mi demandé après réinitialisation","Verrouillage de l'appareil.","Protection antivol liée au compte Mi.","Identifiants du propriétaire uniquement ; sinon refuser l'intervention."]]},
  "Huawei / Honor":{models:"P, Mate, Nova, Y, Honor",tool:"Appli Assistance (HiCare / My Honor) → Diagnostic ; HiSuite sur PC.",keys:"Recovery : Power + Volume haut. eRecovery : câble branché + Power + Volume haut.",faults:[
   ["Pas de services Google (Huawei)","Gmail, YouTube, Play Store absents.","Modèles Huawei sortis depuis 2019 : restriction, pas une panne.","AppGallery, Petal Search ; expliquer la limite au client avant achat ou réparation."],
   ["Bloqué sur le logo","Après une mise à jour.","Système corrompu.","eRecovery : récupérer la dernière version ; HiSuite."],
   ["Batterie gonflée (anciens P et Mate)","Écran qui se soulève.","Batterie usée.","Remplacer immédiatement."],
   ["Lignes sur l'écran","Après une chute.","Dalle.","Remplacer le bloc écran."]]},
  "Oppo / Realme / OnePlus":{models:"Reno, Find, Realme, Nord, OnePlus",tool:"*#899# (mode ingénieur Oppo/Realme), *#808# (OnePlus).",keys:"Recovery : Power + Volume bas.",faults:[
   ["Ligne verte sur l'écran (OnePlus)","Ligne verticale verte.","Dalle AMOLED (cas connus sur plusieurs séries OnePlus).","Remplacer l'écran ; vérifier une éventuelle prise en charge OnePlus."],
   ["Charge rapide absente","Charge lente.","Câble ou chargeur non d'origine (VOOC / SUPERVOOC / Warp exigent les leurs).","Utiliser le chargeur et le câble d'origine."],
   ["Bootloop après mise à jour","Logo en boucle.","Mise à jour corrompue.","Recovery → effacer les données ; mise à jour locale officielle."],
   ["Tactile qui ne répond plus en bas","Zone morte.","Dalle tactile.","Remplacer l'écran."]]},
  "Tecno / Infinix / itel":{models:"Spark, Camon, Pova, Hot, Note, Smart, A",tool:"Mode ingénieur MediaTek *#*#3646633#*#* (selon le modèle) ; centres Carlcare.",keys:"Recovery : Power + Volume haut.",faults:[
   ["Tactile fantôme ou écran qui ne répond plus","Clics tout seuls, zones mortes.","Écran fissuré ou dalle de remplacement de mauvaise qualité.","Remplacer le bloc écran par une pièce de qualité."],
   ["Port de charge usé","Charge intermittente.","Usure, poussière.","Nettoyer ; remplacer la sous-carte de charge."],
   ["Bootloop après mise à jour","Logo en boucle.","Mise à jour interrompue.","Recovery → Wipe data ; firmware officiel via Carlcare."],
   ["Compte Google demandé après réinitialisation (FRP)","Appareil verrouillé.","Protection antivol.","Identifiants du propriétaire ou preuve d'achat auprès de Carlcare ; jamais de contournement."],
   ["Batterie qui se vide vite","Autonomie faible.","Batterie usée ou appli en arrière-plan.","Vérifier les applis, remplacer la batterie."]]},
  "Google Pixel":{models:"Pixel, Pixel a, Pixel Pro, Fold",tool:"Paramètres → Système → Mode Réparation ; Pixel Repair / diagnostic Google.",keys:"Bootloader : Power + Volume bas.",faults:[
   ["Problèmes de batterie sur certains modèles","Extinctions, autonomie faible, gonflement.","Batterie : Google a lancé des programmes de remplacement pour certains modèles (ex. Pixel 4a, Pixel 6a).","Vérifier l'éligibilité sur le site d'assistance Google ; remplacer la batterie."],
   ["Réseau mobile instable","Pertes de réseau, appels coupés.","Modem ou mise à jour.","Installer les dernières mises à jour, réinitialiser les réglages réseau ; tester une autre SIM."],
   ["Lecteur d'empreinte lent","Déverrouillage peu fiable.","Lecteur sous l'écran sensible à la protection d'écran.","Protection compatible, réenregistrer l'empreinte, mettre à jour."]]},
  "Motorola":{models:"Moto G, Moto E, Edge, Razr",tool:"Appli Device Help ; Software Fix / Rescue and Smart Assistant sur PC.",keys:"Fastboot : Power + Volume bas.",faults:[
   ["Port de charge défaillant","Charge intermittente.","Usure.","Remplacer la sous-carte de charge."],
   ["Bootloop","Logo en boucle.","Système corrompu.","Software Fix sur PC."],
   ["Écran pliant marqué (Razr)","Pli ou lignes.","Dalle pliante.","Remplacement par Motorola ou réparateur agréé."]]}
 }
};

/* ---------- Pilotes ---------- */
/* Identifiants de fabricants (PCI VEN_ / USB VID_) les plus courants */
const VENDOR_IDS = {
 "8086":"Intel","8087":"Intel (Bluetooth)","1022":"AMD","1002":"AMD Radeon","10DE":"NVIDIA","10EC":"Realtek","0BDA":"Realtek (USB)",
 "14E4":"Broadcom","168C":"Qualcomm Atheros","17CB":"Qualcomm","0CF3":"Qualcomm Atheros (USB)","1969":"Qualcomm Atheros / Killer (Ethernet)",
 "14C3":"MediaTek","0E8D":"MediaTek (USB)","1B21":"ASMedia","1180":"Ricoh","1217":"O2 Micro","1814":"Ralink","13D3":"AzureWave",
 "04CA":"Lite-On","0489":"Foxconn","04F2":"Chicony (webcam)","5986":"Bison / Acer (webcam)","0C45":"Sonix (webcam)","30C9":"Luxvisions (webcam)",
 "06CB":"Synaptics","04F3":"ELAN","27C6":"Goodix (empreinte)","138A":"Synaptics / Validity (empreinte)","1C7A":"LighTuning (empreinte)",
 "046D":"Logitech","045E":"Microsoft","05AC":"Apple","04E8":"Samsung","18D1":"Google","2717":"Xiaomi","22D9":"Oppo / Realme / OnePlus",
 "12D1":"Huawei","05C6":"Qualcomm (téléphone, mode EDL)","1004":"LG","0FCE":"Sony","22B8":"Motorola","2A70":"OnePlus","1A86":"QinHeng (CH340, adaptateurs série)",
 "0403":"FTDI","067B":"Prolific","03F0":"HP","413C":"Dell","17EF":"Lenovo","0B05":"ASUS","04A9":"Canon","04B8":"Epson","04F9":"Brother"
};
/* Codes d'erreur du Gestionnaire de périphériques */
const PNP_CODES = {1:"mal configuré",3:"pilote endommagé ou mémoire insuffisante",10:"ne peut pas démarrer",12:"ressources insuffisantes",14:"redémarrage nécessaire",18:"pilote à réinstaller",19:"registre endommagé",21:"en cours de suppression",24:"absent ou mal installé",28:"pilote non installé",31:"pilote inadapté",32:"service du pilote désactivé",37:"le pilote n'a pas pu s'initialiser",39:"pilote endommagé ou absent",43:"signalé défaillant par le matériel",45:"débranché",48:"pilote bloqué (incompatible)",52:"signature du pilote invalide"};
/* Sources de pilotes hors connexion et pilotes USB des téléphones */
const DRIVER_SOURCES = [
 ["Packs de pilotes Dell (par modèle)","Archives CAB de tous les pilotes d'un modèle, pour installation hors connexion.","https://www.dell.com/support/kbdoc/000124139","Officiel"],
 ["Packs de pilotes HP (par modèle)","Tableau des « Driver Packs » HP pour les PC professionnels.","https://ftp.ext.hp.com/pub/caps-softpaq/cmit/HP_Driverpack_Matrix_x64.html","Officiel"],
 ["Packs de pilotes Lenovo (par modèle)","Packs SCCM complets par modèle ThinkPad, ThinkCentre, ThinkBook.","https://support.lenovo.com/solutions/ht074984","Officiel"],
 ["Catalogue Microsoft Update","Pilotes publiés via Windows Update, téléchargeables en .cab et installables hors connexion.","https://www.catalog.update.microsoft.com/","Officiel"],
 ["Snappy Driver Installer Origin","Logiciel libre avec packs de pilotes complets hors connexion (plusieurs dizaines de Go) : à mettre sur la clé. Créez un point de restauration avant.","https://www.glenn.delahoy.com/snappy-driver-installer-origin/","Libre"],
 ["Intel Driver & Support Assistant","Pilotes Intel à jour (connexion requise).","https://www.intel.com/content/www/us/en/support/detect.html","Officiel"]
];
const PHONE_DRIVERS = [
 ["Samsung USB Driver","Reconnaissance des Galaxy par Windows (transfert, ADB, Odin).","https://developer.samsung.com/android-usb-driver"],
 ["Google USB Driver","Pour Pixel et ADB / Fastboot.","https://developer.android.com/studio/run/win-usb"],
 ["Apple Devices (Windows)","Pilotes et gestion des iPhone et iPad sous Windows.","https://apps.microsoft.com/detail/9np83lwlpz9k"],
 ["Android Platform Tools","ADB et Fastboot officiels.","https://developer.android.com/tools/releases/platform-tools"],
 ["Autres marques","Xiaomi, Oppo, Tecno, Infinix, Motorola : les pilotes sont installés par l'outil officiel de la marque (Mi Flash Tool, Software Fix…) ou par Windows Update à la première connexion.","https://www.catalog.update.microsoft.com/"]
];
