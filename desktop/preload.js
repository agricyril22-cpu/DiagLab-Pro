// Pont sécurisé entre l'interface et Windows : seules ces fonctions sont exposées.
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("diaglab", {
  desktop: true,
  version: ipcRenderer.sendSync("app:version"),
  runReport: (opts) => ipcRenderer.invoke("report:run", { admin: !!(opts && opts.admin), complet: !!(opts && opts.complet) }),
  openReport: () => ipcRenderer.invoke("report:open"),
  saveReport: () => ipcRenderer.invoke("report:save"),
  usb: {
    list: () => ipcRenderer.invoke("usb:list"),
    ventoy: (index, opts) => ipcRenderer.invoke("usb:ventoy", { index: Number(index), gpt: !!(opts && opts.gpt), update: !!(opts && opts.update) }),
    ventoyGui: () => ipcRenderer.invoke("usb:ventoyGui"),
    addIso: (letter) => ipcRenderer.invoke("usb:addIso", { letter: String(letter) }),
    hirens: (letter) => ipcRenderer.invoke("usb:hirens", { letter: String(letter) }),
    kit: (letter) => ipcRenderer.invoke("usb:kit", { letter: String(letter) }),
    cancel: () => ipcRenderer.invoke("usb:cancel")
  },
  drivers: {
    scan: () => ipcRenderer.invoke("drv:scan"),
    install: (mode) => ipcRenderer.invoke("drv:install", { mode: mode === "folder" ? "folder" : "files" }),
    exportTo: () => ipcRenderer.invoke("drv:export"),
    windowsUpdate: () => ipcRenderer.invoke("drv:update")
  },
  disks: {
    analyse: () => ipcRenderer.invoke("disk:analyse"),
    surface: (disk, mode) => ipcRenderer.invoke("disk:surface", { disk: Number(disk), mode: mode === "full" ? "full" : "quick" }),
    cancel: () => ipcRenderer.invoke("disk:cancel"),
    chkdsk: (letter, fix, surface) => ipcRenderer.invoke("disk:chkdsk", { letter: String(letter), fix: !!fix, surface: !!surface }),
    speed: (letter) => ipcRenderer.invoke("disk:speed", { letter: String(letter) }),
    fixDisk: (disk, what) => ipcRenderer.invoke("disk:fixdisk", { disk: Number(disk), what: what === "readonly" ? "readonly" : "online" }),
    letter: (disk, partition) => ipcRenderer.invoke("disk:letter", { disk: Number(disk), partition: Number(partition) }),
    format: (letter, fs, label) => ipcRenderer.invoke("disk:format", { letter: String(letter), fs: String(fs), label: String(label || "") }),
    eject: (letter) => ipcRenderer.invoke("disk:eject", { letter: String(letter) }),
    copy: (letter) => ipcRenderer.invoke("disk:copy", { letter: String(letter) }),
    manager: () => ipcRenderer.invoke("disk:mgmt"),
    onProgress: (cb) => { const h = (_e, d) => cb(d); ipcRenderer.on("disk:progress", h); return () => ipcRenderer.removeListener("disk:progress", h); }
  },
  onProgress: (cb) => { const h = (_e, d) => cb(d); ipcRenderer.on("dl:progress", h); return () => ipcRenderer.removeListener("dl:progress", h); }
});
