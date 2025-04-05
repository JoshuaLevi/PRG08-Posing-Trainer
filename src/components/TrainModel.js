import React, { useState, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';

const TrainModel = () => {
  const [upPoseData, setUpPoseData] = useState(null);
  const [downPoseData, setDownPoseData] = useState(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainProgress, setTrainProgress] = useState(0);
  const [error, setError] = useState(null);
  const [modelStats, setModelStats] = useState(null);
  
  const upInputRef = useRef(null);
  const downInputRef = useRef(null);

  const handleFileUpload = (event, poseType) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);
        if (poseType === 'up') {
          setUpPoseData(jsonData);
        } else {
          setDownPoseData(jsonData);
        }
        setError(null);
      } catch (err) {
        setError(`Error parsing ${poseType} pose data: ${err.message}`);
      }
    };
    reader.onerror = () => {
      setError(`Error reading ${poseType} pose file`);
    };
    reader.readAsText(file);
  };

  const preprocessData = (data) => {
    return data.map(sample => ({
      angle: sample.angle,
      landmarks: [
        sample.landmarks.leftShoulder.x,
        sample.landmarks.leftShoulder.y,
        sample.landmarks.leftShoulder.z,
        sample.landmarks.leftElbow.x,
        sample.landmarks.leftElbow.y,
        sample.landmarks.leftElbow.z,
        sample.landmarks.leftWrist.x,
        sample.landmarks.leftWrist.y,
        sample.landmarks.leftWrist.z
      ]
    }));
  };

  const trainModel = async () => {
    if (!upPoseData || !downPoseData) {
      setError('Please upload both UP and DOWN pose data files first');
      return;
    }

    setIsTraining(true);
    setTrainProgress(0);
    setError(null);

    try {
      // Preprocess the data
      const upProcessed = preprocessData(upPoseData);
      const downProcessed = preprocessData(downPoseData);

      // Combine and shuffle the data
      const allData = [
        ...upProcessed.map(d => ({ ...d, label: 1 })), // 1 for up
        ...downProcessed.map(d => ({ ...d, label: 0 })) // 0 for down
      ];
      tf.util.shuffle(allData);

      // Convert to tensors
      const xData = allData.map(d => [...d.landmarks, d.angle]);
      const yData = allData.map(d => d.label);

      const xTensor = tf.tensor2d(xData);
      const yTensor = tf.tensor2d(yData, [yData.length, 1]);

      // Create the model
      const model = tf.sequential();
      model.add(tf.layers.dense({ units: 16, activation: 'relu', inputShape: [10] }));
      model.add(tf.layers.dense({ units: 8, activation: 'relu' }));
      model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

      model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      });

      // Train the model
      const totalEpochs = 50;
      await model.fit(xTensor, yTensor, {
        epochs: totalEpochs,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: async (epoch) => {
            const progress = Math.round(((epoch + 1) / totalEpochs) * 100);
            setTrainProgress(progress);
          }
        }
      });

      // Evaluate the model
      const evalResult = await model.evaluate(xTensor, yTensor);
      const accuracy = (await evalResult[1].data())[0] * 100;

      // Save the model
      await model.save('indexeddb://bicep-curl-model');

      // Update stats
      setModelStats({
        totalSamples: allData.length,
        upSamples: upProcessed.length,
        downSamples: downProcessed.length,
        accuracy: accuracy.toFixed(2)
      });

      setTrainProgress(100);

      // Cleanup
      xTensor.dispose();
      yTensor.dispose();
      evalResult[0].dispose();
      evalResult[1].dispose();
      model.dispose();

    } catch (err) {
      console.error('Training error:', err);
      setError('Error training model: ' + err.message);
    } finally {
      setIsTraining(false);
    }
  };

  const clearData = (poseType) => {
    if (poseType === 'up') {
      setUpPoseData(null);
      if (upInputRef.current) upInputRef.current.value = '';
    } else {
      setDownPoseData(null);
      if (downInputRef.current) downInputRef.current.value = '';
    }
    setModelStats(null);
  };

  return (
    <div className="p-4">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Train Model</h2>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>Error: {error}</p>
          </div>
        )}

        <div className="mb-6 space-y-4">
          {/* UP pose file upload */}
          <div className="border rounded p-4 bg-gray-50">
            <h3 className="font-semibold mb-2">UP Pose Data</h3>
            <div className="flex items-center space-x-2">
              <input
                ref={upInputRef}
                type="file"
                accept=".json"
                onChange={(e) => handleFileUpload(e, 'up')}
                className="flex-1"
              />
              {upPoseData && (
                <button
                  onClick={() => clearData('up')}
                  className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Clear
                </button>
              )}
            </div>
            {upPoseData && (
              <p className="text-sm text-green-600 mt-1">
                ✓ Loaded {upPoseData.length} samples
              </p>
            )}
          </div>

          {/* DOWN pose file upload */}
          <div className="border rounded p-4 bg-gray-50">
            <h3 className="font-semibold mb-2">DOWN Pose Data</h3>
            <div className="flex items-center space-x-2">
              <input
                ref={downInputRef}
                type="file"
                accept=".json"
                onChange={(e) => handleFileUpload(e, 'down')}
                className="flex-1"
              />
              {downPoseData && (
                <button
                  onClick={() => clearData('down')}
                  className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Clear
                </button>
              )}
            </div>
            {downPoseData && (
              <p className="text-sm text-green-600 mt-1">
                ✓ Loaded {downPoseData.length} samples
              </p>
            )}
          </div>
        </div>

        {/* Training controls */}
        <div className="mb-6">
          <button
            onClick={trainModel}
            disabled={!upPoseData || !downPoseData || isTraining}
            className={`w-full py-2 rounded ${
              !upPoseData || !downPoseData || isTraining
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white font-semibold`}
          >
            {isTraining ? 'Training...' : 'Train Model'}
          </button>
        </div>

        {/* Training progress */}
        {(isTraining || trainProgress > 0) && (
          <div className="mb-6">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${trainProgress}%` }}
              ></div>
            </div>
            <p className="text-center mt-2">{trainProgress}% Complete</p>
          </div>
        )}

        {/* Training results */}
        {modelStats && (
          <div className="border rounded p-4 bg-green-50">
            <h3 className="font-semibold mb-2">Training Results</h3>
            <div className="space-y-2">
              <p>Total Samples: {modelStats.totalSamples}</p>
              <p>UP Pose Samples: {modelStats.upSamples}</p>
              <p>DOWN Pose Samples: {modelStats.downSamples}</p>
              <p className="font-semibold text-green-700">
                Model Accuracy: {modelStats.accuracy}%
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainModel; 