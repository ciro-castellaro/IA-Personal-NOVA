// ── Estado ────────────────────────────────────────────────────────────────────
let audioContext = null;
let mediaStream = null;
let scriptProcessor = null;
let audioChunks = [];
let isRecording = false;

const SAMPLE_RATE = 16000;
const BUFFER_SIZE = 4096;

// ── Codificador WAV (PCM 16-bit mono) ────────────────────────────────────────

function encodeWAV(samples) {
  const dataSize = samples.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  function str(offset, s) {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  }

  str(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  str(8, "WAVE");
  str(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);            // PCM
  view.setUint16(22, 1, true);            // mono
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true); // byteRate
  view.setUint16(32, 2, true);            // blockAlign
  view.setUint16(34, 16, true);           // bitsPerSample
  str(36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return buffer;
}

// ── Control del micrófono ─────────────────────────────────────────────────────

const btnMic = document.getElementById("btn-mic");

btnMic.addEventListener("click", async () => {
  if (!isRecording) {
    await startRecording();
  } else {
    await stopRecording();
  }
});

async function startRecording() {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });

    const source = audioContext.createMediaStreamSource(mediaStream);
    scriptProcessor = audioContext.createScriptProcessor(BUFFER_SIZE, 1, 1);

    audioChunks = [];

    scriptProcessor.onaudioprocess = (e) => {
      audioChunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
    };

    source.connect(scriptProcessor);
    scriptProcessor.connect(audioContext.destination);

    isRecording = true;
    btnMic.classList.add("recording");
    btnMic.title = "Detener grabación";
  } catch (err) {
    console.error("[voice] Error al acceder al micrófono:", err.message);
    alert("No se pudo acceder al micrófono: " + err.message);
  }
}

async function stopRecording() {
  if (!isRecording) return;

  isRecording = false;
  btnMic.classList.remove("recording");
  btnMic.classList.add("transcribing");
  btnMic.title = "Transcribiendo...";
  btnMic.disabled = true;

  scriptProcessor.disconnect();
  mediaStream.getTracks().forEach((t) => t.stop());
  await audioContext.close();

  // Combinar chunks de PCM
  const totalLen = audioChunks.reduce((s, c) => s + c.length, 0);
  const combined = new Float32Array(totalLen);
  let offset = 0;
  for (const chunk of audioChunks) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }

  const wavBuffer = encodeWAV(combined);

  try {
    const result = await window.nova.transcribeAudio(wavBuffer);
    if (result?.text) {
      const input = document.getElementById("user-input");
      input.value = result.text.trim();
      input.dispatchEvent(new Event("input"));
      input.focus();
    }
  } catch (err) {
    console.error("[voice] Error en transcripción:", err.message);
  } finally {
    btnMic.classList.remove("transcribing");
    btnMic.disabled = false;
    btnMic.title = "Hablar con NOVA";
  }
}
