/* DiagLab Pro — base de connaissances
   prob : h = élevée, m = moyenne, l = faible
   Chaque cause : [prob, cause, test à faire, réparation] */

const DEVICES = {
  pc:{t:"Ordinateur",s:"PC fixe, portable, Mac"},
  android:{t:"Android",s:"Smartphones et tablettes"},
  iphone:{t:"iPhone / iPad",s:"iOS, iPadOS"},
  reseau:{t:"Réseau",s:"Box, routeur, Wi-Fi, câblage"},
  imprimante:{t:"Imprimante",s:"Jet d'encre, laser"}
};

const DIAG = {
 pc:{
  "Ne s'allume pas":[
   ["h","Alimentation / chargeur défectueux","Tester une autre prise et un autre câble secteur ; sur portable, le voyant du chargeur s'allume-t-il ? Mesurer la tension du bloc (19–20 V sur la plupart des portables, 5–20 V négociés en USB-C PD).","Remplacer le chargeur ou le bloc ATX. Tester l'alimentation ATX avec un testeur ou la méthode du trombone (PS_ON vert + masse noire)."],
   ["m","Électricité statique / carte bloquée","Débrancher tout, retirer la batterie si elle est amovible.","Maintenir le bouton Power 30 s, rebrancher le secteur seul et rallumer."],
   ["m","Bouton Power ou nappe défectueux","Sur PC fixe, court-circuiter les broches PWR_SW de la carte mère avec un tournevis.","Remplacer le bouton ou la nappe, réparer la connectique façade."],
   ["l","Carte mère en court-circuit","Odeur de brûlé, composant gonflé, chauffe localisée, consommation anormale à l'alimentation de labo.","Réparation micro-soudure (MOSFET, condensateurs) ou remplacement de la carte mère."]],
  "Allumé mais pas d'affichage":[
   ["h","RAM mal insérée ou défectueuse","Bips au démarrage ? Voyant DRAM ou code de débogage sur la carte mère ?","Retirer, nettoyer les contacts à la gomme, réinsérer barrette par barrette dans un seul slot. Sur DDR5, le premier démarrage peut durer 1 à 3 min (entraînement mémoire)."],
   ["m","Câble ou sortie vidéo","Tester une autre sortie (HDMI/DP) ; écran branché sur la carte graphique dédiée et non sur la carte mère ?","Changer le câble ; sur portable, tester un écran externe pour isoler la dalle."],
   ["m","Carte graphique","Tester avec la puce intégrée (retirer le GPU dédié) ; vérifier les connecteurs PCIe 8 broches ou 12V-2x6.","Réinstaller ou remplacer la carte ; vérifier que l'alimentation est suffisante."],
   ["l","BIOS corrompu","Ventilateurs qui tournent, aucun bip, après une mise à jour ratée.","Reset CMOS, puis BIOS Flashback (bouton dédié) ou reprogrammation de la puce au programmateur CH341A."]],
  "Écran bleu (BSOD)":[
   ["h","Pilote défectueux","Noter le code d'arrêt (ex. DRIVER_IRQL_NOT_LESS_OR_EQUAL) et le fichier .sys cité. Lire C:\\Windows\\Minidump avec BlueScreenView ou WinDbg.","Démarrer en mode sans échec, désinstaller ou rétrograder le pilote ; DDU pour le pilote graphique."],
   ["h","RAM instable","Codes MEMORY_MANAGEMENT, PAGE_FAULT_IN_NONPAGED_AREA.","MemTest86 (4 passes), désactiver XMP/EXPO, remplacer la barrette fautive."],
   ["m","Fichiers système corrompus","Codes CRITICAL_PROCESS_DIED, SYSTEM_SERVICE_EXCEPTION.","sfc /scannow puis DISM /Online /Cleanup-Image /RestoreHealth."],
   ["m","Disque en fin de vie","Codes KERNEL_DATA_INPAGE_ERROR, INACCESSIBLE_BOOT_DEVICE. Lire le SMART avec CrystalDiskInfo.","Cloner immédiatement les données, remplacer le disque."],
   ["l","Erreur matérielle CPU / carte mère","Code WHEA_UNCORRECTABLE_ERROR, événements WHEA-Logger dans l'Observateur.","Retirer tout overclocking, mettre à jour le BIOS, tester CPU et alimentation (OCCT)."]],
  "Lenteur extrême":[
   ["h","Disque dur mécanique saturé ou usé","Gestionnaire des tâches : disque à 100 % ? Santé SMART ?","Remplacer par un SSD, cloner avec Macrium Reflect ou Clonezilla."],
   ["m","Logiciels au démarrage / malware","Onglet Démarrage, Autoruns, scan Malwarebytes ou ESET Online Scanner.","Désactiver les programmes inutiles, désinfecter."],
   ["m","RAM insuffisante","Mémoire au-delà de 85 % en usage normal.","Ajouter de la RAM (8 Go minimum, 16 Go conseillé sous Windows 11)."],
   ["l","Throttling thermique","Fréquence CPU qui chute sous charge (HWiNFO).","Nettoyer, remplacer la pâte thermique."]],
  "Surchauffe / s'éteint seul":[
   ["h","Ventilation obstruée","Températures CPU/GPU au repos au-delà de 60 °C (HWiNFO, Core Temp).","Dépoussiérer à la bombe d'air en bloquant le ventilateur pendant le soufflage."],
   ["m","Pâte thermique sèche","Pics à 95–100 °C en quelques secondes de charge.","Remplacer la pâte thermique (et les pads GPU/VRM si besoin)."],
   ["m","Batterie ou alimentation faible","Extinction sous charge sans surchauffe ; événement Kernel-Power 41.","Tester sur secteur sans batterie, remplacer la batterie ou l'alimentation."],
   ["l","Ventilateur HS","Ventilateur qui ne tourne pas ou fait du bruit.","Remplacer le ventilateur."]],
  "Disque non détecté":[
   ["h","Câble ou SSD M.2 mal enfiché","Le disque apparaît-il dans le BIOS ? Changer de câble et de port SATA ; réinsérer le SSD M.2 et sa vis.","Rebrancher, remplacer le câble."],
   ["m","Contrôleur en mode RAID / VMD (Intel RST)","Disque visible dans le BIOS mais absent de l'installateur Windows.","Charger le pilote Intel RST/VMD pendant l'installation (« Charger un pilote »), ou passer en AHCI si aucun système n'est installé dessus."],
   ["m","Disque non initialisé ou sans lettre","Visible dans Gestion des disques (diskmgmt.msc) mais pas dans l'Explorateur.","Attribuer une lettre. S'il est « Non initialisé » et contient des données, ne pas l'initialiser : passer par TestDisk."],
   ["l","Disque mort","Inconnu du BIOS sur plusieurs machines, clics ou silence total.","Remplacer ; données importantes → laboratoire de récupération."]],
  "Wi-Fi absent ou inutilisable":[
   ["h","Mode avion ou touche Fn Wi-Fi","Icône avion, touche Fn + F2/F12 selon la marque.","Désactiver le mode avion."],
   ["m","Pilote manquant après réinstallation","Contrôleur réseau inconnu dans le Gestionnaire de périphériques.","Installer le pilote du constructeur (téléchargé sur un autre poste, ou via le partage de connexion USB d'un téléphone)."],
   ["m","Pile réseau corrompue","Réseaux visibles, connexion impossible.","netsh winsock reset, netsh int ip reset, puis Paramètres → Réseau → Réinitialisation du réseau."],
   ["l","Carte Wi-Fi ou antennes","Carte absente du Gestionnaire, ou signal très faible près de la box.","Reconnecter les antennes, remplacer la carte M.2 (certains anciens HP/Lenovo n'acceptent que les cartes de leur liste blanche BIOS)."]],
  "Clavier ou pavé tactile HS":[
   ["h","Pavé tactile désactivé","Paramètres → Bluetooth et appareils → Pavé tactile ; touche Fn dédiée.","Réactiver."],
   ["m","Pilote I2C HID / Serial IO","Erreur dans le Gestionnaire de périphériques, souvent après réinstallation.","Installer le pilote chipset / Serial IO du constructeur."],
   ["m","Liquide renversé","Touches collantes, répétées ou mortes.","Débrancher, sécher, nettoyer à l'alcool isopropylique ; remplacer le clavier."],
   ["l","Batterie gonflée sous le pavé","Pavé surélevé ou qui clique mal, coque déformée.","Retirer la batterie immédiatement (risque d'incendie) et la remplacer."]],
  "Mac ne démarre pas":[
   ["h","Batterie vide ou alimentation","Charger 30 min avec le chargeur d'origine.","Intel : réinitialiser le SMC. Apple Silicon : maintenir Power 10 s puis rallumer."],
   ["m","macOS endommagé","Dossier avec point d'interrogation ou barre de progression bloquée.","Récupération macOS → Utilitaire de disque (S.O.S.) puis Réinstaller macOS."],
   ["m","Firmware à raviver","Écran noir et aucun son (Apple Silicon ou puce T2).","Raviver puis, si besoin, Restaurer le firmware avec Apple Configurator depuis un autre Mac."],
   ["l","Carte logique","Aucune consommation au wattmètre USB-C.","Réparation carte ou service Apple."]],
  "Pas de son":[
   ["h","Mauvaise sortie sélectionnée","Vérifier le périphérique de sortie par défaut.","Choisir la bonne sortie, désactiver le mode exclusif."],
   ["m","Pilote audio","Point d'exclamation dans le Gestionnaire de périphériques.","Réinstaller le pilote Realtek ou constructeur."],
   ["l","Haut-parleurs / prise jack","Tester avec un casque.","Remplacer les haut-parleurs ou le connecteur."]]
 },
 android:{
  "Ne s'allume pas / ne charge pas":[
   ["h","Câble, chargeur ou port de charge encrassé","Tester un autre câble et chargeur ; inspecter le port à la lampe (peluches).","Nettoyer le port au cure-dent en bois ou en plastique, changer le câble."],
   ["m","Batterie profondément déchargée","Laisser charger 30 min avant de conclure ; mesurer le courant avec un testeur USB.","Puis appui long Power + Volume bas 15–20 s pour forcer le redémarrage."],
   ["m","Connecteur ou sous-carte de charge","Testeur USB à 0,0 A ou intermittent quand on bouge la prise.","Remplacer la sous-carte de charge."],
   ["l","Panne carte mère (PMIC, court-circuit)","Consommation anormale à l'alimentation de labo, point chaud (caméra thermique, colophane).","Réparation micro-soudure."]],
  "Bootloop (redémarre en boucle)":[
   ["h","Mise à jour ou appli corrompue","Le logo apparaît puis le téléphone redémarre.","Mode sans échec (maintenir Volume bas au démarrage), désinstaller l'appli récente ; vider la partition cache depuis le Recovery si elle existe."],
   ["m","Système corrompu ou stockage plein","Bootloop après saturation de la mémoire ou mise à jour interrompue.","Recovery → Wipe data (perte des données), ou reflasher le firmware officiel avec l'outil de la marque (voir la fiche marque)."],
   ["m","Batterie faible ou gonflée","Redémarre quand l'écran s'allume ; batterie bombée.","Remplacer la batterie."],
   ["l","Mémoire eMMC / UFS défaillante","Échecs répétés de flash, erreurs d'écriture.","Remplacement de la mémoire ou de la carte mère."]],
  "Batterie qui se vide vite":[
   ["h","Appli gourmande en arrière-plan","Paramètres → Batterie → utilisation par appli.","Restreindre ou désinstaller l'appli."],
   ["m","Batterie usée","Santé de la batterie dans Paramètres (Android 14+ sur de nombreux modèles) ; AccuBattery pour estimer la capacité.","Remplacer la batterie."],
   ["l","Mauvais signal réseau","Le modem consomme beaucoup en zone faible.","Préférer le Wi-Fi ; désactiver la 5G en zone mal couverte."]],
  "Pas de réseau / SIM non détectée":[
   ["h","SIM mal positionnée ou abîmée","Tester la SIM dans un autre téléphone.","Nettoyer, réinsérer, ou demander une nouvelle SIM à l'opérateur."],
   ["m","Réglages réseau / APN","Mode avion activé, APN vide.","Réinitialiser les paramètres réseau ; configurer l'APN de l'opérateur."],
   ["m","Téléphone bloqué opérateur","« SIM non valide » avec une SIM d'un autre opérateur.","Demander le déblocage officiel à l'opérateur d'origine."],
   ["l","IMEI perdu / modem défaillant","*#06# n'affiche pas d'IMEI ou affiche « null ».","Reflasher le firmware officiel ; sinon réparation carte (baseband)."]],
  "Écran cassé : récupérer les données":[
   ["h","Écran HS, téléphone fonctionnel","Il vibre et sonne à l'appel.","Câble USB-C vers HDMI (si le téléphone sort la vidéo), souris OTG, ou scrcpy si le débogage USB était activé."],
   ["m","Données déjà synchronisées","Compte Google ou compte de la marque actif.","Récupérer depuis Google Photos, Contacts, Samsung Cloud, ou un transfert Smart Switch."],
   ["l","Carte mère seule fonctionnelle","Bloc écran introuvable.","Brancher un écran de test compatible le temps de la sauvegarde."]],
  "Micro ou haut-parleur":[
   ["h","Grilles obstruées","Inspection à la lampe.","Brosse douce, pâte de nettoyage adhésive."],
   ["m","Bluetooth connecté à un autre appareil","Icône Bluetooth active.","Déconnecter l'accessoire."],
   ["m","Quel micro est en cause ?","Enregistrer un mémo vocal (micro du bas) puis une vidéo caméra arrière (micro du haut).","Remplacer la sous-carte de charge (elle porte souvent le micro principal) ou la nappe concernée."],
   ["l","Codec audio","Aucun son ni micro, même en Bluetooth.","Réparation carte."]],
  "Appareil photo ne marche pas":[
   ["h","Appli Appareil photo bloquée","Une autre appli photo fonctionne-t-elle ?","Vider le cache de l'appli Appareil photo, mettre à jour."],
   ["m","Lentille fissurée ou poussière","Image floue ou tache fixe.","Remplacer la vitre de l'objectif."],
   ["m","Module photo HS","Écran noir sur un seul capteur, confirmé par le test usine (voir codes de la fiche marque).","Remplacer le module."]],
  "Wi-Fi ou Bluetooth ne s'active pas":[
   ["h","Bug logiciel","Redémarrer ; tester en mode sans échec.","Réinitialiser les paramètres réseau."],
   ["m","Mise à jour défectueuse","Problème apparu après une mise à jour.","Installer le correctif suivant ou reflasher le firmware officiel."],
   ["l","Puce Wi-Fi / Bluetooth","Adresse MAC Wi-Fi « indisponible » dans À propos du téléphone.","Réparation carte."]],
  "Tactile ne répond pas":[
   ["h","Protection d'écran ou doigts humides","Retirer le verre trempé.","Nettoyer, retirer le film."],
   ["m","Nappe de l'écran déconnectée","Après une chute.","Réinsérer la nappe, remplacer le bloc écran."],
   ["l","Bug logiciel","Le tactile fonctionne-t-il en mode sans échec ?","Mise à jour ou réinitialisation."]],
  "Surchauffe":[
   ["h","Charge + usage intensif","Jeux, GPS pendant la charge.","Éviter, retirer la coque."],
   ["m","Appli malveillante ou en boucle","Chauffe au repos.","Mode sans échec, scan antivirus, désinstaller."],
   ["l","Court-circuit sur la carte","Chauffe même éteint.","Diagnostic au banc, micro-soudure."]]
 },
 iphone:{
  "Ne s'allume pas":[
   ["h","Batterie complètement vide","Charger 1 h avec un chargeur Apple ou certifié MFi.","Redémarrage forcé : Volume + (relâcher), Volume − (relâcher), maintenir le bouton latéral jusqu'au logo."],
   ["m","Port Lightning / USB-C encrassé","Inspection à la lampe.","Nettoyer délicatement, tester un autre câble."],
   ["m","Écran HS, iPhone fonctionnel","Il vibre et sonne, mais l'écran reste noir.","Tester avec un écran de test, remplacer l'écran."],
   ["l","Carte logique (Tristar/Hydra, PMIC)","Consommation anormale à l'alimentation de labo.","Réparation micro-soudure spécialisée."]],
  "Bloqué sur la pomme":[
   ["h","Mise à jour iOS interrompue","Reste sur le logo Apple.","Mode de récupération + Finder / Apple Devices → « Mettre à jour » (conserve les données)."],
   ["m","Système corrompu","La mise à jour échoue.","Mode DFU → Restaurer (efface les données)."],
   ["l","NAND / matériel","Erreurs 4013, 4014 ou 9 dans Finder / iTunes.","Diagnostic matériel, réparation carte."]],
  "Redémarre tout seul (toutes les 3 min)":[
   ["h","Capteur manquant détecté par iOS","Réglages → Confidentialité et sécurité → Analyses et améliorations → Données d'analyse : ouvrir le dernier « panic-full » et chercher « missing sensor(s) ».","Le capteur cité désigne la pièce : mic1, mic2 ou prs0 → nappe du connecteur de charge ; TG0B ou TG0V → batterie. Remplacer la pièce indiquée."],
   ["m","Batterie usée","État de la batterie sous 80 % ou mention « Service ».","Remplacer la batterie."],
   ["m","iOS corrompu","Panics variés sans capteur cité.","Mise à jour via Finder puis, si besoin, restauration DFU."]],
  "Ne charge pas":[
   ["h","Port encrassé","Peluches tassées au fond du port.","Nettoyer avec un outil non métallique."],
   ["m","Câble ou chargeur non certifié","Message « Accessoire non pris en charge ».","Utiliser un câble Apple ou certifié."],
   ["m","Recharge optimisée","Bloque à 80 %.","Normal : Réglages → Batterie → Charge."],
   ["l","Circuit de charge (Tristar/Hydra)","Aucune consommation au testeur USB.","Réparation carte."]],
  "Batterie qui se vide vite":[
   ["h","Batterie usée","Réglages → Batterie → État : capacité maximale sous 80 %.","Remplacer la batterie (pièce d'origine via Réparation en libre-service Apple ou atelier agréé)."],
   ["m","Actualisation en arrière-plan","Réglages → Batterie : appli dominante.","Limiter l'actualisation et la localisation."],
   ["l","Indexation après mise à jour","Dans les 48 h suivant une mise à jour iOS.","Normal, attendre 2 jours."]],
  "Face ID / Touch ID indisponible":[
   ["h","Capteur sale ou obstrué","Nettoyer la caméra TrueDepth ou le bouton.","Réenregistrer le visage ou l'empreinte."],
   ["m","Pièce non appariée après réparation","« Face ID indisponible » après changement d'écran ou de module.","Les capteurs biométriques sont appariés à la carte : passer par Apple, ou par l'Assistant de réparation des pièces (iOS 18+) avec des pièces d'origine."],
   ["l","Nappe endommagée","Après chute ou contact liquide.","Réparation du module."]],
  "Pas de service":[
   ["h","SIM / eSIM","Réglages → Données cellulaires : ligne active ?","Réinsérer la SIM, reconfigurer l'eSIM avec l'opérateur."],
   ["m","Réglages réseau","Problème apparu après une mise à jour.","Réglages → Général → Transférer ou réinitialiser → Réinitialiser les réglages réseau."],
   ["l","Modem / baseband","IMEI absent dans Réglages → Général → Informations.","Réparation carte logique."]],
  "Écran : lignes ou tactile fantôme":[
   ["h","Écran de remplacement de mauvaise qualité","Message « Pièce inconnue » dans Réglages → Général → Informations.","Remplacer par un écran d'origine ou de qualité équivalente."],
   ["m","Nappe d'écran mal connectée","Après une chute ou une réparation.","Reconnecter, remplacer l'écran."],
   ["l","Carte logique","Défaut identique avec un écran de test.","Réparation carte."]],
  "Pas de son / micro":[
   ["h","Mode silencieux ou Bluetooth","Bouton Action / interrupteur, accessoire Bluetooth connecté.","Désactiver, déconnecter l'accessoire."],
   ["m","Grilles obstruées","Inspection à la lampe.","Nettoyer à la brosse douce."],
   ["l","Codec audio","Haut-parleur grisé pendant les appels (iPhone 7 notamment).","Réparation carte."]]
 },
 reseau:{
  "Pas d'internet":[
   ["h","Box ou routeur bloqué","Voyants de la box : synchronisation DSL / fibre (ONT) correcte ?","Redémarrer la box et l'ONT, attendre 3 min."],
   ["m","Panne côté opérateur","Page d'état du fournisseur ou appli opérateur.","Contacter le support avec le relevé des voyants."],
   ["m","Problème DNS","ping 8.8.8.8 répond mais ping google.com échoue.","Changer de DNS (1.1.1.1, 8.8.8.8), ipconfig /flushdns."],
   ["l","IP en conflit / adresse automatique","Adresse en 169.254.x.x.","ipconfig /release puis /renew ; vérifier le DHCP de la box."]],
  "Wi-Fi lent ou instable":[
   ["h","Interférences / canal saturé","Analyser les canaux avec WiFi Analyzer ou inSSIDer.","Changer de canal (1, 6 ou 11 en 2,4 GHz), passer en 5 GHz ou 6 GHz (Wi-Fi 6E / 7)."],
   ["m","Distance / obstacles","Signal sous −70 dBm.","Répéteur, réseau mesh ou CPL."],
   ["l","Pilote Wi-Fi obsolète","Coupures sur un seul PC.","Mettre à jour le pilote, désactiver l'économie d'énergie de la carte."]],
  "Débit faible en câble":[
   ["h","Câble défectueux ou de mauvaise catégorie","Lien négocié à 100 Mb/s au lieu de 1 Gb/s.","Remplacer par un câble cat. 6, tester au testeur RJ45."],
   ["m","Port du switch","Erreurs CRC sur le port.","Changer de port ou de switch."],
   ["l","Duplex mal négocié","Paramètres avancés de la carte réseau.","Remettre la négociation en automatique."]],
  "Interface de la box inaccessible":[
   ["h","Mauvaise adresse","ipconfig : quelle est la passerelle par défaut ?","Ouvrir l'adresse de la passerelle (souvent 192.168.1.1 ou 192.168.0.1)."],
   ["m","IP fixe configurée sur le PC","Adresse hors du réseau de la box.","Repasser la carte réseau en DHCP automatique."],
   ["l","Mot de passe administrateur perdu","Identifiants refusés.","Reset de la box (bouton 10–15 s) puis identifiants de l'étiquette."]],
  "Imprimante réseau introuvable":[
   ["h","L'IP de l'imprimante a changé","Imprimer la page de configuration réseau.","Réserver une IP fixe dans le DHCP de la box."],
   ["m","Réseau différent / Wi-Fi invité","PC et imprimante ne sont pas sur le même réseau.","Connecter les deux au réseau principal."],
   ["l","Pare-feu / spouleur","Service Spouleur d'impression arrêté.","Redémarrer le service Spouleur."]]
 },
 imprimante:{
  "N'imprime pas / document bloqué":[
   ["h","File d'attente bloquée","Un document reste « en erreur » dans la file.","Arrêter le service Spouleur, vider C:\\Windows\\System32\\spool\\PRINTERS, redémarrer le service."],
   ["m","Imprimante hors ligne","Statut « Hors connexion » alors qu'elle est allumée.","Vérifier son IP (page de configuration), recréer le port TCP/IP, réserver l'IP dans la box."],
   ["m","Pilote inadapté","Erreurs après une mise à jour Windows.","Installer le pilote complet du constructeur ou le pilote universel (HP UPD, Brother, Canon Generic)."],
   ["l","Carte formatter / carte mère","Aucune page de test interne.","Réparation ou remplacement de la carte."]],
  "Impression pâle, rayée ou baveuse":[
   ["h","Buses bouchées (jet d'encre)","Imprimer le motif de vérification des buses.","Lancer 2 nettoyages maximum, attendre quelques heures, recommencer."],
   ["m","Toner bas ou tambour usé (laser)","Défaut répété à intervalle régulier sur la page.","L'écart entre deux défauts désigne le rouleau fautif (tambour, fixation, transfert) : voir la règle des défauts répétitifs du manuel de service."],
   ["l","Mauvais type de papier dans le pilote","Encre qui bave sur papier ordinaire.","Choisir le bon type de papier dans les préférences d'impression."]],
  "Bourrage papier":[
   ["h","Papier humide ou mal chargé","Ramette ouverte depuis longtemps, guides mal réglés.","Changer de papier, ajuster les guides, ne pas surcharger le bac."],
   ["m","Rouleaux d'entraînement usés","Le papier n'est pas pris ou plusieurs feuilles passent ensemble.","Nettoyer les rouleaux à l'eau, puis remplacer le kit de rouleaux."],
   ["l","Fragment coincé ou capteur","Bourrage signalé sans papier visible.","Chercher le morceau à la lampe ; nettoyer le capteur papier."]],
  "Erreur de cartouche":[
   ["h","Cartouche mal installée ou film non retiré","Bande de protection encore présente.","Retirer le film, réinsérer jusqu'au clic."],
   ["m","Contacts sales","Puce ou contacts encrassés.","Nettoyer les contacts au coton sec."],
   ["l","Cartouche compatible refusée","Refus après une mise à jour du firmware.","Utiliser une cartouche d'origine, ou une compatible dont la puce est à jour."]]
 }
};

