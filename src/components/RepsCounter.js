import React, { useState, useEffect } from 'react';

const RepsCounter = ({ poseData, onRepsUpdate }) => {
  const [reps, setReps] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isUp, setIsUp] = useState(false);
  const [lastPoseClass, setLastPoseClass] = useState(null);

  useEffect(() => {
    if (!poseData || !poseData.poseClass) {
      console.log('No pose data received');
      return;
    }

    const currentPoseClass = poseData.poseClass;
    console.log('Current pose:', currentPoseClass, 'Last pose:', lastPoseClass);
    
    // Detect rep when pose changes from up to down
    if (currentPoseClass === 'down' && lastPoseClass === 'up') {
      console.log('Rep detected!');
      const newReps = reps + 1;
      setReps(newReps);
      onRepsUpdate(newReps);
      setFeedback('Rep counted!');
      setTimeout(() => setFeedback(''), 1000);
    }

    // Update pose state
    setLastPoseClass(currentPoseClass);
    setIsUp(currentPoseClass === 'up');

    // Set feedback based on current pose
    if (currentPoseClass === 'up' && !isUp) {
      setFeedback('Good! Keep going up!');
    } else if (currentPoseClass === 'down' && isUp) {
      setFeedback('Now lower your arm...');
    }
  }, [poseData, lastPoseClass, isUp, reps, onRepsUpdate]);

  return (
    <div className="text-center p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-3xl font-bold mb-4">Reps: {reps}</h2>
      {feedback && (
        <p className={`font-semibold text-xl ${
          feedback.includes('Rep counted')
            ? 'text-green-500 animate-bounce'
            : 'text-blue-500'
        }`}>
          {feedback}
        </p>
      )}
      <p className="text-gray-600 mt-2">
        Current Position: {isUp ? 'UP' : 'DOWN'}
      </p>
    </div>
  );
};

export default RepsCounter; 