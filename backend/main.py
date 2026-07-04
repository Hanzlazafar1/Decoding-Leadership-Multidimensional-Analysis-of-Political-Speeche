import os
import json
import wave
import re
import asyncio
import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from openai import AsyncOpenAI
import vosk
from pydub import AudioSegment

# ── Load .env ──────────────────────────────────────────────────────────────────
load_dotenv()

app = FastAPI(title="Political Speech Analyzer", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── External LLM API Config ────────────────────────────────────────────────────
REMOTE_BASE   = os.getenv("REMOTE_BASE", "https://yard-prissy-washer.ngrok-free.dev")
CLASSIFY_URL  = os.getenv("CLASSIFY_URL",  f"{REMOTE_BASE}/classify")
EXTRACT_URL   = os.getenv("EXTRACT_URL",   f"{REMOTE_BASE}/extract")
SUMMARIZE_URL = os.getenv("SUMMARIZE_URL", f"{REMOTE_BASE}/summarize")

_HEADERS = {
    "Content-Type": "application/json",
    "Accept":       "application/json",
    "ngrok-skip-browser-warning": "true",
}

# ── OpenAI Config (GPT-4.1-nano) ───────────────────────────────────────────────
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
GPT_MODEL      = "gpt-4.1-nano"
openai_client  = AsyncOpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

# ── Chunking Config ────────────────────────────────────────────────────────────
# Models were fine-tuned with MAX_SEQ_LEN=2048 tokens.
# 2000 tokens ≈ 6000 characters (English, ~3 chars/token average).
CHUNK_SIZE    = 6000   # characters per chunk
CHUNK_OVERLAP = 200    # characters of context carried into next chunk

# ── Load Vosk Model ────────────────────────────────────────────────────────────
MODEL_PATH = "model"
if not os.path.exists(MODEL_PATH):
    print("⚠️  Vosk model not found. Download from https://alphacephei.com/vosk/models")
    vosk_model = None
else:
    vosk_model = vosk.Model(MODEL_PATH)


# ── Pydantic Schemas ───────────────────────────────────────────────────────────
class SpeechPayload(BaseModel):
    """Accepts 'transcript' from the client."""
    transcript: str
    analysis_type: str = "full"



class AgendaDetailPayload(BaseModel):
    """Accepts transcript + agenda_topic for drill-down."""
    transcript:   str
    agenda_topic: str


# ── Chunking Utility ───────────────────────────────────────────────────────────
def chunk_transcript(text: str, max_chars: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    """
    Split a transcript into chunks of ≤ max_chars characters.

    Strategy:
    1. Split on sentence boundaries (. ! ?) to avoid mid-sentence cuts.
    2. Pack sentences into chunks greedily until max_chars is reached.
    3. Carry the last `overlap` chars of the previous chunk into the next one
       so the model has context at the boundary.

    This mirrors how training data was prepared: long speeches were split into
    rows of MAX_SEQ_LEN=2048 tokens (≈6000 chars) in the dataset.
    """
    if len(text) <= max_chars:
        return [text]

    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    chunks: list[str] = []
    current = ""

    for sentence in sentences:
        # If a single sentence is longer than the chunk, hard-split it
        if len(sentence) > max_chars:
            if current:
                chunks.append(current.strip())
            # Hard-split the long sentence
            for i in range(0, len(sentence), max_chars - overlap):
                piece = sentence[i: i + max_chars]
                if piece.strip():
                    chunks.append(piece.strip())
            current = chunks[-1][-overlap:] if chunks else ""
            continue

        candidate = (current + " " + sentence).strip() if current else sentence
        if len(candidate) <= max_chars:
            current = candidate
        else:
            if current:
                chunks.append(current.strip())
            # Carry overlap from end of previous chunk for context
            tail = current[-overlap:] if current else ""
            current = (tail + " " + sentence).strip() if tail else sentence

    if current.strip():
        chunks.append(current.strip())

    return chunks if chunks else [text[:max_chars]]


# ── External LLM HTTP Helpers ──────────────────────────────────────────────────
async def _post(url: str, body: dict) -> dict | str:
    """POST JSON to a remote LLM endpoint."""
    async with httpx.AsyncClient(timeout=180.0) as client:
        resp = await client.post(url, json=body, headers=_HEADERS)
        resp.raise_for_status()
        try:
            return resp.json()
        except Exception:
            return {"_raw": resp.text}


def _to_list(value) -> list:
    """Coerce a value that might be a list, comma-separated string, or None into a list."""
    if not value:
        return []
    if isinstance(value, list):
        return [str(v).strip() for v in value if str(v).strip()]
    if isinstance(value, str):
        if "\n" in value:
            return [v.strip() for v in value.split("\n") if v.strip()]
        return [v.strip() for v in value.split(",") if v.strip()]
    return [str(value)]


def _sse(event_type: str, payload: dict) -> str:
    """Format a dict as an SSE data line."""
    return f"data: {json.dumps({'type': event_type, **payload})}\n\n"


# ── GPT Aggregation ────────────────────────────────────────────────────────────
async def gpt_aggregate(chunks_results: list[dict], total_chunks: int, analysis_type: str = "full") -> dict:
    """
    Use GPT-4.1-nano to synthesize all per-chunk analysis results into one
    unified, deduplicated response covering the full speech.
    """
    if not openai_client:
        raise ValueError("OPENAI_API_KEY not configured.")

    run_classify = analysis_type in ("full", "classify")
    run_extract = analysis_type in ("full", "extract")
    run_summarize = analysis_type in ("full", "summarize")

    # Format chunk results for GPT
    chunk_summaries = []
    for i, cr in enumerate(chunks_results):
        classify  = cr.get("classify", {})
        extract   = cr.get("extract", {})
        summarize = cr.get("summarize", {})
        
        parts = [f"--- CHUNK {i+1}/{total_chunks} ---"]
        if run_classify:
            parts.append(f"Sentiment : {classify.get('sentiment', 'N/A')}")
            parts.append(f"Agenda    : {', '.join(classify.get('agenda', []))}")
        if run_extract:
            parts.append(f"Promises  : {chr(10).join(extract.get('promises', []))}")
            parts.append(f"Achievements: {chr(10).join(extract.get('achievements', []))}")
            parts.append(f"Speech Type : {extract.get('speech_type', 'unknown')}")
        if run_summarize:
            parts.append(f"Summary   : {summarize.get('summary', '')}")
        chunk_summaries.append("\n".join(parts) + "\n")

    rules = []
    schema = ["{"]
    models_used = []

    if run_classify:
        models_used.append("  - LLaMA 3.2 3B: sentiment (positive/negative/neutral) and agenda topics")
        rules.extend([
            "- For sentiment: pick the most dominant sentiment across chunks; if mixed, use 'Neutral'",
            "- For agenda: merge all topics, deduplicate, keep all unique ones",
            "- For agenda_breakdown: estimate the percentage weight of each topic based on the speech context (percentages must sum to 100)"
        ])
        schema.extend([
            '  "sentiment": "Positive|Negative|Neutral",',
            '  "sentiment_reasoning": "one sentence explanation",',
            '  "agenda": ["topic1", "topic2"],',
            '  "agenda_breakdown": [{"topic": "topic1", "percentage": 60}, {"topic": "topic2", "percentage": 40}],\n'
        ])

    if run_extract:
        models_used.append("  - Gemma 3 4B: promises, achievements, and speech type")
        rules.extend([
            "- For promises/achievements: merge all, deduplicate near-duplicate entries",
            "- For speech_type: pick the most representative label"
        ])
        schema.extend([
            '  "promises": ["..."],',
            '  "achievements": ["..."],',
            '  "speech_type": "promise-heavy|achievement-heavy|balanced|neither",\n'
        ])

    if run_summarize:
        models_used.append("  - Qwen 2.5 3B: summarization")
        rules.extend([
            "- For summary: write a single 3-5 sentence overview of the ENTIRE speech",
            "- For key_points: extract the top 5 most important takeaways from the full speech"
        ])
        schema.extend([
            '  "summary": "3-5 sentence unified summary of the entire speech",',
            '  "key_points": ["point1", "point2", "point3", "point4", "point5"]\n'
        ])

    # remove trailing comma/newline from last schema item
    if len(schema) > 1:
        schema[-1] = schema[-1].rstrip().rstrip(',')
    schema.append("}")

    system_msg = (
        "You are an AI assistant synthesizing results from a political speech analyzer.\n\n"
        f"The speech was too long to process at once, so it was split into {total_chunks} chunk(s). "
        "Each chunk was independently analyzed by fine-tuned AI models:\n"
        + "\n".join(models_used) + "\n\n"
        "Your task: synthesize ALL chunk results into ONE unified, deduplicated analysis.\n\n"
        "Rules:\n"
        + "\n".join(rules) + "\n\n"
        "Return ONLY valid JSON — no markdown, no extra text — with this exact schema:\n"
        + "\n".join(schema)
    )

    user_msg = "Here are the per-chunk analysis results:\n\n" + "\n".join(chunk_summaries)

    response = await openai_client.chat.completions.create(
        model=GPT_MODEL,
        messages=[
            {"role": "system", "content": system_msg},
            {"role": "user",   "content": user_msg},
        ],
        temperature=0.3,
        max_tokens=2000,
    )

    raw = response.choices[0].message.content.strip()

    # Parse JSON with fallback
    try:
        clean = raw
        if clean.startswith("```json"):
            clean = clean.split("```json")[1].split("```")[0].strip()
        elif clean.startswith("```"):
            clean = clean.split("```")[1].split("```")[0].strip()
        return json.loads(clean)
    except Exception:
        # Try to extract JSON object from raw text
        s, e = raw.find("{"), raw.rfind("}")
        if s != -1 and e != -1:
            try:
                return json.loads(raw[s:e+1])
            except Exception:
                pass
    # Fallback: return partial data
    return {"summary": raw, "sentiment": "Neutral", "agenda": [], "promises": [], "achievements": [], "key_points": []}


# ── Audio Upload & Vosk Transcription ─────────────────────────────────────────
@app.post("/upload-audio")
async def upload_audio(file: UploadFile = File(...)):
    """Transcribe an uploaded audio file using the local Vosk model."""
    if not vosk_model:
        raise HTTPException(status_code=500, detail="Vosk model not loaded on server.")

    file_location = f"temp_{file.filename}"
    with open(file_location, "wb+") as fobj:
        fobj.write(file.file.read())

    wav_location = f"converted_{file.filename}.wav"
    try:
        audio = AudioSegment.from_file(file_location)
        audio = audio.set_channels(1).set_frame_rate(16000)
        audio.export(wav_location, format="wav")
    except Exception as e:
        os.remove(file_location)
        raise HTTPException(status_code=400, detail=f"Audio conversion failed: {str(e)}")

    transcript = ""
    try:
        wf = wave.open(wav_location, "rb")
        rec = vosk.KaldiRecognizer(vosk_model, wf.getframerate())
        rec.SetWords(True)
        while True:
            data = wf.readframes(4000)
            if len(data) == 0:
                break
            if rec.AcceptWaveform(data):
                res = json.loads(rec.Result())
                transcript += res.get("text", "") + " "
        res = json.loads(rec.FinalResult())
        transcript += res.get("text", "")
        wf.close()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
    finally:
        if os.path.exists(file_location):
            os.remove(file_location)
        if os.path.exists(wav_location):
            os.remove(wav_location)

    return {"speech_id": file.filename, "transcript": transcript.strip()}


# ── Classification Endpoint ────────────────────────────────────────────────────
@app.post("/classify")
async def classify_speech(payload: SpeechPayload):
    """
    Sentiment + Agenda Classification using LLaMA 3.2 3B (GGUF).
    Returns: sentiment, agenda, raw_output
    """
    try:
        data = await _post(CLASSIFY_URL, {"transcript": payload.transcript})

        if isinstance(data, str) or "_raw" in data:
            raw_text = data if isinstance(data, str) else data.get("_raw", "")
            return {"sentiment": "Neutral", "agenda": [], "raw_output": raw_text}

        result = data.get("result") if isinstance(data.get("result"), dict) else data

        raw_sentiment = str(result.get("sentiment", "neutral")).lower()
        if "positive" in raw_sentiment:
            sentiment = "Positive"
        elif "negative" in raw_sentiment:
            sentiment = "Negative"
        else:
            sentiment = "Neutral"

        agenda = _to_list(result.get("agenda", []))

        return {
            "sentiment":  sentiment,
            "agenda":     agenda,
            "raw_output": str(result.get("raw", data.get("raw_output", ""))),
        }
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"Remote classify API error {e.response.status_code}: {e.response.text}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Classify API error: {str(e)}")


# ── Extraction Endpoint & Helper ──────────────────────────────────────────────
async def fetch_extracted_promises(transcript: str) -> dict:
    """
    Internal helper to chunk text down to ~500 tokens (1500 chars) specifically
    for the Gemma 3 Promises model to prevent GPU OOM, then merge the results.
    """
    chunks = chunk_transcript(transcript, max_chars=1500, overlap=100)
    all_promises = []
    all_achievements = []
    speech_types = []
    raw_outputs = []

    for chunk in chunks:
        data = await _post(EXTRACT_URL, {"transcript": chunk})

        if isinstance(data, str) or "_raw" in data:
            raw_outputs.append(data if isinstance(data, str) else data.get("_raw", ""))
            continue

        result = data.get("result") if isinstance(data.get("result"), dict) else data
        all_promises.extend(_to_list(result.get("promises", [])))
        all_achievements.extend(_to_list(result.get("achievements", [])))
        
        stype = result.get("speech_type")
        if stype and str(stype).lower() != "unknown":
            speech_types.append(str(stype))
            
        raw_outputs.append(str(data.get("raw_output", "")))

    final_type = "unknown"
    if speech_types:
        from collections import Counter
        final_type = Counter(speech_types).most_common(1)[0][0]

    return {
        "promises": list(dict.fromkeys(all_promises)),
        "achievements": list(dict.fromkeys(all_achievements)),
        "speech_type": final_type,
        "raw_output": "\n\n".join(raw_outputs),
    }


@app.post("/extract")
async def extract_promises(payload: SpeechPayload):
    """
    Promise + Achievement Extraction using Gemma 3 4B (QLoRA).
    Returns: promises, achievements, speech_type, raw_output
    """
    try:
        data = await fetch_extracted_promises(payload.transcript)
        return data
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"Remote extract API error {e.response.status_code}: {e.response.text}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Extract API error: {str(e)}")


