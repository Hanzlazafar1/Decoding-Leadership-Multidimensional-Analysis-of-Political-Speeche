import React from 'react';
import { motion } from 'framer-motion';
import { Activity, GitBranch, CheckSquare, Trophy, BookOpen } from 'lucide-react';
import './ChunkResultCard.css';

const SENTIMENT_COLOR = {
  Positive: 'var(--accent-green)',
  Negative: 'var(--accent-red)',
  Neutral:  'var(--gold-300)',
};

const TYPE_COLOR = {
  'promise-heavy':     'var(--accent-blue)',
  'achievement-heavy': 'var(--accent-green)',
  'balanced':          'var(--accent-purple)',
  'neither':           'var(--text-muted)',
  'unknown':           'var(--text-muted)',
};

export default function ChunkResultCard({ chunkIndex, total, classify, extract, summarize }) {
  const hasClassify = classify !== undefined;
  const hasExtract = extract !== undefined;
  const hasSummarize = summarize !== undefined;

  const sentiment    = classify?.sentiment || 'Neutral';
  const agenda       = classify?.agenda    || [];
  const promises     = extract?.promises     || [];
  const achievements = extract?.achievements || [];
  const speechType   = extract?.speech_type  || 'unknown';
  const summary      = summarize?.summary   || '';

  return (
    <motion.div
      className="chunk-card glass-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="chunk-card-header">
        <div className="chunk-label">
          <span className="chunk-number">Chunk {chunkIndex + 1}</span>
          <span className="chunk-of">of {total}</span>
        </div>
        <div className="chunk-badges">
          {hasClassify && (
            <span
              className="chunk-sentiment"
              style={{ color: SENTIMENT_COLOR[sentiment], borderColor: SENTIMENT_COLOR[sentiment] }}
            >
              <Activity size={12} />
              {sentiment}
            </span>
          )}
          {hasExtract && speechType !== 'unknown' && (
            <span
              className="chunk-type"
              style={{ color: TYPE_COLOR[speechType] || 'var(--text-muted)' }}
            >
              {speechType.replace('-', ' ')}
            </span>
          )}
        </div>
      </div>

      {/* Agenda pills */}
      {hasClassify && agenda.length > 0 && (
        <div className="chunk-row">
          <GitBranch size={12} className="chunk-row-icon" style={{ color: 'var(--accent-purple)' }} />
          <div className="chunk-pills">
            {agenda.map((a, i) => (
              <span key={i} className="mini-chip">{a}</span>
            ))}
          </div>
        </div>
      )}

      {/* Counts row */}
      {hasExtract && (
        <div className="chunk-counts">
          <div className="chunk-count-item">
            <CheckSquare size={12} style={{ color: 'var(--accent-blue)' }} />
            <span style={{ color: 'var(--accent-blue)' }}>{promises.length}</span>
            <span className="chunk-count-label">Promises</span>
          </div>
          <div className="chunk-count-sep" />
          <div className="chunk-count-item">
            <Trophy size={12} style={{ color: 'var(--accent-green)' }} />
            <span style={{ color: 'var(--accent-green)' }}>{achievements.length}</span>
            <span className="chunk-count-label">Achievements</span>
          </div>
        </div>
      )}

      {/* Summary snippet */}
      {hasSummarize && summary && (
        <div className="chunk-summary">
          <BookOpen size={12} style={{ color: 'var(--gold-300)' }} />
          <p className="chunk-summary-text">
            {summary.length > 200 ? summary.slice(0, 200) + '…' : summary}
          </p>
        </div>
      )}
    </motion.div>
  );
}
