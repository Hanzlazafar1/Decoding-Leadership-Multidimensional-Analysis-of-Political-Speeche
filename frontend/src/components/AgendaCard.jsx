import React from 'react';
import { motion } from 'framer-motion';
import { GitBranch, Tag } from 'lucide-react';
import './AgendaCard.css';

export default function AgendaCard({ data }) {
  // data = /classify result: { sentiment, agenda, raw_output } or legacy fallback
  const topics      = data?.agenda      || data?.topics || [];
  const buzzwords   = data?.buzzwords   || [];

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
        <p className="section-label">Detected Agenda Topics</p>
        <div className="tags-row">
          {topics.length > 0 ? (
            topics.map((item, i) => (
              <motion.span
                key={i}
                className="chip chip-topic"
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

      {/* Buzzwords */}
      {buzzwords.length > 0 && (
        <div className="agenda-section">
          <div className="section-label-row">
            <Tag size={13} style={{ color: 'var(--accent-purple)' }} />
            <p className="section-label">Key Buzzwords</p>
          </div>
          <div className="tags-row">
            {buzzwords.map((word, i) => (
              <motion.span
                key={i}
                className="chip chip-buzz"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.08 * i + 0.3 }}
                whileHover={{ scale: 1.05 }}
              >
                {word}
              </motion.span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
