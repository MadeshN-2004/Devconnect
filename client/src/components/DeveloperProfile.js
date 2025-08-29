// src/components/DeveloperProfile.js
import React from 'react';
import { useParams } from 'react-router-dom';

// Dummy data again (can be fetched via API later)
const users = [
  { username: 'alice', name: 'Alice Johnson', role: 'Frontend Developer' },
  { username: 'alex', name: 'Alex Morgan', role: 'Backend Developer' },
  { username: 'bob', name: 'Bob Smith', role: 'Fullstack Developer' },
  { username: 'charlie', name: 'Charlie Brown', role: 'UI/UX Designer' },
  { username: 'dan', name: 'Dan Carter', role: 'DevOps Engineer' },
];

const DeveloperProfile = () => {
  const { username } = useParams();
  const user = users.find((u) => u.username === username);

  if (!user) return <div className="p-6">User not found</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold">{user.name}</h1>
      <p className="text-lg mt-2">Role: {user.role}</p>
      <p className="text-sm mt-1 text-gray-600">Username: {user.username}</p>
    </div>
  );
};

export default DeveloperProfile;
