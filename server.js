// Import required packages
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const dotenv=require("dotenv");
dotenv.config();
const Joi = require('joi');
const { spawn } = require('child_process');
const { body, validationResult } = require('express-validator');


const codeSubmit= require('./controllers/CodeSubmit');
const getSubmission=require('./controllers/GetSubmission');
const Register=require('./controllers/Register');
const Login = require('./controllers/Login');


// Create an Express application
const app = express();
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


// Connect to MongoDB
mongoose.connect(`mongodb+srv://admin-anshika:${process.env.PASSWORD}@cluster0.wzrpvnt.mongodb.net/judge0`, {
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
  Login(req,res,User,bcrypt,jwt);
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




const executeCode = (code, language) => {
    const childProcess = spawn('docker', ['run', '--rm', '-i', 'sandbox-image', code, language]);

    let output = '';
    let error = '';

    childProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    childProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    childProcess.on('close', async(code) => {
      if (code === 0) {
        const result = JSON.parse(output);
        resolve(result);
        const submission = new CodeSubmission({ code, language, input,executionResult });
        await submission.save();
      } else {
        reject(new Error(`Execution failed: ${error}`));
      }
    });

    childProcess.on('error', (err) => {
      reject(err);
    });
  
};



// Define the API endpoints
app.post('/api/code',[
  body('code').notEmpty().withMessage('Code is required'),
  body('language').notEmpty().withMessage('Language is required'),
],authenticateToken, (req, res,next) => {
  const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
  // console.log(req.body);
  codeSubmit(req,res,CodeSubmission,spawn);
});

app.get('/api/code/:id',authenticateToken, (req, res) => {
  getSubmission(req,res,CodeSubmission);
});

// Start the server
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
