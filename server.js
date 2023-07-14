// Import required packages
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const dotenv=require("dotenv");
dotenv.config();
const Joi = require('joi');
const { spawn } = require('child_process');
const { body, validationResult } = require('express-validator');
const socketIO  = require('socket.io');

const codeSubmit= require('./controllers/CodeSubmit');
const getSubmission=require('./controllers/GetSubmission');
const Register=require('./controllers/Register');
const Login = require('./controllers/Login');


// Create an Express application
const app = express();
const server = http.createServer(app);
const io = socketIO (server);
app.use(express.json());

app.use((err, req, res, next) => {
  console.error(err.stack);

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  // Handle authentication and authorization errors
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Handle other errors
  res.status(500).json({ error: 'Internal server error' });
});


// Store the socket IDs for each connected client
const socketIds = new Map();


io.on('connection', (socket) => {
  console.log('A socket connection is established:', socket.id);
  
  // Handle events for the connected socket
  socket.on('event', (data) => {
    console.log('Received event:', data);
  });
  socket.on('setUserId', (token) => {
    try {
      // Verify the JWT token to get the user ID
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId;

      // Associate the user's socket ID with their user ID
      socketIds.set(userId, socket.id);
    } catch (error) {
      console.error('Invalid token:', error);
      // Handle invalid token error if needed
    }
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);

    // Remove the user's socket ID from the map when they disconnect
    for (const [userId, socketId] of socketIds) {
      if (socketId === socket.id) {
        socketIds.delete(userId);
        break;
      }
    }
  });
});


// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});



// Define the CodeSubmission schema
const codeSubmissionSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
  },
  language: {
    type: String,
    required: true,
  },
  input: {
    type: String,
  },
  executionResult: {
    type: String,
  },
  userId:{
    type:String,
    required:true
  }
});

// User Schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
});

userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});


// Create the CodeSubmission model
const CodeSubmission = mongoose.model('CodeSubmission', codeSubmissionSchema);



// Create the user model
const User = mongoose.model('User', userSchema);

// Register a new user
app.post('/api/register', async (req, res) => {
  Register(req,res,User);
});

// User login
app.post('/api/login', async (req, res) => {
  Login(req,res,User,bcrypt,jwt,io);
});


// Protect API endpoints with authentication middleware
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (error, decoded) => {
    if (error) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.userId = decoded.userId;
    next();
  });
};

// Define the API endpoints
app.post('/api/code',[
  body('code').notEmpty().withMessage('Code is required'),
  body('language').notEmpty().withMessage('Language is required'),
],authenticateToken, (req, res,next) => {
  const userId=req.userId;
  const socketId=socketIds.get(userId);
  const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

  codeSubmit(req,res,CodeSubmission,spawn,io,socketId,userId)
});

app.get('/api/code/:id',authenticateToken, (req, res) => {
  getSubmission(req,res,CodeSubmission);
});


// Start the server
server.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});


