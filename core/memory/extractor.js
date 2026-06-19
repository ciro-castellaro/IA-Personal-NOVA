const { Ollama } = require("ollama");
const { saveMemory } = require("../../db/repositories/memory.repo");

const ollama = new Ollama({
  host: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
});

const EXTRACT_PROMPT = `Analizá este intercambio y extraé SOLO los hechos importantes y permanentes sobre el usuario que deben recordarse en futuras conversaciones.

Recordar: nombre, profesión, ciudad, proyectos clave, preferencias explícitas, tecnologías habituales.
NO recordar: preguntas técnicas puntuales, conversación casual sin datos personales, información temporal.

Si no hay nada importante, devolvé: []

Respondé ÚNICAMENTE con JSON válido, sin texto adicional:
[{"key": "clave_unica", "value": "valor", "category": "personal|work|preferences|technical|general", "importance": 0.1-1.0}]`;

async function extractMemories(userMessage, assistantResponse) {
  try {
    const content = `Usuario: "${userMessage}"\nNOVA: "${assistantResponse.slice(0, 600)}"`;

    const response = await ollama.chat({
      model: process.env.OLLAMA_MODEL || "llama3:8b",
      messages: [
        { role: "system", content: EXTRACT_PROMPT },
        { role: "user", content },
      ],
      stream: false,
    });

    const text = response.message.content.trim();
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return;

    const memories = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(memories) || memories.length === 0) return;

    for (const mem of memories) {
      if (mem.key && mem.value) {
        await saveMemory({
          key: mem.key,
          value: String(mem.value),
          category: mem.category || "general",
          importance: typeof mem.importance === "number" ? Math.min(1, Math.max(0, mem.importance)) : 0.5,
        });
        console.log(`[memory.extractor] Guardado: "${mem.key}" = "${mem.value}"`);
      }
    }
  } catch (err) {
    console.error("[memory.extractor] Error:", err.message);
  }
}

module.exports = { extractMemories };
