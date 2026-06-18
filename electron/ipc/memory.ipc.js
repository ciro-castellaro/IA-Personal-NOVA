const {
  getRecentMessages,
  clearMessages,
} = require("../../db/repositories/conversation.repo");

function register(ipcMain) {
  // Devuelve el historial reciente al renderer (para mostrar al abrir la app)
  ipcMain.handle("memory:history", async () => {
    try {
      const messages = await getRecentMessages(50);
      return { success: true, messages };
    } catch (error) {
      console.error("[memory.ipc] Error al obtener historial:", error.message);
      return { success: false, messages: [] };
    }
  });

  // Limpia el historial de la sesión actual
  ipcMain.handle("memory:clear", async () => {
    try {
      await clearMessages();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}

module.exports = { register };
