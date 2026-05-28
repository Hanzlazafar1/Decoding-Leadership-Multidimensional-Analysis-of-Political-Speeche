import os
import json
import wave
import re
import httpx
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import vosk
from pydub import AudioSegment

app = FastAPI(title="Political Speech Analyzer", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── LLM API Config ─────────────────────────────────────────────────────────────
LLAMA_API_URL = os.getenv("LLAMA_API_URL", "https://yard-prissy-washer.ngrok-free.dev/generate")
GEMMA_API_URL = os.getenv("GEMMA_API_URL", LLAMA_API_URL)  # Defaults to LLaMA if no Gemma URL set
GEMMA_EXTRACT_URL = os.getenv("GEMMA_EXTRACT_URL", "https://yard-prissy-washer.ngrok-free.dev/extract")

# ── Load Vosk Model ────────────────────────────────────────────────────────────
MODEL_PATH = "model"
if not os.path.exists(MODEL_PATH):
    print("⚠️  Vosk model not found. Download from https://alphacephei.com/vosk/models and unpack as 'model'.")
    model = None
else:
    model = vosk.Model(MODEL_PATH)


# ── Pydantic Schemas ───────────────────────────────────────────────────────────
class TextPayload(BaseModel):
    text: str


# ── LLM HTTP Helper ────────────────────────────────────────────────────────────
async def call_llm(api_url: str, prompt: str) -> str:
    """Call an external LLM API (LLaMA / Gemma) and return the raw text response."""
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            api_url,
            json={"prompt": prompt},
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json",
                "ngrok-skip-browser-warning": "true",
            },
        )
        response.raise_for_status()
        data = response.json()
        return data.get("response", "")


async def call_gemma_extract(api_url: str, transcript: str) -> dict:
    """Call the Gemma extraction API and return the raw JSON dict."""
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            api_url,
            json={"transcript": transcript},
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json",
                "ngrok-skip-browser-warning": "true",
            },
        )
        response.raise_for_status()
        return response.json()


# ── Audio Upload & Vosk Transcription ─────────────────────────────────────────
@app.post("/upload-audio")
async def upload_audio(file: UploadFile = File(...)):
    if not model:
        raise HTTPException(status_code=500, detail="Vosk model not loaded on server.")

    file_location = f"temp_{file.filename}"
    with open(file_location, "wb+") as file_object:
        file_object.write(file.file.read())

    try:
        audio = AudioSegment.from_file(file_location)
        audio = audio.set_channels(1).set_frame_rate(16000)
        wav_location = f"converted_{file.filename}.wav"
        audio.export(wav_location, format="wav")
    except Exception as e:
        os.remove(file_location)
        raise HTTPException(status_code=400, detail=f"Audio conversion failed: {str(e)}")

    transcript = ""
    try:
        wf = wave.open(wav_location, "rb")
        rec = vosk.KaldiRecognizer(model, wf.getframerate())
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


# ── Response Parsers ───────────────────────────────────────────────────────────

def clean_list_items(val: str) -> list[str]:
    """Helper to cleanly parse lists, handling JSON arrays and stripping brackets/quotes."""
    val_stripped = val.strip()
    if val_stripped.startswith('[') and val_stripped.endswith(']'):
        try:
            parsed = json.loads(val_stripped)
            if isinstance(parsed, list):
                return [str(item).strip(" '\"[]").strip() for item in parsed if str(item).strip()]
        except Exception:
            pass

    # Split by semicolon or comma, whichever is present
    delimiter = ";" if ";" in val_stripped else ","
    items = []
    for item in val_stripped.split(delimiter):
        item_cleaned = item.strip(" '\"[]").strip()
        if item_cleaned:
            items.append(item_cleaned)
    return items


def parse_sentiment_response(raw: str) -> dict:
    """Parse LLaMA sentiment response into structured JSON."""
    sentiment = "Neutral"
    agenda: list[str] = []
    explanation = ""

    for line in raw.strip().splitlines():
        line = line.strip()
        if re.match(r"(?i)^sentiment\s*:", line):
            val = line.split(":", 1)[1].strip()
            if "positive" in val.lower():
                sentiment = "Positive"
            elif "negative" in val.lower():
                sentiment = "Negative"
            else:
                sentiment = "Neutral"
        elif re.match(r"(?i)^agenda\s*:", line):
            val = line.split(":", 1)[1].strip()
            agenda = clean_list_items(val)
        elif re.match(r"(?i)^explanation\s*:", line):
            explanation = line.split(":", 1)[1].strip()

    # Fallback: if model returned plain text not following format
    if not explanation:
        explanation = raw.strip()

    return {"sentiment": sentiment, "agenda": agenda, "explanation": explanation}