# ── Summarization Endpoint ─────────────────────────────────────────────────────
@app.post("/summarize")
async def summarize_speech(payload: SpeechPayload):
    """
    Speech Summarization using Qwen 2.5 3B (QLoRA).
    Returns: summary, key_points, raw_output
    """
    try:
        data = await _post(SUMMARIZE_URL, {"transcript": payload.transcript})

        if isinstance(data, str):
            return {"summary": data.strip(), "key_points": [], "raw_output": data}

        if "_raw" in data:
            raw_text = data["_raw"]
            return {"summary": raw_text.strip(), "key_points": [], "raw_output": raw_text}

        result = data.get("result") if isinstance(data.get("result"), dict) else data

        summary = (
            result.get("summary")
            or result.get("result")
            or result.get("text")
            or result.get("output")
            or ""
        )

        if isinstance(summary, dict):
            summary = (
                summary.get("summary")
                or summary.get("text")
                or summary.get("output")
                or str(summary)
            )

        summary = str(summary).strip()

        key_points = result.get("key_points") or result.get("key_takeaways") or []
        if isinstance(key_points, str):
            sep = ";" if ";" in key_points else "\n"
            key_points = [k.strip() for k in key_points.split(sep) if k.strip()]

        return {
            "summary":    summary,
            "key_points": key_points,
            "raw_output": str(data.get("raw_output", "")),
        }
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"Remote summarize API error {e.response.status_code}: {e.response.text}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Summarize API error: {str(e)}")


