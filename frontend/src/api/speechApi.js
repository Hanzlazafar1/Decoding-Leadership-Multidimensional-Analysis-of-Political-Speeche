// ── API Base URL ───────────────────────────────────────────────────────────────
// In dev, Vite proxy forwards /upload-audio and /api/* to http://localhost:8000
const BASE = '';

/**
 * Upload audio file → returns { speech_id, transcript }
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
 * Sentiment analysis → { sentiment, agenda, explanation }
 */
export async function analyzeSentiment(text) {
  const res = await fetch(`${BASE}/api/sentiment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Sentiment API error: ${res.status}`);
  }
  return res.json(); // { sentiment, agenda: [], explanation }
}

/**
 * Agenda detection → { topics, buzzwords, context }
 */
export async function detectAgenda(text) {
  const res = await fetch(`${BASE}/api/agenda`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Agenda API error: ${res.status}`);
  }
  return res.json(); // { topics: [], buzzwords: [], context }
}

/**
 * Promises & achievements extraction → { promises, achievements }
 */
export async function extractPromises(text) {
  const res = await fetch(`${BASE}/api/promises`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Promises API error: ${res.status}`);
  }
  return res.json(); // { promises: [], achievements: [] }
}

/**
 * Speech summarization → { summary, key_points }
 */
export async function summarizeSpeech(text) {
  const res = await fetch(`${BASE}/api/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Summarize API error: ${res.status}`);
  }
  return res.json(); // { summary, key_points: [] }
}
