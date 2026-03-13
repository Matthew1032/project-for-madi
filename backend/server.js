require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS — needed when frontend calls backend directly (production / no proxy)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-replace-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,       // set to true in production (requires HTTPS)
    sameSite: 'lax',     // 'lax' works with the Vite dev proxy (same-origin from browser's view)
    maxAge: 8 * 60 * 60 * 1000, // 8 hours
  },
}));

app.use('/auth', authRoutes);
app.use('/api/events', eventRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
