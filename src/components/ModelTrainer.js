import React, { useState } from 'react';
import * as tf from '@tensorflow/tfjs';

const ModelTrainer = () => {
  const [model, setModel] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [confusionMatrix, setConfusionMatrix] = useState(null);

  const trainModel = async (data) => {
    try {
      // Convert data to tensors
      const angles = data.map(d => d.angle);
      const labels = data.map(d => d.pose === 'up' ? 1 : 0);

      const xs = tf.tensor2d(angles, [angles.length, 1]);
      const ys = tf.tensor2d(labels, [labels.length, 1]);

      // Create a simple model
      const model = tf.sequential();
      model.add(tf.layers.dense({ units: 10, activation: 'relu', inputShape: [1] }));
      model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));

      // Compile the model
      model.compile({
        optimizer: 'adam',
        loss: 'binaryCrossentropy',
        metrics: ['accuracy']
      });

      // Train the model
      const history = await model.fit(xs, ys, {
        epochs: 100,
        validationSplit: 0.2,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            console.log(`Epoch ${epoch}: loss = ${logs.loss}`);
          }
        }
      });

      // Calculate confusion matrix
      const predictions = model.predict(xs);
      const predictedLabels = predictions.arraySync().map(p => p[0] > 0.5 ? 1 : 0);
      
      let truePositives = 0;
      let trueNegatives = 0;
      let falsePositives = 0;
      let falseNegatives = 0;

      for (let i = 0; i < labels.length; i++) {
        if (predictedLabels[i] === 1 && labels[i] === 1) truePositives++;
        if (predictedLabels[i] === 0 && labels[i] === 0) trueNegatives++;
        if (predictedLabels[i] === 1 && labels[i] === 0) falsePositives++;
        if (predictedLabels[i] === 0 && labels[i] === 1) falseNegatives++;
      }

      setConfusionMatrix({
        truePositives,
        trueNegatives,
        falsePositives,
        falseNegatives
      });

      setAccuracy(history.history.acc[history.history.acc.length - 1]);
      setModel(model);

      // Save the model
      await model.save('downloads://bicep_curl_model');
    } catch (error) {
      console.error('Error training model:', error);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = JSON.parse(e.target.result);
        trainModel(data);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="p-4">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Model Training</h2>
        <div className="mb-4">
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="mb-4"
          />
          {accuracy && (
            <div>
              <p>Model Accuracy: {(accuracy * 100).toFixed(2)}%</p>
              {confusionMatrix && (
                <div className="mt-4">
                  <h3 className="font-bold">Confusion Matrix:</h3>
                  <table className="border-collapse border border-gray-400">
                    <tbody>
                      <tr>
                        <td className="border border-gray-400 p-2">True Positives</td>
                        <td className="border border-gray-400 p-2">{confusionMatrix.truePositives}</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 p-2">True Negatives</td>
                        <td className="border border-gray-400 p-2">{confusionMatrix.trueNegatives}</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 p-2">False Positives</td>
                        <td className="border border-gray-400 p-2">{confusionMatrix.falsePositives}</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-400 p-2">False Negatives</td>
                        <td className="border border-gray-400 p-2">{confusionMatrix.falseNegatives}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModelTrainer; 