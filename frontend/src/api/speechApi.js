// ── API Base URL ───────────────────────────────────────────────────────────────
// In dev, Vite proxy forwards all paths → http://localhost:8000 (FastAPI backend)
const BASE = '';

// ── Shared fetch helper ────────────────────────────────────────────────────────
async function postJSON(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });

  if (!res.ok) {
    let detail = `API error ${res.status}: ${path}`;
    try {
      const err = await res.json();
      detail = err.detail || detail;
    } catch (_) { /* non-JSON error body */ }
    throw new Error(detail);
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
    body:   form,
  });

  if (!res.ok) {
    let detail = `Upload failed: ${res.status}`;
    try {
      const err = await res.json();
      detail = err.detail || detail;
    } catch (_) { /* non-JSON error body */ }
    throw new Error(detail);
  }

  return res.json();
}

/**
 * POST /classify — LLaMA 3.2 3B
 * Returns: { sentiment, agenda, raw_output }
 */
export async function classifySpeech(text) {
  return postJSON('/classify', { transcript: text });
}

/**
 * POST /extract — Gemma 3 4B
 * Returns: { promises, achievements, speech_type, raw_output }
 */
export async function extractPromises(text) {
  return postJSON('/extract', { transcript: text });
}

/**
 * POST /summarize — Qwen 2.5 3B
 * Returns: { summary, key_points, raw_output }
 */
export async function summarizeSpeech(text) {
  return postJSON('/summarize', { transcript: text });
}

/**
 * POST /analyze-stream — Chunked SSE analysis (all 3 models per chunk + GPT aggregation)
 *
 * Uses fetch() + ReadableStream instead of EventSource because SSE requires GET,
 * but we need to POST a (potentially large) transcript body.
 *
 * @param {string} transcript - Full speech text
 * @param {function} onEvent  - Callback called with each parsed SSE event object
 * @returns {Promise<void>}   - Resolves when the stream ends
 */
export async function analyzeStream(transcript, analysisType, onEvent) {
  const res = await fetch(`${BASE}/analyze-stream`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ transcript, analysis_type: analysisType }),
  });

  if (!res.ok) {
    let detail = `Stream error ${res.status}`;
    try {
      const err = await res.json();
      detail = err.detail || detail;
    } catch (_) {}
    throw new Error(detail);
  }

  const reader  = res.body.getReader();
  const decoder = new TextDecoder();
  let   buffer  = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // SSE lines are separated by \n\n
    const parts = buffer.split('\n\n');
    buffer = parts.pop(); // keep incomplete last part in buffer

    for (const part of parts) {
      const line = part.trim();
      if (line.startsWith('data: ')) {
        try {
          const event = JSON.parse(line.slice(6));
          onEvent(event);
        } catch (_) { /* malformed JSON, skip */ }
      }
    }
  }
}

/**
 * POST /agenda-detail — GPT-4.1-nano agenda drill-down
 *
 * @param {string} transcript    - Full speech transcript
 * @param {string} agenda_topic  - e.g. "healthcare", "economy"
 * Returns: { agenda_topic, statements: [{text, type}], overall_stance }
 */
export async function getAgendaDetail(transcript, agenda_topic) {
  return postJSON('/agenda-detail', { transcript, agenda_topic });
}
