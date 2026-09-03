// ═══════════════════════════════════════════════════════════
//  ATTENDANCE & EVENT SCHEDULING — Express Server
// ═══════════════════════════════════════════════════════════
//
//  Run in development:  npm run dev
//  Run in production:   npm start
//  Seed admin account:  npm run seed
//
// ═══════════════════════════════════════════════════════════

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables from .env file
dotenv.config();

// Initialize Express app
const app = express();

// ─── Middleware ───
app.use(cors()); // Allow cross-origin requests (React Native ↔ Express)
app.use(express.json({ limit: '10mb' })); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// ─── Request Logger (Development) ───
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.path}`);
  next();
});

// ─── API Routes ───
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/japmala', require('./routes/japmala'));
app.use('/api/compliance', require('./routes/compliance'));

// ─── Health Check Endpoint ───
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Attendance API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ─── 404 Handler ───
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found.`,
  });
});

// ─── Global Error Handler ───
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'An unexpected server error occurred.',
  });
});

// ─── Start Server ───
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB first
    await connectDB();

    app.listen(PORT, () => {
      console.log('');
      console.log('═══════════════════════════════════════════');
      console.log(`  🚀 Server running on port ${PORT}`);
      console.log(`  📍 http://localhost:${PORT}`);
      console.log(`  ❤️  Health: http://localhost:${PORT}/api/health`);
      console.log('═══════════════════════════════════════════');
      console.log('');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
