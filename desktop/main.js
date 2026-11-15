// DiagLab Pro pour Windows : fenêtre de l'application et lancement du diagnostic PC.
const { app, BrowserWindow, protocol, net, shell, ipcMain, dialog, Menu } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const { pathToFileURL } = require("url");

const WEB = path.join(__dirname, "web");
const OUTILS = app.isPackaged ? path.join(process.resourcesPath, "outils") : path.join(WEB, "outils");
const SCRIPT = app.isPackaged
  ? path.join(process.resourcesPath, "outils", "DiagLab-Rapport.ps1")
  : path.join(WEB, "outils", "DiagLab-Rapport.ps1");

protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }
]);

if (!app.requestSingleInstanceLock()) app.quit();

let win = null;
let lastReport = null;
let running = false;

function createWindow() {
  win = new BrowserWindow({
    width: 1280, height: 860, minWidth: 380, minHeight: 500,
    title: "DiagLab Pro",
    icon: path.join(WEB, "icons", "icon-512.png"),
    backgroundColor: "#0f151b",
    autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, "preload.js"), contextIsolation: true, sandbox: true, nodeIntegration: false }
  });
  win.loadURL("app://diaglab/index.html");
  // Boutons « précédent / suivant » de la souris et des claviers multimédias.
  win.on("app-command", (_e, cmd) => {
    const h = win.webContents.navigationHistory;
    if (cmd === "browser-backward" && h.canGoBack()) h.goBack();
    if (cmd === "browser-forward" && h.canGoForward()) h.goForward();
  });
  // Liens externes : navigateur par défaut ; jamais de navigation hors de l'application.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (e, url) => {
    if (!url.startsWith("app://diaglab/")) {
      e.preventDefault();
      if (/^https?:\/\//.test(url)) shell.openExternal(url);
    }
  });
}

app.on("second-instance", () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  const { session } = require("electron");
  const allowed = new Set(["media", "clipboard-sanitized-write", "fullscreen", "geolocation"]);
  session.defaultSession.setPermissionRequestHandler((wc, perm, cb, details) => cb(allowed.has(perm) && String(details.requestingUrl || "").startsWith("app://diaglab/")));
  protocol.handle("app", (req) => {
    let p = decodeURIComponent(new URL(req.url).pathname);
    if (p === "/" || p === "") p = "/index.html";
    const file = path.normalize(path.join(WEB, p));
    if (!file.startsWith(WEB + path.sep)) return new Response("Accès refusé", { status: 403 });
    return net.fetch(pathToFileURL(file).toString());
  });
  createWindow();
});
app.on("window-all-closed", () => app.quit());

ipcMain.on("app:version", (e) => { e.returnValue = app.getVersion(); });
require("./tools")({ app, ipcMain, dialog, shell, net, getWin: () => win, OUTILS });

function run(cmd, args) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { windowsHide: true });
    child.on("error", () => resolve(-1));
    child.on("exit", (code) => resolve(code));
  });
}

ipcMain.handle("report:run", async (_e, opts) => {
  if (process.platform !== "win32") return { ok: false, error: "L'analyse du PC n'est disponible que sous Windows." };
  if (running) return { ok: false, error: "Une analyse est déjà en cours." };
  if (!fs.existsSync(SCRIPT)) return { ok: false, error: "Script de diagnostic introuvable : réinstallez DiagLab Pro." };
  running = true;
  try {
    const dir = fs.mkdtempSync(path.join(app.getPath("temp"), "diaglab-"));
    const psArgs = ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", SCRIPT, "-Dossier", dir, "-NePasOuvrir"];
    if (opts && opts.complet) psArgs.push("-Complet");
    const ps = path.join(process.env.SystemRoot || "C:\\Windows", "System32", "WindowsPowerShell", "v1.0", "powershell.exe");
    if (opts && opts.admin) {
      // Relance élevée (fenêtre UAC) puis attente de la fin de l'analyse.
      const q = (s) => "'" + String(s).replace(/'/g, "''") + "'";
      const list = psArgs.map((a) => q(/\s/.test(a) ? '"' + a + '"' : a)).join(",");
      const cmd = "$p = Start-Process -FilePath " + q(ps) + " -ArgumentList " + list +
        " -Verb RunAs -WindowStyle Hidden -Wait -PassThru -ErrorAction Stop; exit $p.ExitCode";
      await run(ps, ["-NoProfile", "-ExecutionPolicy", "Bypass", "-EncodedCommand", Buffer.from(cmd, "utf16le").toString("base64")]);
    } else {
      await run(ps, psArgs);
    }
    const json = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => path.join(dir, f))[0];
    if (!json) {
      return { ok: false, error: opts && opts.admin
        ? "Analyse annulée : les droits administrateur n'ont pas été accordés. Acceptez la fenêtre Windows, ou décochez « Avec droits administrateur »."
        : "L'analyse n'a pas produit de rapport. Réessayez, ou lancez le kit Rapport PC manuellement." };
    }
    const data = JSON.parse(fs.readFileSync(json, "utf8").replace(/^\uFEFF/, ""));
    lastReport = { json, html: json.replace(/\.json$/, ".html") };
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: "Erreur pendant l'analyse : " + (err && err.message ? err.message : String(err)) };
  } finally {
    running = false;
  }
});

ipcMain.handle("report:open", async () => {
  if (!lastReport || !fs.existsSync(lastReport.html)) return false;
  const err = await shell.openPath(lastReport.html);
  return !err;
});

ipcMain.handle("report:save", async () => {
  if (!lastReport || !fs.existsSync(lastReport.html)) return null;
  const r = await dialog.showSaveDialog(win, {
    title: "Enregistrer le rapport",
    defaultPath: path.join(app.getPath("desktop"), path.basename(lastReport.html)),
    filters: [{ name: "Rapport HTML", extensions: ["html"] }]
  });
  if (r.canceled || !r.filePath) return null;
  fs.copyFileSync(lastReport.html, r.filePath);
  fs.copyFileSync(lastReport.json, r.filePath.replace(/\.html?$/i, "") + ".json");
  return r.filePath;
});
