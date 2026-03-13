# Calendar Invite App

A small internal tool that uses AI to generate Microsoft 365 / Outlook calendar invites from a plain-text description or an uploaded PDF/Word document.

**How it works:**
1. Type a description of the event, or upload a document containing the event details.
2. Click **Extract with AI** — Claude reads the text and fills in the invite fields automatically.
3. Review and edit the preview (title, date, time, attendees, etc.).
4. Click **Send Calendar Invite** — the app creates the event in Outlook and sends invitations to all attendees automatically.

---

## Prerequisites

- **Node.js 18+** and **npm**
- An **Anthropic API key** ([console.anthropic.com](https://console.anthropic.com))
- A **Microsoft Azure AD app registration** (steps below)

---

## 1. Azure AD App Registration

This step gives the app permission to create calendar events on behalf of your Microsoft 365 account.

1. Go to [portal.azure.com](https://portal.azure.com) and sign in.
2. Navigate to **Azure Active Directory → App registrations → New registration**.
3. Fill in:
   - **Name**: `Calendar Invite App` (or any name you prefer)
   - **Supported account types**: *Accounts in this organizational directory only* (single tenant)
   - **Redirect URI**: Select **Web** and enter `http://localhost:5173/auth/callback`
4. Click **Register**.
5. On the app's overview page, copy:
   - **Application (client) ID** → this is your `MICROSOFT_CLIENT_ID`
   - **Directory (tenant) ID** → this is your `MICROSOFT_TENANT_ID`
6. Go to **Certificates & secrets → New client secret**.
   - Add a description, choose an expiry, and click **Add**.
   - Copy the **Value** immediately (it won't be shown again) → this is your `MICROSOFT_CLIENT_SECRET`
7. Go to **API permissions → Add a permission → Microsoft Graph → Delegated permissions**.
   - Search for and add: `Calendars.ReadWrite` and `User.Read`
8. Click **Grant admin consent for [your org]** (requires admin privileges, or ask your IT admin).

---

## 2. Local Setup

### Clone and install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Configure environment variables

```bash
# In the backend directory
cp .env.example .env
```

Open `backend/.env` and fill in all values:

```env
ANTHROPIC_API_KEY=sk-ant-...

MICROSOFT_CLIENT_ID=<from Azure AD step 5>
MICROSOFT_CLIENT_SECRET=<from Azure AD step 6>
MICROSOFT_TENANT_ID=<from Azure AD step 5>
REDIRECT_URI=http://localhost:5173/auth/callback

PORT=3001
FRONTEND_URL=http://localhost:5173
SESSION_SECRET=<run: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
```

> **Important:** The `REDIRECT_URI` must exactly match the redirect URI you registered in Azure AD.

---

## 3. Run the App

Open two terminal windows:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Server running at http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# App running at http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 4. Usage

1. **Connect Microsoft** (top-right corner) — sign in with your Microsoft 365 account. This only needs to be done once per session.
2. Choose an input method:
   - **Type a Description** — write a plain-English description of the event.
   - **Upload Document** — upload a PDF or Word (.docx) document containing the event details.
3. Click **Extract with AI** — the fields are auto-populated.
4. Review and edit any fields in the preview. Add or remove attendees as needed.
5. Click **Send Calendar Invite** — the invite is created in Outlook and all attendees receive an email invitation automatically.

---

## Project Structure

```
project-for-madi/
├── backend/
│   ├── server.js                  # Express entry point
│   ├── routes/
│   │   ├── auth.js                # Microsoft OAuth2 routes + token helper
│   │   └── events.js              # Extract and send event routes
│   ├── services/
│   │   ├── aiService.js           # Claude AI extraction logic
│   │   ├── graphService.js        # Microsoft Graph API calendar creation
│   │   └── documentParser.js      # PDF + Word text extraction
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # Root component, state management
│   │   ├── App.css                # All styles
│   │   └── components/
│   │       ├── AuthBanner.jsx     # Microsoft auth status + login/logout
│   │       ├── InputSection.jsx   # File upload + text prompt input
│   │       ├── EventPreview.jsx   # Editable event details form + send button
│   │       └── SuccessMessage.jsx # Confirmation screen
│   ├── vite.config.js             # Vite dev server with API proxy
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
| AI | Claude (via Anthropic API) |
| Auth | Microsoft MSAL Node (OAuth 2.0 auth code flow) |
| Calendar | Microsoft Graph API (`POST /me/events`) |
| Document parsing | pdf-parse (PDF), mammoth (Word .docx) |

---

## Notes

- **Session storage**: By default, sessions are stored in memory. They are lost when the server restarts and do not scale across multiple processes. For production, use a persistent session store (e.g., `connect-redis`).
- **File types**: Word `.doc` (old format) has limited support. Use `.docx` for best results.
- **Timezones**: The app detects your browser's timezone and pre-fills it. Attendees receive invites that honour the timezone specified on the event.
- **Admin consent**: If your organisation requires admin consent for API permissions, you'll need to ask your IT admin to grant it on the Azure AD app registration.
