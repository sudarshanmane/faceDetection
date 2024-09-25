const faceapi=require('face-api.js')
const canvas = require("canvas");
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({Canvas,Image,ImageData})

exports.FaceAgeGender=async (req, res) => {

    // Load Face  Age Gender Model
    await faceapi.nets.ageGenderNet.loadFromDisk('./face-analyzer-models');
    try{

        // Prepare Images
        let img=new Image();
        img.src = req.body['imgBase64'];
        let FaceDetails;

        try {
            await faceapi.nets.ssdMobilenetv1.loadFromDisk('./face-analyzer-models');
            FaceDetails = await faceapi.detectSingleFace(img).withAgeAndGender();
            let age=(FaceDetails['age']).toFixed(0);
            let gender=(FaceDetails['gender']);
            res.status(200).json({status: "success", message: "Face detected",age:age,gender:gender})
        }
        catch (e) {
            res.status(200).json({status: "fail", message: "No Face detected"})
        }

    }
    catch (e) {
        res.status(200).json({status: "fail", message: "No Face detected"})
    }
}


