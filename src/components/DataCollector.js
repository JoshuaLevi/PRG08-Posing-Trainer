import React, { useRef, useEffect, useState } from 'react';

const DataCollector = () => {
  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const poseLandmarkerRef = useRef(null);
  const animationFrameRef = useRef(null);

  // State
  const [poseData, setPoseData] = useState([]);
  const [currentPose, setCurrentPose] = useState('up');
  const [count, setCount] = useState(0);
  const [error, setError] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  // Initialize MediaPipe
  useEffect(() => {
    const initializeMediaPipe = async () => {
      try {
        const { PoseLandmarker, FilesetResolver } = await import(
          'https://cdn.skypack.dev/@mediapipe/tasks-vision@0.10.0'
        );

        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
        );

        poseLandmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numPoses: 1
        });

        await startWebcam();
      } catch (err) {
        console.error('Error initializing MediaPipe:', err);
        setError('Error initializing pose detection: ' + err.message);
      }
    };

    const startWebcam = async () => {
      try {
        const constraints = {
          video: {
            width: 640,
            height: 480
          }
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await new Promise((resolve) => {
            videoRef.current.onloadeddata = resolve;
          });
          predictWebcam();
        }
      } catch (err) {
        console.error('Error starting webcam:', err);
        setError('Could not start webcam: ' + err.message);
      }
    };

    const predictWebcam = async () => {
      if (!poseLandmarkerRef.current || !videoRef.current || !canvasRef.current) {
        return;
      }

      try {
        const startTimeMs = performance.now();
        const results = await poseLandmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);
        
        if (results.landmarks && results.landmarks.length > 0) {
          const landmarks = results.landmarks[0];

          // Draw landmarks
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

          // Collect sample if recording
          if (isRecording) {
            const leftShoulder = landmarks[11];
            const leftElbow = landmarks[13];
            const leftWrist = landmarks[15];

            if (leftShoulder && leftElbow && leftWrist) {
              const angle = calculateAngle(
                [leftShoulder.x, leftShoulder.y],
                [leftElbow.x, leftElbow.y],
                [leftWrist.x, leftWrist.y]
              );

              const data = {
                angle,
                pose: currentPose,
                timestamp: new Date().toISOString(),
                landmarks: {
                  leftShoulder: { x: leftShoulder.x, y: leftShoulder.y, z: leftShoulder.z },
                  leftElbow: { x: leftElbow.x, y: leftElbow.y, z: leftElbow.z },
                  leftWrist: { x: leftWrist.x, y: leftWrist.y, z: leftWrist.z }
                }
              };

              setPoseData(prev => [...prev, data]);
              setCount(prev => prev + 1);
            }
          }
        }

        animationFrameRef.current = requestAnimationFrame(predictWebcam);
      } catch (err) {
        console.error('Error in predictWebcam:', err);
      }
    };

    const calculateAngle = (point1, point2, point3) => {
      const angle = Math.atan2(point3[1] - point2[1], point3[0] - point2[0]) -
                   Math.atan2(point1[1] - point2[1], point1[0] - point2[0]);
      return Math.abs(angle * 180 / Math.PI);
    };

    initializeMediaPipe();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRecording, currentPose]);

  // Toggle pose
  const togglePose = () => {
    if (!isRecording) {
      setCurrentPose(prev => prev === 'up' ? 'down' : 'up');
    } else {
      setError('Stop recording before changing pose');
    }
  };

  // Toggle recording
  const toggleRecording = () => {
    if (!isRecording) {
      setPoseData([]);
      setCount(0);
      setError(null);
    }
    setIsRecording(prev => !prev);
  };

  // Save data
  const saveData = () => {
    try {
      if (poseData.length === 0) {
        setError('No pose data collected yet. Toggle recording and perform some poses first.');
        return;
      }

      const dataStr = JSON.stringify(poseData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pose_data_${currentPose}_${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error saving data:', err);
      setError('Failed to save data: ' + err.message);
    }
  };

  return (
    <div className="p-4">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Data Collection</h2>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>Error: {error}</p>
          </div>
        )}
        <div className="mb-4">
          <p>Current Pose: <span className="font-bold">{currentPose}</span></p>
          <p>Samples collected: <span className="font-bold">{count}</span></p>
          <p>Recording: <span className={`font-bold ${isRecording ? 'text-red-500' : 'text-gray-500'}`}>
            {isRecording ? 'ON' : 'OFF'}
          </span></p>
          <div className="space-x-2 mt-4">
            <button
              onClick={togglePose}
              disabled={isRecording}
              className={`px-4 py-2 rounded ${
                isRecording ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500'
              } text-white`}
            >
              Toggle Pose
            </button>
            <button
              onClick={toggleRecording}
              className={`px-4 py-2 rounded ${
                isRecording ? 'bg-red-500' : 'bg-green-500'
              } text-white`}
            >
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>
            <button
              onClick={saveData}
              disabled={poseData.length === 0}
              className={`px-4 py-2 rounded ${
                poseData.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-500'
              } text-white`}
            >
              Save Data ({poseData.length} samples)
            </button>
          </div>
        </div>
        <div className="relative w-full">
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
      </div>
    </div>
  );
};

export default DataCollector; 