/* Fiches marques Android : modes, codes et outils officiels.
   Les combinaisons varient selon le modèle et la version : vérifier le manuel. */
const BRANDS = {
 "Samsung":{rec:"Éteint, câble branché sur un PC : Power + Volume haut",dl:"Mode Download : éteint, maintenir Volume haut + Volume bas puis brancher le câble",code:"*#0*# (test écran, tactile, capteurs, haut-parleurs)",flash:"Smart Switch (restauration officielle) ; Odin avec le firmware du bon CSC",note:"Compte Samsung et protection FRP actifs après réinitialisation. Appli Samsung Members → Diagnostic du téléphone pour un test complet."},
 "Xiaomi / Redmi / POCO":{rec:"Power + Volume haut",dl:"Fastboot : Power + Volume bas",code:"*#*#6484#*#* (CIT, test matériel complet)",flash:"Mi Flash Tool avec la ROM Fastboot officielle du modèle",note:"Compte Mi lié à l'appareil : seul le propriétaire peut le retirer. Le déverrouillage du bootloader impose un délai d'attente."},
 "Google Pixel":{rec:"Power + Volume bas → Recovery mode → Power + Volume haut",dl:"Bootloader : Power + Volume bas",code:"Paramètres → Système → Mode Réparation (Android 14+), appli Diagnostic de l'appareil",flash:"Android Flash Tool officiel (flash.android.com) depuis Chrome",note:"Le Mode Réparation protège les données du client pendant l'intervention."},
 "Huawei / Honor":{rec:"Power + Volume haut (eRecovery : câble branché + Power + Volume haut)",dl:"Fastboot : câble branché + Power + Volume bas",code:"*#*#2846579#*#* (menu projet)",flash:"HiSuite (Huawei) ou Honor Suite : récupération du système",note:"Huawei récent : pas de services Google. Compte Huawei ID lié à l'appareil."},
 "Oppo / Realme / OnePlus":{rec:"Power + Volume bas",dl:"Fastboot depuis le menu du Recovery",code:"*#899# (mode ingénieur Oppo/Realme) ; *#808# (OnePlus)",flash:"Mise à jour locale du firmware officiel depuis le Recovery ; MSM Download Tool réservé aux centres de service",note:"Comptes HeyTap / OnePlus et FRP Google actifs après réinitialisation."},
 "Tecno / Infinix / itel":{rec:"Power + Volume haut",dl:"Mode préchargement MediaTek ou Unisoc via câble",code:"*#*#3646633#*#* (mode ingénieur MediaTek, selon le modèle)",flash:"Firmware officiel via le réseau Carlcare ; SP Flash Tool (MediaTek) ou ResearchDownload (Unisoc)",note:"Identifier la puce (MediaTek ou Unisoc) avant de choisir l'outil. FRP Google actif après réinitialisation."},
 "Motorola":{rec:"Power + Volume bas → Recovery mode",dl:"Fastboot : Power + Volume bas",code:"Appli Device Help → Diagnostic",flash:"Software Fix / Rescue and Smart Assistant (officiel Lenovo-Motorola)",note:"FRP Google actif après réinitialisation."},
 "Vivo":{rec:"Power + Volume haut",dl:"Fastboot : Power + Volume bas",code:"*#558# (mode ingénieur, selon le modèle)",flash:"Mise à jour officielle via le centre de service Vivo",note:"Compte Vivo et FRP Google actifs après réinitialisation."}
};