def parse_agenda_response(raw: str) -> dict:
    """Parse LLaMA agenda/buzzword response."""
    topics: list[str] = []
    buzzwords: list[str] = []
    context = ""

    for line in raw.strip().splitlines():
        line = line.strip()
        if re.match(r"(?i)^topics\s*:", line):
            val = line.split(":", 1)[1].strip()
            topics = clean_list_items(val)
        elif re.match(r"(?i)^buzzwords\s*:", line):
            val = line.split(":", 1)[1].strip()
            buzzwords = clean_list_items(val)
        elif re.match(r"(?i)^context\s*:", line):
            context = line.split(":", 1)[1].strip()

    # Fallback: extract capitalized noun phrases
    if not topics and not buzzwords:
        words = re.findall(r"\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b", raw)
        topics = list(dict.fromkeys(words))[:8]

    return {"topics": topics, "buzzwords": buzzwords, "context": context}


def parse_promises_response(raw: str) -> dict:
    """Parse Gemma promises/achievements response."""
    promises: list[str] = []
    achievements: list[str] = []

    for line in raw.strip().splitlines():
        line = line.strip()
        if re.match(r"(?i)^promises\s*:", line):
            val = line.split(":", 1)[1].strip()
            if val.lower() not in ("none", ""):
                promises = clean_list_items(val)
        elif re.match(r"(?i)^achievements\s*:", line):
            val = line.split(":", 1)[1].strip()
            if val.lower() not in ("none", ""):
                achievements = clean_list_items(val)

    return {"promises": promises, "achievements": achievements}


def parse_summary_response(raw: str) -> dict:
    """Parse Gemma summarization response."""
    summary = ""
    key_points: list[str] = []

    for line in raw.strip().splitlines():
        line = line.strip()
        if re.match(r"(?i)^summary\s*:", line):
            summary = line.split(":", 1)[1].strip()
        elif re.match(r"(?i)^key\s*points\s*:", line):
            val = line.split(":", 1)[1].strip()
            key_points = clean_list_items(val)

    if not summary:
        summary = raw.strip()

    return {"summary": summary, "key_points": key_points}



# ── LLM Analysis Endpoints ─────────────────────────────────────────────────────

@app.post("/api/sentiment")
async def analyze_sentiment(payload: TextPayload):
    """Sentiment analysis using LLaMA model."""
    prompt = (
        "Analyze this political speech for sentiment and agenda. "
        "Respond ONLY in this exact format with no additional text or preamble:\n"
        "Sentiment: [Positive/Negative/Neutral]\n"
        "Agenda: [comma-separated list of main political topics, max 6]\n"
        "Explanation: [2-3 sentence explanation of the overall tone and focus]\n\n"
        f"Speech: {payload.text}"
    )
    try:
        raw = await call_llm(LLAMA_API_URL, prompt)
        return parse_sentiment_response(raw)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM API error: {str(e)}")


@app.post("/api/agenda")
async def detect_agenda(payload: TextPayload):
    """Agenda detection and buzzword extraction using LLaMA model."""
    prompt = (
        "Extract the main political agenda topics and buzzwords from this speech. "
        "Respond ONLY in this exact format with no additional text or preamble:\n"
        "Topics: [comma-separated list of main agenda topics, max 8]\n"
        "Buzzwords: [comma-separated list of key political buzzwords or phrases, max 10]\n"
        "Context: [one sentence describing the overall political context]\n\n"
        f"Speech: {payload.text}"
    )
    try:
        raw = await call_llm(LLAMA_API_URL, prompt)
        return parse_agenda_response(raw)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM API error: {str(e)}")


@app.post("/api/promises")
async def extract_promises(payload: TextPayload):
    """Promise & achievement extraction using Gemma model."""
    try:
        data = await call_gemma_extract(GEMMA_EXTRACT_URL, payload.text)
        if data.get("success") and "result" in data:
            result = data["result"]
            return {
                "speech_type": result.get("speech_type", "unknown"),
                "promises": result.get("promises", []),
                "achievements": result.get("achievements", [])
            }
        else:
            raise HTTPException(status_code=502, detail="Gemma extract API returned unsuccessful response structure")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM extract API error: {str(e)}")


@app.post("/api/summarize")
async def summarize_speech(payload: TextPayload):
    """Speech summarization using Gemma model."""
    prompt = (
        "Summarize this political speech concisely. "
        "Respond ONLY in this exact format with no additional text or preamble:\n"
        "Summary: [2-3 sentence concise summary of the speech]\n"
        "Key Points: [semicolon-separated list of 4-6 key points or takeaways]\n\n"
        f"Speech: {payload.text}"
    )
    try:
        raw = await call_llm(GEMMA_API_URL, prompt)
        return parse_summary_response(raw)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM API error: {str(e)}")


# ── Health Check ───────────────────────────────────────────────────────────────
@app.get("/")
async def home():
    return {
        "status": "Political Speech Analyzer API running",
        "version": "1.0.0",
        "vosk": "loaded" if model else "not loaded",
        "llama_url": LLAMA_API_URL,
        "gemma_url": GEMMA_API_URL,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
