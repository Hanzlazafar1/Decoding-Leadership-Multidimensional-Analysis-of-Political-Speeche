import React, { useRef, useEffect } from 'react';
import './LiveLog.css';

// ── Type → display config ──────────────────────────────────────────────────────
const LOG_CONFIG = {
  init:            { prefix: '[INIT]',        color: 'var(--accent-blue)',   icon: '⚡' },
  chunk_start:     { prefix: '[CHUNK]',       color: 'var(--gold-300)',      icon: '◈' },
  chunk_progress:  { prefix: '[MODEL]',       color: 'var(--text-secondary)',icon: '›'  },
  chunk_result:    { prefix: '[RESULT]',      color: 'var(--accent-green)',  icon: '✓' },
  aggregating:     { prefix: '[AI]',         color: 'var(--accent-purple)', icon: '✨' },
  final_result:    { prefix: '[UNIFIED]',     color: 'var(--accent-green)',  icon: '★' },
  error:           { prefix: '[ERROR]',       color: 'var(--accent-red)',    icon: '✗' },
  done:            { prefix: '[DONE]',        color: 'var(--gold-300)',      icon: '✔' },
};

function formatMessage(event) {
  // Use the message field if available; otherwise build from the event type
  if (event.message) return event.message;
  if (event.type === 'chunk_result') {
    const ci = event.chunk_index;
    const tot = event.total;
    return `Chunk ${ci + 1}/${tot} complete.`;
  }
  if (event.type === 'final_result') {
    return `Unified result ready — Sentiment: ${event.sentiment}`;
  }
  if (event.type === 'done') {
    return `Analysis complete in ${event.total_time_seconds}s`;
  }
  return JSON.stringify(event).slice(0, 120);
}

export default function LiveLog({ events, isStreaming }) {
  const bottomRef = useRef(null);

  // Auto-scroll to bottom when new events arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events.length]);

  if (events.length === 0 && !isStreaming) return null;

  return (
    <div className="live-log glass-card">
      <div className="live-log-header">
        <div className="live-log-title">
          <span className="live-log-dot" />
          <span>Live Processing Log</span>
        </div>
        {isStreaming && (
          <span className="live-log-badge">
            <span className="pulse-ring" />
            Streaming…
          </span>
        )}
        {!isStreaming && events.length > 0 && (
          <span className="live-log-badge done-badge">Complete</span>
        )}
      </div>

      <div className="live-log-body">
        {events.map((event, idx) => {
          const cfg = LOG_CONFIG[event.type] || LOG_CONFIG.chunk_progress;
          const msg = formatMessage(event);
          return (
            <div key={idx} className="log-line">
              <span className="log-icon" style={{ color: cfg.color }}>{cfg.icon}</span>
              <span className="log-prefix" style={{ color: cfg.color }}>{cfg.prefix}</span>
              <span className="log-msg">{msg}</span>
            </div>
          );
        })}
        {isStreaming && (
          <div className="log-line log-cursor">
            <span className="log-icon" style={{ color: 'var(--gold-300)' }}>_</span>
            <span className="log-prefix" style={{ color: 'var(--text-muted)' }}>[WAIT]</span>
            <span className="log-msg" style={{ color: 'var(--text-muted)' }}>Waiting for model response…</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
