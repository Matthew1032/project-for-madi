import { useState } from 'react';

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(text); }
    catch { /* ignore */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button className={`btn btn-copy ${copied ? 'copied' : ''}`} onClick={handleCopy}>
      {copied ? '✓ Copied' : 'Copy URL'}
    </button>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, mi] = timeStr.split(':').map(Number);
  const d = new Date(); d.setHours(h, mi, 0);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export default function SuccessMessage({ result, onReset }) {
  const { event, webcalUrl, eventCount } = result;

  return (
    <div className="app-content">
      {/* Confirmation card */}
      <div className="card success-card">
        <div className="success-icon">✅</div>
        <h2 className="success-title">Event Added to Feed!</h2>
        <p className="success-sub">
          The event has been saved to your iCal feed.
          {eventCount > 1 && ` Your feed now contains ${eventCount} events.`}
        </p>

        <div className="success-details">
          <div className="success-detail-row">
            <span className="success-detail-label">Event</span>
            <span>{event.title}</span>
          </div>
          <div className="success-detail-row">
            <span className="success-detail-label">Date</span>
            <span>{formatDate(event.date)}</span>
          </div>
          <div className="success-detail-row">
            <span className="success-detail-label">Time</span>
            <span>{formatTime(event.time)} · {event.duration} min · {event.timezone}</span>
          </div>
          {event.location && (
            <div className="success-detail-row">
              <span className="success-detail-label">Location</span>
              <span>{event.location}</span>
            </div>
          )}
          {event.attendees?.length > 0 && (
            <div className="success-detail-row">
              <span className="success-detail-label">Attendees</span>
              <span>{event.attendees.join(', ')}</span>
            </div>
          )}
        </div>

        <button className="btn btn-primary" onClick={onReset}>Add Another Event</button>
      </div>

      {/* Feed URL + subscribe instructions */}
      <div className="card">
        <h2 className="card-title">Subscribe in Outlook</h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
          Anyone on the team who subscribes to this URL will automatically see all events you add — including the one you just created.
        </p>

        <div className="feed-url-block">
          <label className="feed-url-label">Feed URL</label>
          <div className="feed-url-row">
            <span className="feed-url-text">{webcalUrl}</span>
            <CopyButton text={webcalUrl} />
          </div>
        </div>

        <div className="outlook-steps" style={{ marginTop: 20 }}>
          <div className="steps-section">
            <h4 className="steps-heading">Outlook for Windows</h4>
            <ol className="steps-list">
              <li>Open Outlook → click the <strong>Calendar</strong> icon (bottom-left)</li>
              <li>In the ribbon, click <strong>Open Calendar → From Internet…</strong></li>
              <li>Paste the URL above → click <strong>OK</strong> → <strong>Yes</strong></li>
            </ol>
          </div>
          <div className="steps-section">
            <h4 className="steps-heading">Outlook on the web (outlook.com / OWA)</h4>
            <ol className="steps-list">
              <li>Go to <strong>outlook.com</strong> → click <strong>Calendar</strong></li>
              <li>Click <strong>Add calendar → Subscribe from web</strong></li>
              <li>Paste the URL above → click <strong>Import</strong></li>
            </ol>
          </div>
          <div className="steps-note">
            <strong>Tip:</strong> Outlook syncs feeds periodically. To see the new event immediately, right-click the calendar in your list and choose <strong>Refresh</strong>.
          </div>
        </div>
      </div>
    </div>
  );
}
