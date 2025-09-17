import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import ThreeModelViewer from './ThreeModelViewer';
import { Model, ModelViewerSettings, AuthState, ViewerConfig } from '../types';

interface ViewerPageProps {
  viewerId: 'client1' | 'client2' | 'client3' | 'general';
}

export default function ViewerPage({ viewerId }: ViewerPageProps) {
  const router = useRouter();
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authState, setAuthState] = useState<AuthState>({ isAuthenticated: false, user: null });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [viewerConfig, setViewerConfig] = useState<ViewerConfig | null>(null);
  
  const [viewerSettings, setViewerSettings] = useState<ModelViewerSettings>({
    showWireframe: false,
    showMaterials: true,
    showTextures: true,
    autoRotate: false,
    lightingMode: 'standard',
    lightingIntensity: 1,
    backgroundColor: '#f0f0f0',
    renderMode: 'solid',
  });

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`/api/viewers/${viewerId}/models`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setAuthState({ isAuthenticated: true, user: { role: 'client', viewerId } });
            setViewerConfig(data.viewerConfig);
            setModels(data.data);
            // Select the most recent model by default
            if (data.data.length > 0 && !selectedModel) {
              setSelectedModel(data.data[0]);
            }
          }
        } else {
          router.push(`/login/${viewerId}`);
        }
      } catch (error) {
        router.push(`/login/${viewerId}`);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [viewerId, router, selectedModel]);

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

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push(`/login/${viewerId}`);
    } catch (error) {
      router.push(`/login/${viewerId}`);
    }
  };

  if (!authState.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {viewerConfig?.name || 'Model Viewer'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Model Selection Dropdown */}
              {models.length > 0 && (
                <select
                  value={selectedModel?.id || ''}
                  onChange={(e) => {
                    const model = models.find(m => m.id === e.target.value);
                    setSelectedModel(model || null);
                  }}
                  className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  {models.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} ({model.type.toUpperCase()})
                    </option>
                  ))}
                </select>
              )}
              
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {isDarkMode ? '☀️' : '🌙'}
              </button>
              
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 text-sm underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading models...</p>
            </div>
          </div>
        ) : models.length === 0 ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="text-6xl mb-4">📦</div>
              <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                No Models Available
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                No 3D models have been assigned to this viewer yet. Please contact your administrator.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                    {selectedModel?.name || 'Select a Model'}
                  </h2>
                  {selectedModel && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedModel.type.toUpperCase()} • {(selectedModel.size / 1024).toFixed(1)} KB
                      • Uploaded {new Date(selectedModel.uploadDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                
                {models.length > 1 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {models.length} models available
                  </p>
                )}
              </div>
              
              <ThreeModelViewer
                model={selectedModel}
                settings={viewerSettings}
                onSettingsChange={setViewerSettings}
                className="w-full h-96"
              />
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100 mb-2">
            How to Use
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Use your mouse to orbit around the model (click and drag)</li>
            <li>• Scroll to zoom in and out</li>
            <li>• Use the display options to toggle wireframe, materials, and textures</li>
            <li>• Select different models from the dropdown menu in the header</li>
            <li>• Enable auto-rotate to continuously rotate the model</li>
          </ul>
        </div>
      </div>
    </div>
  );
}