# ── Chunked Analysis Stream (SSE) ──────────────────────────────────────────────
@app.post("/analyze-stream")
async def analyze_stream(payload: SpeechPayload):
    """
    Stream chunked analysis results via Server-Sent Events (SSE).

    Flow:
      1. Split transcript into ≤6000-char chunks (≈2000 tokens, matching model training).
      2. For each chunk: classify → extract → summarize (sequentially).
      3. Stream each step + result as a JSON SSE event.
      4. After all chunks: call GPT-4.1-nano to aggregate into a unified analysis.
      5. Emit final_result and done events.

    Frontend consumes this with fetch() + ReadableStream (not EventSource, since this is POST).
    """
    import time
    start_time = time.time()

    async def event_generator():
        chunks = chunk_transcript(payload.transcript)
        total  = len(chunks)
        all_chunk_results: list[dict] = []
        analysis_type = payload.analysis_type

        run_classify = analysis_type in ("full", "classify")
        run_extract = analysis_type in ("full", "extract")
        run_summarize = analysis_type in ("full", "summarize")

        # ── INIT ──────────────────────────────────────────────────────────────
        yield _sse("init", {
            "total_chunks": total,
            "chunk_sizes":  [len(c) for c in chunks],
            "message": f"Speech split into {total} chunk{'s' if total > 1 else ''} of ≤{CHUNK_SIZE} characters each.",
        })

        for i, chunk_text in enumerate(chunks):
            preview = chunk_text[:100].replace("\n", " ") + ("…" if len(chunk_text) > 100 else "")

            # ── CHUNK START ───────────────────────────────────────────────────
            yield _sse("chunk_start", {
                "chunk_index": i,
                "total":       total,
                "chars":       len(chunk_text),
                "preview":     preview,
            })

            chunk_result: dict = {}

            # Step 1 — Classify (LLaMA 3.2)
            if run_classify:
                yield _sse("chunk_progress", {
                    "chunk_index": i,
                    "step":        "classify",
                    "status":      "running",
                    "message":     f"[Chunk {i+1}/{total}] → Classifying sentiment + agenda with LLaMA 3.2…",
                })
                try:
                    classify_raw = await _post(CLASSIFY_URL, {"transcript": chunk_text})
                    if isinstance(classify_raw, str) or "_raw" in classify_raw:
                        classify_result = {"sentiment": "Neutral", "agenda": []}
                    else:
                        r = classify_raw.get("result") if isinstance(classify_raw.get("result"), dict) else classify_raw
                        raw_s = str(r.get("sentiment", "neutral")).lower()
                        s = "Positive" if "positive" in raw_s else ("Negative" if "negative" in raw_s else "Neutral")
                        classify_result = {"sentiment": s, "agenda": _to_list(r.get("agenda", []))}
                    chunk_result["classify"] = classify_result
                    yield _sse("chunk_progress", {
                        "chunk_index": i,
                        "step":        "classify",
                        "status":      "done",
                        "message":     f"[Chunk {i+1}/{total}] ✓ Sentiment: {classify_result['sentiment']} | Agenda: {', '.join(classify_result['agenda']) or 'none'}",
                        "result":      classify_result,
                    })
                except Exception as exc:
                    chunk_result["classify"] = {"sentiment": "Neutral", "agenda": [], "error": str(exc)}
                    yield _sse("chunk_progress", {
                        "chunk_index": i, "step": "classify", "status": "error",
                        "message": f"[Chunk {i+1}/{total}] ✗ Classify error: {exc}",
                    })

            # Step 2 — Extract (Gemma 3)
            if run_extract:
                yield _sse("chunk_progress", {
                    "chunk_index": i,
                    "step":        "extract",
                    "status":      "running",
                    "message":     f"[Chunk {i+1}/{total}] → Extracting promises + achievements with Gemma 3…",
                })
                try:
                    extract_result = await fetch_extracted_promises(chunk_text)
                    chunk_result["extract"] = extract_result
                    yield _sse("chunk_progress", {
                        "chunk_index": i,
                        "step":        "extract",
                        "status":      "done",
                        "message":     (
                            f"[Chunk {i+1}/{total}] ✓ {len(extract_result['promises'])} promise(s), "
                            f"{len(extract_result['achievements'])} achievement(s) | Type: {extract_result['speech_type']}"
                        ),
                        "result": extract_result,
                    })
                except Exception as exc:
                    chunk_result["extract"] = {"promises": [], "achievements": [], "speech_type": "unknown", "error": str(exc)}
                    yield _sse("chunk_progress", {
                        "chunk_index": i, "step": "extract", "status": "error",
                        "message": f"[Chunk {i+1}/{total}] ✗ Extract error: {exc}",
                    })

            # Step 3 — Summarize (Qwen 2.5)
            if run_summarize:
                yield _sse("chunk_progress", {
                    "chunk_index": i,
                    "step":        "summarize",
                    "status":      "running",
                    "message":     f"[Chunk {i+1}/{total}] → Summarizing with Qwen 2.5…",
                })
                try:
                    summarize_raw = await _post(SUMMARIZE_URL, {"transcript": chunk_text})
                    if isinstance(summarize_raw, str):
                        summarize_result = {"summary": summarize_raw.strip(), "key_points": []}
                    elif "_raw" in summarize_raw:
                        summarize_result = {"summary": summarize_raw["_raw"].strip(), "key_points": []}
                    else:
                        r = summarize_raw.get("result") if isinstance(summarize_raw.get("result"), dict) else summarize_raw
                        summary_text = r.get("summary") or r.get("result") or r.get("text") or r.get("output") or ""
                        if isinstance(summary_text, dict):
                            summary_text = summary_text.get("summary") or summary_text.get("text") or str(summary_text)
                        summarize_result = {
                            "summary":    str(summary_text).strip(),
                            "key_points": _to_list(r.get("key_points") or r.get("key_takeaways") or []),
                        }
                    chunk_result["summarize"] = summarize_result
                    preview_summary = summarize_result["summary"][:120] + "…" if len(summarize_result.get("summary", "")) > 120 else summarize_result.get("summary", "")
                    yield _sse("chunk_progress", {
                        "chunk_index": i,
                        "step":        "summarize",
                        "status":      "done",
                        "message":     f"[Chunk {i+1}/{total}] ✓ Summary: {preview_summary}",
                        "result":      summarize_result,
                    })
                except Exception as exc:
                    chunk_result["summarize"] = {"summary": "", "key_points": [], "error": str(exc)}
                    yield _sse("chunk_progress", {
                        "chunk_index": i, "step": "summarize", "status": "error",
                        "message": f"[Chunk {i+1}/{total}] ✗ Summarize error: {exc}",
                    })

            # ── CHUNK RESULT ──────────────────────────────────────────────────
            all_chunk_results.append(chunk_result)
            yield _sse("chunk_result", {
                "chunk_index": i,
                "total":       total,
                "chunk_text":  chunk_text,
                "classify":    chunk_result.get("classify", {}),
                "extract":     chunk_result.get("extract", {}),
                "summarize":   chunk_result.get("summarize", {}),
            })

        # ── GPT AGGREGATION ───────────────────────────────────────────────────
        if not openai_client:
            yield _sse("error", {
                "message": "OPENAI_API_KEY not configured — skipping aggregation. Set it in backend/.env",
            })
        else:
            yield _sse("aggregating", {
                "message": f"All {total} chunk(s) processed. Synthesizing unified analysis with GPT-4.1-nano…",
            })
            try:
                aggregated = await gpt_aggregate(all_chunk_results, total, analysis_type)
                yield _sse("final_result", {
                    "sentiment":          aggregated.get("sentiment", "Neutral") if run_classify else None,
                    "sentiment_reasoning":aggregated.get("sentiment_reasoning", "") if run_classify else None,
                    "agenda":             aggregated.get("agenda", []) if run_classify else None,
                    "agenda_breakdown":   aggregated.get("agenda_breakdown", []) if run_classify else None,
                    "promises":           aggregated.get("promises", []) if run_extract else None,
                    "achievements":       aggregated.get("achievements", []) if run_extract else None,
                    "speech_type":        aggregated.get("speech_type", "unknown") if run_extract else None,
                    "summary":            aggregated.get("summary", "") if run_summarize else None,
                    "key_points":         aggregated.get("key_points", []) if run_summarize else None,
                })
            except Exception as exc:
                yield _sse("error", {"message": f"GPT aggregation failed: {exc}"})

        # ── DONE ──────────────────────────────────────────────────────────────
        elapsed = round(time.time() - start_time, 1)
        yield _sse("done", {
            "total_time_seconds": elapsed,
            "message": f"Analysis complete in {elapsed}s",
        })

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control":    "no-cache",
            "X-Accel-Buffering": "no",      # disable nginx buffering
            "Connection":       "keep-alive",
        },
    )


