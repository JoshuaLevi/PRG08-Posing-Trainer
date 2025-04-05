import React, { useState } from 'react';
import DataCollector from './components/DataCollector';
import TrainModel from './components/TrainModel';
import PoseDetector from './components/PoseDetector';
import RepsCounter from './components/RepsCounter';
import Leaderboard from './components/Leaderboard';
import UserInput from './components/UserInput';

function App() {
  const [username, setUsername] = useState('');
  const [poseData, setPoseData] = useState(null);
  const [reps, setReps] = useState(0);
  const [mode, setMode] = useState('collect'); // 'collect', 'train', or 'use'

  const handlePoseDetected = (landmarks) => {
    setPoseData(landmarks);
  };

  const handleRepsUpdate = (newReps) => {
    setReps(newReps);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          Bicep Curls Counter
        </h1>

        <div className="flex justify-center space-x-4 mb-8">
          <button
            onClick={() => setMode('collect')}
            className={`px-4 py-2 rounded ${
              mode === 'collect' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            Collect Data
          </button>
          <button
            onClick={() => setMode('train')}
            className={`px-4 py-2 rounded ${
              mode === 'train' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            Train Model
          </button>
          <button
            onClick={() => setMode('use')}
            className={`px-4 py-2 rounded ${
              mode === 'use' ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            Use App
          </button>
        </div>

        {mode === 'collect' && <DataCollector />}
        {mode === 'train' && <TrainModel />}
        {mode === 'use' && (
          <>
            {!username ? (
              <div className="flex justify-center items-center min-h-[60vh]">
                <UserInput onUsernameSet={setUsername} />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-8 bg-white rounded-xl shadow-xl p-6">
                  <div className="text-center mb-4">
                    <h2 className="text-2xl font-semibold text-gray-700">Workout Session</h2>
                    <p className="text-gray-500">Welcome, {username}!</p>
                  </div>
                  <PoseDetector onPoseDetected={handlePoseDetected} />
                  <RepsCounter
                    poseData={poseData}
                    onRepsUpdate={handleRepsUpdate}
                  />
                </div>
                <div className="bg-white rounded-xl shadow-xl p-6">
                  <Leaderboard
                    currentUser={username}
                    currentReps={reps}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
