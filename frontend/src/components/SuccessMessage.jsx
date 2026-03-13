function formatDate(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(h, m, 0);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export default function SuccessMessage({ result, onReset }) {
  const { event, eventUrl, attendeeCount } = result;

  return (
    <div className="card success-card">
      <div className="success-icon">✅</div>
      <h2 className="success-title">Invite Sent!</h2>
      <p className="success-sub">
        Your calendar invite has been created and{' '}
        {attendeeCount > 0
          ? `invitations sent to ${attendeeCount} attendee${attendeeCount !== 1 ? 's' : ''}.`
          : 'added to your calendar.'}
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
          <span>{formatTime(event.time)} &middot; {event.duration} min &middot; {event.timezone}</span>
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

      <div className="success-actions">
        {eventUrl && (
          <a
            className="btn btn-secondary"
            href={eventUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open in Outlook
          </a>
        )}
        <button className="btn btn-primary" onClick={onReset}>
          Create Another Invite
        </button>
      </div>
    </div>
  );
}
