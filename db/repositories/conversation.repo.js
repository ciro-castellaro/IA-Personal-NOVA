const pool = require("../client");

/**
 * Guarda un mensaje en el historial.
 * @param {{ role: string, content: string, session_id?: string }} msg
 */
async function saveMessage({ role, content, session_id = null }) {
  const query = `
    INSERT INTO conversations (role, content, session_id)
    VALUES ($1, $2, $3)
    RETURNING id, created_at
  `;
  const { rows } = await pool.query(query, [role, content, session_id]);
  return rows[0];
}

/**
 * Devuelve los últimos N mensajes ordenados cronológicamente.
 * @param {number} limit
 */
async function getRecentMessages(limit = 20) {
  const query = `
    SELECT id, role, content, created_at
    FROM conversations
    ORDER BY created_at DESC
    LIMIT $1
  `;
  const { rows } = await pool.query(query, [limit]);
  // Invertir para orden cronológico (el más antiguo primero)
  return rows.reverse();
}

/**
 * Limpia todos los mensajes (útil para empezar una conversación nueva).
 */
async function clearMessages() {
  await pool.query("DELETE FROM conversations");
}

module.exports = { saveMessage, getRecentMessages, clearMessages };
