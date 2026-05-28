import React from 'react';
import { motion } from 'framer-motion';
import { CheckSquare, Trophy, AlertTriangle, Sparkles } from 'lucide-react';
import './PromisesCard.css';

const ListItem = ({ text, index, color, icon: Icon }) => (
  <motion.li
    className="promise-item"
    style={{ borderLeftColor: color }}
    initial={{ opacity: 0, x: -16 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.08 + 0.2 }}
  >
    <span className="promise-bullet" style={{ color }}>
      <Icon size={14} />
    </span>
    <span className="promise-text">{text}</span>
  </motion.li>
);

export default function PromisesCard({ data }) {
  const promises     = data.promises     || [];
  const achievements = data.achievements || [];
  const speechType   = data.speech_type   || 'unknown';
  const empty        = promises.length === 0 && achievements.length === 0;

  return (
    <motion.div
      className="promises-card glass-card"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="card-header">
        <div className="card-title">
          <CheckSquare size={18} style={{ color: 'var(--accent-green)' }} />
          <span>Promises &amp; Achievements</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {speechType && speechType !== 'unknown' && (
            <motion.div
              className={`speech-type-badge type-${speechType.toLowerCase()}`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Sparkles size={12} className="speech-type-icon" />
              <span>{speechType.replace('-', ' ')}</span>
            </motion.div>
          )}
          <span className="badge badge-blue">{promises.length} Promises</span>
          <span className="badge badge-green">{achievements.length} Achievements</span>
        </div>
      </div>

      {empty ? (
        <div className="empty-state">
          <AlertTriangle size={32} style={{ color: 'var(--text-muted)' }} />
          <p>No promises or achievements detected in this speech.</p>
        </div>
      ) : (
        <div className="pa-grid">
          {/* Promises column */}
          <div className="pa-column">
            <div className="pa-col-header promises-header">
              <CheckSquare size={15} />
              <span>Promises Made</span>
              <span className="pa-count">{promises.length}</span>
            </div>
            {promises.length === 0 ? (
              <p className="pa-empty">None detected</p>
            ) : (
              <ul className="promise-list">
                {promises.map((p, i) => (
                  <ListItem
                    key={i}
                    text={p}
                    index={i}
                    color="var(--accent-blue)"
                    icon={CheckSquare}
                  />
                ))}
              </ul>
            )}
          </div>

          {/* Divider */}
          <div className="pa-divider" />

          {/* Achievements column */}
          <div className="pa-column">
            <div className="pa-col-header achievements-header">
              <Trophy size={15} />
              <span>Achievements Claimed</span>
              <span className="pa-count">{achievements.length}</span>
            </div>
            {achievements.length === 0 ? (
              <p className="pa-empty">None detected</p>
            ) : (
              <ul className="promise-list">
                {achievements.map((a, i) => (
                  <ListItem
                    key={i}
                    text={a}
                    index={i}
                    color="var(--accent-green)"
                    icon={Trophy}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Progress bars */}
      {!empty && (
        <div className="pa-summary">
          <div className="pa-bar-row">
            <span className="pa-bar-label" style={{ color: 'var(--accent-blue)' }}>Promises</span>
            <div className="pa-bar-track">
              <motion.div
                className="pa-bar-fill"
                style={{ background: 'var(--accent-blue)' }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, promises.length * 12)}%` }}
                transition={{ duration: 0.8, delay: 0.4 }}
              />
            </div>
            <span className="pa-bar-count">{promises.length}</span>
          </div>
          <div className="pa-bar-row">
            <span className="pa-bar-label" style={{ color: 'var(--accent-green)' }}>Achievements</span>
            <div className="pa-bar-track">
              <motion.div
                className="pa-bar-fill"
                style={{ background: 'var(--accent-green)' }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, achievements.length * 12)}%` }}
                transition={{ duration: 0.8, delay: 0.5 }}
              />
            </div>
            <span className="pa-bar-count">{achievements.length}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
