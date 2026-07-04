import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Loader } from 'lucide-react';
import { getAgendaDetail } from '../api/speechApi.js';
import './AgendaTag.css';

// Color per statement type
const TYPE_CONFIG = {
  promise:     { color: 'var(--accent-blue)',   label: 'Promise',      dot: '#3d8ef0' },
  achievement: { color: 'var(--accent-green)',  label: 'Achievement',  dot: '#2dd4a4' },
  claim:       { color: 'var(--text-secondary)', label: 'Claim',       dot: '#8892a4' },
  criticism:   { color: 'var(--accent-red)',    label: 'Criticism',    dot: '#f87171' },
};

export default function AgendaTag({ topic, transcript }) {
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [data,    setData]    = useState(null);   // { statements, overall_stance }
  const [error,   setError]   = useState(null);

  const handleClick = async () => {
    if (open) {
      setOpen(false);
      return;
    }

    setOpen(true);

    // Already fetched — just re-open
    if (data) return;

    setLoading(true);
    setError(null);
    try {
      const result = await getAgendaDetail(transcript, topic);
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="agenda-tag-wrap">
      {/* Clickable chip */}
      <motion.button
        className={`agenda-chip ${open ? 'agenda-chip--open' : ''}`}
        onClick={handleClick}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
      >
        <span className="agenda-chip-text">{topic}</span>
        {loading
          ? <Loader size={12} className="agenda-spin" />
          : open
            ? <ChevronUp size={12} />
            : <ChevronDown size={12} />
        }
      </motion.button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="agenda-dropdown"
            initial={{ opacity: 0, y: -8, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0,  scaleY: 1 }}
            exit={{ opacity: 0, y: -8, scaleY: 0.95 }}
            transition={{ duration: 0.22 }}
            style={{ originY: 0 }}
          >
            {loading && (
              <div className="agenda-loading">
                <Loader size={16} className="agenda-spin" />
                <span>Asking Advanced AI about "{topic}".</span>
              </div>
            )}

            {error && !loading && (
              <p className="agenda-error">⚠ {error}</p>
            )}

            {data && !loading && (
              <>
                {/* Overall stance */}
                {data.overall_stance && (
                  <div className="agenda-stance">
                    <span className="agenda-stance-label">Speaker's Stance</span>
                    <p className="agenda-stance-text">{data.overall_stance}</p>
                  </div>
                )}

                {/* Statements */}
                {data.statements?.length > 0 ? (
                  <ul className="agenda-statements">
                    {data.statements.map((stmt, i) => {
                      const cfg = TYPE_CONFIG[stmt.type] || TYPE_CONFIG.claim;
                      return (
                        <motion.li
                          key={i}
                          className="agenda-stmt"
                          style={{ borderLeftColor: cfg.dot }}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06 }}
                        >
                          <span
                            className="stmt-type"
                            style={{ color: cfg.color, borderColor: cfg.dot + '55' }}
                          >
                            {cfg.label}
                          </span>
                          <span className="stmt-text">{stmt.text}</span>
                        </motion.li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="agenda-no-stmts">
                    No specific statements about "{topic}" were found.
                  </p>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
