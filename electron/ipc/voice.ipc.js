const { transcribe } = require("../../core/voice/transcriber");

function register(ipcMain) {
  ipcMain.handle("voice:transcribe", async (_event, audioBuffer) => {
    try {
      const text = await transcribe(audioBuffer);
      return { success: true, text };
    } catch (error) {
      console.error("[voice.ipc] Error:", error.message);
      return { success: false, text: "", error: error.message };
    }
  });
}

module.exports = { register };
