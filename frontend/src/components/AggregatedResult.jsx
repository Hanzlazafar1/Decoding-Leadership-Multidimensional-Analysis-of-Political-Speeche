import React from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles, Activity, GitBranch, CheckSquare, Trophy,
  BookOpen, TrendingUp, TrendingDown, Minus,
} from 'lucide-react';
import AgendaTag from './AgendaTag.jsx';
import AggregatedVisuals from './AggregatedVisuals.jsx';
import './AggregatedResult.css';

const SENTIMENT_CONFIG = {
  Positive: { color: '#2dd4a4', Icon: TrendingUp,   badgeClass: 'badge-green' },
  Negative: { color: '#f87171', Icon: TrendingDown,  badgeClass: 'badge-red'  },
  Neutral:  { color: '#f5c518', Icon: Minus,         badgeClass: 'badge-gold' },
};

export default function AggregatedResult({ result, fullTranscript }) {
  if (!result) return null;

  const hasClassify = result.sentiment !== undefined && result.sentiment !== null;
  const hasExtract = result.promises !== undefined && result.promises !== null;
  const hasSummarize = result.summary !== undefined && result.summary !== null;

  const sentiment = result.sentiment || 'Neutral';
  const sentiment_reasoning = result.sentiment_reasoning || '';
  const agenda = result.agenda || [];
  const promises = result.promises || [];
  const achievements = result.achievements || [];
  const speech_type = result.speech_type || 'unknown';
  const summary = result.summary || '';
  const key_points = result.key_points || [];

  const sentCfg = SENTIMENT_CONFIG[sentiment] || SENTIMENT_CONFIG.Neutral;
  const SentIcon = sentCfg.Icon;

  return (
    <motion.div
      className="aggregated-result"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header bar */}
      <div className="agg-header glass-card">
        <div className="agg-header-left">
          <div className="agg-gpt-badge">
            <Sparkles size={13} />
            <span>Advanced AI Unified Analysis</span>
          </div>
          <h3 className="agg-title">Unified Results</h3>
          {hasClassify && sentiment_reasoning && (
            <p className="agg-reasoning">{sentiment_reasoning}</p>
          )}
        </div>
        <div className="agg-header-right">
          {hasClassify && (
            <span className={`badge ${sentCfg.badgeClass} agg-sentiment-badge`}>
              <SentIcon size={13} />
              {sentiment}
            </span>
          )}
          {hasExtract && speech_type !== 'unknown' && (
            <span className="agg-type-label">{speech_type.replace('-', ' ')}</span>
          )}
        </div>
      </div>

      <div className="agg-grid">
        {/* Left column: Agenda + Summary */}
        <div className="agg-left">
          {/* Agenda topics */}
          {hasClassify && agenda.length > 0 && (
            <div className="agg-card glass-card" style={{ zIndex: 50, position: 'relative' }}>
              <div className="agg-card-header">
                <GitBranch size={15} style={{ color: 'var(--accent-purple)' }} />
                <span>Agenda Topics</span>
                <span className="badge badge-purple">{agenda.length}</span>
              </div>
              <p className="agg-card-hint">
                Click any topic to see exactly what the speaker said about it ↓
              </p>
              <div className="agg-tags-row">
                {agenda.map((topic, i) => (
                  <AgendaTag
                    key={i}
                    topic={topic}
                    transcript={fullTranscript}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          {hasSummarize && summary && (
            <div className="agg-card glass-card" style={{ zIndex: 1, position: 'relative' }}>
              <div className="agg-card-header">
                <BookOpen size={15} style={{ color: 'var(--gold-300)' }} />
                <span>Unified Summary</span>
              </div>
              <p className="agg-summary-text">{summary}</p>

              {key_points.length > 0 && (
                <div className="agg-keypoints">
                  <p className="agg-kp-label">Key Takeaways</p>
                  <ul className="agg-kp-list">
                    {key_points.map((kp, i) => (
                      <motion.li
                        key={i}
                        className="agg-kp-item"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.07 + 0.3 }}
                      >
                        <span className="agg-kp-dot" />
                        <span>{kp}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right column: Promises + Achievements */}
        {hasExtract && (
          <div className="agg-right">
            {/* Promises */}
            <div className="agg-card glass-card">
              <div className="agg-card-header">
                <CheckSquare size={15} style={{ color: 'var(--accent-blue)' }} />
                <span>All Promises</span>
                <span className="badge badge-blue">{promises.length}</span>
              </div>
              {promises.length === 0 ? (
                <p className="agg-empty">None detected across all chunks.</p>
              ) : (
                <ul className="agg-list">
                  {promises.map((p, i) => (
                    <motion.li
                      key={i}
                      className="agg-list-item agg-promise"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 + 0.2 }}
                    >
                      <CheckSquare size={13} className="agg-list-icon" />
                      <span>{p}</span>
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>

            {/* Achievements */}
            <div className="agg-card glass-card">
              <div className="agg-card-header">
                <Trophy size={15} style={{ color: 'var(--accent-green)' }} />
                <span>All Achievements</span>
                <span className="badge badge-green">{achievements.length}</span>
              </div>
              {achievements.length === 0 ? (
                <p className="agg-empty">None detected across all chunks.</p>
              ) : (
                <ul className="agg-list">
                  {achievements.map((a, i) => (
                    <motion.li
                      key={i}
                      className="agg-list-item agg-achievement"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 + 0.2 }}
                    >
                      <Trophy size={13} className="agg-list-icon" />
                      <span>{a}</span>
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Visualizations Section */}
      {(hasClassify || hasExtract) && (
        <AggregatedVisuals
          agenda={agenda}
          agendaBreakdown={result.agenda_breakdown || []}
          promises={promises}
          achievements={achievements}
          sentiment={sentiment}
        />
      )}
    </motion.div>
  );
}
