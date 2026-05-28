import React, { useState } from 'react';
import Navbar from './components/Navbar';
import AudioUploader from './components/AudioUploader';
import TranscriptPanel from './components/TranscriptPanel';
import ResultsSection from './components/ResultsSection';
import { Shield, Sparkles, Mic, FileText, ChevronRight } from 'lucide-react';
import './App.css';

function App() {
  const [transcript, setTranscript] = useState('');
  const [speechId, setSpeechId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleTranscript = (text, id) => {
    setTranscript(text);
    setSpeechId(id);
    // Smooth scroll to the results section after transcript is ready
    setTimeout(() => {
      document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="app-container">
      <Navbar />

      {/* Hero Section */}
      <header className="hero section" id="hero">
        <div className="hero-badge">
          <Sparkles size={14} className="shimmer-icon" />
          <span></span>
        </div>
        <h1 className="hero-title">
          Decoding Leadership
        </h1>
        <p className="hero-subtitle">
          Multidimensional Analysis of Political Speeches
        </p>
        <p className="hero-description">
          An advanced intelligence platform that leverages offline <strong>ASR (Vosk)</strong> for zero-latency speech-to-text conversion, coupled with <strong>LLaMA</strong> and <strong>Gemma</strong> large language models to dissect the tone, agenda, promises, and rhetoric of political leadership.
        </p>

        <div className="hero-features">
          <div className="feature-card glass-card">
            <div className="feature-icon-wrap blue">
              <Mic size={20} />
            </div>
            <h3>Local Speech ASR</h3>
            <p>Vosk offline speech recognition model extracts raw text directly from complex political audio files locally.</p>
          </div>
          <div className="feature-card glass-card">
            <div className="feature-icon-wrap purple">
              <Shield size={20} />
            </div>
            <h3>LLM Dissection</h3>
            <p>Four parallel intelligence pipelines run across multiple parameters to decode political sentiment, topics, and promises.</p>
          </div>
        </div>
      </header>

      {/* Main Workspace Section */}
      <main className="workspace section">
        <div className="workspace-grid">
          {/* Left panel: Upload and Instructions */}
          <div className="workspace-left">
            <div className="glass-card instruction-card">
              <h2>Speech Transcription Engine</h2>
              <p>Upload a clear recording of a political address, press conference, or debate statement. The speech engine will automatically transcribe, compile, and prepare the content for deep LLM analysis.</p>

              <div className="workflow-steps">
                <div className="step-item">
                  <div className="step-number">1</div>
                  <div className="step-detail">
                    <strong>Audio Input</strong>
                    <span>Upload your file (.wav, .mp3, .mp4, etc.)</span>
                  </div>
                </div>
                <div className="step-item">
                  <div className="step-number">2</div>
                  <div className="step-detail">
                    <strong>Vosk ASR Decode</strong>
                    <span>Extract word sequences offline</span>
                  </div>
                </div>
                <div className="step-item">
                  <div className="step-number">3</div>
                  <div className="step-detail">
                    <strong>Parallel Analytics</strong>
                    <span>Feed the text to LLaMA & Gemma models</span>
                  </div>
                </div>
              </div>
            </div>

            <AudioUploader
              onTranscript={handleTranscript}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          </div>

          {/* Right panel: Transcript output */}
          <div className="workspace-right">
            {transcript ? (
              <TranscriptPanel transcript={transcript} speechId={speechId} />
            ) : (
              <div className="glass-card empty-transcript">
                <div className="empty-icon-ring">
                  <FileText size={32} />
                </div>
                <h3>Transcript Ready Area</h3>
                <p>Once you upload and transcribe your speech, the transcribed text and statistics will appear here. The system will then automatically launch the multidimensional analytical dashboards below.</p>
                <div className="empty-indicator">
                  <span>Awaiting Speech File</span>
                  <ChevronRight size={14} className="bounce-arrow" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        {transcript && (
          <>
            <div className="divider" />
            <ResultsSection transcript={transcript} />
          </>
        )}
      </main>

      <footer className="app-footer">
        <div className="footer-inner section">
          <div className="footer-quote">
            <span className="footer-quote-mark">&ldquo;</span>
            <p className="footer-quote-text">
              Words have the power to shape minds,<br />
              move nations, and define history.
            </p>
            <span className="footer-quote-mark footer-quote-mark--close">&rdquo;</span>
          </div>
          <div className="footer-credit">
            <span className="footer-heart">Made with</span>
            <span className="footer-heart-emoji">❤️</span>
            <span className="footer-heart">by</span>
            <span className="footer-authors">
              <span className="footer-author">Ameer Hamza</span>
              <span className="footer-author-sep">&amp;</span>
              <span className="footer-author">Hanzla Zafar</span>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
