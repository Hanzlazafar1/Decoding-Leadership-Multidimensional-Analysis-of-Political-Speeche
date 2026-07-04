import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, ChevronDown, RefreshCw } from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [apiStatus, setApiStatus] = useState({
    connected: false,
    vosk: 'checking',
    version: '',
    checking: true,
  });
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const checkHealth = async () => {
    setApiStatus(prev => ({ ...prev, checking: true }));
    try {
      const res = await fetch('http://localhost:8000/');
      if (res.ok) {
        const data = await res.json();
        setApiStatus({
          connected: true,
          vosk: data.vosk === 'loaded' ? 'active' : 'inactive',
          version: data.version || '2.0.0',
          checking: false,
        });
      } else {
        setApiStatus({ connected: false, vosk: 'failed', version: '', checking: false });
      }
    } catch (err) {
      setApiStatus({ connected: false, vosk: 'failed', version: '', checking: false });
    }
  };

  useEffect(() => {
    checkHealth();
    // Poll API status every 20 seconds to keep it updated without overloading
    const interval = setInterval(checkHealth, 20000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

        {/* Navigation Links */}
        <div className="navbar-links">
          <a href="#hero" className="nav-link-item">
            Overview
          </a>
          <a
            href="#mode-audio"
            className="nav-link-item"
            onClick={(e) => {
              e.preventDefault();
              document.querySelector('.workspace')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Analyzer
          </a>
          <a
            href="#results"
            className="nav-link-item"
            onClick={(e) => {
              e.preventDefault();
              const resultsEl = document.getElementById('results');
              if (resultsEl) {
                resultsEl.scrollIntoView({ behavior: 'smooth' });
              } else {
                document.querySelector('.workspace')?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          >

          </a>
        </div>

        {/* Right Action Group */}
        <div className="navbar-actions">
          {/* Models Hub Popover */}
          <div className="navbar-models-wrap" ref={dropdownRef}>
            <button
              className={`navbar-models-btn ${showDropdown ? 'active' : ''}`}
              onClick={() => setShowDropdown(!showDropdown)}
              title="System Model Infrastructure Status"
            >
              <Cpu size={14} className="cpu-icon" />
              <span>Model Hub</span>
              <ChevronDown size={12} className={`chevron-icon ${showDropdown ? 'open' : ''}`} />
            </button>

            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  className="models-dropdown glass-card"
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="dropdown-header">
                    <span className="header-title">System Infrastructure</span>
                    <button
                      className="refresh-btn"
                      onClick={checkHealth}
                      disabled={apiStatus.checking}
                      title="Refresh status"
                    >
                      <RefreshCw size={12} className={apiStatus.checking ? 'spin' : ''} />
                    </button>
                  </div>

                  <div className="dropdown-divider" />

                  <div className="models-list">
                    {/* Vosk */}
                    <div className="model-status-item">
                      <div className="model-info">
                        <span className="model-name">Vosk ASR Engine</span>
                        <span className="model-meta">Speech-to-Text · Local Offline</span>
                      </div>
                      <span className={`status-badge ${apiStatus.vosk}`}>
                        {apiStatus.vosk === 'active'
                          ? 'Loaded'
                          : apiStatus.vosk === 'inactive'
                            ? 'Not Loaded'
                            : apiStatus.vosk === 'checking'
                              ? 'Checking'
                              : 'Offline'}
                      </span>
                    </div>

                    {/* LLaMA 3.2 */}
                    <div className="model-status-item">
                      <div className="model-info">
                        <span className="model-name">LLaMA 3.2 3B</span>
                        <span className="model-meta">Sentiment &amp; Agenda · GGUF</span>
                      </div>
                      <span className={`status-badge ${apiStatus.connected ? 'active' : 'offline'}`}>
                        {apiStatus.connected ? 'Active' : 'Offline'}
                      </span>
                    </div>

                    {/* Gemma 3 */}
                    <div className="model-status-item">
                      <div className="model-info">
                        <span className="model-name">Gemma 3 4B</span>
                        <span className="model-meta">Promises &amp; Achiev. · QLoRA</span>
                      </div>
                      <span className={`status-badge ${apiStatus.connected ? 'active' : 'offline'}`}>
                        {apiStatus.connected ? 'Active' : 'Offline'}
                      </span>
                    </div>

                    {/* Qwen 2.5 */}
                    <div className="model-status-item">
                      <div className="model-info">
                        <span className="model-name">Qwen 2.5 3B</span>
                        <span className="model-meta">Speech Summarizer · QLoRA</span>
                      </div>
                      <span className={`status-badge ${apiStatus.connected ? 'active' : 'offline'}`}>
                        {apiStatus.connected ? 'Active' : 'Offline'}
                      </span>
                    </div>
                  </div>

                  <div className="dropdown-divider" />


                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Live indicator */}

        </div>
      </div>
    </motion.nav>
  );
}
