const faceapi=require('face-api.js')
const canvas = require("canvas");
const {TinyFaceDetectorOptions} = require("face-api.js");
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({Canvas,Image,ImageData})

exports.FaceLandmark=async (req, res) => {

    // Load Face Landmark Model
    await faceapi.nets.faceLandmark68Net.loadFromDisk('./face-analyzer-models');
    try{

        // Prepare Images
        let img=new Image();
        img.src = req.body['imgBase64'];
        let FaceDetails;

        try {
            if(req.body['accuracy']==="high"){

                // Calculate Face Details With Higher ssdMobilenet model
                await faceapi.nets.ssdMobilenetv1.loadFromDisk('./face-analyzer-models');
                FaceDetails = await faceapi.detectSingleFace(img).withFaceLandmarks()
            }
            else{

                // Calculate Face Details With Higher tinyFaceDetector model
                await faceapi.nets.tinyFaceDetector.loadFromDisk('./face-analyzer-models');
                FaceDetails = await faceapi.detectSingleFace(img,new TinyFaceDetectorOptions()).withFaceLandmarks()
            }
            res.status(200).json({status: "success", message: "Face detected", landmarks: FaceDetails['landmarks']})

        }
        catch (e) {
            res.status(200).json({status: "fail", message: "No Face detected"})
        }
    }
    catch (e) {
        res.status(200).json({status: "fail", message: "No Face detected"})
    }
}