const IPHONE_MODES = [
 ["Redémarrage forcé (iPhone 8 et plus récents)","Volume + (relâcher), Volume − (relâcher), maintenir le bouton latéral jusqu'au logo Apple."],
 ["Mode de récupération","Câble branché au Mac/PC, même séquence, garder le bouton latéral jusqu'à l'écran câble + ordinateur."],
 ["Mode DFU","Volume +, Volume −, maintenir Latéral 10 s ; sans relâcher, ajouter Volume − 5 s ; relâcher Latéral et garder Volume − 10 s. L'écran reste noir."],
 ["iPad sans bouton principal","Volume le plus proche du bouton supérieur, puis l'autre, puis maintenir le bouton supérieur."],
 ["Historique des réparations","Réglages → Général → Informations → Historique des pièces et des réparations."]
];

const FAQ = [
 ["PC","Comment récupérer des données d'un disque qui ne démarre plus ?","Retirez le disque et branchez-le via un adaptateur USB-SATA/NVMe sur un autre PC, ou démarrez sur une clé live (Ventoy + Hiren's BootCD PE). Copiez d'abord les données. Si le disque fait des clics, arrêtez tout : chaque tentative aggrave les dégâts, orientez vers un laboratoire de récupération."],
 ["PC","Windows ne démarre plus après une mise à jour","Interrompez le démarrage 3 fois pour obtenir l'environnement de récupération (WinRE) → Dépannage → Options avancées → Désinstaller des mises à jour, ou Réparation du démarrage. En ligne de commande : bootrec /fixmbr, bootrec /fixboot, bootrec /rebuildbcd (ou bcdboot C:\\Windows pour l'UEFI)."],
 ["PC","Que signifie « No bootable device » ?","Le BIOS ne trouve pas de système. Vérifiez l'ordre de démarrage, le mode UEFI/Legacy (un Windows installé en UEFI ne démarre pas en Legacy), et que le disque apparaît dans le BIOS. S'il est absent : câble, connecteur, ou disque mort."],
 ["PC","Windows 11 refuse l'installation (TPM 2.0, Secure Boot)","Activez le TPM du processeur dans le BIOS (Intel PTT ou AMD fTPM) et le démarrage sécurisé. Sur du matériel trop ancien, Rufus propose de retirer ces exigences sur la clé d'installation ; la machine reste alors hors du cadre de support Microsoft."],
 ["PC","Windows 10 est-il encore utilisable ?","Le support de Windows 10 a pris fin le 14 octobre 2025. Sans abonnement aux mises à jour de sécurité étendues (ESU), il ne reçoit plus de correctifs. Proposez la migration vers Windows 11 si le PC est compatible, ou un remplacement."],
 ["PC","Comment vérifier la santé d'un disque ?","CrystalDiskInfo (Windows) ou smartctl -a /dev/sdX (Linux). Surveillez les secteurs réalloués, les secteurs en attente et le pourcentage d'usure du SSD. « Prudence » signifie : sauvegarder immédiatement."],
 ["PC","Bips au démarrage : comment les lire ?","Le code dépend du BIOS. AMI : 1 long + 2 courts = carte graphique ; 3 courts = RAM. Award : 1 long + 3 courts = vidéo ; bips longs répétés = RAM. Dell, HP et Lenovo utilisent leurs propres codes de bips ou de voyants, décrits dans le manuel de service du modèle."],
 ["PC","Windows indique « Non activé » après changement de carte mère","La licence numérique est liée au matériel. Connectez-vous avec le compte Microsoft lié, puis Paramètres → Activation → Résolution des problèmes → « J'ai changé de matériel »."],
 ["Mobile","Comment entrer en mode Recovery sur Android ?","Téléphone éteint, en général Power + Volume haut, ou Power + Volume bas puis le menu Recovery. La combinaison exacte par marque figure dans la fiche marque de l'onglet Diagnostic (Android)."],
 ["Mobile","Comment trouver l'IMEI ?","Composez *#06#. Il figure aussi sur le tiroir SIM ou la boîte. Vérifiez avec le calculateur IMEI qu'il est cohérent, et qu'un appareil d'occasion n'est pas déclaré volé auprès de l'opérateur avant toute intervention."],
 ["Mobile","Le téléphone est tombé dans l'eau","Éteignez-le immédiatement et ne le chargez pas. Le riz ne sert à rien. Ouvrez-le rapidement, déconnectez la batterie, nettoyez la carte à l'alcool isopropylique 99 % (bac à ultrasons idéalement) et séchez avant tout essai."],
 ["Mobile","Un téléphone récent n'est pas reconnu par le PC","Utilisez un câble de données (beaucoup de câbles ne font que la charge), choisissez « Transfert de fichiers » dans la notification USB, installez le pilote USB du constructeur. Pour ADB, acceptez l'empreinte RSA sur l'écran du téléphone."],
 ["Mobile","Diagnostiquer un modèle très récent (2025–2026)","Les pannes suivent les mêmes familles quel que soit le modèle : alimentation, écran, charge, réseau, logiciel. Commencez par le diagnostic par symptôme, puis utilisez le test usine de la marque (codes de la fiche marque) et l'appli de diagnostic officielle (Samsung Members, Mode Réparation Pixel, Diagnostic Apple)."],
 ["iPhone","Différence entre mode de récupération et DFU ?","Le mode de récupération passe par iBoot et permet de mettre à jour sans effacer. Le mode DFU contourne iBoot et sert à restaurer complètement quand la récupération échoue. Les deux se pilotent depuis Finder (macOS) ou Apple Devices / iTunes (Windows)."],
 ["iPhone","« Pièce inconnue » après une réparation","Depuis iOS 15.2, l'iPhone signale les écrans, batteries et caméras non d'origine. Depuis iOS 18, l'Assistant de réparation des pièces permet de calibrer les pièces Apple d'origine, y compris celles récupérées sur un autre iPhone."],
 ["iPhone","Lire un « panic log » d'iPhone","Réglages → Confidentialité et sécurité → Analyses et améliorations → Données d'analyse. Ouvrez le fichier « panic-full » le plus récent. La ligne « missing sensor(s) » ou le nom du processus fautif indique la pièce à contrôler."],
 ["iPhone","Que faire d'un iPhone avec Verrouillage d'activation ?","Seul le propriétaire peut le retirer (identifiant Apple, ou suppression à distance sur iCloud.com). Sinon, Apple peut le lever sur preuve d'achat via sa procédure officielle. Il n'existe pas de contournement légitime : un appareil verrouillé d'origine inconnue est à refuser."],
 ["Réseau","Comment trouver l'adresse IP de la box ?","Windows : ipconfig, ligne « Passerelle par défaut ». macOS/Linux : ip route ou netstat -nr. Le plus souvent 192.168.1.1 ou 192.168.0.1."],
 ["Réseau","Comment tester un câble réseau ?","Avec un testeur RJ45, les 8 voyants doivent s'allumer dans l'ordre. Sans testeur, regardez la vitesse négociée : 1 Gb/s attendu, 100 Mb/s signale souvent une paire coupée."],
 ["Réseau","Le réseau Wi-Fi 6 GHz n'apparaît pas","Il faut une carte Wi-Fi 6E ou 7, un pilote à jour, Windows 11 et le chiffrement WPA3 (obligatoire en 6 GHz)."],
 ["Réseau","Quel DNS choisir ?","Cloudflare 1.1.1.1 (rapide), Google 8.8.8.8, Quad9 9.9.9.9 (bloque les domaines malveillants)."],
 ["Imprimante","Une imprimante n'est plus détectée en Wi-Fi","Imprimez la page de configuration réseau, notez l'IP, réservez-la dans la box, puis ajoutez l'imprimante par son adresse IP plutôt que par la recherche automatique."]
];

