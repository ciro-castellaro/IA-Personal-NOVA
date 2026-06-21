const { nodewhisper } = require("nodejs-whisper");
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");

// ── Detección de CUDA (se ejecuta una sola vez al cargar el módulo) ───────────

const CUDA_AVAILABLE = detectCuda();

function detectCuda() {
  try {
    // 1. Verificar que nvidia-smi responde (GPU presente y driver cargado)
    execSync("nvidia-smi --query-gpu=name --format=csv,noheader", {
      stdio: "pipe",
      timeout: 5000,
    });

    // 2. Verificar que las librerías CUDA están disponibles en el sistema
    const cudaLibPaths = [
      "/usr/local/cuda/lib64/libcudart.so",
      "/usr/lib/x86_64-linux-gnu/libcuda.so.1",
      "/usr/lib/x86_64-linux-gnu/libcuda.so",
    ];
    const cudaFound = cudaLibPaths.some((p) => fs.existsSync(p));

    if (!cudaFound) {
      // Último recurso: ldconfig
      execSync("ldconfig -p | grep libcuda", { stdio: "pipe", timeout: 3000 });
    }

    console.log("[voice.transcriber] GPU NVIDIA detectada — usando CUDA");
    return true;
  } catch {
    console.log("[voice.transcriber] Sin GPU CUDA disponible — usando CPU");
    return false;
  }
}

// ── Extrae texto plano de la salida de whisper-cli ────────────────────────────

function parseWhisperOutput(stdout) {
  return (stdout || "")
    .split("\n")
    .filter((l) => /\d{2}:\d{2}:\d{2}/.test(l))
    .map((l) => l.replace(/\[.*?--?>.*?\]/, "").trim())
    .filter(Boolean)
    .join(" ")
    .trim();
}

// ── Llama a nodewhisper con las opciones dadas ────────────────────────────────

async function runWhisper(filePath, noGpu) {
  const stdout = await nodewhisper(filePath, {
    modelName: "base",
    removeWavFileAfterTranscription: true,
    whisperOptions: {
      outputInText: false,
      language: "es",
      noGpu,
    },
  });
  return parseWhisperOutput(stdout);
}

// ── Transcripción con detección automática y fallback ─────────────────────────

async function transcribe(audioBuffer) {
  const tmpPath = path.join(os.tmpdir(), `nova_audio_${Date.now()}.wav`);

  try {
    fs.writeFileSync(tmpPath, Buffer.from(audioBuffer));

    if (CUDA_AVAILABLE) {
      try {
        return await runWhisper(tmpPath, false);
      } catch (gpuErr) {
        const msg = gpuErr.message || "";
        const isCudaError =
          /cuda|gpu|driver|device|nvml|cublas/i.test(msg);

        if (isCudaError) {
          console.warn(
            "[voice.transcriber] Error de GPU, reintentando en CPU:",
            msg
          );
          return await runWhisper(tmpPath, true);
        }

        throw gpuErr;
      }
    }

    return await runWhisper(tmpPath, true);
  } catch (err) {
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    throw err;
  }
}

module.exports = { transcribe, CUDA_AVAILABLE };
