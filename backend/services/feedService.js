const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const DATA_DIR = path.join(__dirname, '..', 'data');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');

// ─── Persistence ───────────────────────────────────────────────────────────────

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readEvents() {
  ensureDataDir();
  if (!fs.existsSync(EVENTS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(EVENTS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeEvents(events) {
  ensureDataDir();
  fs.writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 2), 'utf8');
}

/**
 * Persists a new event to events.json and returns the stored record.
 */
function addEvent(eventDetails) {
  const events = readEvents();
  const record = {
    ...eventDetails,
    uid: `${randomUUID()}@calendar-invite-app`,
    createdAt: new Date().toISOString(),
  };
  events.push(record);
  writeEvents(events);
  return record;
}

function getEventCount() {
  return readEvents().length;
}

// ─── iCal generation ───────────────────────────────────────────────────────────

/**
 * Escape special characters per RFC 5545 §3.3.11.
 */
function escapeIcal(str) {
  return String(str || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n');
}

/**
 * Fold long lines per RFC 5545 §3.1 (max 75 chars per line, continuation with leading space).
 */
function foldLine(line) {
  if (line.length <= 75) return line;
  const chunks = [line.slice(0, 75)];
  let pos = 75;
  while (pos < line.length) {
    chunks.push(' ' + line.slice(pos, pos + 74));
    pos += 74;
  }
  return chunks.join('\r\n');
}

/**
 * Format a UTC Date as iCal DTSTAMP: YYYYMMDDTHHMMSSZ
 */
function formatUtcStamp(date) {
  return date.toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';
}

/**
 * Format a local datetime for DTSTART/DTEND: YYYYMMDDTHHMMSS
 * (used alongside a TZID parameter — no Z suffix)
 */
function formatLocalDateTime(dateStr, timeStr) {
  const [y, m, d] = dateStr.split('-');
  const [h, min] = timeStr.split(':');
  return `${y}${m}${d}T${h}${min}00`;
}

/**
 * Add durationMinutes to a date+time without timezone conversion.
 * Returns a local datetime string YYYYMMDDTHHMMSS.
 */
function addMinutes(dateStr, timeStr, durationMinutes) {
  const [y, mo, d] = dateStr.split('-').map(Number);
  const [h, mi] = timeStr.split(':').map(Number);

  const totalMinutes = h * 60 + mi + Number(durationMinutes || 60);
  const endH = Math.floor(totalMinutes / 60) % 24;
  const endMi = totalMinutes % 60;
  const extraDays = Math.floor(totalMinutes / (24 * 60));

  // Use Date for calendar arithmetic (handles month/year rollover)
  const date = new Date(y, mo - 1, d + extraDays);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(endH)}${pad(endMi)}00`;
}

/**
 * Generates a complete iCal (RFC 5545) string from the stored events array.
 */
function generateIcal(events) {
  const now = formatUtcStamp(new Date());

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Calendar Invite App//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Team Calendar',
    'X-WR-CALDESC:Shared team calendar invites',
    'X-WR-TIMEZONE:UTC',
  ];

  for (const ev of events) {
    const tz = ev.timezone || 'UTC';
    const dtstart = formatLocalDateTime(ev.date, ev.time);
    const dtend = addMinutes(ev.date, ev.time, ev.duration);

    lines.push('BEGIN:VEVENT');
    lines.push(foldLine(`UID:${ev.uid}`));
    lines.push(`DTSTAMP:${now}`);
    lines.push(foldLine(`DTSTART;TZID=${tz}:${dtstart}`));
    lines.push(foldLine(`DTEND;TZID=${tz}:${dtend}`));
    lines.push(foldLine(`SUMMARY:${escapeIcal(ev.title)}`));

    if (ev.description) {
      lines.push(foldLine(`DESCRIPTION:${escapeIcal(ev.description)}`));
    }
    if (ev.location) {
      lines.push(foldLine(`LOCATION:${escapeIcal(ev.location)}`));
    }
    for (const email of ev.attendees || []) {
      lines.push(foldLine(`ATTENDEE;ROLE=REQ-PARTICIPANT:mailto:${email}`));
    }

    lines.push(`CREATED:${formatUtcStamp(new Date(ev.createdAt))}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');

  // iCal requires CRLF line endings
  return lines.join('\r\n');
}

module.exports = { addEvent, readEvents, getEventCount, generateIcal };