const RESETS = [
 ["Windows 11 / 10","Ordinateur",["Paramètres → Système → Récupération → Réinitialiser ce PC.","Choisir « Conserver mes fichiers » ou « Supprimer tout ».","« Téléchargement cloud » si l'image locale est corrompue.","Si Windows ne démarre pas : Maj + Redémarrer depuis l'écran de connexion, ou 3 démarrages interrompus → WinRE → Dépannage → Réinitialiser ce PC.","Vérifier que la clé de récupération BitLocker est disponible avant de commencer."]],
 ["macOS (Apple Silicon / Intel T2)","Ordinateur",["Réglages Système → Général → Transférer ou réinitialiser → Effacer contenu et réglages.","Sinon, Apple Silicon : maintenir le bouton d'alimentation → Options → Utilitaire de disque. Intel : Cmd + R au démarrage.","Réinstaller macOS depuis la récupération.","Le propriétaire doit se déconnecter d'iCloud (Localiser) avant une revente."]],
 ["Chromebook","Ordinateur",["Powerwash : sur l'écran de connexion, Ctrl + Alt + Maj + R → Redémarrer → Powerwash.","Récupération : Échap + Actualiser + Power, puis clé USB créée avec l'extension Chromebook Recovery Utility.","Les appareils gérés par une école ou une entreprise se réinscrivent automatiquement."]],
 ["Android (général)","Mobile",["Sauvegarder les données et noter le compte Google.","Paramètres → Système → Options de réinitialisation → Effacer toutes les données.","Depuis le Recovery : Wipe data / factory reset.","Protection FRP : après réinitialisation, le compte Google précédent est demandé. Le client doit fournir ses identifiants ou retirer le compte avant l'intervention."]],
 ["Samsung Galaxy","Mobile",["Paramètres → Gestion globale → Réinitialisation → Réinitialiser toutes les données.","Recovery : éteint, câble USB branché sur un PC, Power + Volume haut.","Firmware : Smart Switch pour une restauration simple, ou Odin + firmware correspondant au CSC du pays."]],
 ["Xiaomi / Redmi / POCO","Mobile",["Paramètres → À propos du téléphone → Réinitialisation d'usine.","Recovery : Power + Volume haut → Wipe Data.","Firmware : Mi Flash Tool en mode Fastboot (Power + Volume bas) avec la ROM officielle du modèle. Le compte Mi doit être retiré par son propriétaire."]],
 ["Google Pixel","Mobile",["Paramètres → Système → Options de réinitialisation → Effacer toutes les données.","Recovery : Power + Volume bas → choisir Recovery mode ; à l'écran « No command », Power + Volume haut brièvement.","Firmware : Android Flash Tool (flash.android.com) depuis Chrome."]],
 ["Huawei / Honor","Mobile",["Paramètres → Système et mises à jour → Réinitialisation → Restaurer les paramètres d'usine.","eRecovery : câble branché, Power + Volume haut → Récupérer la dernière version ou Effacer les données.","Récupération sur PC avec HiSuite (Huawei) ou Honor Suite. Le compte Huawei ID reste lié à l'appareil."]],
 ["Oppo / Realme / OnePlus","Mobile",["Paramètres → Système → Sauvegarde et réinitialisation → Effacer toutes les données.","Recovery : Power + Volume bas, choisir la langue → Effacer les données.","Comptes HeyTap / OnePlus et compte Google à retirer par le propriétaire."]],
 ["Tecno / Infinix / itel","Mobile",["Paramètres → Système → Options de réinitialisation → Effacer toutes les données.","Recovery : Power + Volume haut → Wipe data / factory reset.","Firmware officiel via Carlcare ; outil selon la puce : SP Flash Tool (MediaTek) ou ResearchDownload (Unisoc)."]],
 ["Motorola","Mobile",["Paramètres → Système → Réinitialiser les options → Effacer toutes les données.","Recovery : Power + Volume bas → Recovery mode.","Firmware : Software Fix / Rescue and Smart Assistant sur PC."]],
 ["iPhone / iPad","Mobile",["Réglages → Général → Transférer ou réinitialiser → Effacer contenu et réglages.","Restauration via Mac/PC : mode de récupération (Volume +, Volume −, maintenir Latéral jusqu'à l'écran câble).","DFU pour une restauration complète (séquence détaillée dans l'onglet Diagnostic, iPhone / iPad).","Le Verrouillage d'activation reste actif : identifiant Apple du propriétaire requis."]],
 ["Box internet / routeur","Réseau",["Appuyer 10–15 s sur le bouton Reset avec un trombone, box allumée.","Attendre le redémarrage complet (2–5 min).","Se reconnecter avec les identifiants par défaut de l'étiquette.","Reconfigurer : mot de passe administrateur, Wi-Fi, redirections de ports."]],
 ["Switch manageable / point d'accès","Réseau",["Bouton Reset maintenu 10 à 30 s selon le modèle.","Accès par défaut : voir l'étiquette ou la documentation du constructeur.","Réimporter la sauvegarde de configuration si elle existe."]],
 ["Imprimante (HP, Epson, Canon, Brother)","Périphérique",["Menu Configuration → Restaurer les paramètres d'usine (ou seulement les paramètres réseau).","Brother : Menu → Configuration générale → Réinitialiser.","La méthode matérielle varie selon le modèle : consulter le manuel."]]
];

