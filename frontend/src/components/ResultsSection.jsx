import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, GitBranch, CheckSquare, BookOpen, RefreshCw, AlertCircle } from 'lucide-react';
import { classifySpeech, extractPromises, summarizeSpeech } from '../api/speechApi.js';
import SentimentCard  from './SentimentCard.jsx';
import AgendaCard     from './AgendaCard.jsx';
import PromisesCard   from './PromisesCard.jsx';
import SummaryCard    from './SummaryCard.jsx';
import LoadingSpinner from './LoadingSpinner.jsx';
import './ResultsSection.css';

// ── Tab Config ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'sentiment', label: 'Sentiment',  icon: Activity,    color: 'var(--accent-blue)',   apiKey: 'classify' },
  { id: 'agenda',    label: 'Agenda',     icon: GitBranch,   color: 'var(--accent-purple)', apiKey: 'classify' },
  { id: 'promises',  label: 'Promises',   icon: CheckSquare, color: 'var(--accent-green)',  apiKey: 'promises' },
  { id: 'summary',   label: 'Summary',    icon: BookOpen,    color: 'var(--gold-300)',       apiKey: 'summary'  },
];

// ── API calls keyed by internal cache key ──────────────────────────────────────
// /classify is shared for both Sentiment + Agenda tabs (called once, cached)
const API_MAP = {
  classify: classifySpeech,
  promises: extractPromises,
  summary:  summarizeSpeech,
};

const LABELS = {
  classify: 'Classifying speech with LLaMA 3.2…',
  promises: 'Extracting promises with Gemma 3…',
  summary:  'Summarizing speech with Qwen 2.5…',
};

export default function ResultsSection({ transcript }) {
  const [activeTab, setActiveTab] = useState('sentiment');
  const [results,   setResults]   = useState({});
  const [loading,   setLoading]   = useState({});
  const [errors,    setErrors]    = useState({});

  const runAnalysis = async (apiKey, forceRun = false) => {
    if (!forceRun && results[apiKey]) return; // already cached
    setLoading(prev => ({ ...prev, [apiKey]: true }));
    setErrors(prev  => ({ ...prev, [apiKey]: null  }));
    try {
      const data = await API_MAP[apiKey](transcript);
      setResults(prev => ({ ...prev, [apiKey]: data }));
    } catch (err) {
      setErrors(prev => ({ ...prev, [apiKey]: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, [apiKey]: false }));
    }
  };

  // Fire all 3 unique API calls in parallel when transcript is ready
  useEffect(() => {
    if (!transcript) return;
    setResults({});
    setErrors({});
    setLoading({});
    Object.keys(API_MAP).forEach(key => runAnalysis(key));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript]);

  const retry = (apiKey) => {
    setResults(prev => { const n = { ...prev }; delete n[apiKey]; return n; });
    runAnalysis(apiKey, true);
  };

  const activeConfig = TABS.find(t => t.id === activeTab);
  const activeApiKey = activeConfig?.apiKey;

  const renderContent = () => {
    if (loading[activeApiKey]) {
      return <LoadingSpinner label={LABELS[activeApiKey]} color={activeConfig.color} />;
    }
    if (errors[activeApiKey]) {
      return (
        <motion.div className="tab-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <AlertCircle size={24} style={{ color: 'var(--accent-red)' }} />
          <div>
            <p className="tab-error-title">Analysis Failed</p>
            <p className="tab-error-msg">{errors[activeApiKey]}</p>
          </div>
          <button className="btn-secondary" onClick={() => retry(activeApiKey)}>
            <RefreshCw size={14} /> Retry
          </button>
        </motion.div>
      );
    }
    if (!results[activeApiKey]) return null;

    const data = results[activeApiKey];
    switch (activeTab) {
      case 'sentiment': return <SentimentCard data={data} />;
      case 'agenda':    return <AgendaCard    data={data} />;
      case 'promises':  return <PromisesCard  data={data} />;
      case 'summary':   return <SummaryCard   data={data} />;
      default:          return null;
    }
  };

  return (
    <section className="results-section" id="results">
      {/* Section heading */}
      <motion.div
        className="results-heading"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="results-title">Multidimensional Analysis</h2>
        <p className="results-sub">
          AI-powered analysis via LLaMA 3.2 · Gemma 3 · Qwen 2.5 running in parallel
        </p>
      </motion.div>

      {/* Tab bar */}
      <div className="tab-bar glass-card">
        {TABS.map((tab) => {
          const Icon    = tab.icon;
          const isDone  = !!results[tab.apiKey];
          const isErr   = !!errors[tab.apiKey];
          const isLoad  = !!loading[tab.apiKey];

          return (
            <button
              key={tab.id}
              id={tab.label.toLowerCase()}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              style={{ '--tab-color': tab.color }}
            >
              <Icon size={16} />
              <span className="tab-label">{tab.label}</span>
              {isLoad && <span className="tab-dot loading" />}
              {isDone && !isLoad && <span className="tab-dot done" style={{ background: tab.color }} />}
              {isErr  && !isLoad && <span className="tab-dot error" />}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
