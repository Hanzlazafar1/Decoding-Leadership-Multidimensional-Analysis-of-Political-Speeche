import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Lightbulb, ChevronRight } from 'lucide-react';
import './SummaryCard.css';

export default function SummaryCard({ data }) {
  const keyPoints = data.key_points || [];

  return (
    <motion.div
      className="summary-card glass-card"
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="card-header">
        <div className="card-title">
          <BookOpen size={18} style={{ color: 'var(--accent-purple)' }} />
          <span>Speech Summary</span>
        </div>
        <span className="badge badge-purple">
          {keyPoints.length} Key Points
        </span>
      </div>

      {/* Summary block */}
      {data.summary ? (
        <div className="summary-block">
          <div className="summary-quote-mark">&ldquo;</div>
          <p className="summary-text">{data.summary}</p>
          <div className="summary-quote-mark right">&rdquo;</div>
        </div>
      ) : (
        <div className="summary-block" style={{ opacity: 0.5, textAlign: 'center', padding: '1.5rem 0' }}>
          <p className="summary-text" style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
            No summary was returned by the model. Check the backend logs for details.
          </p>
        </div>
      )}

      {/* Key points */}
      {keyPoints.length > 0 && (
        <div className="keypoints-section">
          <div className="section-label-row">
            <Lightbulb size={13} style={{ color: 'var(--gold-300)' }} />
            <p className="section-label">Key Takeaways</p>
          </div>
          <div className="keypoints-list">
            {keyPoints.map((point, i) => (
              <motion.div
                key={i}
                className="keypoint-item"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 + 0.3 }}
              >
                <div className="keypoint-num">{String(i + 1).padStart(2, '0')}</div>
                <div className="keypoint-content">
                  <ChevronRight size={13} className="keypoint-arrow" />
                  <p className="keypoint-text">{point}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Model info footer */}
      <div className="summary-footer">
        <span className="badge badge-purple">Qwen 2.5</span>
        <span className="footer-label">Powered by Qwen 2.5 3B via local API</span>
      </div>
    </motion.div>
  );
}
