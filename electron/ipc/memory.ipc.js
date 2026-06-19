const {
  getRecentMessages,
  clearMessages,
} = require("../../db/repositories/conversation.repo");
const {
  getAllMemories,
  saveMemory,
  deleteMemory,
} = require("../../db/repositories/memory.repo");

function register(ipcMain) {
  ipcMain.handle("memory:history", async () => {
    try {
      const messages = await getRecentMessages(50);
      return { success: true, messages };
    } catch (error) {
      console.error("[memory.ipc] Error al obtener historial:", error.message);
      return { success: false, messages: [] };
    }
  });

  ipcMain.handle("memory:clear", async () => {
    try {
      await clearMessages();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Devuelve todas las memorias persistentes
  ipcMain.handle("memory:get-all", async () => {
    try {
      const memories = await getAllMemories();
      return { success: true, memories };
    } catch (error) {
      return { success: false, memories: [] };
    }
  });

  // Guarda o actualiza una memoria
  ipcMain.handle("memory:save", async (_event, { key, value, category, importance }) => {
    try {
      const memory = await saveMemory({ key, value, category, importance });
      return { success: true, memory };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Elimina una memoria por clave
  ipcMain.handle("memory:delete", async (_event, key) => {
    try {
      await deleteMemory(key);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}

module.exports = { register };
