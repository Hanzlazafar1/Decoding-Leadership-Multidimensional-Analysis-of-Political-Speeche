import React from 'react';
import { motion } from 'framer-motion';
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import './SentimentCard.css';

const SENTIMENT_CONFIG = {
  Positive: { color: '#2dd4a4', icon: TrendingUp,   score: 85, label: 'Positive',  badgeClass: 'badge-green' },
  Negative: { color: '#f87171', icon: TrendingDown, score: 20, label: 'Negative',  badgeClass: 'badge-red'   },
  Neutral:  { color: '#f5c518', icon: Minus,        score: 50, label: 'Neutral',   badgeClass: 'badge-gold'  },
};

export default function SentimentCard({ data }) {
  const config = SENTIMENT_CONFIG[data.sentiment] || SENTIMENT_CONFIG.Neutral;
  const Icon   = config.icon;

  return (
    <motion.div
      className="sentiment-card glass-card"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Card header */}
      <div className="card-header">
        <div className="card-title">
          <Activity size={18} style={{ color: 'var(--accent-blue)' }} />
          <span>Sentiment Analysis</span>
        </div>
        <span className={`badge ${config.badgeClass}`}>
          <Icon size={12} />
          {config.label}
        </span>
      </div>

      {/* Gauge + Meter */}
      <div className="sentiment-visual">
        <div className="gauge-wrap">
          <svg
            viewBox="0 0 200 110"
            className="gauge-svg"
          >
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={`${config.color}33`} />
                <stop offset="100%" stopColor={config.color} />
              </linearGradient>
            </defs>
            {/* Background track */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="rgba(255, 255, 255, 0.05)"
              strokeWidth="12"
              strokeLinecap="round"
            />
            {/* Foreground/Active track */}
            <motion.path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke={`url(#gaugeGradient)`}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={251.327}
              initial={{ strokeDashoffset: 251.327 }}
              animate={{ strokeDashoffset: 251.327 - (config.score / 100) * 251.327 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          </svg>
          <div className="gauge-label">
            <span className="gauge-val" style={{ color: config.color }}>{config.score}%</span>
            <span className="gauge-sub">{config.label}</span>
          </div>
        </div>

        {/* Sentiment meter bar */}
        <div className="meter-section">
          <div className="meter-labels">
            <span style={{ color: 'var(--accent-red)' }}>Negative</span>
            <span style={{ color: 'var(--gold-300)' }}>Neutral</span>
            <span style={{ color: 'var(--accent-green)' }}>Positive</span>
          </div>
          <div className="meter-bar">
            <motion.div
              className="meter-fill"
              style={{ background: config.color }}
              initial={{ width: 0 }}
              animate={{ width: `${config.score}%` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
            />
            <div className="meter-marker" style={{ left: `${config.score}%`, borderColor: config.color }} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
