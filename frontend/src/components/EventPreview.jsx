import { useState } from 'react';

// Common IANA timezones for the dropdown
const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Moscow',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
  'UTC',
];

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function EventPreview({ event, onChange, onSend, isSending, isAuthenticated, sendError }) {
  const [newAttendee, setNewAttendee] = useState('');
  const [attendeeError, setAttendeeError] = useState('');

  const update = (field, value) => onChange({ ...event, [field]: value });

  const addAttendee = () => {
    const email = newAttendee.trim();
    if (!email) return;
    if (!isValidEmail(email)) {
      setAttendeeError('Please enter a valid email address.');
      return;
    }
    if (event.attendees.includes(email)) {
      setAttendeeError('This email is already in the list.');
      return;
    }
    onChange({ ...event, attendees: [...event.attendees, email] });
    setNewAttendee('');
    setAttendeeError('');
  };

  const removeAttendee = (email) => {
    onChange({ ...event, attendees: event.attendees.filter((a) => a !== email) });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addAttendee(); }
  };

  const canSend = event.title.trim() && event.date && event.time;

  return (
    <div className="card">
      <h2 className="card-title">Preview &amp; Edit Invite</h2>

      <div className="preview-grid">

        {/* Title */}
        <div className="field full-width">
          <label>Event Title</label>
          <input
            type="text"
            value={event.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="Meeting title"
          />
        </div>

        {/* Date */}
        <div className="field">
          <label>Date</label>
          <input
            type="date"
            value={event.date}
            onChange={(e) => update('date', e.target.value)}
          />
        </div>

        {/* Time */}
        <div className="field">
          <label>Start Time</label>
          <input
            type="time"
            value={event.time}
            onChange={(e) => update('time', e.target.value)}
          />
        </div>

        {/* Duration */}
        <div className="field">
          <label>Duration</label>
          <div className="duration-row">
            <input
              type="number"
              min="5"
              max="1440"
              step="5"
              value={event.duration}
              onChange={(e) => update('duration', Number(e.target.value))}
            />
            <span className="duration-unit">minutes</span>
          </div>
        </div>

        {/* Timezone */}
        <div className="field">
          <label>Timezone</label>
          <select value={event.timezone} onChange={(e) => update('timezone', e.target.value)}>
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
            {/* Keep the current value if it's not in the list */}
            {!TIMEZONES.includes(event.timezone) && (
              <option value={event.timezone}>{event.timezone}</option>
            )}
          </select>
        </div>

        {/* Location */}
        <div className="field full-width">
          <label>Location / Meeting Link</label>
          <input
            type="text"
            value={event.location}
            onChange={(e) => update('location', e.target.value)}
            placeholder="Conference Room A, Teams link, etc. (optional)"
          />
        </div>

        {/* Attendees */}
        <div className="field full-width">
          <label>Attendees</label>
          {event.attendees.length > 0 && (
            <div className="attendees-list">
              {event.attendees.map((email) => (
                <span key={email} className="attendee-chip">
                  {email}
                  <button type="button" onClick={() => removeAttendee(email)} title="Remove">
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="add-attendee-row">
            <input
              type="email"
              value={newAttendee}
              onChange={(e) => { setNewAttendee(e.target.value); setAttendeeError(''); }}
              onKeyDown={handleKeyDown}
              placeholder="Add attendee email and press Enter"
            />
            <button className="btn btn-secondary" type="button" onClick={addAttendee}>
              Add
            </button>
          </div>
          {attendeeError && (
            <span style={{ fontSize: 13, color: 'var(--error)', marginTop: 4 }}>{attendeeError}</span>
          )}
        </div>

        {/* Description */}
        <div className="field full-width">
          <label>Description / Agenda</label>
          <textarea
            value={event.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="Event description or agenda (optional)"
          />
        </div>

      </div>

      <div className="divider" />

      <div className="send-row">
        {sendError && (
          <div className="error-msg">
            <span>⚠</span>
            <span>{sendError}</span>
          </div>
        )}

        <button
          className="btn btn-primary btn-lg"
          onClick={() => onSend(event)}
          disabled={!canSend || isSending}
        >
          {isSending ? (
            <>
              <span className="spinner" />
              Sending Invite...
            </>
          ) : isAuthenticated ? (
            'Send Calendar Invite'
          ) : (
            'Sign in with Microsoft to Send'
          )}
        </button>

        {!isAuthenticated && (
          <p className="send-hint">
            You'll be redirected to Microsoft login, then returned here to send the invite.
          </p>
        )}
      </div>
    </div>
  );
}