const BOOTTOOLS = [
 ["Rufus","Windows","Crée des clés USB bootables à partir d'ISO Windows ou Linux. Peut retirer l'exigence TPM / Secure Boot pour installer Windows 11 sur du matériel ancien.","https://rufus.ie","Gratuit · Open source"],
 ["Ventoy","Windows / Linux","Copiez plusieurs ISO sur une seule clé et choisissez au démarrage. L'outil multiboot de référence pour une trousse technicien.","https://www.ventoy.net","Gratuit · Open source"],
 ["Media Creation Tool","Windows","Outil officiel Microsoft pour créer une clé d'installation Windows 11.","https://www.microsoft.com/software-download/windows11","Officiel · Gratuit"],
 ["balenaEtcher","Win / Mac / Linux","Flash d'images ISO/IMG sur USB ou carte SD, très simple. Idéal pour Raspberry Pi.","https://etcher.balena.io","Gratuit"],
 ["Hiren's BootCD PE","ISO","Environnement Windows PE plein d'outils : récupération, partitionnement, diagnostic. À mettre sur Ventoy.","https://www.hirensbootcd.org","Gratuit"],
 ["MemTest86","ISO / USB","Test complet de la mémoire vive hors système.","https://www.memtest86.com","Gratuit (version de base)"],
 ["Clonezilla","ISO","Clonage et images disque, parfait pour migrer vers un SSD.","https://clonezilla.org","Gratuit · Open source"],
 ["GParted Live","ISO","Partitionnement avancé : redimensionner, réparer, convertir MBR/GPT.","https://gparted.org/livecd.php","Gratuit · Open source"],
 ["SystemRescue","ISO","Distribution Linux de dépannage : récupération de données (TestDisk, PhotoRec), réseau, systèmes de fichiers.","https://www.system-rescue.org","Gratuit · Open source"],
 ["Ubuntu Live","ISO","Démarrer un PC sans toucher au disque pour copier des données ou tester le matériel.","https://ubuntu.com/download/desktop","Gratuit"],
 ["Windows ADK / WinPE","Windows","Créer son propre WinPE personnalisé pour l'entreprise.","https://learn.microsoft.com/windows-hardware/get-started/adk-install","Officiel"],
 ["macOS (createinstallmedia)","macOS","Clé d'installation macOS depuis le Terminal avec l'installateur de l'App Store.","https://support.apple.com/101578","Officiel"]
];

