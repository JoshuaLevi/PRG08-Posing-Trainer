import React, { useRef, useEffect, useState } from 'react';
import * as tf from '@tensorflow/tfjs';

const PoseDetector = ({ onPoseDetected }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [error, setError] = useState(null);
  const [webcamRunning, setWebcamRunning] = useState(false);
  const poseLandmarkerRef = useRef(null);
  const modelRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);

  useEffect(() => {
    const initialize = async () => {
      try {
        // Load the trained model
        console.log('Loading trained model...');
        modelRef.current = await tf.loadLayersModel('indexeddb://bicep-curl-model');
        console.log('Model loaded successfully');

        // Initialize MediaPipe
        console.log('Initializing MediaPipe...');
        const { PoseLandmarker, FilesetResolver } = await import(
          'https://cdn.skypack.dev/@mediapipe/tasks-vision@0.10.0'
        );

        console.log('Creating FilesetResolver...');
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );

        console.log('Creating PoseLandmarker...');
        poseLandmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numPoses: 1
        });
        console.log('PoseLandmarker created successfully');

        await startWebcam();
      } catch (err) {
        console.error('Error during initialization:', err);
        setError(`Initialization error: ${err.message}`);
      }
    };

    initialize();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
      if (modelRef.current) {
        modelRef.current.dispose();
      }
    };
  }, []);

  const startWebcam = async () => {
    try {
      console.log('Starting webcam...');
      const constraints = {
        video: {
          width: 640,
          height: 480
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadeddata = () => {
          console.log('Video loaded, starting detection...');
          setWebcamRunning(true);
          requestAnimationFrame(predictWebcam);
        };
      }
    } catch (err) {
      console.error('Error starting webcam:', err);
      setError(`Webcam error: ${err.message}`);
    }
  };

  const calculateAngle = (point1, point2, point3) => {
    const angle = Math.atan2(point3[1] - point2[1], point3[0] - point2[0]) -
                 Math.atan2(point1[1] - point2[1], point1[0] - point2[0]);
    return Math.abs(angle * 180 / Math.PI);
  };

  const predictWebcam = async () => {
    try {
      if (!poseLandmarkerRef.current || !videoRef.current || !canvasRef.current || !webcamRunning || !modelRef.current) {
        console.log('Skipping frame, missing refs:', {
          hasPoseLandmarker: !!poseLandmarkerRef.current,
          hasVideo: !!videoRef.current,
          hasCanvas: !!canvasRef.current,
          isWebcamRunning: webcamRunning,
          hasModel: !!modelRef.current
        });
        return;
      }

      const startTimeMs = performance.now();

      if (lastVideoTimeRef.current !== videoRef.current.currentTime) {
        lastVideoTimeRef.current = videoRef.current.currentTime;
        const results = await poseLandmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);
        
        if (results.landmarks && results.landmarks.length > 0) {
          console.log('Landmarks detected:', results.landmarks.length);
          const landmarks = results.landmarks[0];

          // Extract relevant landmarks
          const leftShoulder = landmarks[11];
          const leftElbow = landmarks[13];
          const leftWrist = landmarks[15];

          if (leftShoulder && leftElbow && leftWrist) {
            // Calculate angle
            const angle = calculateAngle(
              [leftShoulder.x, leftShoulder.y],
              [leftElbow.x, leftElbow.y],
              [leftWrist.x, leftWrist.y]
            );

            // Prepare input for model
            const inputData = [
              leftShoulder.x, leftShoulder.y, leftShoulder.z,
              leftElbow.x, leftElbow.y, leftElbow.z,
              leftWrist.x, leftWrist.y, leftWrist.z,
              angle
            ];

            // Make prediction
            const tensor = tf.tensor2d([inputData]);
            const prediction = modelRef.current.predict(tensor);
            const poseClass = (await prediction.data())[0] > 0.5 ? 'up' : 'down';
            console.log('Predicted pose:', poseClass);
            prediction.dispose();
            tensor.dispose();

            // Pass landmarks and prediction to parent
            onPoseDetected({ landmarks, poseClass });
          }

          // Draw landmarks on canvas
          const canvasCtx = canvasRef.current.getContext('2d');
          canvasCtx.save();
          canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          
          const { DrawingUtils, PoseLandmarker } = await import(
            'https://cdn.skypack.dev/@mediapipe/tasks-vision@0.10.0'
          );
          const drawingUtils = new DrawingUtils(canvasCtx);
          drawingUtils.drawLandmarks(landmarks);
          drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS);
          
          canvasCtx.restore();
        } else {
          console.log('No landmarks detected in this frame');
        }
      }

      if (webcamRunning) {
        requestAnimationFrame(predictWebcam);
      }
    } catch (err) {
      console.error('Error in predictWebcam:', err);
      setError(`Detection error: ${err.message}`);
    }
  };

  return (
    <div className="relative w-full">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>Error: {error}</p>
        </div>
      )}
      <video
        ref={videoRef}
        className="w-full rounded-lg shadow-lg"
        style={{ transform: 'scaleX(-1)' }}
        playsInline
        autoPlay
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full"
        width={640}
        height={480}
        style={{ transform: 'scaleX(-1)' }}
      />
    </div>
  );
};

export default PoseDetector; 