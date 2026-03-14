import { useState } from 'react';

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

export default function EventPreview({ event, onChange, onAdd, isAdding, addError }) {
  const [newAttendee, setNewAttendee] = useState('');
  const [attendeeError, setAttendeeError] = useState('');

  const update = (field, value) => onChange({ ...event, [field]: value });

  const addAttendee = () => {
    const email = newAttendee.trim();
    if (!email) return;
    if (!isValidEmail(email)) { setAttendeeError('Please enter a valid email address.'); return; }
    if (event.attendees.includes(email)) { setAttendeeError('Already in the list.'); return; }
    onChange({ ...event, attendees: [...event.attendees, email] });
    setNewAttendee('');
    setAttendeeError('');
  };

  const removeAttendee = (email) =>
    onChange({ ...event, attendees: event.attendees.filter((a) => a !== email) });

  const canAdd = event.title.trim() && event.date && event.time;

  return (
    <div className="card">
      <h2 className="card-title">Preview &amp; Edit Event</h2>

      <div className="preview-grid">

        <div className="field full-width">
          <label>Event Title</label>
          <input type="text" value={event.title} onChange={(e) => update('title', e.target.value)} placeholder="Meeting title" />
        </div>

        <div className="field">
          <label>Date</label>
          <input type="date" value={event.date} onChange={(e) => update('date', e.target.value)} />
        </div>

        <div className="field">
          <label>Start Time</label>
          <input type="time" value={event.time} onChange={(e) => update('time', e.target.value)} />
        </div>

        <div className="field">
          <label>Duration</label>
          <div className="duration-row">
            <input
              type="number" min="5" max="1440" step="5"
              value={event.duration}
              onChange={(e) => update('duration', Number(e.target.value))}
            />
            <span className="duration-unit">minutes</span>
          </div>
        </div>

        <div className="field">
          <label>Timezone</label>
          <select value={event.timezone} onChange={(e) => update('timezone', e.target.value)}>
            {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
            {!TIMEZONES.includes(event.timezone) && (
              <option value={event.timezone}>{event.timezone}</option>
            )}
          </select>
        </div>

        <div className="field full-width">
          <label>Location / Meeting Link</label>
          <input
            type="text" value={event.location}
            onChange={(e) => update('location', e.target.value)}
            placeholder="Conference Room A, Teams link, etc. (optional)"
          />
        </div>

        <div className="field full-width">
          <label>Attendees <span className="label-hint">(listed on the invite — they won't receive automatic emails)</span></label>
          {event.attendees.length > 0 && (
            <div className="attendees-list">
              {event.attendees.map((email) => (
                <span key={email} className="attendee-chip">
                  {email}
                  <button type="button" onClick={() => removeAttendee(email)}>&times;</button>
                </span>
              ))}
            </div>
          )}
          <div className="add-attendee-row">
            <input
              type="email" value={newAttendee}
              onChange={(e) => { setNewAttendee(e.target.value); setAttendeeError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAttendee())}
              placeholder="Add attendee email and press Enter"
            />
            <button className="btn btn-secondary" type="button" onClick={addAttendee}>Add</button>
          </div>
          {attendeeError && <span className="field-error">{attendeeError}</span>}
        </div>

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
        {addError && (
          <div className="error-msg"><span>⚠</span><span>{addError}</span></div>
        )}
        <button
          className="btn btn-primary btn-lg"
          onClick={() => onAdd(event)}
          disabled={!canAdd || isAdding}
        >
          {isAdding ? <><span className="spinner" /> Adding to Feed...</> : 'Add to Calendar Feed'}
        </button>
        <p className="send-hint">
          This saves the event to your iCal feed. Anyone subscribed in Outlook will see it after the next sync.
        </p>
      </div>
    </div>
  );
}
