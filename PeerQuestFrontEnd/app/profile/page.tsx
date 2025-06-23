'use client';

import { useContext, useState } from 'react';
import { AuthContext } from '@/context/AuthContext';
import axiosAuth from '@/lib/api/auth';

export default function ProfilePage() {
  const { user } = useContext(AuthContext);
  const [avatar, setAvatar] = useState<File | null>(null);

  const handleUpload = async () => {
    if (!avatar) return;

    const formData = new FormData();
    formData.append('avatar', avatar);

    await axiosAuth.put('/auth/user/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    alert('Avatar updated. Refresh to see changes.');
  };

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Your Profile</h1>

      {user ? (
        <div>
          <p>Username: {user.username}</p>
          <p>XP: {user.xp}</p>
          <p>Level: {user.level}</p>
          {user.avatar && <img src={user.avatar} width={100} />}
        </div>
      ) : (
        <p>Loading user info...</p>
      )}

      <div className="mt-4">
        <input type="file" onChange={(e) => setAvatar(e.target.files?.[0] || null)} />
        <button
          onClick={handleUpload}
          className="bg-green-600 text-white px-3 py-1 mt-2 rounded"
        >
          Upload Avatar
        </button>
      </div>
    </main>
  );
}
