'use client';

export default function LoginPage() {
  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:8000/auth/social/google/login/';
  };

  return (
    <main className="p-6">
      <h1 className="text-xl font-bold mb-4">Login</h1>
      <button onClick={handleGoogleLogin} className="bg-blue-600 text-white px-4 py-2 rounded">
        Login with Google
      </button>
    </main>
  );
}
