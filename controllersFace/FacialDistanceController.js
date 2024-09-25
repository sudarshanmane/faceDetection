const faceapi=require('face-api.js')
const canvas = require("canvas");
const {TinyFaceDetectorOptions} = require("face-api.js");
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({Canvas,Image,ImageData})

exports.FacialDistance=async (req, res) => {

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

            //Left to Right Eye Distance
            let x1_LRE=  FaceDetails['landmarks']['_positions'][37]['_x']
            let y1_LRE=  FaceDetails['landmarks']['_positions'][37]['_y']
            let x2_LRE=  FaceDetails['landmarks']['_positions'][46]['_x']
            let y2_LRE=  FaceDetails['landmarks']['_positions'][46]['_y']
            let Left_to_Right_Eye=Math.sqrt( (Math.pow((x1_LRE-x2_LRE),2))+(Math.pow((y1_LRE-y2_LRE),2)));

            //Nose to Left Mouth Distance
            let x1_NLM=  FaceDetails['landmarks']['_positions'][31]['_x']
            let y1_NLM=  FaceDetails['landmarks']['_positions'][31]['_y']
            let x2_NLM=  FaceDetails['landmarks']['_positions'][49]['_x']
            let y2_NLM=  FaceDetails['landmarks']['_positions'][49]['_y']
            let Nose_to_Left_Mouth=Math.sqrt( (Math.pow((x1_NLM-x2_NLM),2))+(Math.pow((y1_NLM-y2_NLM),2)));

            //Nose to Right Mouth Distance
            let x1_NRM=  FaceDetails['landmarks']['_positions'][31]['_x']
            let y1_NRM=  FaceDetails['landmarks']['_positions'][31]['_y']
            let x2_NRM=  FaceDetails['landmarks']['_positions'][55]['_x']
            let y2_NRM=  FaceDetails['landmarks']['_positions'][55]['_y']
            let Nose_to_Right_Mouth=Math.sqrt( (Math.pow((x1_NRM-x2_NRM),2))+(Math.pow((y1_NRM-y2_NRM),2)));

            //Nose to Right Eye Distance
            let x1_NRE = FaceDetails['landmarks']['_positions'][31]['_x']
            let y1_NRE = FaceDetails['landmarks']['_positions'][31]['_y']
            let x2_NRE = FaceDetails['landmarks']['_positions'][46]['_x']
            let y2_NRE = FaceDetails['landmarks']['_positions'][46]['_y']
            let Nose_to_Right_Eye = Math.sqrt((Math.pow((x1_NRE - x2_NRE), 2)) + (Math.pow((y1_NRE - y2_NRE), 2)));

            //Nose to Left Eye Distance
            let x1_NLE=  FaceDetails['landmarks']['_positions'][31]['_x']
            let y1_NLE=  FaceDetails['landmarks']['_positions'][31]['_y']
            let x2_NLE=  FaceDetails['landmarks']['_positions'][37]['_x']
            let y2_NLE=  FaceDetails['landmarks']['_positions'][37]['_y']
            let Nose_to_Left_Eye=Math.sqrt( (Math.pow((x1_NLE-x2_NLE),2))+(Math.pow((y1_NLE-y2_NLE),2)));

            res.status(200).json({
                status: "success",
                message: "Face detected",
                Left_to_Right_Eye:Left_to_Right_Eye,
                Nose_to_Left_Mouth:Nose_to_Left_Mouth,
                Nose_to_Right_Mouth:Nose_to_Right_Mouth,
                Nose_to_Right_Eye:Nose_to_Right_Eye,
                Nose_to_Left_Eye:Nose_to_Left_Eye
            })

        }
        catch (e) {
            res.status(200).json({status: "fail", message: "No Face detected"})
        }
    }
    catch (e) {
        res.status(200).json({status: "fail", message: "No Face detected"})
    }
}


