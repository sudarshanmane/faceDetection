const express = require('express');
const morgan = require('morgan');
// const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');
const faceapi = require('@vladmandic/face-api');

const multer = require('multer');
const fs = require('fs');
const bodyParser = require('body-parser');

// Security Middleware Lib Import
const cors = require('cors');

const AppError = require('./utils/appError');
const faceRoutes = require('./route/faceRoutes');

// Security Middleware Implement

const app = express();
multer({ dest: 'uploads/' });

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 1. Global middleware

// set security http headers
app.use(helmet());

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

const loadModels = async () => {
  const modelPath = path.join(__dirname, 'models');
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
};

loadModels();

// requests limiter from same api
// const limiter = rateLimit({
//   max: 100,
//   windowMs: 60 * 60 * 1000,
//   message: 'Too many requests from this ip. Please try again later.'
// });

// app.use('/api', limiter);

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// body parser
app.use(express.json());

// after express.json() only
// data sanitization against noSQL Query injection
app.use(mongoSanitize()); // it will verify all the $ like symbol from the body and headers

// xss
app.use(xss()); // help preventing cross site scripting attach remove all the html code
app.use((req, res, next) => {
  next();
});

app.use(cors());
app.use(express.urlencoded({ limit: '50mb' }));

// Body Parser Implement
app.use(bodyParser.json());

// http parameter pollution
// removes all the duplicate search query parameters
//whitelist to not remove some duplicates
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingQuantity',
      'maximumGroupSize',
      'price',
      'difficulty'
    ]
  })
);

app.use('/api/v1/uploads', faceRoutes);

app.get('/api/v1/', (req, res) => {
  res.send('Welcome to the Node.js API!');
});

// for handling incorrect url's
// Note: always define this after all other routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// global error handling middleware
// app.use(errorMiddleware);

module.exports = app;

//  npm i eslint prettier eslint-config-prettier eslint-plugin-prettier eslint-config-airbnb eslint-plugin-node eslint-plugin-import eslint-plugin-jsx-a11y eslint-plugin-react --save-dev
