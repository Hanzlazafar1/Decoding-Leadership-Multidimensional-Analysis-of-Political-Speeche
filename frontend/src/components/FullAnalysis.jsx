import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Send, AlertCircle, RefreshCw, Layers, Mic, Type } from 'lucide-react';
import { analyzeStream } from '../api/speechApi.js';
import LiveLog         from './LiveLog.jsx';
import ChunkResultCard from './ChunkResultCard.jsx';
import AggregatedResult from './AggregatedResult.jsx';
import AudioUploader   from './AudioUploader.jsx';
import './FullAnalysis.css';

const ANALYSIS_MODES = [
  { id: 'full',      label: 'Full Suite' },
  { id: 'classify',  label: 'Sentiment & Agenda' },
  { id: 'extract',   label: 'Promises & Achievements' },
  { id: 'summarize', label: 'Summarization' }
];

export default function FullAnalysis() {
  const [text,        setText]        = useState('');
  const [inputMode,   setInputMode]   = useState('text'); // 'text' | 'audio'
  const [analysisType,setAnalysisType] = useState('full');
  const [isStreaming, setIsStreaming] = useState(false);
  const [events,      setEvents]      = useState([]);
  const [chunkCards,  setChunkCards]  = useState([]);  // array of chunk_result events
  const [finalResult, setFinalResult] = useState(null);
  const [error,       setError]       = useState(null);
  const [done,        setDone]        = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  const reset = () => {
    setEvents([]);
    setChunkCards([]);
    setFinalResult(null);
    setError(null);
    setDone(false);
  };

  const handleAnalyze = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    reset();
    setIsStreaming(true);

    try {
      await analyzeStream(trimmed, analysisType, (event) => {
        // Always push to the log
        setEvents(prev => [...prev, event]);

        // Handle specific event types
        switch (event.type) {
          case 'chunk_result':
            setChunkCards(prev => [...prev, event]);
            break;
          case 'final_result':
            setFinalResult(event);
            break;
          case 'error':
            setError(event.message);
            break;
          case 'done':
            setDone(true);
            break;
          default:
            break;
        }
      });
    } catch (err) {
      setError(err.message);
      setEvents(prev => [...prev, { type: 'error', message: err.message }]);
    } finally {
      setIsStreaming(false);
    }
  }, [text, isStreaming, analysisType]);

  const handleAudioTranscript = (transcriptText) => {
    setText(transcriptText);
    setInputMode('text');
  };

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const estimatedChunks = Math.ceil((text.trim().length || 0) / 6000) || 1;

  return (
    <section className="full-analysis">
      {/* Input area */}
      <div className="fa-input-card glass-card">
        <div className="fa-input-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={16} style={{ color: 'var(--accent-purple)' }} />
            <span style={{ fontWeight: 600 }}>Speech Input Engine</span>
          </div>
          
          {/* Toggles for Input Mode */}
          <div className="input-mode-toggle" style={{ display: 'flex', gap: '5px' }}>
            <button
              className={`mode-btn ${inputMode === 'audio' ? 'active' : ''}`}
              onClick={() => setInputMode('audio')}
              style={{ padding: '6px 12px', fontSize: '13px', display: 'flex', gap: '6px', alignItems: 'center', borderRadius: '4px', border: '1px solid var(--border-color)', background: inputMode === 'audio' ? 'var(--bg-card-hover)' : 'transparent', color: inputMode === 'audio' ? 'white' : 'var(--text-muted)', cursor: 'pointer' }}
            >
              <Mic size={14} /> Audio
            </button>
            <button
              className={`mode-btn ${inputMode === 'text' ? 'active' : ''}`}
              onClick={() => setInputMode('text')}
              style={{ padding: '6px 12px', fontSize: '13px', display: 'flex', gap: '6px', alignItems: 'center', borderRadius: '4px', border: '1px solid var(--border-color)', background: inputMode === 'text' ? 'var(--bg-card-hover)' : 'transparent', color: inputMode === 'text' ? 'white' : 'var(--text-muted)', cursor: 'pointer' }}
            >
              <Type size={14} /> Text
            </button>
          </div>
        </div>

        {inputMode === 'audio' ? (
          <AudioUploader
            onTranscript={handleAudioTranscript}
            isLoading={isLoadingAudio}
            setIsLoading={setIsLoadingAudio}
          />
        ) : (
          <>
            <textarea
              id="full-analysis-textarea"
              className="fa-textarea"
              placeholder="Paste a political speech transcript here… Long speeches are automatically split into chunks of ≈2000 tokens, matching the fine-tuned models' training. Each chunk is queued and processed individually, with results streamed live below."
              value={text}
              onChange={e => setText(e.target.value)}
              rows={10}
              disabled={isStreaming}
            />

            <div className="fa-analysis-type-selector" style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap', alignItems: 'center', padding: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
              <span style={{color: 'var(--text-muted)', fontSize: '13px', marginRight: '4px'}}>Target Analysis:</span>
              {ANALYSIS_MODES.map(mode => (
                <button
                  key={mode.id}
                  className="btn-secondary"
                  onClick={() => setAnalysisType(mode.id)}
                  disabled={isStreaming}
                  style={{
                    padding: '6px 12px', 
                    fontSize: '13px',
                    borderColor: analysisType === mode.id ? 'var(--gold-500)' : 'var(--border-color)',
                    color: analysisType === mode.id ? 'var(--gold-300)' : 'var(--text-muted)',
                    background: analysisType === mode.id ? 'rgba(245, 197, 24, 0.1)' : 'transparent'
                  }}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            <div className="fa-input-footer" style={{ marginTop: '16px' }}>
              <div className="fa-meta">
                <span className="fa-word-count">{wordCount.toLocaleString()} words</span>
                <span className="fa-char-count">{text.trim().length.toLocaleString()} chars</span>
                {text.trim().length > 6000 && (
                  <span className="fa-chunk-hint" style={{ marginLeft: '10px', color: 'var(--accent-purple)' }}>
                    ≈ {estimatedChunks} chunks
                  </span>
                )}
              </div>
              <button
                id="full-analyze-btn"
                className="btn-gold fa-submit"
                onClick={handleAnalyze}
                disabled={!text.trim() || isStreaming}
              >
                {isStreaming
                  ? <><span className="fa-spin-icon">⟳</span> Analyzing…</>
                  : <><Zap size={15} /> Run Analysis</>
                }
              </button>
            </div>
          </>
        )}
      </div>

      {/* Error banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="fa-error glass-card"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <AlertCircle size={18} style={{ color: 'var(--accent-red)', flexShrink: 0 }} />
            <div>
              <p className="fa-error-title">Analysis Error</p>
              <p className="fa-error-msg">{error}</p>
            </div>
            <button className="btn-secondary" onClick={reset}>
              <RefreshCw size={13} /> Reset
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live log */}
      <LiveLog events={events} isStreaming={isStreaming} />

      {/* Per-chunk result cards */}
      <AnimatePresence>
        {chunkCards.length > 0 && (
          <motion.div
            className="fa-chunks-section"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <div className="fa-section-label">
              <span>Per-Chunk Results</span>
              <span className="fa-section-badge">{chunkCards.length} / {chunkCards[0]?.total || '?'}</span>
            </div>
            <div className="fa-chunks-grid">
              {chunkCards.map((card, i) => (
                <ChunkResultCard
                  key={i}
                  chunkIndex={card.chunk_index}
                  total={card.total}
                  classify={card.classify}
                  extract={card.extract}
                  summarize={card.summarize}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Aggregated GPT result */}
      <AnimatePresence>
        {finalResult && (
          <motion.div
            className="fa-final-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="fa-section-label">
              <span>Unified Analysis</span>
              <span className="fa-section-badge fa-gpt-badge">Advanced AI</span>
            </div>
            <AggregatedResult
              result={finalResult}
              fullTranscript={text.trim()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Done state reset button */}
      {done && !isStreaming && (
        <div className="fa-done-row">
          <button className="btn-secondary" onClick={reset}>
            <RefreshCw size={14} /> Analyze Another Speech
          </button>
        </div>
      )}
    </section>
  );
}
