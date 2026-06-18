#!/usr/bin/env node
/**
 * NOVA — Setup de base de datos
 * Ejecutar una sola vez antes de iniciar la app por primera vez:
 *   node scripts/setup-db.js
 */

require('dotenv').config()
const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

const DB_NAME = process.env.DB_NAME || 'nova_db'

async function main() {
  console.log('🚀 Iniciando setup de base de datos de NOVA...\n')

  // 1. Conectar a postgres (DB por defecto) para poder crear nova_db
  const adminClient = new Client({
    host:     process.env.DB_HOST || 'localhost',
    port:     parseInt(process.env.DB_PORT || '5432'),
    database: 'postgres',            // DB de sistema, siempre existe
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  })

  try {
    await adminClient.connect()
    console.log('✅ Conectado a PostgreSQL.')

    // 2. Crear la base de datos si no existe
    const { rows } = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`, [DB_NAME]
    )

    if (rows.length === 0) {
      await adminClient.query(`CREATE DATABASE ${DB_NAME}`)
      console.log(`✅ Base de datos "${DB_NAME}" creada.`)
    } else {
      console.log(`ℹ️  La base de datos "${DB_NAME}" ya existe.`)
    }

    await adminClient.end()

    // 3. Conectar a nova_db y ejecutar migraciones
    const novaClient = new Client({
      host:     process.env.DB_HOST || 'localhost',
      port:     parseInt(process.env.DB_PORT || '5432'),
      database: DB_NAME,
      user:     process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    })

    await novaClient.connect()

    const migrationPath = path.join(__dirname, '../db/migrations/001_initial.sql')
    const sql = fs.readFileSync(migrationPath, 'utf-8')
    await novaClient.query(sql)
    console.log('✅ Migraciones ejecutadas correctamente.')

    await novaClient.end()

    console.log('\n🎉 Setup completo. Ya podés ejecutar: npm start\n')

  } catch (error) {
    console.error('\n❌ Error durante el setup:', error.message)
    console.error('\nVerificá que:')
    console.error('  1. PostgreSQL esté corriendo.')
    console.error('  2. El archivo .env esté configurado correctamente.')
    console.error('  3. DB_USER tenga permisos para crear bases de datos.\n')
    process.exit(1)
  }
}

main()
