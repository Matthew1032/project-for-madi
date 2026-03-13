import { useState, useRef } from 'react';

export default function InputSection({ onExtract, isExtracting, error }) {
  const [tab, setTab] = useState('prompt');
  const [prompt, setPrompt] = useState('');
  const [file, setFile] = useState(null);
  const [dragover, setDragover] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragover(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  };

  const handleSubmit = () => {
    if (tab === 'file' && !file) return;
    if (tab === 'prompt' && !prompt.trim()) return;
    onExtract({ file: tab === 'file' ? file : null, prompt: tab === 'prompt' ? prompt : '' });
  };

  const canSubmit = (tab === 'prompt' && prompt.trim().length > 0) ||
                    (tab === 'file' && file !== null);

  return (
    <div className="card">
      <h2 className="card-title">Create a Calendar Invite</h2>

      <div className="tab-bar">
        <button
          className={`tab-btn ${tab === 'prompt' ? 'active' : ''}`}
          onClick={() => setTab('prompt')}
        >
          Type a Description
        </button>
        <button
          className={`tab-btn ${tab === 'file' ? 'active' : ''}`}
          onClick={() => setTab('file')}
        >
          Upload Document
        </button>
      </div>

      {tab === 'prompt' ? (
        <textarea
          className="prompt-input"
          placeholder={
            'Describe the event in plain language.\n\nExample: "Team sync on Friday March 20th at 2pm for 30 minutes. Attendees: alice@company.com, bob@company.com. We\'ll review the Q1 roadmap."'
          }
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      ) : (
        <>
          <div
            className={`drop-zone ${dragover ? 'dragover' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
            onDragLeave={() => setDragover(false)}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileChange}
            />
            <div className="drop-zone-icon">📄</div>
            <p className="drop-zone-text">Drop your file here, or click to browse</p>
            <p className="drop-zone-sub">Supports PDF and Word documents (.docx) — max 10 MB</p>
          </div>

          {file && (
            <div className="file-selected">
              <span>📎</span>
              <span className="file-selected-name">{file.name}</span>
              <button
                className="btn btn-ghost"
                onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
              >
                Remove
              </button>
            </div>
          )}
        </>
      )}

      {error && (
        <div className="error-msg">
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}

      <div className="extract-btn-row">
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={!canSubmit || isExtracting}
        >
          {isExtracting ? (
            <>
              <span className="spinner" />
              Extracting with AI...
            </>
          ) : (
            'Extract with AI'
          )}
        </button>
      </div>
    </div>
  );
}
