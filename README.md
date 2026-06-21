# NOVA — Asistente personal de IA local

Asistente personal que corre completamente en tu computadora.
Sin suscripciones, sin datos enviados a la nube (excepto si usás OpenAI).

---

## Requisitos previos

- Linux (probado en Linux Mint 22) o Windows 11
- Node.js 18 o superior
- PostgreSQL (corriendo localmente)
- Git
- Ollama
- **Para reconocimiento de voz:** `cmake` y herramientas de compilación C++ (`gcc`, `g++`, `make`)

```bash
# Linux — instalar herramientas de compilación
sudo apt install cmake build-essential -y
```

---

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/ciro-castellaro/IA-Personal-NOVA.git
cd IA-Personal-NOVA
```

### 2. Instalar dependencias

```bash
npm install
```

> `nodejs-whisper` se instala automáticamente con este comando. Requiere que `cmake` y `g++` estén instalados (ver Requisitos previos), ya que compila whisper.cpp desde cero durante la instalación.

### 3. Descargar el modelo de voz (Whisper)

```bash
npx nodejs-whisper download
```

Elegí el modelo **`base`** (~140 MB). Solo se descarga una vez.

### 4. Instalar Ollama

Descargá e instalá Ollama desde [ollama.com](https://ollama.com).

Luego descargá el modelo de lenguaje (se descarga una sola vez, ~4.7 GB):

```bash
ollama pull llama3:8b
```

### 5. Configurar variables de entorno

```bash
cp .env.example .env
```

Abrí `.env` y completá al menos estos campos:

```env
DB_USER=tu_usuario_de_postgres
DB_PASSWORD=tu_contraseña_de_postgres
```

### 6. Crear la base de datos

```bash
npm run setup-db
```

### 7. Iniciar NOVA

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
- **Voz**: botón de micrófono en el input — grabá y soltá para transcribir

---

## Reconocimiento de voz

NOVA usa [Whisper](https://github.com/openai/whisper) (vía `nodejs-whisper`) para transcribir audio 100% localmente, sin enviar nada a internet.

- Detecta automáticamente si hay una GPU NVIDIA con CUDA disponible y la usa si es posible.
- Si no hay GPU o CUDA falla, cae automáticamente a CPU sin interrumpir la transcripción.
- El audio se codifica como WAV 16 kHz mono directamente en el renderer, sin necesidad de `ffmpeg`.

---

## Estructura del proyecto

```
nova/
├── electron/          # Proceso principal de Electron
│   ├── main.js        # Entry point
│   ├── preload.js     # Bridge seguro renderer ↔ main
│   └── ipc/           # Handlers de comunicación
│       ├── ai.ipc.js
│       ├── memory.ipc.js
│       └── voice.ipc.js
├── core/              # Lógica de negocio
│   ├── ai/            # Motor de IA (Ollama)
│   ├── memory/        # Memory Engine — extracción y recuperación
│   └── voice/         # Voice Engine — transcripción con Whisper
├── db/                # Base de datos
│   ├── client.js      # Pool de conexiones
│   ├── migrations/    # SQL de creación de tablas
│   └── repositories/  # Acceso a datos
├── renderer/          # Interfaz de usuario
│   ├── index.html
│   ├── styles/
│   └── scripts/
└── scripts/           # Scripts de utilidad
```

---

## Hoja de ruta

| Hito | Estado | Descripción |
|------|--------|-------------|
| H-1  | ✅ Completo | Chat con Ollama + historial en PostgreSQL |
| H-2  | ✅ Completo | Memory Engine — recordar hechos entre sesiones |
| H-3  | ✅ Completo | Voice Engine — Whisper (nodejs-whisper), detección GPU/CPU automática |
| H-4  | 🔜 Próximo | Tool System — abrir apps, gestionar archivos |
| H-5  | ⏳ Pendiente | TTS — respuestas de voz |
| H-6  | ⏳ Pendiente | Automatización avanzada |
| H-7  | ⏳ Pendiente | Visión — análisis de pantalla e imágenes |

---

## Seguridad

- El archivo `.env` nunca se sube al repositorio (incluido en `.gitignore`).
- El renderer de Electron tiene `contextIsolation: true` y `nodeIntegration: false`.
- Toda la comunicación entre UI y Node.js pasa por el IPC bridge con `contextBridge`.
- El audio de voz nunca sale de la máquina local.
