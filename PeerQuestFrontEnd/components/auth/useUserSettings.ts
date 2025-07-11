import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function useUserSettings() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Helper to get token from localStorage
  const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('access_token') : null);

  // Update user profile using the correct endpoint
  const updateUser = async (data: Partial<typeof user>) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const token = getToken();
      if (!token) throw new Error('Not authenticated');
      
      const res = await fetch(`${API_BASE_URL}/api/users/settings/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      
      const result = await res.json();
      if (!res.ok) {
        setError(result.errors ? result.errors.join(' ') : 'Update failed.');
        setSuccess(null);
        return false;
      }
      
      // Optionally update user in AuthContext if needed
      if (result.user) {
        localStorage.setItem('user', JSON.stringify(result.user));
      }
      setSuccess(result.detail || 'Profile updated successfully.');
      setError(null);
      return true;
    } catch (e: any) {
      setError('Network error.');
      setSuccess(null);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Delete user account using the correct endpoint
  const deleteUser = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const token = getToken();
      if (!token) throw new Error('Not authenticated');
      
      const res = await fetch(`${API_BASE_URL}/api/users/settings/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      const result = await res.json();
      if (!res.ok) {
        setError(result.errors ? result.errors.join(' ') : 'Delete failed.');
        setSuccess(null);
        return false;
      }
      setSuccess(result.detail || 'Account deleted successfully.');
      setError(null);
      logout();
      return true;
    } catch (e: any) {
      setError('Network error.');
      setSuccess(null);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { user, updateUser, deleteUser, loading, error, success };
}
