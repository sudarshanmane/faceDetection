const faceapi=require('face-api.js')
const canvas = require("canvas");
const { Canvas, Image, ImageData }=canvas;
faceapi.env.monkeyPatch({Canvas,Image,ImageData});

exports.FaceExpression=async (req, res) => {

    // Load Face  Expression Model
    await faceapi.nets.faceExpressionNet.loadFromDisk('./face-analyzer-models');
    try{

        // Prepare Images
        let img=new Image()
        img.src = req.body['imgBase64'];
        let FaceDetails;
        let FaceExpression;

        try {

            await faceapi.nets.ssdMobilenetv1.loadFromDisk('./face-analyzer-models');
            FaceDetails = await faceapi.detectSingleFace(img).withFaceExpressions();

            // Expression Terms
            let neutral= (FaceDetails['expressions']['neutral'])
            let happy= (FaceDetails['expressions']['happy'])
            let sad=  (FaceDetails['expressions']['sad'])
            let angry=  (FaceDetails['expressions']['angry'])
            let fearful=   (FaceDetails['expressions']['fearful'])
            let disgusted= (FaceDetails['expressions']['disgusted'])
            let surprised=(FaceDetails['expressions']['surprised'])

            if(neutral>0.9 &&neutral<1.2 ){
                FaceExpression="Neutral";
            }
            else if(happy>0.9 &&happy<1.2 ){
                FaceExpression="Happy";
            }
            else if(sad>0.9 &&sad<1.2 ){
                FaceExpression="Sad";
            }
            else if(angry>0.9 &&angry<1.2 ){
                FaceExpression="Angry";
            }
            else if(fearful>0.9 &&fearful<1.2 ){
                FaceExpression="Fearful";
            }
            else if(disgusted>0.9 &&disgusted<1.2 ){
                FaceExpression="Disgusted";
            }
            else if(surprised>0.9 &&surprised<1.2 ){
                FaceExpression="Surprised";
            }

            res.status(200).json({status: "success", message: "Face detected",expression:FaceExpression,FaceDetails:FaceDetails['expressions']})

        }
        catch (e) {
            res.status(200).json({status: "fail", message: "No Face detected"})
        }
    }
    catch (e) {
        res.status(200).json({status: "fail", message: "No Face detected"})
    }
}


