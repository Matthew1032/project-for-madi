const GRAPH_API = 'https://graph.microsoft.com/v1.0';

/**
 * Creates a calendar event on the authenticated user's calendar via Microsoft Graph.
 * Attendees automatically receive email invitations.
 *
 * @param {string} accessToken - Valid MS Graph access token
 * @param {Object} event - Structured event details from the frontend preview
 * @returns {Promise<Object>} The created event object from Graph
 */
async function createCalendarEvent(accessToken, event) {
  const { title, date, time, duration, attendees, description, location, timezone } = event;

  // Build start datetime (ISO 8601 WITHOUT trailing Z — timeZone field anchors it)
  const startDateTime = `${date}T${time}:00`;

  // Compute end datetime by adding duration minutes
  const startMs = new Date(`${date}T${time}:00`).getTime();
  const endMs = startMs + (Number(duration) || 60) * 60 * 1000;
  const endDateObj = new Date(endMs);

  const pad = (n) => String(n).padStart(2, '0');
  const endDate = `${endDateObj.getFullYear()}-${pad(endDateObj.getMonth() + 1)}-${pad(endDateObj.getDate())}`;
  const endTime = `${pad(endDateObj.getHours())}:${pad(endDateObj.getMinutes())}`;
  const endDateTime = `${endDate}T${endTime}:00`;

  const tz = timezone || 'America/Chicago';

  const payload = {
    subject: title,
    start: { dateTime: startDateTime, timeZone: tz },
    end: { dateTime: endDateTime, timeZone: tz },
    body: {
      contentType: 'HTML',
      content: description
        ? `<p>${description.replace(/\n/g, '<br>')}</p>`
        : '',
    },
    attendees: (attendees || []).map((email) => ({
      emailAddress: { address: email, name: email },
      type: 'required',
    })),
    isReminderOn: true,
    reminderMinutesBeforeStart: 15,
  };

  if (location) {
    payload.location = { displayName: location };
  }

  const response = await fetch(`${GRAPH_API}/me/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const msg = errorBody?.error?.message || `Graph API error (HTTP ${response.status})`;
    throw new Error(msg);
  }

  return response.json();
}

module.exports = { createCalendarEvent };