const DIAGTOOLS = [
 ["CrystalDiskInfo","Santé SMART des disques","https://crystalmark.info"],
 ["HWiNFO","Inventaire matériel, températures, tensions","https://www.hwinfo.com"],
 ["CPU-Z / GPU-Z","Identification processeur, RAM, carte graphique","https://www.cpuid.com"],
 ["OCCT","Stress test CPU, GPU, alimentation","https://www.ocbase.com"],
 ["BlueScreenView","Lecture des minidumps d'écran bleu","https://www.nirsoft.net"],
 ["DDU (Display Driver Uninstaller)","Désinstallation propre des pilotes graphiques","https://www.guru3d.com"],
 ["LatencyMon","Coupures audio, micro-saccades, latence des pilotes","https://www.resplendence.com/latencymon"],
 ["Autoruns (Sysinternals)","Programmes au démarrage","https://learn.microsoft.com/sysinternals"],
 ["Malwarebytes","Désinfection","https://www.malwarebytes.com"],
 ["TestDisk / PhotoRec","Récupération de partitions et de fichiers","https://www.cgsecurity.org"],
 ["Advanced IP Scanner","Scan des appareils du réseau local","https://www.advanced-ip-scanner.com"],
 ["Wireshark","Analyse de trames réseau","https://www.wireshark.org"],
 ["3uTools","Infos iPhone, état batterie, flash iOS (Windows)","https://www.3u.com"],
 ["scrcpy","Afficher et piloter un Android depuis le PC (écran cassé)","https://github.com/Genymobile/scrcpy"],
 ["Android Platform Tools (ADB)","Commandes ADB / Fastboot officielles de Google","https://developer.android.com/tools/releases/platform-tools"],
 ["Samsung Members","Diagnostic intégré des Galaxy (Assistance → Diagnostic)","https://www.samsung.com/members/"],
 ["Apple Diagnostics","Test matériel intégré des Mac (touche D au démarrage)","https://support.apple.com/102550"]
];