# ── Agenda Detail Drill-down (GPT) ─────────────────────────────────────────────
@app.post("/agenda-detail")
async def agenda_detail(payload: AgendaDetailPayload):
    """
    Use GPT-4.1-nano to extract everything the speaker said about a specific
    agenda topic from the full transcript.

    GPT has a 1M token context window so no chunking is needed here — the full
    speech is sent in a single call for complete, accurate attribution.

    Returns: { agenda_topic, statements: [{text, type}], overall_stance }
    """
    if not openai_client:
        raise HTTPException(status_code=503, detail="OPENAI_API_KEY not configured.")

    topic = payload.agenda_topic.strip()
    transcript = payload.transcript.strip()

    if not topic or not transcript:
        raise HTTPException(status_code=422, detail="Both transcript and agenda_topic are required.")

    system_msg = (
        "You are a precise political speech analyst.\n\n"
        f"Given a political speech transcript and the policy topic '{topic}', "
        f"extract ALL statements the speaker made that relate to {topic}.\n\n"
        "For each statement:\n"
        "  - 'text'  : a direct quote or very close paraphrase (keep numbers and names exact)\n"
        "  - 'type'  : one of: 'promise' | 'achievement' | 'claim' | 'criticism'\n"
        "      promise     = future commitment (will, going to, pledge, plan to)\n"
        "      achievement = past/present accomplishment (have done, we achieved, already)\n"
        "      claim       = general assertion or position statement\n"
        "      criticism   = attacking opponents or status quo\n\n"
        "Also write a brief 1-2 sentence 'overall_stance' describing the speaker's overall "
        f"position on {topic}.\n\n"
        "If the speaker made NO statements about this topic, return an empty statements list.\n\n"
        "Return ONLY valid JSON — no markdown, no extra text:\n"
        "{\n"
        f'  "agenda_topic": "{topic}",\n'
        '  "statements": [\n'
        '    { "text": "...", "type": "promise|achievement|claim|criticism" }\n'
        "  ],\n"
        '  "overall_stance": "..."\n'
        "}"
    )

    try:
        response = await openai_client.chat.completions.create(
            model=GPT_MODEL,
            messages=[
                {"role": "system", "content": system_msg},
                {"role": "user",   "content": f"Speech transcript:\n{transcript}"},
            ],
            temperature=0.2,
            max_tokens=1200,
        )

        raw = response.choices[0].message.content.strip()

        try:
            clean = raw
            if clean.startswith("```json"):
                clean = clean.split("```json")[1].split("```")[0].strip()
            elif clean.startswith("```"):
                clean = clean.split("```")[1].split("```")[0].strip()
            return json.loads(clean)
        except Exception:
            s, e = raw.find("{"), raw.rfind("}")
            if s != -1 and e != -1:
                try:
                    return json.loads(raw[s:e+1])
                except Exception:
                    pass
        return {"agenda_topic": topic, "statements": [], "overall_stance": raw}

    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"GPT agenda-detail error: {str(exc)}")


# ── Health Check ───────────────────────────────────────────────────────────────
@app.get("/")
async def home():
    return {
        "status":        "Political Speech Analyzer API running",
        "version":       "3.0.0",
        "vosk":          "loaded" if vosk_model else "not loaded",
        "gpt_model":     GPT_MODEL,
        "gpt_ready":     bool(OPENAI_API_KEY),
        "chunk_size":    CHUNK_SIZE,
        "remote_base":   REMOTE_BASE,
        "endpoints": {
            "legacy":    ["/upload-audio", "/classify", "/extract", "/summarize"],
            "new":       ["/analyze-stream (SSE)", "/agenda-detail"],
        },
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
