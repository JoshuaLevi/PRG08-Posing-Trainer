import React, { useState, useEffect } from 'react';
import { db, collection, doc, setDoc, onSnapshot, query, orderBy, limit } from '../firebase';

const Leaderboard = ({ currentUser, currentReps }) => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('reps', 'desc'), limit(10));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(userData);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser && currentReps > 0) {
      const userRef = doc(db, 'users', currentUser);
      setDoc(userRef, {
        reps: currentReps,
        timestamp: new Date()
      }, { merge: true });
    }
  }, [currentUser, currentReps]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4">Leaderboard</h2>
      <div className="space-y-2">
        {users.map((user, index) => (
          <div
            key={user.id}
            className={`flex justify-between items-center p-2 rounded ${
              user.id === currentUser ? 'bg-blue-100' : ''
            }`}
          >
            <div className="flex items-center">
              <span className="font-bold mr-2">#{index + 1}</span>
              <span>{user.id}</span>
            </div>
            <span className="font-semibold">{user.reps} reps</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard; 