const CMDS = [
 ["Windows · Réseau",[
  ["ipconfig /all","Afficher la configuration IP complète"],
  ["ipconfig /release && ipconfig /renew","Renouveler l'adresse DHCP"],
  ["ipconfig /flushdns","Vider le cache DNS"],
  ["ping -n 20 8.8.8.8","Tester la connectivité et la perte de paquets"],
  ["tracert google.com","Suivre le chemin vers un hôte"],
  ["netsh winsock reset","Réinitialiser la pile réseau (redémarrage requis)"],
  ["netsh int ip reset","Réinitialiser TCP/IP"],
  ["netsh wlan show profile name=\"NOM\" key=clear","Afficher le mot de passe d'un Wi-Fi enregistré sur ce PC"],
  ["nslookup google.com","Tester la résolution DNS"]]],
 ["Windows · Système",[
  ["sfc /scannow","Réparer les fichiers système"],
  ["DISM /Online /Cleanup-Image /RestoreHealth","Réparer l'image Windows"],
  ["chkdsk C: /f /r","Vérifier et réparer le disque"],
  ["powercfg /batteryreport","Rapport d'usure de la batterie (portable)"],
  ["wmic bios get serialnumber","Numéro de série du PC"],
  ["msinfo32","Informations système"],
  ["mdsched","Diagnostic mémoire Windows"],
  ["bcdboot C:\\Windows /s S: /f UEFI","Recréer le chargeur de démarrage UEFI"]]],
 ["Linux / macOS",[
  ["ip a","Interfaces et adresses"],
  ["sudo smartctl -a /dev/sda","Santé du disque"],
  ["lsblk -f","Disques et partitions"],
  ["dmesg -T | tail -50","Derniers messages du noyau"],
  ["system_profiler SPPowerDataType","État de la batterie (macOS)"]]],
 ["Android (ADB)",[
  ["adb devices","Lister les appareils connectés"],
  ["adb shell dumpsys battery","État de la batterie"],
  ["adb logcat","Journal système en direct"],
  ["adb reboot recovery","Redémarrer en Recovery"],
  ["adb reboot bootloader","Redémarrer en Fastboot"],
  ["adb shell getprop ro.product.model","Modèle exact"],
  ["adb pull /sdcard/DCIM ./sauvegarde","Récupérer les photos"]]]
];

