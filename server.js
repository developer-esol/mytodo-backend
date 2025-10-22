// require("dotenv").config();
// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");

// const userRoutes = require("./routes/UserRoutes");

// const authRoutes = require("./routes/Auth");
// const twoFactorAuthRoutes = require("./routes/TwoFactorAuth"); // Import 2FA route

// const app = express();
// const PORT = process.env.PORT || 5001;

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Database Connection
// mongoose
//   .connect(process.env.MONGO_URI)
//   .then(() => console.log("MongoDB Connected"))
//   .catch((err) => console.log(err));

// // Routes
// //app.use("/api/auth", authRoutes);
// // app.use("/api", twoFactorAuthRoutes); // Add 2FA route
// app.use("/api/auth", userRoutes);
// app.use("/api/two-factor-auth", twoFactorAuthRoutes);

// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
const connectDB = require("./config/db");
const app = require("./app");
const http = require('http');
const socketIo = require('socket.io');

// Connect to database before starting server
connectDB()
  .then(() => {
    // Set up CORS headers middleware
    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
      
      // Handle OPTIONS preflight
      if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
      }
      next();
    });

    // Enable CORS for all responses
    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // Create HTTP server
    const server = http.createServer(app);
    
    // Setup Socket.io with CORS
    const io = socketIo(server, {
      cors: {
        origin: ["http://localhost:3000", "http://localhost:5173", "http://localhost:3001"],
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        credentials: true
      }
    });

    // Make io available globally for notification service
    global.io = io;

    // Socket.io connection handling
    io.on('connection', (socket) => {
      console.log(`🔗 User connected: ${socket.id}`);

      // Handle user joining their notification room
      socket.on('join-user-room', (userId) => {
        if (userId) {
          socket.join(`user_${userId}`);
          console.log(`👤 User ${userId} joined their notification room`);
          
          // Send confirmation
          socket.emit('room-joined', { 
            message: 'Connected to notification system',
            userId: userId 
          });
        }
      });

      // Handle sound preference updates
      socket.on('update-sound-preference', (data) => {
        const { userId, soundEnabled } = data;
        console.log(`🔊 User ${userId} sound preference: ${soundEnabled ? 'enabled' : 'disabled'}`);
        
        // Store preference in socket session
        socket.soundEnabled = soundEnabled;
        socket.userId = userId;
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`❌ User disconnected: ${socket.id}`);
      });

      // Handle test notification request
      socket.on('test-notification', (data) => {
        const { userId } = data;
        if (userId) {
          // Send test notification with sound alert
          io.to(`user_${userId}`).emit('notification', {
            id: 'test-' + Date.now(),
            type: 'TEST',
            title: 'Test Notification',
            message: 'This is a test notification with sound alert!',
            priority: 'NORMAL',
            playSound: true,
            createdAt: new Date()
          });
          console.log(`🧪 Test notification sent to user ${userId}`);
        }
      });
    });

    server.listen(process.env.PORT || 5001, () => {
      console.log(`🚀 Server running on port ${process.env.PORT || 5001}`);
      console.log(`🔗 Socket.io enabled for real-time notifications`);
    });
    
    // Increase header size limit
    server.maxHeadersCount = 0;
  })
  .catch((err) => {
    console.error("Database connection failed", err);
    process.exit(1);
  });
