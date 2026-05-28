import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, GitBranch, CheckSquare, BookOpen, RefreshCw, AlertCircle } from 'lucide-react';
import { analyzeSentiment, detectAgenda, extractPromises, summarizeSpeech } from '../api/speechApi.js';
import SentimentCard  from './SentimentCard.jsx';
import AgendaCard     from './AgendaCard.jsx';
import PromisesCard   from './PromisesCard.jsx';
import SummaryCard    from './SummaryCard.jsx';
import LoadingSpinner from './LoadingSpinner.jsx';
import './ResultsSection.css';

const TABS = [
  { id: 'sentiment', label: 'Sentiment',   icon: Activity,    color: 'var(--accent-blue)',   badgeClass: 'badge-blue',   spinnerColor: 'var(--accent-blue)'   },
  { id: 'agenda',    label: 'Agenda',      icon: GitBranch,   color: 'var(--accent-purple)', badgeClass: 'badge-purple', spinnerColor: 'var(--accent-purple)' },
  { id: 'promises',  label: 'Promises',    icon: CheckSquare, color: 'var(--accent-green)',  badgeClass: 'badge-green',  spinnerColor: 'var(--accent-green)'  },
  { id: 'summary',   label: 'Summary',     icon: BookOpen,    color: 'var(--gold-300)',       badgeClass: 'badge-gold',   spinnerColor: 'var(--gold-300)'      },
];

const API_MAP = {
  sentiment: analyzeSentiment,
  agenda:    detectAgenda,
  promises:  extractPromises,
  summary:   summarizeSpeech,
};

const LABELS = {
  sentiment: 'Running LLaMA sentiment analysis…',
  agenda:    'Detecting agenda with LLaMA…',
  promises:  'Extracting promises with Gemma…',
  summary:   'Summarizing speech with Gemma…',
};

export default function ResultsSection({ transcript }) {
  const [activeTab, setActiveTab] = useState('sentiment');
  const [results,   setResults]   = useState({});
  const [loading,   setLoading]   = useState({});
  const [errors,    setErrors]    = useState({});

  const runAnalysis = async (tabId) => {
    if (results[tabId]) return; // already cached
    setLoading(prev => ({ ...prev, [tabId]: true }));
    setErrors(prev => ({ ...prev, [tabId]: null }));
    try {
      const data = await API_MAP[tabId](transcript);
      setResults(prev => ({ ...prev, [tabId]: data }));
    } catch (err) {
      setErrors(prev => ({ ...prev, [tabId]: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, [tabId]: false }));
    }
  };

  // Run first tab immediately and all in parallel (skipping 'agenda' as it reuses 'sentiment' outputs)
  useEffect(() => {
    if (!transcript) return;
    setResults({});
    setErrors({});
    TABS.forEach(tab => {
      if (tab.id !== 'agenda') {
        runAnalysis(tab.id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript]);

  const retry = (tabId) => {
    const checkTab = tabId === 'agenda' ? 'sentiment' : tabId;
    setResults(prev => { const n = { ...prev }; delete n[checkTab]; return n; });
    runAnalysis(checkTab);
  };

  const activeConfig = TABS.find(t => t.id === activeTab);

  const renderContent = () => {
    const checkTab = activeTab === 'agenda' ? 'sentiment' : activeTab;
    const spinnerLabel = activeTab === 'agenda' ? 'Analyzing speech agenda with LLaMA…' : LABELS[activeTab];

    if (loading[checkTab]) {
      return <LoadingSpinner label={spinnerLabel} color={activeConfig.color} />;
    }
    if (errors[checkTab]) {
      return (
        <motion.div className="tab-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <AlertCircle size={24} style={{ color: 'var(--accent-red)' }} />
          <div>
            <p className="tab-error-title">Analysis Failed</p>
            <p className="tab-error-msg">{errors[checkTab]}</p>
          </div>
          <button className="btn-secondary" onClick={() => retry(activeTab)}>
            <RefreshCw size={14} /> Retry
          </button>
        </motion.div>
      );
    }
    if (!results[checkTab]) return null;

    const data = results[checkTab];
    switch (activeTab) {
      case 'sentiment': return <SentimentCard data={data} />;
      case 'agenda':    return <AgendaCard    data={null} sentimentData={data} />;
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
          AI-powered analysis pipelines running in parallel using LLaMA &amp; Gemma language models
        </p>
      </motion.div>

      {/* Tab bar */}
      <div className="tab-bar glass-card">
        {TABS.map((tab) => {
          const Icon    = tab.icon;
          const isDone  = tab.id === 'agenda' ? !!results.sentiment : !!results[tab.id];
          const isErr   = tab.id === 'agenda' ? !!errors.sentiment : !!errors[tab.id];
          const isLoad  = tab.id === 'agenda' ? !!loading.sentiment : !!loading[tab.id];

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
