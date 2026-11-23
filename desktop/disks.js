// DiagLab Pro pour Windows : disques internes et externes (analyse, SMART, tests, réparation).
// Toutes les opérations passent par outils/cle/DiagLab/Disques/DiagLab-Disques.ps1, avec des
// paramètres revérifiés ici contre la dernière analyse (numéros de disque, lettres, disque système).
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

module.exports = function setupDisks({ app, ipcMain, dialog, shell, getWin, OUTILS }) {
  const IS_WIN = process.platform === "win32";
  const PS = path.join(process.env.SystemRoot || "C:\\Windows", "System32", "WindowsPowerShell", "v1.0", "powershell.exe");
  const SCRIPT = path.join(OUTILS, "cle", "DiagLab", "Disques", "DiagLab-Disques.ps1");
  const q = (s) => "'" + String(s).replace(/'/g, "''") + "'";
  const send = (d) => { const w = getWin(); if (w && !w.isDestroyed()) w.webContents.send("disk:progress", d); };
  const notWin = { ok: false, error: "Cette fonction n'est disponible que sous Windows." };
  let last = null;          // dernière analyse
  let job = null;           // opération longue en cours : { stop, child }

  function run(args, opts) {
    return new Promise((resolve) => {
      const c = spawn(opts && opts.exe || PS, args, { windowsHide: true });
      if (opts && opts.track) job = { child: c };
      let out = "";
      c.stdout && c.stdout.on("data", (b) => { out += b.toString("utf8"); if (opts && opts.onData) opts.onData(out); });
      c.on("error", () => resolve({ code: -1, out }));
      c.on("exit", (code) => resolve({ code, out }));
    });
  }
  // Lance le script en administrateur (fenêtre UAC) ; « extra » permet de suivre la progression.
  async function elevated(params, extra) {
    const dir = (extra && extra.dir) || fs.mkdtempSync(path.join(app.getPath("temp"), "diaglab-disk-"));
    const log = path.join(dir, "journal.txt");
    const wrapper = path.join(dir, "tache.ps1");
    fs.writeFileSync(wrapper, "\ufeff" + `& ${q(SCRIPT)} ${params} *>&1 | Out-File -LiteralPath ${q(log)} -Encoding utf8`, "utf8");
    const cmd = "$p = Start-Process -FilePath " + q(PS) + " -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File'," + q('"' + wrapper + '"') +
      " -Verb RunAs -WindowStyle Hidden -Wait -PassThru -ErrorAction Stop; exit $p.ExitCode";
    const r = await run(["-NoProfile", "-ExecutionPolicy", "Bypass", "-EncodedCommand", Buffer.from(cmd, "utf16le").toString("base64")]);
    const text = fs.existsSync(log) ? fs.readFileSync(log, "utf8").replace(/^\ufeff/, "") : null;
    return { code: r.code, log: text, cancelled: text === null, dir };
  }
  const tail = (t, n) => String(t || "").split(/\r?\n/).filter((l) => l.trim()).slice(-(n || 60)).join("\n");
  const errOf = (log) => { const m = /ERREUR : ([^\r\n]+)/.exec(log || ""); return m ? m[1] : null; };
  const findDisk = (n) => last && last.Disks.find((d) => d.Number === Number(n));
  const findVol = (l) => {
    const L = String(l || "").toUpperCase().replace(":", "");
    if (!/^[A-Z]$/.test(L) || !last) return null;
    for (const d of last.Disks) for (const v of d.Volumes) if (v.Letter === L) return { d, v, L };
    return null;
  };
  const denied = { ok: false, error: "Opération annulée : les droits administrateur n'ont pas été accordés." };
  const stale = { ok: false, error: "Disque ou volume introuvable : relancez l'analyse des disques." };

  ipcMain.handle("disk:analyse", async () => {
    if (!IS_WIN) return notWin;
    if (!fs.existsSync(SCRIPT)) return { ok: false, error: "Script de disques introuvable : réinstallez DiagLab Pro." };
    const dir = fs.mkdtempSync(path.join(app.getPath("temp"), "diaglab-disk-"));
    const out = path.join(dir, "analyse.json");
    send({ label: "Analyse des disques…", pct: null });
    const r = await elevated(`-Action Analyse -Out ${q(out)}`, { dir });
    if (r.cancelled) return denied;
    try {
      const data = JSON.parse(fs.readFileSync(out, "utf8").replace(/^\ufeff/, ""));
      data.Disks = [].concat(data.Disks || []).map((d) => ({ ...d, Volumes: [].concat(d.Volumes || []), Smart: d.Smart ? { ...d.Smart, Attrs: [].concat(d.Smart.Attrs || []) } : null }));
      last = data;
      return { ok: true, data };
    } catch (e) { return { ok: false, error: "Analyse impossible.", detail: tail(r.log, 20) }; }
  });

  ipcMain.handle("disk:surface", async (_e, o) => {
    if (!IS_WIN) return notWin;
    const d = findDisk(o && o.disk); if (!d) return stale;
    if (job) return { ok: false, error: "Une opération est déjà en cours." };
    const mode = o && o.mode === "full" ? "full" : "quick";
    const dir = fs.mkdtempSync(path.join(app.getPath("temp"), "diaglab-disk-"));
    const prog = path.join(dir, "progression.json"), stop = path.join(dir, "arret");
    job = { stop };
    const timer = setInterval(() => {
      try { const p = JSON.parse(fs.readFileSync(prog, "utf8").replace(/^\ufeff/, "")); send({ disk: d.Number, ...p, label: `Test de surface ${mode === "full" ? "complet" : "rapide"} : ${d.Model}` }); } catch (e) { }
    }, 1000);
    try {
      const r = await elevated(`-Action Surface -Disk ${d.Number} -Mode ${mode} -Out ${q(prog)} -Stop ${q(stop)}`, { dir });
      if (r.cancelled) return denied;
      if (errOf(r.log)) return { ok: false, error: errOf(r.log) };
      const fin = JSON.parse(fs.readFileSync(prog, "utf8").replace(/^\ufeff/, ""));
      return { ok: true, result: { ...fin, Zones: [].concat(fin.Zones || []) }, mode, disk: d.Number };
    } catch (e) { return { ok: false, error: "Le test n'a pas pu se terminer : " + e.message }; }
    finally { clearInterval(timer); job = null; }
  });

  ipcMain.handle("disk:cancel", () => {
    if (!job) return false;
    if (job.stop) fs.writeFileSync(job.stop, "1");
    if (job.child) job.child.kill();
    return true;
  });

  ipcMain.handle("disk:chkdsk", async (_e, o) => {
    if (!IS_WIN) return notWin;
    const f = findVol(o && o.letter); if (!f) return stale;
    const fix = !!(o && o.fix), surf = !!(o && o.surface);
    if (fix && f.d.System) return { ok: false, error: "Réparation refusée sur le disque système depuis Windows : utilisez la clé de secours." };
    send({ label: `CHKDSK ${f.L}: ${fix ? "réparation" : "vérification"}…`, pct: null });
    const r = await elevated(`-Action Chkdsk -Letter ${f.L}${fix ? " -Fix" : ""}${fix && surf ? " -Scan" : ""}`);
    if (r.cancelled) return denied;
    if (errOf(r.log)) return { ok: false, error: errOf(r.log) };
    const code = Number((/CODE=(-?\d+)/.exec(r.log) || [])[1]);
    return { ok: true, code, log: tail(r.log, 40) };
  });

  ipcMain.handle("disk:speed", async (_e, o) => {
    if (!IS_WIN) return notWin;
    const f = findVol(o && o.letter); if (!f) return stale;
    send({ label: `Mesure de vitesse de ${f.L}: (environ 1 minute)…`, pct: null });
    const r = await elevated(`-Action Speed -Letter ${f.L}`);
    if (r.cancelled) return denied;
    const val = (k) => { const m = new RegExp(k + "=([\\d.]+)").exec(r.log || ""); return m ? Number(m[1]) : null; };
    return { ok: true, seqRead: val("SEQREAD"), seqWrite: val("SEQWRITE"), ranRead: val("RANREAD"), log: tail(r.log, 10) };
  });

  ipcMain.handle("disk:fixdisk", async (_e, o) => {
    if (!IS_WIN) return notWin;
    const d = findDisk(o && o.disk); if (!d) return stale;
    const action = o && o.what === "readonly" ? "ReadWrite" : "Online";
    const r = await elevated(`-Action ${action} -Disk ${d.Number}`);
    if (r.cancelled) return denied;
    return { ok: true, log: tail(r.log, 10) };
  });

  ipcMain.handle("disk:letter", async (_e, o) => {
    if (!IS_WIN) return notWin;
    const d = findDisk(o && o.disk); if (!d) return stale;
    const v = d.Volumes.find((x) => x.Partition === Number(o && o.partition)); if (!v) return stale;
    const r = await elevated(`-Action Letter -Disk ${d.Number} -Partition ${v.Partition}`);
    if (r.cancelled) return denied;
    const m = /LETTRE=([A-Z])/i.exec(r.log || "");
    return m ? { ok: true, letter: m[1].toUpperCase() } : { ok: false, error: "Aucune lettre attribuée.", detail: tail(r.log, 10) };
  });

  ipcMain.handle("disk:format", async (_e, o) => {
    if (!IS_WIN) return notWin;
    const f = findVol(o && o.letter); if (!f) return stale;
    if (f.d.System) return { ok: false, error: "Formatage refusé sur le disque système." };
    const fsType = ["exFAT", "NTFS", "FAT32"].includes(o && o.fs) ? o.fs : "exFAT";
    const label = String((o && o.label) || "DONNEES").replace(/[^\w \-]/g, "").slice(0, 32) || "DONNEES";
    const r = await elevated(`-Action Format -Letter ${f.L} -FileSystem ${fsType} -Label ${q(label)}`);
    if (r.cancelled) return denied;
    if (errOf(r.log)) return { ok: false, error: errOf(r.log) };
    return { ok: true, log: tail(r.log, 10) };
  });

  ipcMain.handle("disk:eject", async (_e, o) => {
    if (!IS_WIN) return notWin;
    const f = findVol(o && o.letter); if (!f) return stale;
    if (f.d.System) return { ok: false, error: "Le disque système ne peut pas être éjecté." };
    await run(["-NoProfile", "-Command", `(New-Object -ComObject Shell.Application).Namespace(17).ParseName('${f.L}:').InvokeVerb('Eject')`]);
    return { ok: true };
  });

  ipcMain.handle("disk:copy", async (_e, o) => {
    if (!IS_WIN) return notWin;
    const f = findVol(o && o.letter); if (!f) return stale;
    if (job) return { ok: false, error: "Une opération est déjà en cours." };
    const r = await dialog.showOpenDialog(getWin(), { title: `Où copier les données de ${f.L}: ?`, properties: ["openDirectory", "createDirectory"] });
    if (r.canceled || !r.filePaths.length) return { ok: false, cancelled: true };
    const dest = path.join(r.filePaths[0], `Sauvegarde_${f.L}_${new Date().toISOString().slice(0, 10)}`);
    if (dest.toUpperCase().startsWith(f.L + ":")) return { ok: false, error: "Choisissez une destination sur un autre disque." };
    send({ label: `Copie de ${f.L}: vers ${dest}…`, pct: null });
    let n = 0, lastSend = 0;
    const res = await run([`${f.L}:\\`, dest, "/E", "/XJ", "/R:1", "/W:1", "/NP", "/NDL", "/XD", "System Volume Information", "$RECYCLE.BIN"],
      { exe: "robocopy.exe", track: true, onData: (out) => { n = out.split(/\r?\n/).length; if (Date.now() - lastSend > 1000) { lastSend = Date.now(); send({ label: `Copie en cours : environ ${n} fichier(s) traité(s)…`, pct: null }); } } });
    job = null;
    const ok = res.code >= 0 && res.code < 8; // robocopy : 0–7 = réussite, 8 et plus = échecs
    return { ok, dest, code: res.code, log: tail(res.out, 14), error: ok ? null : "Certains fichiers n'ont pas pu être copiés (code " + res.code + ") : secteurs illisibles probables." };
  });

  ipcMain.handle("disk:mgmt", () => { if (!IS_WIN) return notWin; spawn("mmc.exe", ["diskmgmt.msc"], { detached: true, stdio: "ignore" }).unref(); return { ok: true }; });
};
