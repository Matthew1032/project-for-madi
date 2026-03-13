const express = require('express');
const { ConfidentialClientApplication } = require('@azure/msal-node');

const router = express.Router();

const SCOPES = ['Calendars.ReadWrite', 'User.Read', 'offline_access'];
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:5173/auth/callback';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const msalConfig = {
  auth: {
    clientId: process.env.MICROSOFT_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}`,
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
  },
};

// Singleton MSAL instance — holds the in-memory token cache
const cca = new ConfidentialClientApplication(msalConfig);

// GET /auth/login
// Redirects the browser to Microsoft's login page
router.get('/login', async (req, res) => {
  try {
    const authUrl = await cca.getAuthCodeUrl({
      scopes: SCOPES,
      redirectUri: REDIRECT_URI,
    });
    res.redirect(authUrl);
  } catch (err) {
    console.error('Login error:', err);
    res.redirect(`${FRONTEND_URL}?auth=error`);
  }
});

// GET /auth/callback
// Microsoft redirects here after the user logs in
router.get('/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error || !code) {
    console.error('Auth callback error:', req.query.error_description);
    return res.redirect(`${FRONTEND_URL}?auth=error`);
  }

  try {
    const tokenResponse = await cca.acquireTokenByCode({
      code,
      scopes: SCOPES,
      redirectUri: REDIRECT_URI,
    });

    // Store auth data in the server-side session
    req.session.msalAccount = tokenResponse.account;
    req.session.accessToken = tokenResponse.accessToken;
    req.session.tokenExpiry = tokenResponse.expiresOn;

    res.redirect(`${FRONTEND_URL}?auth=success`);
  } catch (err) {
    console.error('Token exchange error:', err);
    res.redirect(`${FRONTEND_URL}?auth=error`);
  }
});

// GET /auth/status
// Returns whether the current session has a valid Microsoft login
router.get('/status', (req, res) => {
  if (req.session.msalAccount) {
    res.json({
      isAuthenticated: true,
      userName: req.session.msalAccount.name || req.session.msalAccount.username,
      email: req.session.msalAccount.username,
    });
  } else {
    res.json({ isAuthenticated: false });
  }
});

// GET /auth/logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('Session destroy error:', err);
    res.json({ success: true });
  });
});

// ─── Shared helper used by other routes ────────────────────────────────────────

/**
 * Returns a valid access token for the current session.
 * Tries a silent refresh if the token is expired or nearly expired.
 * Throws if the session has no Microsoft login.
 */
async function getAccessToken(req) {
  if (!req.session.msalAccount) {
    throw Object.assign(new Error('Not authenticated'), { code: 'UNAUTHENTICATED' });
  }

  const now = new Date();
  const expiry = new Date(req.session.tokenExpiry);
  const bufferMs = 5 * 60 * 1000; // 5-minute buffer

  if (expiry > new Date(now.getTime() + bufferMs)) {
    return req.session.accessToken;
  }

  // Token is expiring — try a silent refresh
  try {
    const result = await cca.acquireTokenSilent({
      account: req.session.msalAccount,
      scopes: SCOPES,
    });
    req.session.accessToken = result.accessToken;
    req.session.tokenExpiry = result.expiresOn;
    return result.accessToken;
  } catch (err) {
    console.error('Silent refresh failed:', err);
    // Clear stale session so the user can re-authenticate
    req.session.destroy(() => {});
    throw Object.assign(new Error('Session expired — please log in again'), { code: 'UNAUTHENTICATED' });
  }
}

module.exports = { router, getAccessToken };
