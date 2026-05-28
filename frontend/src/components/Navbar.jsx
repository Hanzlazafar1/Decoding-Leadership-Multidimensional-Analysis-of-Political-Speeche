import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './Navbar.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.nav
      className={`navbar${scrolled ? ' navbar--scrolled' : ''}`}
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="navbar-inner section">
        {/* Brand */}
        <a href="#hero" className="navbar-brand">
          <div className="brand-logo-ring">
            <span className="brand-logo-icon">⚖</span>
          </div>
          <div className="brand-text">
            <span className="brand-title">Decoding Leadership</span>
            <span className="brand-sub">Political Speech Analyzer</span>
          </div>
        </a>

        {/* Live indicator */}
        <div className="navbar-live">
          <span className="live-dot" />
          <span className="live-label">AI Live</span>
        </div>
      </div>
    </motion.nav>
  );
}
