import React from 'react';
import { motion } from 'framer-motion';
import { GitBranch, AlignLeft } from 'lucide-react';
import './AgendaCard.css';

export default function AgendaCard({ data, sentimentData }) {
  // Use sentimentData agenda/explanation as primary, fall back to topics/context if sentimentData is not loaded yet
  const topics = sentimentData?.agenda || data?.topics || [];
  const analysisText = sentimentData?.explanation || data?.context || '';

  return (
    <motion.div
      className="agenda-card glass-card"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="card-header">
        <div className="card-title">
          <GitBranch size={18} style={{ color: 'var(--accent-purple)' }} />
          <span>Agenda Detection</span>
        </div>
        <span className="badge badge-purple">
          {topics.length} {topics.length === 1 ? 'Topic' : 'Topics'}
        </span>
      </div>

      {/* Political Agenda Topics */}
      <div className="agenda-section">
        <p className="section-label">Political Agenda Topics</p>
        <div className="tags-row">
          {topics.length > 0 ? (
            topics.map((item, i) => (
              <motion.span
                key={i}
                className="chip"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * i + 0.2 }}
                whileHover={{ scale: 1.05 }}
              >
                {item}
              </motion.span>
            ))
          ) : (
            <span className="text-muted">No topics detected</span>
          )}
        </div>
      </div>

      {/* Analysis Box */}
      {analysisText && (
        <div className="explanation-box">
          <div className="section-label-row">
            <AlignLeft size={13} style={{ color: 'var(--gold-400)' }} />
            <p className="explanation-label">Analysis</p>
          </div>
          <p className="explanation-text">{analysisText}</p>
        </div>
      )}
    </motion.div>
  );
}
