const { contextBridge, ipcRenderer } = require('electron')

// Exponemos una API segura al renderer.
// El renderer NUNCA accede a Node.js o Electron directamente.
contextBridge.exposeInMainWorld('nova', {

  // ── IA / Chat ──────────────────────────────────────────────────────────────
  sendMessage: (text) =>
    ipcRenderer.invoke('ai:message', text),

  // Escuchar tokens en streaming (respuesta parcial de Ollama)
  onToken: (callback) => {
    ipcRenderer.on('ai:token', (_event, token) => callback(token))
  },

  onResponseEnd: (callback) => {
    ipcRenderer.on('ai:response-end', () => callback())
  },

  // ── Historial ──────────────────────────────────────────────────────────────
  getHistory: () =>
    ipcRenderer.invoke('memory:history'),

  clearHistory: () =>
    ipcRenderer.invoke('memory:clear'),

  // ── Control de ventana (titlebar personalizada) ────────────────────────────
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close:    () => ipcRenderer.send('window:close'),

  // ── Voz ────────────────────────────────────────────────────────────────────
  transcribeAudio: (arrayBuffer) =>
    ipcRenderer.invoke('voice:transcribe', arrayBuffer),

  // ── Utilidades ─────────────────────────────────────────────────────────────
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
})
