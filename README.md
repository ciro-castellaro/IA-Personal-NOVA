# NOVA — Local AI Assistant

Personal assistant that runs entirely on your computer.

No subscriptions, no data sent to the cloud (unless you use the OpenAI API instead of Ollama).

---

## Prerequisites

* Linux (tested on Linux Mint 22) or Windows 11
* Node.js 18 or higher
* PostgreSQL (running locally)
* Git
* Ollama
* **For voice recognition:** `cmake` and C++ build tools (`gcc`, `g++`, `make`)

```bash
# Linux — install build tools
sudo apt install cmake build-essential -y
```

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/ciro-castellaro/IA-Personal-NOVA.git
cd IA-Personal-NOVA
```

### 2. Install Dependencies

```bash
npm install
```

> `nodejs-whisper` is installed automatically with this command. It requires `cmake` and `g++` to be installed (see Prerequisites), as it compiles whisper.cpp from source during installation.

### 3. Download the Voice Model (Whisper)

```bash
npx nodejs-whisper download
```

Select the **`base`** model (~140 MB). It only needs to be downloaded once.

### 4. Install Ollama

Download and install Ollama from [ollama.com](https://ollama.com).

Then download the language model (only needs to be downloaded once, ~4.7 GB):

```bash
ollama pull llama3:8b
```

### 5. Configure Environment Variables

```bash
cp .env.example .env
```

Open `.env` and fill in at least the following fields:

```env
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password
```

### 6. Create the Database

```bash
npm run setup-db
```

### 7. Start NOVA

```bash
npm start
```

---

## Usage

* **Show/hide NOVA** from any app: `Ctrl + Shift + N`
* **Send a message**: `Enter`
* **New line in a message**: `Shift + Enter`
* **New conversation**: `+` button in the sidebar
* **View history**: clock button in the sidebar
* **Voice input**: microphone button in the input — record and release to transcribe

---

## Voice Recognition

NOVA uses [Whisper](https://github.com/openai/whisper) (via `nodejs-whisper`) to transcribe audio **100% locally**, without sending anything over the internet.

* Automatically detects whether an NVIDIA GPU with CUDA is available and uses it when possible.
* If there is no GPU or CUDA fails, it automatically falls back to CPU without interrupting the transcription.
* Audio is encoded as 16 kHz mono WAV directly in the renderer, without requiring `ffmpeg`.

---

## Project Structure

```text
nova/
├── electron/          # Electron main process
│   ├── main.js        # Entry point
│   ├── preload.js     # Secure renderer ↔ main bridge
│   └── ipc/           # Communication handlers
│       ├── ai.ipc.js
│       ├── memory.ipc.js
│       └── voice.ipc.js
├── core/              # Business logic
│   ├── ai/            # AI Engine (Ollama)
│   ├── memory/        # Memory Engine — extraction and retrieval
│   └── voice/         # Voice Engine — Whisper transcription
├── db/                # Database
│   ├── client.js      # Connection pool
│   ├── migrations/    # Table creation SQL
│   └── repositories/  # Data access
├── renderer/          # User interface
│   ├── index.html
│   ├── styles/
│   └── scripts/
└── scripts/           # Utility scripts
```

---

## Roadmap

| Milestone | Status     | Description                                                            |
| --------- | ---------- | ---------------------------------------------------------------------- |
| H-1       | ✅ Complete | Chat with Ollama + PostgreSQL history                                  |
| H-2       | ✅ Complete | Memory Engine — remember facts between sessions                        |
| H-3       | ✅ Complete | Voice Engine — Whisper (`nodejs-whisper`), automatic GPU/CPU detection |
| H-4       | 🔜 Next    | Tool System — open apps, manage files                                  |
| H-5       | ⏳ Pending  | TTS — voice responses                                                  |
| H-6       | ⏳ Pending  | Advanced automation                                                    |
| H-7       | ⏳ Pending  | Vision — screen and image analysis                                     |

---

## Security

* Electron's renderer uses `contextIsolation: true` and `nodeIntegration: false`.
* All communication between the UI and Node.js goes through the IPC bridge using `contextBridge`.
* Voice audio never leaves the local machine.
