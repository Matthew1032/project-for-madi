const express = require('express');
const multer = require('multer');
const { parseDocument } = require('../services/documentParser');
const { extractEventDetails } = require('../services/aiService');
const { addEvent, readEvents, getEventCount, generateIcal } = require('../services/feedService');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Only PDF and Word (.docx) files are supported.'));
  },
});

// ─── POST /api/events/extract ──────────────────────────────────────────────────
// Accepts a file upload OR { prompt } body.
// Returns AI-extracted event details for preview — does NOT save anything yet.
router.post('/events/extract', upload.single('file'), async (req, res) => {
  try {
    let text;

    if (req.file) {
      text = await parseDocument(req.file.buffer, req.file.mimetype);
    } else if (req.body?.prompt) {
      text = String(req.body.prompt).trim();
    } else {
      return res.status(400).json({ error: 'Provide either a file upload or a prompt.' });
    }

    if (!text) {
      return res.status(400).json({ error: 'No usable text found.' });
    }

    const event = await extractEventDetails(text);
    res.json({ success: true, event });
  } catch (err) {
    console.error('Extract error:', err);
    res.status(500).json({ error: err.message || 'Failed to extract event details.' });
  }
});

// ─── POST /api/events/add ──────────────────────────────────────────────────────
// Saves a confirmed event to the persistent iCal feed.
router.post('/events/add', (req, res) => {
  try {
    const event = req.body;

    if (!event.title || !event.date || !event.time) {
      return res.status(400).json({ error: 'title, date, and time are required.' });
    }

    const saved = addEvent(event);

    const publicUrl = process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 3001}`;
    const feedPath = '/api/feed/calendar.ics';

    res.json({
      success: true,
      event: saved,
      feedUrl: `${publicUrl}${feedPath}`,
      webcalUrl: `webcal://${publicUrl.replace(/^https?:\/\//, '')}${feedPath}`,
      eventCount: getEventCount(),
    });
  } catch (err) {
    console.error('Add event error:', err);
    res.status(500).json({ error: err.message || 'Failed to add event to feed.' });
  }
});

// ─── GET /api/feed/calendar.ics ───────────────────────────────────────────────
// Serves the iCal feed. This is the URL Outlook subscribes to.
router.get('/feed/calendar.ics', (req, res) => {
  try {
    const events = readEvents();
    const ical = generateIcal(events);

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="calendar.ics"');
    // Allow Outlook to cache the feed but still refresh periodically
    res.setHeader('Cache-Control', 'no-cache, no-store');
    res.send(ical);
  } catch (err) {
    console.error('Feed error:', err);
    res.status(500).send('Failed to generate calendar feed.');
  }
});

// ─── GET /api/feed/info ────────────────────────────────────────────────────────
// Returns the feed URL and event count so the frontend can display them.
router.get('/feed/info', (req, res) => {
  const publicUrl = process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 3001}`;
  const feedPath = '/api/feed/calendar.ics';

  res.json({
    feedUrl: `${publicUrl}${feedPath}`,
    webcalUrl: `webcal://${publicUrl.replace(/^https?:\/\//, '')}${feedPath}`,
    eventCount: getEventCount(),
  });
});

module.exports = router;
