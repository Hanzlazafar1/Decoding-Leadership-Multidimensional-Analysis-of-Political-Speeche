import React from 'react';
import Navbar from './components/Navbar';
import FullAnalysis from './components/FullAnalysis';
import { Shield, Sparkles, Mic, Layers } from 'lucide-react';
import './App.css';

function App() {
  return (
    <div className="app-container">
      <Navbar />

      {/* Hero Section */}
      <header className="hero section" id="hero">
        <div className="hero-badge">
          <Sparkles size={14} className="shimmer-icon" />
          <span>AI-Powered Rhetorical Analytics Engine</span>
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

      {/* -- Main Workspace Section ------------------------------------- */}
      <main className="workspace section">
        <div className="glass-card full-mode-info" style={{ marginBottom: '24px' }}>
          <div className="full-mode-info-inner">
            <Layers size={18} style={{ color: 'var(--accent-purple)' }} />
            <div>
              <strong>Unified Analysis Pipeline</strong>
              <p>
                Upload an audio file or paste text directly. Long speeches are automatically split into =6,000-character chunks. 
                Select your target analysis to selectively execute LLaMA 3.2, Gemma 3, and Qwen 2.5 models. 
                Results stream live below. When complete, the Advanced AI synthesizes a unified, deduplicated report.
              </p>
            </div>
          </div>
        </div>
        
        <FullAnalysis />
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
            <span className="footer-heart-emoji">??</span>
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
