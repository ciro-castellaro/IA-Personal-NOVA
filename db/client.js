const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "nova_db",
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Verificar conexión al iniciar
pool.connect((err, client, release) => {
  if (err) {
    console.error("❌ Error al conectar con PostgreSQL:", err.message);
    console.error(
      "   Verificá que el servicio esté corriendo y que .env esté configurado.",
    );
  } else {
    console.log("✅ PostgreSQL conectado correctamente.");
    release();
  }
});

module.exports = pool;
