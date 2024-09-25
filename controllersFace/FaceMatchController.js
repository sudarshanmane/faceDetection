const faceapi = require("face-api.js");
const canvas = require("canvas");
const { TinyFaceDetectorOptions } = require("face-api.js");
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

exports.FaceMatch = async (req, res) => {
  // Load Face Landmark & Recognition Model
  await faceapi.nets.faceLandmark68Net.loadFromDisk("./face-analyzer-models");
  await faceapi.nets.faceRecognitionNet.loadFromDisk("./face-analyzer-models");

  try { 
    // Prepare Images
    let img1 = new Image();
    let img2 = new Image();
    img1.src = req.body["img1Base64"];
    img2.src = req.body["img2Base64"];

    let FaceDetails1, FaceDetails2;

    try {
      if (req.body["accuracy"] === "high") {
        // Calculate Face Details With Higher ssdMobilenet model
        await faceapi.nets.ssdMobilenetv1.loadFromDisk(
          "./face-analyzer-models"
        );
        FaceDetails1 = await faceapi
          .detectSingleFace(img1)
          .withFaceLandmarks()
          .withFaceDescriptor();
        FaceDetails2 = await faceapi
          .detectSingleFace(img2)
          .withFaceLandmarks()
          .withFaceDescriptor();
      } else {
        // Calculate Face Details With Higher tinyFaceDetector model
        await faceapi.nets.tinyFaceDetector.loadFromDisk(
          "./face-analyzer-models"
        );
        FaceDetails1 = await faceapi
          .detectSingleFace(img1, new TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();
        FaceDetails2 = await faceapi
          .detectSingleFace(img2, new TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();
      }

      let distance = faceapi.euclideanDistance(
        FaceDetails1["descriptor"],
        FaceDetails2["descriptor"]
      );
      let similarity = 1 - distance;

      res
        .status(200)
        .json({
          status: "success",
          message: "Face detected",
          distance: distance,
          similarity: similarity,
        });
    } catch (e) {
      res.status(200).json({ status: "fail", message: "No Face detected" });
    }
  } catch (e) {
    res.status(200).json({ status: "fail", message: "No Face detected" });
  }
};
