const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  imagePath: {
    type: String,
    required: true
  },
  id: {
    type: String,
    required: true,
    unique: true
  },
  descriptors: {
    type: [[Number]], // Array of arrays of numbers (2D array for multiple faces in one image)
    required: true
  }
});

const ImageModel = mongoose.model('imageSchema', imageSchema);
module.exports = ImageModel;
