# DiagLab Pro

Application de maintenance pour techniciens : diagnostic PC, Android, iPhone/iPad, réseau et imprimantes, fiches clients, rapport PC en un clic. Elle s'installe sur ordinateur, tablette et téléphone, et fonctionne hors connexion.

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

## 4. Données

Les fiches clients, la checklist et les réglages sont enregistrés **sur chaque appareil**. Pour transférer ou sauvegarder : Fiches clients → Exporter les fiches (.json), puis Importer sur l'autre appareil.

## Contenu du dossier

| Fichier | Rôle |
|---|---|
| `index.html` | Page d'entrée de l'application |
| `app.js` | Logique de l'application |
| `data.js` | Base de connaissances : pannes, marques, réinitialisations, outils, FAQ. **C'est le fichier à enrichir.** |
| `style.css` | Apparence (thèmes clair et sombre) |
| `manifest.webmanifest` | Nom, icônes et raccourcis de l'application installée |
| `sw.js` | Fonctionnement hors connexion |
| `icons/` | Icônes et captures d'écran |
| `outils/` | Kit Rapport PC : `DiagLab-Rapport.ps1`, `Lancer-DiagLab.bat`, `DiagLab-Rapport.zip` |
