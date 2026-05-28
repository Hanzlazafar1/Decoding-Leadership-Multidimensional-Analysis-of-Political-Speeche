import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Copy, CheckCheck, ChevronDown, ChevronUp } from 'lucide-react';
import './TranscriptPanel.css';

export default function TranscriptPanel({ transcript, speechId }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const wordCount  = transcript.trim().split(/\s+/).filter(Boolean).length;
  const charCount  = transcript.length;
  const readTime   = Math.max(1, Math.round(wordCount / 160));

  const handleCopy = () => {
    navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      className="transcript-panel glass-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="transcript-header">
        <div className="transcript-title">
          <FileText size={18} />
          <span>Vosk Transcription</span>
          <span className="transcript-id">— {speechId}</span>
        </div>

        <div className="transcript-actions">
          <button className="btn-secondary icon-btn" onClick={handleCopy} title="Copy transcript">
            {copied ? <CheckCheck size={15} /> : <Copy size={15} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            className="btn-secondary icon-btn"
            onClick={() => setExpanded(e => !e)}
          >
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            {expanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="transcript-stats">
        <div className="stat-pill">
          <span className="stat-val">{wordCount.toLocaleString()}</span>
          <span className="stat-label">words</span>
        </div>
        <div className="stat-pill">
          <span className="stat-val">{charCount.toLocaleString()}</span>
          <span className="stat-label">characters</span>
        </div>
        <div className="stat-pill">
          <span className="stat-val">~{readTime} min</span>
          <span className="stat-label">read time</span>
        </div>
        <div className="stat-pill badge badge-green">
          <span>Vosk Offline ASR</span>
        </div>
      </div>

      {/* Body */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            className="transcript-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
          >
            <div className="transcript-text">{transcript}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
