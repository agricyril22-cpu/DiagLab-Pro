// DiagLab Pro pour Windows : clé de secours (Ventoy, ISO, trousse) et pilotes hors connexion.
// Toutes les commandes sont fixes ; seuls des chemins choisis dans une boîte de dialogue
// et des numéros de disques USB revérifiés y sont insérés.
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { spawn } = require("child_process");

module.exports = function setupTools({ app, ipcMain, dialog, shell, net, getWin, OUTILS }) {
  const IS_WIN = process.platform === "win32";
  const PS = path.join(process.env.SystemRoot || "C:\\Windows", "System32", "WindowsPowerShell", "v1.0", "powershell.exe");
  const q = (s) => "'" + String(s).replace(/'/g, "''") + "'";
  const send = (d) => { const w = getWin(); if (w && !w.isDestroyed()) w.webContents.send("dl:progress", d); };
  const notWin = { ok: false, error: "Cette fonction n'est disponible que sous Windows." };
  let lastDisks = [];
  let current = null; // AbortController du téléchargement ou de la copie en cours

  function run(args) {
    return new Promise((resolve) => {
      const c = spawn(PS, args, { windowsHide: true });
      let out = "";
      c.stdout.on("data", (b) => { out += b.toString("utf8"); });
      c.on("error", () => resolve({ code: -1, out }));
      c.on("exit", (code) => resolve({ code, out }));
    });
  }
  async function psJson(cmd) {
    const r = await run(["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", "[Console]::OutputEncoding=[Text.Encoding]::UTF8; " + cmd]);
    const t = r.out.trim();
    if (!t) throw new Error("Aucune réponse de PowerShell.");
    return JSON.parse(t.slice(t.search(/[[{]/)));
  }
  // Exécute un script PowerShell en administrateur (fenêtre UAC) et attend la fin.
  async function elevated(build) {
    const dir = fs.mkdtempSync(path.join(app.getPath("temp"), "diaglab-"));
    const log = path.join(dir, "journal.txt");
    const file = path.join(dir, "tache.ps1");
    fs.writeFileSync(file, "\ufeff" + build(log, dir), "utf8");
    const cmd = "$p = Start-Process -FilePath " + q(PS) + " -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File'," + q('"' + file + '"') +
      " -Verb RunAs -WindowStyle Hidden -Wait -PassThru -ErrorAction Stop; exit $p.ExitCode";
    const r = await run(["-NoProfile", "-ExecutionPolicy", "Bypass", "-EncodedCommand", Buffer.from(cmd, "utf16le").toString("base64")]);
    const text = fs.existsSync(log) ? fs.readFileSync(log, "utf8").replace(/^\ufeff/, "") : null;
    return { code: r.code, log: text, cancelled: text === null, dir };
  }
  async function download(url, dest, task, signal) {
    const res = await net.fetch(url, { signal, headers: { "User-Agent": "DiagLab-Pro" } });
    if (!res.ok) throw new Error("Téléchargement refusé (" + res.status + ").");
    const total = Number(res.headers.get("content-length")) || 0;
    const out = fs.createWriteStream(dest);
    const reader = res.body.getReader();
    let done = 0, last = 0;
    try {
      for (;;) {
        const { done: end, value } = await reader.read();
        if (end) break;
        if (!out.write(Buffer.from(value))) await new Promise((r) => out.once("drain", r));
        done += value.length;
        if (Date.now() - last > 300) { last = Date.now(); send({ task, done, total, pct: total ? done / total * 100 : null }); }
      }
    } finally { await new Promise((r) => out.end(r)); }
    send({ task, done, total, pct: 100 });
  }
  async function copyFile(src, dest, task, signal) {
    const total = fs.statSync(src).size; let done = 0, last = 0;
    await new Promise((resolve, reject) => {
      const rs = fs.createReadStream(src, { highWaterMark: 4 * 1024 * 1024 });
      const ws = fs.createWriteStream(dest);
      const abort = () => { rs.destroy(); ws.destroy(); reject(new Error("annulé")); };
      if (signal) signal.addEventListener("abort", abort, { once: true });
      rs.on("data", (b) => { done += b.length; if (Date.now() - last > 300) { last = Date.now(); send({ task, file: path.basename(src), done, total, pct: done / total * 100 }); } });
      rs.on("error", reject); ws.on("error", reject); ws.on("finish", resolve);
      rs.pipe(ws);
    });
  }
  function findFile(dir, name) {
    if (!fs.existsSync(dir)) return null;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isFile() && e.name.toLowerCase() === name.toLowerCase()) return p;
    }
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory() && e.name.toLowerCase() !== "altexe") { const r = findFile(path.join(dir, e.name), name); if (r) return r; }
    }
    return null;
  }

  /* ---------------- Clés USB ---------------- */
  const LIST_USB = `$sys=$env:SystemDrive; $out=@()
foreach($d in @(Get-CimInstance Win32_DiskDrive | Where-Object { $_.InterfaceType -eq 'USB' })){
  $lds=@(); foreach($p in @(Get-CimAssociatedInstance -InputObject $d -ResultClassName Win32_DiskPartition)){ $lds+=@(Get-CimAssociatedInstance -InputObject $p -ResultClassName Win32_LogicalDisk) }
  $out+=[pscustomobject]@{ Index=[int]$d.Index; Model=[string]$d.Model; Size=[int64]$d.Size; Letters=@($lds|ForEach-Object{[string]$_.DeviceID}); Labels=@($lds|ForEach-Object{[string]$_.VolumeName}); Free=@($lds|ForEach-Object{[int64]$_.FreeSpace}); System=[bool]@($lds|Where-Object{$_.DeviceID -eq $sys}).Count }
}
ConvertTo-Json -InputObject @($out) -Depth 4 -Compress`;
  async function listUsb() {
    const l = await psJson(LIST_USB);
    lastDisks = (Array.isArray(l) ? l : [l]).filter((d) => d && !d.System).map((d) => ({
      ...d, Letters: [].concat(d.Letters || []), Labels: [].concat(d.Labels || []), Free: [].concat(d.Free || []),
      ventoy: [].concat(d.Labels || []).some((x) => /^ventoy$/i.test(x))
    }));
    return lastDisks;
  }
  const okLetter = (l) => /^[A-Za-z]:$/.test(String(l || ""));
  const ventoyLetter = (letter) => okLetter(letter) && lastDisks.find((d) => d.Letters.some((l, i) => l.toUpperCase() === String(letter).toUpperCase() && /^ventoy$/i.test(d.Labels[i] || "")));
  const usbLetter = (letter) => okLetter(letter) && lastDisks.find((d) => d.Letters.some((l) => l.toUpperCase() === String(letter).toUpperCase()));

  ipcMain.handle("usb:list", async () => {
    if (!IS_WIN) return notWin;
    try { return { ok: true, disks: await listUsb() }; } catch (e) { return { ok: false, error: "Lecture des disques impossible : " + e.message }; }
  });

  async function getVentoy() {
    const root = path.join(app.getPath("userData"), "ventoy");
    fs.mkdirSync(root, { recursive: true });
    let rel = null;
    send({ task: "ventoy", label: "Recherche de la dernière version de Ventoy…" });
    try {
      const r = await net.fetch("https://api.github.com/repos/ventoy/Ventoy/releases/latest", { headers: { "User-Agent": "DiagLab-Pro", "Accept": "application/vnd.github+json" } });
      if (r.ok) rel = await r.json();
    } catch (e) { /* hors connexion : version déjà téléchargée */ }
    if (!rel) {
      const vers = fs.readdirSync(root, { withFileTypes: true }).filter((e) => e.isDirectory() && findFile(path.join(root, e.name), "Ventoy2Disk.exe")).map((e) => e.name).sort();
      if (!vers.length) throw new Error("Pas de connexion et Ventoy n'a jamais été téléchargé.");
      return { exe: findFile(path.join(root, vers[vers.length - 1]), "Ventoy2Disk.exe"), ver: vers[vers.length - 1] };
    }
    const ver = String(rel.tag_name || "").replace(/^v/, "");
    const dir = path.join(root, ver);
    const have = findFile(dir, "Ventoy2Disk.exe");
    if (have) return { exe: have, ver };
    const asset = (rel.assets || []).find((a) => /windows\.zip$/i.test(a.name));
    if (!asset) throw new Error("Archive Windows de Ventoy introuvable dans la version " + ver + ".");
    const zip = path.join(root, asset.name);
    send({ task: "ventoy", label: "Téléchargement de Ventoy " + ver + "…" });
    current = new AbortController();
    await download(asset.browser_download_url, zip, "ventoy", current.signal);
    const shaAsset = (rel.assets || []).find((a) => /sha256/i.test(a.name));
    if (shaAsset) {
      const txt = await (await net.fetch(shaAsset.browser_download_url, { headers: { "User-Agent": "DiagLab-Pro" } })).text();
      const line = txt.split(/\r?\n/).find((l) => l.includes(asset.name));
      const want = line && line.trim().split(/\s+/)[0].toLowerCase();
      const got = crypto.createHash("sha256").update(fs.readFileSync(zip)).digest("hex");
      if (want && want !== got) { fs.rmSync(zip, { force: true }); throw new Error("Empreinte SHA-256 de Ventoy incorrecte : téléchargement corrompu, réessayez."); }
    }
    send({ task: "ventoy", label: "Décompression…" });
    const r = await run(["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", "Expand-Archive -LiteralPath " + q(zip) + " -DestinationPath " + q(dir) + " -Force"]);
    const exe = findFile(dir, "Ventoy2Disk.exe");
    if (r.code !== 0 || !exe) throw new Error("Décompression de Ventoy impossible.");
    return { exe, ver };
  }

  ipcMain.handle("usb:ventoy", async (_e, o) => {
    if (!IS_WIN) return notWin;
    try {
      const index = Number(o && o.index), update = !!(o && o.update);
      await listUsb();
      const disk = lastDisks.find((d) => d.Index === index);
      if (!Number.isInteger(index) || !disk) return { ok: false, error: "Clé introuvable : rebranchez-la puis relancez la recherche." };
      const { exe, ver } = await getVentoy();
      const exeDir = path.dirname(exe);
      for (const f of ["cli_done.txt", "cli_percent.txt", "cli_log.txt"]) fs.rmSync(path.join(exeDir, f), { force: true });
      const args = ["'VTOYCLI'", update ? "'/U'" : "'/I'", "'/PhyDrive:" + index + "'"].concat(!update && o.gpt ? ["'/GPT'"] : []);
      send({ task: "ventoy", label: (update ? "Mise à jour" : "Installation") + " de Ventoy " + ver + " sur " + disk.Model + "…", pct: 0 });
      const timer = setInterval(() => {
        try { const p = parseInt(fs.readFileSync(path.join(exeDir, "cli_percent.txt"), "utf8"), 10); if (p >= 0) send({ task: "ventoy", pct: p }); } catch (e) { }
      }, 700);
      const r = await elevated((log) => `$log = ${q(log)}
Set-Location -LiteralPath ${q(exeDir)}
$p = Start-Process -FilePath ${q(exe)} -ArgumentList ${args.join(",")} -Wait -PassThru
"code=$($p.ExitCode)" | Out-File -LiteralPath $log -Encoding utf8`);
      clearInterval(timer);
      if (r.cancelled) return { ok: false, error: "Opération annulée : les droits administrateur n'ont pas été accordés." };
      let done = null, detail = "";
      try { done = fs.readFileSync(path.join(exeDir, "cli_done.txt"), "utf8").trim(); } catch (e) { }
      try { detail = fs.readFileSync(path.join(exeDir, "cli_log.txt"), "utf8").split(/\r?\n/).filter(Boolean).slice(-6).join("\n"); } catch (e) { }
      await new Promise((res) => setTimeout(res, 3000));
      const disks = await listUsb();
      const okDisk = disks.find((d) => d.Index === index && d.ventoy);
      if (done === "0" || okDisk) return { ok: true, ver, disks };
      return { ok: false, error: "Ventoy a signalé un échec. Essayez l'interface Ventoy (bouton ci-dessous).", detail, disks };
    } catch (e) { return { ok: false, error: e.message }; }
    finally { current = null; }
  });

  ipcMain.handle("usb:ventoyGui", async () => {
    if (!IS_WIN) return notWin;
    try { const { exe } = await getVentoy(); const err = await shell.openPath(exe); return err ? { ok: false, error: err } : { ok: true }; }
    catch (e) { return { ok: false, error: e.message }; }
  });

  ipcMain.handle("usb:addIso", async (_e, o) => {
    if (!IS_WIN) return notWin;
    const disk = ventoyLetter(o && o.letter);
    if (!disk) return { ok: false, error: "Choisissez une clé Ventoy détectée." };
    const r = await dialog.showOpenDialog(getWin(), { title: "Ajouter des systèmes à la clé", properties: ["openFile", "multiSelections"], filters: [{ name: "Images de démarrage", extensions: ["iso", "img", "wim", "vhd", "vhdx", "efi"] }] });
    if (r.canceled || !r.filePaths.length) return { ok: false, cancelled: true };
    const need = r.filePaths.reduce((s, f) => s + fs.statSync(f).size, 0);
    const i = disk.Letters.findIndex((l) => l.toUpperCase() === o.letter.toUpperCase());
    if (need > (disk.Free[i] || 0)) return { ok: false, error: "Pas assez de place sur la clé pour ces fichiers." };
    current = new AbortController(); const copied = [];
    try {
      for (const f of r.filePaths) { await copyFile(f, path.join(o.letter + "\\", path.basename(f)), "iso", current.signal); copied.push(path.basename(f)); }
      return { ok: true, copied };
    } catch (e) { return { ok: false, error: e.message === "annulé" ? "Copie annulée." : "Copie impossible : " + e.message, copied }; }
    finally { current = null; }
  });

  ipcMain.handle("usb:hirens", async (_e, o) => {
    if (!IS_WIN) return notWin;
    const disk = ventoyLetter(o && o.letter);
    if (!disk) return { ok: false, error: "Choisissez une clé Ventoy détectée." };
    const dest = path.join(o.letter + "\\", "HBCD_PE_x64.iso");
    current = new AbortController();
    try { await download("https://www.hirensbootcd.org/files/HBCD_PE_x64.iso", dest, "hirens", current.signal); return { ok: true }; }
    catch (e) { fs.rmSync(dest, { force: true }); return { ok: false, error: current && current.signal.aborted ? "Téléchargement annulé." : "Téléchargement impossible : " + e.message }; }
    finally { current = null; }
  });

  ipcMain.handle("usb:kit", async (_e, o) => {
    if (!IS_WIN) return notWin;
    const disk = usbLetter(o && o.letter);
    if (!disk) return { ok: false, error: "Choisissez une clé USB détectée." };
    try {
      fs.cpSync(path.join(OUTILS, "cle"), o.letter + "\\", { recursive: true, force: true });
      let portable = false;
      const self = process.env.PORTABLE_EXECUTABLE_FILE;
      if (self && fs.existsSync(self)) { current = new AbortController(); await copyFile(self, path.join(o.letter + "\\", "DiagLab", "DiagLab-Pro-Portable.exe"), "kit", current.signal); portable = true; }
      return { ok: true, portable };
    } catch (e) { return { ok: false, error: "Copie de la trousse impossible : " + e.message }; }
    finally { current = null; }
  });

  ipcMain.handle("usb:cancel", () => { if (current) current.abort(); return true; });

  /* ---------------- Pilotes ---------------- */
  const SCAN = `$cs=Get-CimInstance Win32_ComputerSystem
$l=@(Get-CimInstance Win32_PnPEntity | Where-Object { $_.ConfigManagerErrorCode -ne 0 -and $_.ConfigManagerErrorCode -ne 22 } | ForEach-Object { [pscustomobject]@{ Name=[string]$_.Name; Class=[string]$_.PNPClass; Code=[int]$_.ConfigManagerErrorCode; Ids=@($_.HardwareID | ForEach-Object {[string]$_}); Instance=[string]$_.DeviceID } })
ConvertTo-Json -InputObject ([pscustomobject]@{ Manufacturer=[string]$cs.Manufacturer; Model=[string]$cs.Model; Total=@(Get-CimInstance Win32_PnPEntity).Count; Devices=@($l) }) -Depth 5 -Compress`;
  ipcMain.handle("drv:scan", async () => {
    if (!IS_WIN) return notWin;
    try { const r = await psJson(SCAN); r.Devices = [].concat(r.Devices || []).map((d) => ({ ...d, Ids: [].concat(d.Ids || []) })); return { ok: true, ...r }; }
    catch (e) { return { ok: false, error: "Analyse impossible : " + e.message }; }
  });

  ipcMain.handle("drv:install", async (_e, o) => {
    if (!IS_WIN) return notWin;
    const folder = o && o.mode === "folder";
    const r = await dialog.showOpenDialog(getWin(), folder
      ? { title: "Dossier de pilotes (clé USB, pack constructeur…)", properties: ["openDirectory"] }
      : { title: "Pilotes à installer", properties: ["openFile", "multiSelections"], filters: [{ name: "Pilotes", extensions: ["inf", "cab"] }] });
    if (r.canceled || !r.filePaths.length) return { ok: false, cancelled: true };
    const res = await elevated((log, dir) => {
      const lines = [`$log = ${q(log)}`, "& {"];
      if (folder) {
        lines.push(`  $src = ${q(r.filePaths[0])}`,
          "  foreach ($cab in @(Get-ChildItem -LiteralPath $src -Recurse -Filter *.cab -ErrorAction SilentlyContinue)) { $d = Join-Path $cab.DirectoryName ($cab.BaseName + '_extrait'); if (-not (Test-Path -LiteralPath $d)) { New-Item -ItemType Directory -Path $d | Out-Null; & expand.exe -F:* $cab.FullName $d | Out-Null } }",
          "  & pnputil.exe /add-driver (Join-Path $src '*.inf') /subdirs /install");
      } else {
        r.filePaths.forEach((f, i) => {
          if (/\.cab$/i.test(f)) lines.push(`  $d = ${q(path.join(dir, "cab" + i))}; New-Item -ItemType Directory -Path $d -Force | Out-Null; & expand.exe -F:* ${q(f)} $d | Out-Null; & pnputil.exe /add-driver (Join-Path $d '*.inf') /subdirs /install`);
          else lines.push(`  & pnputil.exe /add-driver ${q(f)} /install`);
        });
      }
      lines.push("  & pnputil.exe /scan-devices", "} *>&1 | Out-File -LiteralPath $log -Encoding utf8");
      return lines.join("\n");
    });
    if (res.cancelled) return { ok: false, error: "Installation annulée : les droits administrateur n'ont pas été accordés." };
    return { ok: true, log: res.log.split(/\r?\n/).filter((l) => l.trim()).slice(-40).join("\n") };
  });

  ipcMain.handle("drv:export", async () => {
    if (!IS_WIN) return notWin;
    const r = await dialog.showOpenDialog(getWin(), { title: "Où sauvegarder les pilotes de ce PC ? (dossier PILOTES de la clé)", properties: ["openDirectory", "createDirectory"] });
    if (r.canceled || !r.filePaths.length) return { ok: false, cancelled: true };
    const stamp = new Date().toISOString().slice(0, 10);
    const res = await elevated((log) => `$log = ${q(log)}
$m = ((Get-CimInstance Win32_ComputerSystem).Model -replace '[\\\\/:*?"<>|]', '_').Trim()
$dest = Join-Path ${q(r.filePaths[0])} ($m + '_' + ${q(stamp)})
New-Item -ItemType Directory -Path $dest -Force | Out-Null
& pnputil.exe /export-driver * $dest *>&1 | Out-Null
"dossier=$dest" | Out-File -LiteralPath $log -Encoding utf8
"nombre=$(@(Get-ChildItem -LiteralPath $dest -Recurse -Filter *.inf).Count)" | Out-File -LiteralPath $log -Append -Encoding utf8`);
    if (res.cancelled) return { ok: false, error: "Sauvegarde annulée : les droits administrateur n'ont pas été accordés." };
    const m = /dossier=(.*)/.exec(res.log), n = /nombre=(\d+)/.exec(res.log);
    return { ok: true, folder: m ? m[1].trim() : r.filePaths[0], count: n ? Number(n[1]) : 0 };
  });

  ipcMain.handle("drv:update", async () => { if (!IS_WIN) return notWin; await shell.openExternal("ms-settings:windowsupdate-optionalupdates"); return { ok: true }; });
};
