const express = require('express');
const multer = require('multer');
const { parseDocument } = require('../services/documentParser');
const { extractEventDetails } = require('../services/aiService');
const { createCalendarEvent } = require('../services/graphService');
const { getAccessToken } = require('./auth');

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
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and Word (.docx) files are supported.'));
    }
  },
});

// POST /api/events/extract
// Accepts either a file upload OR a { prompt } JSON body.
// Returns extracted event details as JSON.
router.post('/extract', upload.single('file'), async (req, res) => {
  try {
    let text;

    if (req.file) {
      text = await parseDocument(req.file.buffer, req.file.mimetype);
    } else if (req.body && req.body.prompt) {
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

// POST /api/events/send
// Creates a calendar event via Microsoft Graph and sends invites to attendees.
router.post('/send', async (req, res) => {
  try {
    const accessToken = await getAccessToken(req);
    const eventDetails = req.body;

    if (!eventDetails.title || !eventDetails.date || !eventDetails.time) {
      return res.status(400).json({ error: 'title, date, and time are required.' });
    }

    const created = await createCalendarEvent(accessToken, eventDetails);

    res.json({
      success: true,
      message: 'Calendar invite sent successfully!',
      eventId: created.id,
      eventUrl: created.webLink,
      attendeeCount: (eventDetails.attendees || []).length,
    });
  } catch (err) {
    console.error('Send error:', err);

    if (err.code === 'UNAUTHENTICATED') {
      return res.status(401).json({ error: err.message, requiresAuth: true });
    }

    res.status(500).json({ error: err.message || 'Failed to create calendar event.' });
  }
});

module.exports = router;
