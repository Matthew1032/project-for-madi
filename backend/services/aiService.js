const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a structured data extractor for calendar events.
Given text from a document or a plain description, extract event details and return ONLY a valid JSON object — no markdown, no explanation, nothing else.

Required fields:
{
  "title": "string — concise event title",
  "date": "YYYY-MM-DD — use the current year if year is not specified",
  "time": "HH:MM — 24-hour format start time, default 09:00 if not found",
  "duration": integer — duration in minutes, default 60 if not specified,
  "attendees": ["array of email addresses found in the text, empty array if none"],
  "description": "string — summary or agenda, empty string if none",
  "location": "string — room name, address, or meeting link, empty string if none",
  "timezone": "IANA timezone string, e.g. America/Chicago — infer from context, default America/Chicago"
}

Rules:
- Return ONLY the JSON object. No code fences, no commentary.
- Use null only when a value truly cannot be determined and there is no sensible default.
- For date: if a day/month is given without a year, use the next upcoming occurrence.
- For attendees: only include strings that look like valid email addresses.`;

/**
 * Uses Claude to extract structured calendar event details from arbitrary text.
 * @param {string} text - Document text or user prompt
 * @returns {Promise<Object>} Structured event object
 */
async function extractEventDetails(text) {
  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Extract calendar event details from the following:\n\n${text}`,
      },
    ],
  });

  const raw = message.content[0].text.trim();

  let extracted;
  try {
    extracted = JSON.parse(raw);
  } catch {
    // Claude occasionally wraps JSON in code fences despite instructions; strip them
    const stripped = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    extracted = JSON.parse(stripped);
  }

  // Apply safe defaults so the frontend always receives a complete object
  return {
    title: extracted.title || '',
    date: extracted.date || new Date().toISOString().split('T')[0],
    time: extracted.time || '09:00',
    duration: Number(extracted.duration) || 60,
    attendees: Array.isArray(extracted.attendees) ? extracted.attendees.filter(Boolean) : [],
    description: extracted.description || '',
    location: extracted.location || '',
    timezone: extracted.timezone || 'America/Chicago',
  };
}

module.exports = { extractEventDetails };
