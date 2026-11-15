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
  onProgress: (cb) => { const h = (_e, d) => cb(d); ipcRenderer.on("dl:progress", h); return () => ipcRenderer.removeListener("dl:progress", h); }
});
