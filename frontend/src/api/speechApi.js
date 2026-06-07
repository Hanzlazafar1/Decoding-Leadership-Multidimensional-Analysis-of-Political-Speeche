// ── API Base URL ───────────────────────────────────────────────────────────────
// In dev, Vite proxy forwards /upload-audio, /classify, /extract, /summarize
// → http://localhost:8000
const BASE = '';

// ── Shared fetch helper ────────────────────────────────────────────────────────
async function postJSON(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `API error ${res.status}: ${path}`);
  }
  return res.json();
}

/**
 * Upload audio file → { speech_id, transcript }
 */
export async function uploadAudio(file) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE}/upload-audio`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Upload failed: ${res.status}`);
  }
  return res.json(); // { speech_id, transcript }
}

/**
 * POST /classify
 * Sentiment + Agenda Classification using LLaMA 3.2 3B (GGUF).
 * Returns: { sentiment: 'Positive'|'Negative'|'Neutral', agenda: string[], raw_output: string }
 */
export async function classifySpeech(text) {
  return postJSON('/classify', { speech: text });
}

/**
 * POST /extract
 * Promise + Achievement Extraction using Gemma 3 4B (QLoRA).
 * Returns: { success, promises: string[], achievements: string[], speech_type: string, raw_output: string }
 */
export async function extractPromises(text) {
  return postJSON('/extract', { speech: text });
}

/**
 * POST /summarize
 * Speech Summarization using Qwen 2.5 3B (QLoRA).
 * Returns: { summary: string, key_points: string[] }
 */
export async function summarizeSpeech(text) {
  return postJSON('/summarize', { speech: text });
}
