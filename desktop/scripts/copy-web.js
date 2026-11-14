// Copie l'application web (dossier parent) dans desktop/web avant le lancement ou la compilation.
const fs = require("fs");
const path = require("path");
const src = path.resolve(__dirname, "..", "..");
const dst = path.resolve(__dirname, "..", "web");
const items = ["index.html", "app.js", "data.js", "data-plus.js", "board.js", "tests.js", "phone.js", "ia.js", "iso.js", "style.css", "manifest.webmanifest", "icons", "outils", "vendor"];
fs.rmSync(dst, { recursive: true, force: true });
fs.mkdirSync(dst, { recursive: true });
for (const it of items) fs.cpSync(path.join(src, it), path.join(dst, it), { recursive: true });
console.log("Application web copiée dans", dst);
