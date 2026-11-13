// Pont sécurisé entre l'interface et Windows : seules ces fonctions sont exposées.
const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("diaglab", {
  desktop: true,
  version: ipcRenderer.sendSync("app:version"),
  runReport: (opts) => ipcRenderer.invoke("report:run", { admin: !!(opts && opts.admin), complet: !!(opts && opts.complet) }),
  openReport: () => ipcRenderer.invoke("report:open"),
  saveReport: () => ipcRenderer.invoke("report:save")
});
