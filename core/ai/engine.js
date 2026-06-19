const { Ollama } = require("ollama");
const {
  getRecentMessages,
} = require("../../db/repositories/conversation.repo");
const { getAllMemories } = require("../../db/repositories/memory.repo");

const ollama = new Ollama({
  host: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
});

const MODEL = process.env.OLLAMA_MODEL || "llama3:8b";

const SYSTEM_PROMPT = `Tu nombre es NOVA, un asistente personal de inteligencia artificial que corre localmente en la computadora del usuario.

Tu personalidad:
- Respondés siempre en español, de forma clara y directa.
- Sos eficiente: das respuestas concretas sin rodeos innecesarios.
- Cuando el usuario necesita ayuda con código, explicás con ejemplos prácticos.
- Tenés un tono profesional, como un mayordomo desarrollador de confianza con conocimientos SENIOR.
- Si no sabés algo o no tenes programada esa funcion, lo decís claramente en lugar de inventar información.

Capacidades actuales:
- Mantener conversaciones naturales.
- Ayudar con programación (JavaScript, Node.js, Python, SQL y más).
- Explicar conceptos técnicos y no técnicos.
- Recordar hechos importantes sobre el usuario entre sesiones.

En próximas versiones podrás: abrir aplicaciones, gestionar archivos, ejecutar scripts, y más.`;

/**
 * Envía un mensaje al LLM y transmite la respuesta token por token.
 * @param {string} userMessage - Mensaje del usuario
 * @param {function} onToken - Callback llamado con cada token recibido
 */
async function chat(userMessage, onToken) {
  const [history, memories] = await Promise.all([
    getRecentMessages(20),
    getAllMemories(),
  ]);

  const memoryContext = memories.length > 0
    ? `\n\nHechos que recordás sobre el usuario:\n${memories.map((m) => `- ${m.key}: ${m.value}`).join("\n")}`
    : "";

  const messages = [
    { role: "system", content: SYSTEM_PROMPT + memoryContext },
    ...history.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    { role: "user", content: userMessage },
  ];

  // Llamada a Ollama en modo streaming
  const stream = await ollama.chat({
    model: MODEL,
    messages,
    stream: true,
  });

  for await (const chunk of stream) {
    const token = chunk.message?.content;
    if (token) onToken(token);
  }
}

module.exports = { chat };
