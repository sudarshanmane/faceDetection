const multer = require('multer');
const faceapi = require('@vladmandic/face-api');
const canvas = require('canvas');
const path = require('path');
const express = require('express');
const fs = require('fs');

// Set up canvas environment for Node.js
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const faceRoutes = express.Router();

const upload = multer({
  dest: 'uploads/', // Directory to store uploaded files
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
  filename: function(req, file, cb) {
    const id = req.body.id; // Get the ID from the request body
    const extension = path.extname(file.originalname); // Get the original file extension
    cb(null, `${id}${extension}`); // Save file with ID as filename and original extension
  }
});
// Multer configuration for memory storage
const storage = multer.memoryStorage(); // Use memory storage instead of disk storage
const upload1 = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB file size limit
});

// Load face-api models on server startup
const modelPath = path.join(__dirname, './../models'); // Update model path accordingly
const loadModels = async () => {
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
};
loadModels()
  .then(() => {
    console.log('Face-api models loaded successfully');
  })
  .catch(error => {
    console.error('Error loading face-api models:', error);
  });

const fileMapPath = path.join(__dirname, '../data/fileMap.json');

// Read file map from JSON file
const readFileMap = () => {
  if (!fs.existsSync(fileMapPath)) {
    fs.writeFileSync(fileMapPath, JSON.stringify({}), 'utf-8');
  }
  const fileMapData = fs.readFileSync(fileMapPath, 'utf-8');
  return JSON.parse(fileMapData);
};

// Write file map to JSON file
const writeFileMap = fileMap => {
  fs.writeFileSync(fileMapPath, JSON.stringify(fileMap, null, 2), 'utf-8');
};

// API to upload an image and save face descriptors
faceRoutes.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const imgPath = req.file.path;
    const id = req.body.id;
    // Load the image using canvas
    const img = await canvas.loadImage(imgPath);
    const detections = await faceapi
      .detectAllFaces(img)
      .withFaceLandmarks()
      .withFaceDescriptors();

    if (detections.length === 0) {
      return res.status(400).json({ message: 'No faces detected' });
    }

    const filename = req.file.filename; // Get the filename from multer
    const fileMap = readFileMap(); // Read current file map

    // Update fileMap with new ID and filename
    fileMap[id] = filename;
    writeFileMap(fileMap); // Save updated fileMap

    res
      .status(200)
      .json({ message: 'Image and descriptors saved successfully' });
  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({ message: 'Error processing image', error });
  }
});
faceRoutes.post('/match', upload1.single('file'), async (req, res) => {
  console.log('Inside /match route');
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Load the uploaded image from buffer
    const uploadedImg = await canvas.loadImage(req.file.buffer);
    if (!uploadedImg) {
      return res.status(400).json({ message: 'Invalid image file' });
    }

    // Detect faces with landmarks and descriptors in the uploaded image
    const uploadedDetections = await faceapi
      .detectAllFaces(uploadedImg)
      .withFaceLandmarks()
      .withFaceDescriptors();

    if (uploadedDetections.length === 0) {
      return res
        .status(400)
        .json({ message: 'No faces detected in uploaded image' });
    }

    const uploadedDescriptor = uploadedDetections[0].descriptor;
    const uploadsDir = path.join(__dirname, '../uploads'); // Path to the uploads directory
    const files = fs.readdirSync(uploadsDir); // Read files in the uploads directory
    const fileMap = readFileMap(); // Read the fileMap to get the mapping
    const matches = [];

    for (const file of files) {
      const filePath = path.join(uploadsDir, file);
      const img = await canvas.loadImage(filePath);

      // Detect faces with landmarks and descriptors in the image from uploads directory
      const detections = await faceapi
        .detectAllFaces(img)
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (detections.length === 0) continue;

      for (const detection of detections) {
        const storedDescriptor = detection.descriptor;
        const distance = faceapi.euclideanDistance(
          uploadedDescriptor,
          storedDescriptor
        );

        if (distance < 0.6) {
          // Threshold for matching
          // Get the ID from the fileMap based on the filename
          const id = Object.keys(fileMap).find(key => fileMap[key] === file);
          matches.push({
            id: id,
            filename: file,
            distance: distance
          });
        }
      }
    }

    if (matches.length === 0) {
      return res.status(200).json({ message: 'No match found' });
    } else {
      res.status(200).json({ message: 'Match found', matches });
    }
  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({ message: 'Error processing image', error });
  }
});

// Health check endpoint
faceRoutes.route('/').get((req, res) => {
  res.status(200).json({ status: 'success' });
});

module.exports = faceRoutes;