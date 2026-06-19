const aiEngine = require("../.././core/ai/engine");
const { saveMessage } = require("../../db/repositories/conversation.repo");
const { extractMemories } = require("../../core/memory/extractor");

/**
 * Registra los handlers IPC relacionados con la IA.
 * @param {Electron.IpcMain} ipcMain
 * @param {Electron.BrowserWindow} mainWindow - para emitir tokens de streaming
 */
function register(ipcMain, mainWindow) {
  // ── Handler principal: recibe un mensaje del usuario ─────────────────────
  ipcMain.handle("ai:message", async (_event, userText) => {
    try {
      // 1. Guardar mensaje del usuario en la DB
      await saveMessage({ role: "user", content: userText });

      // 2. Obtener respuesta de Ollama en streaming
      let fullResponse = "";

      await aiEngine.chat(userText, (token) => {
        fullResponse += token;
        // Emitir cada token al renderer para efecto de escritura en vivo
        mainWindow?.webContents.send("ai:token", token);
      });

      // 3. Señal de fin de respuesta
      mainWindow?.webContents.send("ai:response-end");

      // 4. Guardar respuesta completa en la DB
      await saveMessage({ role: "assistant", content: fullResponse });

      // 5. Extraer y guardar memorias en background (no bloquea la UI)
      extractMemories(userText, fullResponse).catch(() => {});

      return { success: true };
    } catch (error) {
      console.error("[ai.ipc] Error:", error.message);
      mainWindow?.webContents.send(
        "ai:token",
        `\n\n⚠️ Error: ${error.message}`,
      );
      mainWindow?.webContents.send("ai:response-end");
      return { success: false, error: error.message };
    }
  });
}

module.exports = { register };
