import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { ViewerConfig } from '../../types';

export default function ViewerLogin() {
  const router = useRouter();
  const { viewer } = router.query;
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [viewerConfig, setViewerConfig] = useState<ViewerConfig | null>(null);

  // Valid viewer IDs
  const validViewers = ['client1', 'client2', 'client3', 'general'];

  useEffect(() => {
    // Check if viewer ID is valid
    if (viewer && !validViewers.includes(viewer as string)) {
      router.push('/login');
      return;
    }

    // Load viewer config
    const loadViewerConfig = async () => {
      if (viewer) {
        try {
          const response = await fetch(`/api/viewers/${viewer}/config`);
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setViewerConfig(data.data);
            }
          }
        } catch (error) {
          console.error('Failed to load viewer config:', error);
        }
      }
    };

    loadViewerConfig();
  }, [viewer, router]);

  // Load dark mode preference
  useEffect(() => {
    const stored = localStorage.getItem('darkMode');
    const isDark = stored === 'true';
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/viewer-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          viewerId: viewer,
          password 
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Wait a moment for cookie to be set, then redirect to viewer
        setTimeout(() => {
          router.push(`/${viewer}`);
        }, 100);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!viewer || !validViewers.includes(viewer as string)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const viewerName = viewerConfig?.name || `${viewer}`.charAt(0).toUpperCase() + `${viewer}`.slice(1);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors">
      {/* Dark mode toggle */}
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          {isDarkMode ? '☀️' : '🌙'}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="text-6xl mb-4">🎯</div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            {viewerName} Viewer
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Enter password to access 3D models
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter viewer password"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Access Viewer'
                )}
              </button>
            </div>
          </form>

          {/* Back to main login */}
          <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="text-center">
              <button
                onClick={() => router.push('/login')}
                className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                ← Back to main login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}