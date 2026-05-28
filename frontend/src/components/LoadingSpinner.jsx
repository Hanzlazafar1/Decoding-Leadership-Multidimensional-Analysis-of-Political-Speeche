import React from 'react';
import { motion } from 'framer-motion';
import './LoadingSpinner.css';

export default function LoadingSpinner({ label = 'Analyzing…', color = 'var(--gold-300)' }) {
  return (
    <motion.div
      className="spinner-wrap"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="spinner-rings">
        <div className="ring ring-1" style={{ borderTopColor: color }} />
        <div className="ring ring-2" style={{ borderTopColor: color, opacity: 0.6 }} />
        <div className="ring ring-3" style={{ borderTopColor: color, opacity: 0.3 }} />
        <div className="spinner-core" style={{ background: color }} />
      </div>
      <motion.p
        className="spinner-label"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 1.8 }}
      >
        {label}
      </motion.p>
    </motion.div>
  );
}
