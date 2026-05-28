import React from 'react';
import { motion } from 'framer-motion';
import { Mic2, BarChart3, GitBranch, Activity } from 'lucide-react';
import './Navbar.css';

const NAV_ITEMS = [
  { icon: Mic2,     label: 'Transcription' },
  { icon: Activity, label: 'Sentiment' },
  { icon: GitBranch,label: 'Agenda' },
  { icon: BarChart3,label: 'Promises' },
];

export default function Navbar() {
  return (
    <motion.nav
      className="navbar"
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="navbar-inner section">
        <a href="#hero" className="navbar-brand">
          <span className="brand-icon">⚖</span>
          <div className="brand-text">
            <span className="brand-title">Decoding Leadership</span>
            <span className="brand-sub">Political Speech Analyzer</span>
          </div>
        </a>

        <div className="navbar-links">
          {NAV_ITEMS.map(({ icon: Icon, label }) => (
            <a key={label} className="nav-link" href={`#${label.toLowerCase()}`}>
              <Icon size={14} />
              {label}
            </a>
          ))}
        </div>

        <div className="navbar-badge">
          <span className="status-dot" />
          FYP 2026
        </div>
      </div>
    </motion.nav>
  );
}
