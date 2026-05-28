import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileAudio, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import './AudioUploader.css';

export default function AudioUploader({ onTranscript, isLoading, setIsLoading }) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [uploaded, setUploaded] = useState(false);

  const ACCEPTED = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/webm', 'video/mp4'];

  const handleFile = useCallback((f) => {
    setError('');
    setUploaded(false);
    if (!f) return;
    if (!ACCEPTED.includes(f.type) && !f.name.match(/\.(mp3|wav|ogg|m4a|webm|mp4|flac)$/i)) {
      setError('Unsupported format. Please upload MP3, WAV, OGG, M4A, or similar audio files.');
      return;
    }
    if (f.size > 100 * 1024 * 1024) {
      setError('File too large. Maximum size is 100 MB.');
      return;
    }
    setFile(f);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    handleFile(f);
  }, [handleFile]);

  const onInputChange = (e) => handleFile(e.target.files[0]);

  const handleUpload = async () => {
    if (!file) return;
    setIsLoading(true);
    setError('');
    try {
      const { uploadAudio } = await import('../api/speechApi.js');
      const data = await uploadAudio(file);
      setUploaded(true);
      onTranscript(data.transcript, data.speech_id);
    } catch (err) {
      setError(err.message || 'Upload failed. Make sure the backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setError('');
    setUploaded(false);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="uploader-wrapper" id="transcription">
      {/* Drop Zone */}
      <motion.div
        className={`drop-zone glass-card ${dragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        whileHover={{ scale: 1.005 }}
        transition={{ duration: 0.2 }}
      >
        <input
          id="audio-input"
          type="file"
          accept="audio/*,video/mp4"
          className="file-input"
          onChange={onInputChange}
        />

        <AnimatePresence mode="wait">
          {!file ? (
            <motion.label
              key="empty"
              htmlFor="audio-input"
              className="drop-label"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <motion.div
                className="upload-icon-ring"
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              >
                <Upload size={32} />
              </motion.div>
              <div className="drop-text">
                <span className="drop-title">Drop your audio file here</span>
                <span className="drop-sub">or <span className="browse-link">browse files</span></span>
              </div>
              <div className="drop-formats">
                <span className="chip">MP3</span>
                <span className="chip">WAV</span>
                <span className="chip">OGG</span>
                <span className="chip">M4A</span>
                <span className="chip">MP4</span>
              </div>
            </motion.label>
          ) : (
            <motion.div
              key="file"
              className="file-preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="file-icon-wrap">
                <FileAudio size={36} />
                {uploaded && (
                  <motion.div
                    className="file-check"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <CheckCircle size={16} />
                  </motion.div>
                )}
              </div>
              <div className="file-info">
                <span className="file-name">{file.name}</span>
                <span className="file-size">{formatSize(file.size)}</span>
              </div>
              <button className="file-clear" onClick={clearFile} aria-label="Remove file">
                <X size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="upload-error"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <AlertCircle size={15} />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Button */}
      <motion.button
        className="btn-gold upload-btn"
        onClick={handleUpload}
        disabled={!file || isLoading}
        whileHover={!isLoading && file ? { scale: 1.03 } : {}}
        whileTap={{ scale: 0.97 }}
      >
        {isLoading ? (
          <>
            <Loader2 size={18} className="spin-icon" />
            Transcribing Speech…
          </>
        ) : uploaded ? (
          <>
            <CheckCircle size={18} />
            Transcribed! Re-analyze
          </>
        ) : (
          <>
            <Upload size={18} />
            Upload &amp; Transcribe
          </>
        )}
      </motion.button>

      <p className="upload-note">
        Audio is processed locally on the server using the <strong>Vosk</strong> offline speech recognition model.
        No data is sent to external services.
      </p>
    </div>
  );
}
