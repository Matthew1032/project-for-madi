import { useState, useEffect, useCallback } from 'react';
import InputSection from './components/InputSection.jsx';
import EventPreview from './components/EventPreview.jsx';
import FeedInfo from './components/FeedInfo.jsx';
import SuccessMessage from './components/SuccessMessage.jsx';

export default function App() {
  const [feedInfo, setFeedInfo] = useState(null);
  const [extractedEvent, setExtractedEvent] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [extractError, setExtractError] = useState('');
  const [addError, setAddError] = useState('');
  const [success, setSuccess] = useState(null);

  const refreshFeedInfo = useCallback(async () => {
    try {
      const res = await fetch('/api/feed/info');
      if (res.ok) setFeedInfo(await res.json());
    } catch {
      // Backend not reachable yet — will retry on next action
    }
  }, []);

  useEffect(() => {
    refreshFeedInfo();
  }, [refreshFeedInfo]);

  const handleExtract = async ({ file, prompt }) => {
    setIsExtracting(true);
    setExtractError('');
    setExtractedEvent(null);

    const body = new FormData();
    if (file) {
      body.append('file', file);
    } else {
      body.append('prompt', prompt);
    }

    try {
      const res = await fetch('/api/events/extract', {
        method: 'POST',
        body,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Extraction failed.');

      // Pre-fill the browser's local timezone
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setExtractedEvent({ ...data.event, timezone: data.event.timezone || tz });
    } catch (err) {
      setExtractError(err.message);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleAdd = async (event) => {
    setIsAdding(true);
    setAddError('');

    try {
      const res = await fetch('/api/events/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add event.');

      setSuccess(data);
      setFeedInfo({
        feedUrl: data.feedUrl,
        webcalUrl: data.webcalUrl,
        eventCount: data.eventCount,
      });
    } catch (err) {
      setAddError(err.message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleReset = () => {
    setExtractedEvent(null);
    setSuccess(null);
    setAddError('');
    setExtractError('');
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-brand">
          <span className="header-icon">📅</span>
          <span className="header-title">Calendar Invite</span>
        </div>
        <span className="header-sub">iCal feed for Microsoft Outlook</span>
      </header>

      <main className="app-main">
        {success ? (
          <SuccessMessage result={success} onReset={handleReset} />
        ) : (
          <div className="app-content">
            <InputSection
              onExtract={handleExtract}
              isExtracting={isExtracting}
              error={extractError}
            />

            {extractedEvent && (
              <EventPreview
                event={extractedEvent}
                onChange={setExtractedEvent}
                onAdd={handleAdd}
                isAdding={isAdding}
                addError={addError}
              />
            )}

            <FeedInfo info={feedInfo} onRefresh={refreshFeedInfo} />
          </div>
        )}
      </main>
    </div>
  );
}
