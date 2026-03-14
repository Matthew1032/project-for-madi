# Calendar Invite App

A small internal tool that uses AI to generate a subscribable iCal calendar feed from plain-text descriptions or uploaded PDF/Word documents.

**How it works:**
1. Type a description of the event, or upload a document containing the event details.
2. Click **Extract with AI** — Claude reads the text and fills in all the invite fields automatically.
3. Review and edit the preview (title, date, time, attendees, etc.).
4. Click **Add to Calendar Feed** — the event is saved to a persistent iCal (`.ics`) feed file.
5. Anyone on the team subscribes to the feed URL in Outlook once — they'll automatically receive all future events.

No Azure account, no Microsoft app registration, and no admin permissions required.

---

## Prerequisites

- **Node.js 18+** and **npm** — download from [nodejs.org](https://nodejs.org) (choose the LTS version)
- An **Anthropic API key** — get one at [console.anthropic.com](https://console.anthropic.com)

---

## Setup

### 1. Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment variables

```bash
cd backend
cp .env.example .env
```

Open `backend/.env` and fill in your values:

```env
ANTHROPIC_API_KEY=sk-ant-...your key here...

PORT=3001
FRONTEND_URL=http://localhost:5173

# The URL where the backend is reachable from the outside.
# On your local machine, leave this as-is.
# In production, replace with your server's public URL (e.g. https://calendar.yourcompany.com).
PUBLIC_URL=http://localhost:3001
```

### 3. Run the app

Open **two terminal windows**:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Subscribing to the Feed in Outlook

The app generates a calendar feed at:
```
http://localhost:3001/api/feed/calendar.ics
```

Subscribe to it once — Outlook will automatically pick up every new event you add.

### Outlook for Windows (desktop app)
1. Open Outlook → click the **Calendar** icon in the bottom-left
2. In the ribbon, click **Open Calendar → From Internet…**
3. Paste the feed URL → click **OK** → **Yes**

### Outlook on the web (outlook.com or OWA)
1. Go to **outlook.com** → click the **Calendar** icon
2. Click **Add calendar → Subscribe from web**
3. Paste the feed URL → click **Import**

> **Note:** Outlook syncs subscribed calendars periodically. New events may take up to a few hours to appear. To force a refresh, right-click the calendar in your list and choose **Refresh**.

---

## Project Structure

```
project-for-madi/
├── backend/
│   ├── server.js                  # Express entry point
│   ├── routes/
│   │   └── events.js              # Extract, add, and serve feed routes
│   ├── services/
│   │   ├── aiService.js           # Claude AI event extraction
│   │   ├── feedService.js         # iCal generation + persistent event storage
│   │   └── documentParser.js      # PDF + Word text extraction
│   ├── data/                      # Auto-created; stores events.json (not committed)
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # Root component, state management
│   │   ├── App.css                # All styles
│   │   └── components/
│   │       ├── InputSection.jsx   # File upload + text prompt tabs
│   │       ├── EventPreview.jsx   # Editable event form + add button
│   │       ├── FeedInfo.jsx       # Feed URL display + Outlook instructions
│   │       └── SuccessMessage.jsx # Confirmation + subscribe instructions
│   ├── vite.config.js             # Dev server with API proxy
│   └── package.json
│
├── decisions.md
└── README.md
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite |
| Backend | Node.js, Express |
| AI | Claude claude-opus-4-6 (via Anthropic API) |
| Calendar format | iCalendar / RFC 5545 (`.ics`) |
| Document parsing | pdf-parse (PDF), mammoth (Word .docx) |

---

## Notes

- **Data persistence:** Events are stored in `backend/data/events.json`. This file is created automatically on first use and is excluded from git. Back it up if you need to preserve events across deployments.
- **File types:** Word `.doc` (old binary format) has limited support. Use `.docx` for best results.
- **Attendees on the feed:** Attendee email addresses are embedded in the iCal event as metadata. Outlook displays them on the event detail, but subscribed-feed events do not trigger automatic email invitations (that requires sending an invite directly). For automatic email delivery, share the event from your Outlook calendar manually after it appears.
- **Production deployment:** Set `PUBLIC_URL` in `.env` to your server's public address so the feed URL shown in the UI is correct for external subscribers.
