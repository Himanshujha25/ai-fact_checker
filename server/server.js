require('dotenv').config();
console.log('☢️ ------------------------------------------');
console.log('☢️   TRUECAST FORENSIC NODE: V4.2 PRO ACTIVE');
console.log('☢️ ------------------------------------------');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const db = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const verifyRoutes = require('./routes/verify');

const intelRoutes = require('./routes/intel');
const personaRoutes = require('./routes/persona');
const v1Routes = require('./routes/v1');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));
app.use(express.json({ limit: '25mb' }));

// Init Database
db.initDB();

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Legacy Redirects
app.get('/api/url/reputation', (req, res) => {
  const params = new URLSearchParams(req.query).toString();
  res.redirect(307, `/api/intel/url/reputation${params ? '?' + params : ''}`);
});

// Register Routes
app.use('/api/auth', authRoutes);
app.use('/api', verifyRoutes);

app.use('/api/intel', intelRoutes);
app.use('/api/persona', personaRoutes);
app.use('/api/v1', v1Routes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Fatal Error]', err.stack);
  res.status(500).json({ error: 'Critical server failure' });
});

app.listen(PORT, () => {
  console.log(`🚀 VeriCheck Modular Server running on port ${PORT}`);
});
