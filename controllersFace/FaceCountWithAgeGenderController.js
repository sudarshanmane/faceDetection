const faceapi = require('face-api.js');
const canvas = require('canvas');
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

exports.FaceCountWithAgeGender = async (req, res) => {
  // Load Face Landmark Model
  await faceapi.nets.faceLandmark68Net.loadFromDisk('./face-analyzer-models');
  await faceapi.nets.ageGenderNet.loadFromDisk('./face-analyzer-models');
  try {
    // Prepare Images
    let img = new Image();
    img.src = req.body['imgBase64'];
    let FaceDetails;

    try {
      // Calculate Face Details With Higher ssdMobilenet model
      await faceapi.nets.ssdMobilenetv1.loadFromDisk('./face-analyzer-models');
      FaceDetails = await faceapi.detectAllFaces(img).withAgeAndGender();

      let NumberOfFace = FaceDetails.length;

      let Male = 0;
      let Female = 0;
      let AgeSum = 0;

      FaceDetails.map((item, i) => {
        AgeSum = AgeSum + item['age'];
        if (item['gender'] === 'male') {
          Male = Male + 1;
        } else {
          Female = Female + 1;
        }
      });
      let AgeAvg = AgeSum / NumberOfFace;

      res
        .status(200)
        .json({
          status: 'success',
          message: 'Face detected',
          NumberOfFace: NumberOfFace,
          Male: Male,
          Female: Female,
          AgeAvg: AgeAvg
        });
    } catch (e) {
      res.status(200).json({ status: 'fail', message: 'No Face detected' });
    }
  } catch (e) {
    res.status(200).json({ status: 'fail', message: 'No Face detected' });
  }
};
