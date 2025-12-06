import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
dotenv.config();

import authRoutes from './routes/auth.js';
import bloodRequestRoutes from './routes/bloodRequests.js';
import contactRoutes from './routes/contact.js';
import donorRoutes from './routes/donors.js';
import emergencyRoutes from './routes/emergency.js';
import notificationRoutes from './routes/notifications.js';
import donationRoutes from './routes/donations.js';
import bloodBankRoutes from './routes/bloodBanks.js';
import postRoutes from './routes/posts.js';
import adminRoutes from './routes/admin.js';
import { initializeReminderScheduler } from './utils/donationReminderScheduler.js';

const app = express();

// Create HTTP server and Socket.io server
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Make io available to routes via middleware
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middleware (must come before routes)
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/blood-requests', bloodRequestRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/blood-banks', bloodBankRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/admin', adminRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ message: 'Blood Buddy API is running!' });
});
// Test route
app.get("/api/test", (req, res) => {
  res.send("Backend test route working!");
});

// MongoDB connection
const PORT = process.env.PORT || 5000;
const MONGO_URI =
  process.env.MONGO_URI ||
  'mongodb://127.0.0.1:27017/blood-buddy';

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });

  // Join user-specific room for notifications
  socket.on('join_user_room', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  // Leave user room
  socket.on('leave_user_room', (userId) => {
    socket.leave(`user_${userId}`);
  });
});

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    httpServer.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Socket.io server is ready`);
      // Initialize donation reminder scheduler
      initializeReminderScheduler(io);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

export default app;

