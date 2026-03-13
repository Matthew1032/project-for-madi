import { useState, useEffect, useCallback } from 'react';
import AuthBanner from './components/AuthBanner.jsx';
import InputSection from './components/InputSection.jsx';
import EventPreview from './components/EventPreview.jsx';
import SuccessMessage from './components/SuccessMessage.jsx';

export default function App() {
  const [auth, setAuth] = useState({ isAuthenticated: false, userName: '', email: '' });
  const [extractedEvent, setExtractedEvent] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [extractError, setExtractError] = useState('');
  const [sendError, setSendError] = useState('');
  const [success, setSuccess] = useState(null);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/auth/status', { credentials: 'include' });
      const data = await res.json();
      setAuth(data);
    } catch {
      // Backend not reachable — leave auth as unauthenticated
    }
  }, []);

  useEffect(() => {
    checkAuth();

    // Handle OAuth redirect back to the app
    const params = new URLSearchParams(window.location.search);
    const authResult = params.get('auth');
    if (authResult === 'success') {
      window.history.replaceState({}, '', '/');
      checkAuth();
    } else if (authResult === 'error') {
      window.history.replaceState({}, '', '/');
      setSendError('Microsoft login failed. Please try again.');
    }
  }, [checkAuth]);

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
        credentials: 'include',
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Extraction failed.');

      // Pre-fill the user's local timezone
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setExtractedEvent({ ...data.event, timezone: data.event.timezone || tz });
    } catch (err) {
      setExtractError(err.message);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSend = async (event) => {
    if (!auth.isAuthenticated) {
      // Redirect to Microsoft login; the OAuth callback will return us here
      window.location.href = '/auth/login';
      return;
    }

    setIsSending(true);
    setSendError('');

    try {
      const res = await fetch('/api/events/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
        credentials: 'include',
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.requiresAuth) {
          window.location.href = '/auth/login';
          return;
        }
        throw new Error(data.error || 'Failed to send invite.');
      }

      setSuccess({ ...data, event });
    } catch (err) {
      setSendError(err.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/auth/logout', { credentials: 'include' });
    setAuth({ isAuthenticated: false, userName: '', email: '' });
  };

  const handleReset = () => {
    setExtractedEvent(null);
    setSuccess(null);
    setSendError('');
    setExtractError('');
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-brand">
          <span className="header-icon">📅</span>
          <span className="header-title">Calendar Invite</span>
        </div>
        <AuthBanner auth={auth} onLogout={handleLogout} />
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
                onSend={handleSend}
                isSending={isSending}
                isAuthenticated={auth.isAuthenticated}
                sendError={sendError}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
