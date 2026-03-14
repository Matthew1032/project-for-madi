import { useState } from 'react';

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers that block clipboard access
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button className={`btn btn-copy ${copied ? 'copied' : ''}`} onClick={handleCopy}>
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

function OutlookSteps() {
  return (
    <div className="outlook-steps">
      <div className="steps-section">
        <h4 className="steps-heading">Outlook for Windows (desktop app)</h4>
        <ol className="steps-list">
          <li>Open Outlook and click the <strong>Calendar</strong> icon in the bottom-left</li>
          <li>In the top ribbon, click <strong>Open Calendar</strong></li>
          <li>Select <strong>"From Internet…"</strong></li>
          <li>Paste the feed URL above and click <strong>OK</strong>, then <strong>Yes</strong></li>
          <li>The calendar appears in your list under <strong>"Other Calendars"</strong></li>
        </ol>
      </div>

      <div className="steps-section">
        <h4 className="steps-heading">Outlook on the web (outlook.com or OWA)</h4>
        <ol className="steps-list">
          <li>Go to <strong>outlook.com</strong> and click the <strong>Calendar</strong> icon</li>
          <li>Click <strong>"Add calendar"</strong> in the left sidebar</li>
          <li>Select <strong>"Subscribe from web"</strong></li>
          <li>Paste the feed URL above and click <strong>Import</strong></li>
        </ol>
      </div>

      <div className="steps-note">
        <strong>Note:</strong> Outlook syncs subscribed calendars periodically — new events may take up to a few hours to appear.
        To refresh immediately, right-click the calendar in your list and choose <strong>Refresh</strong>.
      </div>
    </div>
  );
}

export default function FeedInfo({ info, onRefresh }) {
  const [showSteps, setShowSteps] = useState(false);

  return (
    <div className="card feed-info-card">
      <div className="feed-info-header">
        <div>
          <h2 className="card-title" style={{ marginBottom: 4 }}>Your Calendar Feed</h2>
          {info ? (
            <p className="feed-event-count">
              {info.eventCount === 0
                ? 'No events yet — add one above.'
                : `${info.eventCount} event${info.eventCount !== 1 ? 's' : ''} in the feed`}
            </p>
          ) : (
            <p className="feed-event-count">Loading…</p>
          )}
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onRefresh}>Refresh</button>
      </div>

      {info && (
        <>
          <div className="feed-url-block">
            <label className="feed-url-label">Subscription URL</label>
            <div className="feed-url-row">
              <span className="feed-url-text">{info.webcalUrl}</span>
              <CopyButton text={info.webcalUrl} />
            </div>
            <p className="feed-url-hint">
              Paste this URL into Outlook's <strong>"Subscribe from web"</strong> or <strong>"From Internet"</strong> feature.
              The feed updates automatically whenever you add a new event here.
            </p>
          </div>

          <button
            className="btn btn-ghost steps-toggle"
            onClick={() => setShowSteps((s) => !s)}
          >
            {showSteps ? '▲ Hide Outlook instructions' : '▼ How to subscribe in Outlook'}
          </button>

          {showSteps && <OutlookSteps />}
        </>
      )}
    </div>
  );
}
