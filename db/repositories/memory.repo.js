const pool = require("../client");

async function getAllMemories() {
  const { rows } = await pool.query(
    "SELECT * FROM memories ORDER BY importance DESC, last_accessed DESC"
  );
  return rows;
}

async function saveMemory({ key, value, category = "general", importance = 0.5 }) {
  const query = `
    INSERT INTO memories (key, value, category, importance)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (key) DO UPDATE SET
      value        = EXCLUDED.value,
      category     = EXCLUDED.category,
      importance   = EXCLUDED.importance,
      last_accessed = NOW()
    RETURNING *
  `;
  const { rows } = await pool.query(query, [key, value, category, importance]);
  return rows[0];
}

async function deleteMemory(key) {
  await pool.query("DELETE FROM memories WHERE key = $1", [key]);
}

async function touchMemory(key) {
  await pool.query(
    "UPDATE memories SET last_accessed = NOW() WHERE key = $1",
    [key]
  );
}

module.exports = { getAllMemories, saveMemory, deleteMemory, touchMemory };
