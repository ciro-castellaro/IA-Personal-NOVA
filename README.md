# NOVA — Asistente personal de IA local

Asistente personal que corre completamente en tu computadora.
Sin suscripciones, sin datos enviados a la nube (excepto si usás OpenAI).

---

## Requisitos previos

- Windows 11
- Node.js 18 o superior
- PostgreSQL (corriendo localmente)
- Git

---

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/nova.git
cd nova
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Instalar Ollama

Descargá e instalá Ollama desde [ollama.com](https://ollama.com).

Luego descargá el modelo de lenguaje (se descarga una sola vez, ~4GB):

```bash
ollama pull llama3
```

Verificá que esté corriendo:

```bash
ollama list
```

### 4. Configurar variables de entorno

Copiá el archivo de ejemplo y completá tus datos:

```bash
copy .env.example .env
```

Abrí `.env` y completá al menos estos campos:

```env
DB_USER=tu_usuario_de_postgres
DB_PASSWORD=tu_contraseña_de_postgres
```

### 5. Crear la base de datos

```bash
npm run setup-db
```

Este comando crea la base de datos `nova_db` y las tablas necesarias.

### 6. Iniciar NOVA

```bash
npm start
```

---

## Uso

- **Abrir/ocultar** desde cualquier app: `Ctrl + Shift + N`
- **Enviar mensaje**: `Enter`
- **Nueva línea en el mensaje**: `Shift + Enter`
- **Nueva conversación**: botón `+` en el sidebar
- **Ver historial**: botón del reloj en el sidebar

---

## Estructura del proyecto

```
nova/
├── electron/          # Proceso principal de Electron
│   ├── main.js        # Entry point
│   ├── preload.js     # Bridge seguro renderer ↔ main
│   └── ipc/           # Handlers de comunicación
├── core/              # Lógica de negocio
│   ├── ai/            # Motor de IA (Ollama)
│   ├── memory/        # Sistema de memoria (Hito 3)
│   ├── tools/         # Herramientas del sistema (Hito 4)
│   └── voice/         # Voz (Hito 5)
├── db/                # Base de datos
│   ├── client.js      # Pool de conexiones
│   ├── migrations/    # SQL de creación de tablas
│   └── repositories/  # Acceso a datos
├── renderer/          # Interfaz de usuario
│   ├── index.html
│   ├── styles/
│   └── scripts/
├── scripts/           # Scripts de utilidad
└── config/            # Configuración
```

---

## Hoja de ruta

| Hito | Estado | Descripción |
|------|--------|-------------|
| H-1  | ✅ Completo | Chat con Ollama + historial en PostgreSQL |
| H-2  | 🔜 Próximo | Memory Engine — recordar entre sesiones |
| H-3  | ⏳ Pendiente | Tool System — abrir apps, gestionar archivos |
| H-4  | ⏳ Pendiente | Voice Engine — Whisper + TTS |
| H-5  | ⏳ Pendiente | Automatización avanzada |
| H-6  | ⏳ Pendiente | Visión — análisis de pantalla e imágenes |

---

## Seguridad

- El archivo `.env` nunca se sube al repositorio (incluido en `.gitignore`).
- El renderer de Electron tiene `contextIsolation: true` y `nodeIntegration: false`.
- Toda la comunicación entre UI y Node.js pasa por el IPC bridge con `contextBridge`.

---

## Contribuir

Este es un proyecto personal. Si sos alguien de confianza que quiere contribuir:

1. Forkear el repo.
2. Crear una rama: `git checkout -b feature/mi-mejora`
3. Hacer commit: `git commit -m "feat: descripción"`
4. Push y Pull Request.
