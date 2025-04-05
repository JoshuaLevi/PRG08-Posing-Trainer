import React, { useState } from 'react';

const UserInput = ({ onUsernameSet }) => {
  const [username, setUsername] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim()) {
      onUsernameSet(username.trim());
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-xl">
      <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">Welcome to Bicep Curls Counter</h2>
      <p className="text-gray-600 text-center mb-8">
        Enter your username to start tracking your workout and compete with others!
      </p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-semibold"
        >
          Start Workout
        </button>
      </form>
    </div>
  );
};

export default UserInput; 