const faceapi=require('face-api.js')
const canvas = require("canvas");
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({Canvas,Image,ImageData})

exports.FaceCount=async (req, res) => {

    // Load Face Landmark Model
    await faceapi.nets.faceLandmark68Net.loadFromDisk('./face-analyzer-models');
    try{

        // Prepare Images
        let img=new Image();
        img.src = req.body['imgBase64'];
        let FaceDetails;

        try {

            // Calculate Face Details With Higher ssdMobilenet model
            await faceapi.nets.ssdMobilenetv1.loadFromDisk('./face-analyzer-models');
            FaceDetails = await faceapi.detectAllFaces(img);
            let NumberOfFace=FaceDetails.length;
            res.status(200).json({status: "success", message: "Face detected", NumberOfFace:NumberOfFace })

        }
        catch (e) {
            res.status(200).json({status: "fail", message: "No Face detected"})
        }
    }
    catch (e) {
        res.status(200).json({status: "fail", message: "No Face detected"})
    }
}


