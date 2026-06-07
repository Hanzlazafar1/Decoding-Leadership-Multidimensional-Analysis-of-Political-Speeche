import os
import json
import wave
import httpx
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import vosk
from pydub import AudioSegment

app = FastAPI(title="Political Speech Analyzer", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── External LLM API Config ────────────────────────────────────────────────────
# Base URL of your remote LLM server (ngrok or otherwise)
REMOTE_BASE = os.getenv("REMOTE_BASE", "https://yard-prissy-washer.ngrok-free.dev")

CLASSIFY_URL  = os.getenv("CLASSIFY_URL",  f"{REMOTE_BASE}/classify")
EXTRACT_URL   = os.getenv("EXTRACT_URL",   f"{REMOTE_BASE}/extract")
SUMMARIZE_URL = os.getenv("SUMMARIZE_URL", f"{REMOTE_BASE}/summarize")

# Shared headers for every outgoing LLM request
_HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "ngrok-skip-browser-warning": "true",
}

# ── Load Vosk Model ────────────────────────────────────────────────────────────
MODEL_PATH = "model"
if not os.path.exists(MODEL_PATH):
    print("⚠️  Vosk model not found. Download from https://alphacephei.com/vosk/models")
    vosk_model = None
else:
    vosk_model = vosk.Model(MODEL_PATH)


# ── Pydantic Schemas ───────────────────────────────────────────────────────────
class SpeechPayload(BaseModel):
    speech: str


# ── External LLM HTTP Helpers ──────────────────────────────────────────────────
async def _post(url: str, body: dict) -> dict:
    """POST JSON to a remote LLM endpoint, return parsed response dict."""
    async with httpx.AsyncClient(timeout=180.0) as client:
        resp = await client.post(url, json=body, headers=_HEADERS)
        resp.raise_for_status()
        return resp.json()


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

    Calls the remote /classify endpoint and returns:
      - sentiment : 'positive' | 'negative' | 'neutral'
      - agenda    : list of detected agenda topics
      - raw_output: raw model response
    """
    try:
        data = await _post(CLASSIFY_URL, {"speech": payload.speech})
        # Normalise sentiment to capitalised form for the UI
        raw_sentiment = str(data.get("sentiment", "neutral")).lower()
        if "positive" in raw_sentiment:
            sentiment = "Positive"
        elif "negative" in raw_sentiment:
            sentiment = "Negative"
        else:
            sentiment = "Neutral"

        # agenda may arrive as a list or a comma-separated string
        raw_agenda = data.get("agenda", [])
        if isinstance(raw_agenda, str):
            agenda = [a.strip() for a in raw_agenda.split(",") if a.strip()]
        else:
            agenda = [str(a).strip() for a in raw_agenda if str(a).strip()]

        return {
            "sentiment":  sentiment,
            "agenda":     agenda,
            "raw_output": data.get("raw_output", ""),
        }
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"Remote classify API error {e.response.status_code}: {e.response.text}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Classify API error: {str(e)}")


# ── Extraction Endpoint ────────────────────────────────────────────────────────
@app.post("/extract")
async def extract_promises(payload: SpeechPayload):
    """
    Promise + Achievement Extraction using Gemma 3 4B (QLoRA).

    Calls the remote /extract endpoint and returns:
      - success     : whether parsing succeeded
      - promises    : list of promises made
      - achievements: list of achievements claimed
      - speech_type : detected type of speech
      - raw_output  : raw model response
    """
    try:
        data = await _post(EXTRACT_URL, {"speech": payload.speech})
        success = data.get("success", False)
        result  = data.get("result", {})

        # Handle both flat and nested response shapes
        promises     = result.get("promises",     data.get("promises",     []))
        achievements = result.get("achievements", data.get("achievements", []))
        speech_type  = result.get("speech_type",  data.get("speech_type",  "unknown"))

        return {
            "success":      success,
            "promises":     promises     if isinstance(promises,     list) else [],
            "achievements": achievements if isinstance(achievements, list) else [],
            "speech_type":  speech_type,
            "raw_output":   data.get("raw_output", ""),
        }
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"Remote extract API error {e.response.status_code}: {e.response.text}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Extract API error: {str(e)}")


# ── Summarization Endpoint ─────────────────────────────────────────────────────
@app.post("/summarize")
async def summarize_speech(payload: SpeechPayload):
    """
    Speech Summarization using Qwen 2.5 3B (QLoRA).

    Calls the remote /summarize endpoint and returns:
      - summary   : concise summary of the speech
      - key_points: list of key takeaways (if returned by model)
    """
    try:
        data = await _post(SUMMARIZE_URL, {"speech": payload.speech})

        # The remote API returns { summary: "..." }
        # key_points may or may not be present
        summary    = data.get("summary", "")
        key_points = data.get("key_points", [])
        if isinstance(key_points, str):
            key_points = [k.strip() for k in key_points.split(";") if k.strip()]

        return {
            "summary":    summary,
            "key_points": key_points,
        }
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"Remote summarize API error {e.response.status_code}: {e.response.text}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Summarize API error: {str(e)}")


# ── Health Check ───────────────────────────────────────────────────────────────
@app.get("/")
async def home():
    return {
        "status":        "Political Speech Analyzer API running",
        "version":       "2.0.0",
        "vosk":          "loaded" if vosk_model else "not loaded",
        "classify_url":  CLASSIFY_URL,
        "extract_url":   EXTRACT_URL,
        "summarize_url": SUMMARIZE_URL,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