const BIOS = [
 ["Reset CMOS (PC fixe)","Débrancher le secteur, retirer la pile CR2032 5 à 10 min, ou placer le cavalier CLR_CMOS / JBAT1. Efface le mot de passe superviseur sur la plupart des cartes mères grand public (ASUS, MSI, Gigabyte, ASRock)."],
 ["Portables professionnels (Dell, HP, Lenovo)","Le mot de passe superviseur est stocké dans une puce de sécurité, pas dans le CMOS. La procédure officielle passe par le support du constructeur avec le numéro de série et une preuve d'achat (Dell : support technique ; Lenovo : remplacement de la carte système ; HP : Sure Admin pour les parcs gérés)."],
 ["Mac avec mot de passe de firmware","Apple le retire en Apple Store ou en centre agréé sur présentation de la facture."],
 ["Mot de passe de session Windows oublié","Compte Microsoft : réinitialisation en ligne sur account.live.com. Compte local : questions de sécurité ou disque de réinitialisation. Les données chiffrées par BitLocker nécessitent la clé de récupération (aka.ms/myrecoverykey)."],
 ["BitLocker demande une clé au démarrage","Normal après une modification du BIOS, de la carte ou de l'ordre de démarrage. La clé à 48 chiffres se trouve sur le compte Microsoft du propriétaire, ou dans Entra ID / Active Directory en entreprise. Sans clé, les données sont irrécupérables."]
];

const CHECKLIST = [
 ["Accueil client",["Identité du client et coordonnées notées","Description de la panne par le client","État visuel noté (rayures, écran, chocs, oxydation)","IMEI / numéro de série relevé","Vérification que l'appareil n'est pas déclaré volé","Comptes retirés ou identifiants fournis par le propriétaire","Accord de devis signé"]],
 ["Avant intervention",["Sauvegarde des données effectuée ou refus signé","Bracelet antistatique en place","Batterie déconnectée avant ouverture","Photos de l'intérieur avant démontage"]],
 ["Tests de sortie",["Démarrage et écran","Tactile / clavier / pavé","Son, micro, haut-parleurs","Caméras","Wi-Fi, Bluetooth, réseau mobile","Charge et batterie","Capteurs (biométrie, proximité)","Températures sous charge"]],
 ["Restitution",["Nettoyage de l'appareil","Explication de l'intervention au client","Facture et garantie remises","Fiche d'intervention archivée"]]
];
