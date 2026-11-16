# DiagLab Pro

Application de maintenance pour techniciens : diagnostic PC, Android, iPhone/iPad, réseau et imprimantes, fiches clients, rapport PC en un clic. Elle s'installe sur ordinateur, tablette et téléphone, et fonctionne hors connexion.

## Fonctions

- **Tableau de bord** : schéma de carte mère (téléphone et ordinateur) où les composants en panne s'allument.
- **Diagnostic guidé** (PC, Android, iPhone, réseau, imprimantes) et **Diagnostic téléphone** toutes marques avec plan de réparation.
- **Tests de l'appareil** : écran, tactile, son, micro, caméras, vibreur, capteurs, batterie, boutons, réseau, GPS.
- **Rapport PC** : diagnostic Windows en un clic (bouton intégré dans la version .exe).
- **Assistant IA** : base DiagLab hors connexion + Claude avec votre clé API Anthropic.
- **Académie** : 7 parcours (informatique, électronique, réseaux, CCNA 200-301, téléphones, imprimantes, NFC, IA), illustrations interactives, quiz, examen blanc CCNA, attestations.
- **Clé de secours** (Ventoy + Hiren's BootCD PE + menu de réparation) et **Pilotes** hors connexion (version .exe ; trousse autonome pour la clé).
- **Pannes par marque** : ordinateurs et téléphones, avec les outils de diagnostic des constructeurs.
- **Fiches clients**, checklist, FAQ, réinitialisations, **Systèmes & ISO** officiels avec vérification SHA-256, outils de boot, commandes, calculateurs.

## 1. Mettre l'application en ligne (une seule fois)

Pour être installable, l'application doit être servie en **HTTPS**. Deux options gratuites :

### Option A : Netlify Drop (la plus simple, 2 minutes)

1. Ouvrez https://app.netlify.com/drop dans un navigateur sur ordinateur.
2. Glissez-déposez le dossier `diaglab-pro` entier dans la page.
3. Netlify vous donne une adresse du type `https://nom-au-hasard.netlify.app`.
4. Créez un compte gratuit pour garder le site en ligne et choisir un nom (par exemple `diaglab-monatelier.netlify.app`).

### Option B : GitHub Pages

1. Créez un dépôt GitHub et envoyez-y le contenu du dossier `diaglab-pro`.
2. Settings → Pages → Source : branche `main`, dossier `/ (root)`.
3. L'adresse est `https://VOTRE-COMPTE.github.io/NOM-DU-DEPOT/`.

## 2. Installer sur chaque appareil

| Appareil | Navigateur | Comment |
|---|---|---|
| PC Windows, Mac, Linux | Chrome ou Edge | Icône d'installation à droite de la barre d'adresse, ou bouton « Installer l'application » dans DiagLab |
| Mac | Safari 17+ | Fichier → Ajouter au Dock |
| Android (téléphone, tablette) | Chrome, Samsung Internet, Edge | Bouton « Installer », ou menu ⋮ → Installer l'application |
| iPhone, iPad | Safari (ou Chrome/Edge depuis iOS 16.4) | Partager → Sur l'écran d'accueil |

Une fois ouverte une première fois, l'application fonctionne sans internet.

## 3. Mettre à jour

Remplacez les fichiers sur l'hébergement, puis changez la valeur `VERSION` en haut de `sw.js` (par exemple `diaglab-2.0.1`). Les appareils installés affichent « Nouvelle version disponible » et proposent de recharger.

## Version Windows (.exe)

Téléchargez la dernière version sur https://github.com/agricyril22-cpu/DiagLab-Pro/releases/latest :

- `DiagLab-Pro-Setup-x.y.z.exe` : installation avec raccourcis ;
- `DiagLab-Pro-Portable-x.y.z.exe` : sans installation, pour clé USB.

La version Windows ajoute le bouton **Analyser ce PC** (Rapport PC), qui lance le diagnostic et affiche le résultat dans l'application.

### Publier une nouvelle version .exe

1. Changez `version` dans `desktop/package.json` et `VERSION` dans `app.js` (même numéro, par exemple `2.2.0`).
2. Sur GitHub, Releases → **Draft a new release** : étiquette `v2.2.0` (créée à la publication), titre `DiagLab Pro v2.2.0`, puis **Publish release**.
3. GitHub compile les .exe sur un serveur Windows (environ 5 minutes) et les joint automatiquement à la version.

Pour tester sur un PC Windows avec Node.js : `cd desktop`, `npm install`, `npm start`.

## 4. Données

Les fiches clients, la checklist et les réglages sont enregistrés **sur chaque appareil**. Pour transférer ou sauvegarder : Fiches clients → Exporter les fiches (.json), puis Importer sur l'autre appareil.

## Contenu du dossier

| Fichier | Rôle |
|---|---|
| `index.html` | Page d'entrée de l'application |
| `app.js` | Navigation, fiches, Rapport PC et écrans de base |
| `board.js`, `tests.js`, `phone.js`, `ia.js`, `iso.js` | Tableau de bord, tests matériels, diagnostic téléphone, assistant IA, ISO |
| `data-plus.js` | Schémas de cartes, liens pannes → composants, liste des ISO officielles |
| `vendor/` | SDK Anthropic (licence MIT) utilisé par l'assistant IA |
| `data.js` | Base de connaissances : pannes, marques, réinitialisations, outils, FAQ. **C'est le fichier à enrichir.** |
| `style.css` | Apparence (thèmes clair et sombre) |
| `manifest.webmanifest` | Nom, icônes et raccourcis de l'application installée |
| `sw.js` | Fonctionnement hors connexion |
| `icons/` | Icônes et captures d'écran |
| `desktop/` | Application Windows (Electron) : `main.js`, `preload.js`, configuration de compilation |
| `.github/workflows/windows.yml` | Compilation automatique des .exe |
| `rescue.js`, `drivers.js`, `brands.js`, `data-faults.js` | Clé de secours, pilotes, pannes par marque |
| `desktop/tools.js` | Version Windows : Ventoy, copie sur clé, installation de pilotes |
| `outils/cle/` | Trousse copiée sur la clé : réparation, Rapport PC, pilotes, dossier PILOTES |
| `academy*.js` | Académie : moteur, contenus des cours, illustrations |
| `outils/` | Kit Rapport PC : `DiagLab-Rapport.ps1`, `Lancer-DiagLab.bat`, `DiagLab-Rapport.zip` |
