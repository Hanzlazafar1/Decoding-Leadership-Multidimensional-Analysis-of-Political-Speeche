<div align="center">

# 🏛️ Decoding Leadership
### *Multidimensional Analysis of Political Speeches*

**An AI-powered rhetoric intelligence platform that transcribes, dissects, and visualizes political speeches — uncovering sentiment, agendas, promises, and achievements through a pipeline of fine-tuned language models.**

🎓 **Final Year Project (FYP)**

<br/>

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Async%20API-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-JS-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-Build%20Tool-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4.1--nano-412991?style=for-the-badge&logo=openai&logoColor=white)](https://platform.openai.com/)
[![Vosk](https://img.shields.io/badge/Vosk-Speech%20to%20Text-FF6F00?style=for-the-badge)](https://alphacephei.com/vosk/)
[![FFmpeg](https://img.shields.io/badge/FFmpeg-Audio%20Processing-007808?style=for-the-badge&logo=ffmpeg&logoColor=white)](https://ffmpeg.org/)

[![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](#-license)
[![Status](https://img.shields.io/badge/Status-Active%20Development-brightgreen?style=for-the-badge)](#)

</div>

<br/>

## 📖 Overview

**Decoding Leadership** is an advanced web application and analysis engine built to evaluate political speeches at scale. It combines **local, offline speech-to-text transcription** with a suite of **specialized fine-tuned LLMs** and a **GPT synthesis layer** to produce a rich, multidimensional breakdown of rhetoric — sentiment, policy agendas, promises, achievements, and summarized insights — all streamed live to the frontend as the analysis happens.

---

## 🌟 Core Features

| Feature | Description |
|---|---|
| 🎙️ **Local Speech Transcription** | Transcribes speech audio files fully offline using the **Vosk** (Kaldi-based) speech recognition engine — no cloud dependency, full data privacy. |
| 🧠 **Sentiment & Agenda Mapping** | **LLaMA 3.2 3B** detects overall speech sentiment and maps text segments to political/policy agenda topics (economy, education, defense, etc.). |
| 📜 **Promises & Achievements Extraction** | **Gemma 3 4B** identifies specific, verifiable commitments and accomplishments, and classifies overall speech type. |
| ✍️ **Segment Summarization** | **Qwen 2.5 3B** generates concise segment-level summaries and key bullet-point takeaways. |
| ⚡ **Real-Time SSE Streaming** | Streams analysis progress chunk-by-chunk via Server-Sent Events, giving the frontend live log output as the pipeline runs. |
| 🧩 **Smart GPT Aggregation** | A GPT synthesis layer deduplicates and reconciles overlapping promises/achievements into one unified, coherent report. |
| 🔍 **Agenda Drill-Down Analysis** | Explore any policy topic in depth — view every direct quote tied to it, classified as a promise, achievement, claim, or criticism. |

---

## 🏗️ Architecture

```mermaid
graph TD
    A[Speech Audio / Text Input] -->|Frontend| B(React App)
    B -->|FastAPI| C[Backend Engine]
    C -->|Vosk Model| D[Local Audio Transcriber]
    C -->|Chunking & Streaming| E[Chunked Analysis Pipeline]
    E -->|Sentiment & Agenda| F[LLaMA 3.2 3B]
    E -->|Promises & Achievements| G[Gemma 3 4B]
    E -->|Summarization| H[Qwen 2.5 3B]
    E -->|Synthesis & Drill-down| I[GPT-4.1-nano Synthesis]
    I -->|SSE Unified JSON| B
```

---

## 🛠️ Technology Stack

<div align="center">

### Backend
![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-Framework-009688?style=flat-square&logo=fastapi&logoColor=white)
![Vosk](https://img.shields.io/badge/Vosk-STT%20Engine-FF6F00?style=flat-square)
![PyDub](https://img.shields.io/badge/PyDub-Audio-2C3E50?style=flat-square&logo=python&logoColor=white)
![FFmpeg](https://img.shields.io/badge/FFmpeg-Audio%20Codec-007808?style=flat-square&logo=ffmpeg&logoColor=white)
![HTTPX](https://img.shields.io/badge/HTTPX-Async%20Client-0A9EDC?style=flat-square)
![OpenAI](https://img.shields.io/badge/OpenAI-SDK-412991?style=flat-square&logo=openai&logoColor=white)

### AI / LLM Layer
![LLaMA](https://img.shields.io/badge/LLaMA%203.2%203B-Sentiment%20%26%20Agenda-0467DF?style=flat-square&logo=meta&logoColor=white)
![Gemma](https://img.shields.io/badge/Gemma%203%204B-Promises%20%26%20Achievements-4285F4?style=flat-square&logo=google&logoColor=white)
![Qwen](https://img.shields.io/badge/Qwen%202.5%203B-Summarization-6236FF?style=flat-square)
![GPT](https://img.shields.io/badge/GPT--4.1--nano-Synthesis%20Layer-412991?style=flat-square&logo=openai&logoColor=white)

### Frontend
![React](https://img.shields.io/badge/React.js-UI%20Library-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-Build%20Tool-646CFF?style=flat-square&logo=vite&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-Custom%20Styling-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=flat-square&logo=javascript&logoColor=black)

</div>

| Layer | Technology | Purpose |
|---|---|---|
| **Language** | Python 3.11+ | Core backend logic |
| **API Framework** | FastAPI | Asynchronous endpoints & SSE streaming |
| **Speech-to-Text** | Vosk (Offline Kaldi engine) | Local, private audio transcription |
| **Audio Processing** | PyDub & FFmpeg | Audio decoding, chunking, normalization |
| **LLM Orchestration** | HTTPX Async Clients + AsyncOpenAI | Communicates with fine-tuned model microservices & GPT |
| **Frontend Language** | JavaScript (React.js) | Interactive, component-based UI |
| **Build Tool** | Vite | Fast dev server & optimized builds |
| **Styling** | Premium Vanilla CSS | Responsive design, live logs, dynamic charts |

---

## 🚀 Setup & Installation

### ✅ Prerequisites
- Python 3.11+
- Node.js & npm
- `ffmpeg` installed and available on your system `PATH`

### ⚙️ Backend Setup

**1. Navigate to the backend directory and install dependencies**
```bash
cd backend
pip install -r requirements.txt
```

**2. Download the Vosk speech model**

Download a suitable model from [Vosk Models](https://alphacephei.com/vosk/models) (e.g. `vosk-model-small-en-us-0.15` or a standard-sized model), extract it, and rename the folder to `model` inside `backend/`:

```
backend/model/
```

**3. Configure environment variables**

Create a `.env` file inside `backend/`:

```env
OPENAI_API_KEY=your_openai_api_key_here
REMOTE_BASE=https://your-llm-hosting-base-url.dev
```

**4. Run the backend server**
```bash
python main.py
```

> 🌐 The API will be available at `http://localhost:8000`

### 💻 Frontend Setup

**1. Install dependencies**
```bash
cd frontend
npm install
```

**2. Start the development server**
```bash
npm run dev
```

> 🌐 Open `http://localhost:5173` in your browser

---

## 📊 Pipeline Flow

1. **Input** — User uploads a speech audio file or pastes raw text.
2. **Transcription** — Vosk converts audio to text locally (skipped for text input).
3. **Chunking** — The speech is segmented for parallel analysis.
4. **Multi-Model Analysis** — LLaMA, Gemma, and Qwen each process the chunks concurrently for sentiment/agenda, promises/achievements, and summaries respectively.
5. **Streaming** — Results stream to the frontend in real time via SSE.
6. **Synthesis** — GPT-4.1-nano deduplicates and merges outputs into one unified report.
7. **Drill-Down** — Users explore specific agenda topics with full quote-level detail.

---

## 📈 Language Statistics

This repository is configured via `.gitattributes` to emphasize the core engineering component, presenting **Python** as the primary language.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome. Feel free to check the [issues page](../../issues) or open a pull request.

## 📄 License

This project is licensed under the **MIT License** — see the `LICENSE` file for details.

---

<div align="center">

**Built with 🧠 AI, ⚡ FastAPI, and ❤️ for political transparency**

</div>
