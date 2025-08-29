// src/components/DeveloperSearch.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Dummy data (replace with API later)
const users = [
  { username: 'alice', name: 'Alice Johnson' },
  { username: 'alex', name: 'Alex Morgan' },
  { username: 'bob', name: 'Bob Smith' },
  { username: 'charlie', name: 'Charlie Brown' },
  { username: 'dan', name: 'Dan Carter' },
];

const DeveloperSearch = () => {
  const [filteredUsers, setFilteredUsers] = useState([]);
  const navigate = useNavigate();

  const handleLetterClick = (letter) => {
    const results = users.filter((user) => user.name.toLowerCase().startsWith(letter.toLowerCase()));
    setFilteredUsers(results);
  };

  const goToProfile = (username) => {
    navigate(`/profile/${username}`);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Search Developers</h2>

      <div className="flex flex-wrap gap-2 mb-4">
        {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter) => (
          <button
            key={letter}
            className="px-3 py-1 border rounded hover:bg-indigo-600 hover:text-white"
            onClick={() => handleLetterClick(letter)}
          >
            {letter}
          </button>
        ))}
      </div>

      <ul className="space-y-2">
        {filteredUsers.map((user) => (
          <li
            key={user.username}
            className="cursor-pointer p-2 border rounded hover:bg-gray-100"
            onClick={() => goToProfile(user.username)}
          >
            {user.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DeveloperSearch;
