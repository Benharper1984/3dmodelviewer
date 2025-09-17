import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Model, ViewerConfig, AuthState } from '../types';

export default function AdminDashboard() {
  const router = useRouter();
  const [models, setModels] = useState<Model[]>([]);
  const [viewers, setViewers] = useState<ViewerConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [authState, setAuthState] = useState<AuthState>({ isAuthenticated: false, user: null });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedViewersForUpload, setSelectedViewersForUpload] = useState<string[]>(['general']);
  const [editingViewer, setEditingViewer] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/models');
        if (response.ok) {
          setAuthState({ isAuthenticated: true, user: { role: 'admin' } });
          loadData();
        } else {
          router.push('/login');
        }
      } catch (error) {
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

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

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load models and viewers
      const [modelsResponse, viewersResponse] = await Promise.all([
        fetch('/api/models'),
        fetch('/api/viewers')
      ]);

      if (modelsResponse.ok) {
        const modelsData = await modelsResponse.json();
        if (modelsData.success) {
          setModels(modelsData.data);
        }
      }

      if (viewersResponse.ok) {
        const viewersData = await viewersResponse.json();
        if (viewersData.success) {
          setViewers(viewersData.data);
        }
      }
    } catch (error) {
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.glb') && !file.name.endsWith('.obj')) {
      setError('Only GLB and OBJ files are allowed');
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('assignedViewers', JSON.stringify(selectedViewersForUpload));

    try {
      const response = await fetch('/api/models/upload-blob', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        await loadData(); // Reload models
        setSuccess(`File uploaded successfully and assigned to ${selectedViewersForUpload.length} viewer(s)`);
        // Clear file input
        event.target.value = '';
        setSelectedViewersForUpload(['general']);
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (error) {
      setError('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteModel = async (modelId: string) => {
    if (!confirm(`Are you sure you want to delete this model?`)) {
      return;
    }

    try {
      const response = await fetch('/api/models', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ modelId }),
      });

      const data = await response.json();
      
      if (data.success) {
        await loadData();
        setSuccess('Model deleted successfully');
      } else {
        setError(data.error || 'Delete failed');
      }
    } catch (error) {
      setError('Delete failed');
    }
  };

  const handleAssignModel = async (modelId: string, viewerIds: string[]) => {
    try {
      const response = await fetch('/api/models/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ modelId, viewerIds }),
      });

      const data = await response.json();
      
      if (data.success) {
        await loadData();
        setSuccess(`Model assigned to ${viewerIds.length} viewer(s)`);
      } else {
        setError(data.error || 'Assignment failed');
      }
    } catch (error) {
      setError('Assignment failed');
    }
  };

  const handleUpdateViewerPassword = async (viewerId: string, password: string) => {
    try {
      const updatedViewers = viewers.map(v => 
        v.id === viewerId ? { ...v, password } : v
      );

      const viewersObj = updatedViewers.reduce((acc, viewer) => {
        acc[viewer.id] = viewer;
        return acc;
      }, {} as Record<string, ViewerConfig>);

      const response = await fetch('/api/viewers', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ viewers: viewersObj }),
      });

      const data = await response.json();
      
      if (data.success) {
        setViewers(data.data);
        setSuccess('Password updated successfully');
        setEditingViewer(null);
        setNewPassword('');
      } else {
        setError(data.error || 'Update failed');
      }
    } catch (error) {
      setError('Update failed');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      router.push('/login');
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
                4-Viewer Admin Dashboard
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
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
        {/* Alert Messages */}
        {(error || success) && (
          <div className={`mb-6 p-4 rounded-lg ${error ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'}`}>
            <p className={error ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
              {error || success}
            </p>
            <button
              onClick={() => {
                setError(null);
                setSuccess(null);
              }}
              className={`text-sm underline ${error ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700'}`}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Viewer Management */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Viewer Management</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {viewers.map((viewer) => {
              const assignedModelsCount = models.filter(m => m.assignedViewers?.includes(viewer.id)).length;
              
              return (
                <div key={viewer.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {viewer.name}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${viewer.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                      {viewer.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <strong>URL:</strong> /{viewer.id}
                    </div>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <strong>Models:</strong> {assignedModelsCount}
                    </div>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <strong>Password:</strong>
                      {editingViewer === viewer.id ? (
                        <div className="mt-2 flex gap-2">
                          <input
                            type="text"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="New password"
                            className="flex-1 px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600"
                          />
                          <button
                            onClick={() => handleUpdateViewerPassword(viewer.id, newPassword)}
                            className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingViewer(null);
                              setNewPassword('');
                            }}
                            className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="mt-2 flex items-center justify-between">
                          <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                            {viewer.password}
                          </span>
                          <button
                            onClick={() => {
                              setEditingViewer(viewer.id);
                              setNewPassword(viewer.password);
                            }}
                            className="text-blue-500 hover:text-blue-700 text-xs"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4">
                      <a
                        href={`/${viewer.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-500 hover:text-blue-700 underline"
                      >
                        Open Viewer →
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* File Upload */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-4">
              Upload New Model
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select 3D Model File
                </label>
                <input
                  type="file"
                  accept=".glb,.obj"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="block w-full text-sm text-gray-500 dark:text-gray-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-medium
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100
                    disabled:opacity-50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Assign to Viewers
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {viewers.map((viewer) => (
                    <label key={viewer.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedViewersForUpload.includes(viewer.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedViewersForUpload([...selectedViewersForUpload, viewer.id]);
                          } else {
                            setSelectedViewersForUpload(selectedViewersForUpload.filter(id => id !== viewer.id));
                          }
                        }}
                        className="rounded"
                        disabled={isUploading}
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                        {viewer.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              
              {isUploading && (
                <div className="text-sm text-blue-600 dark:text-blue-400">
                  Uploading to Vercel Blob...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Models Library */}
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-medium text-gray-900 dark:text-white">
                Models Library ({models.length})
              </h2>
            </div>
            
            <div className="p-6">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">Loading models...</p>
                </div>
              ) : models.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📦</div>
                  <p className="text-gray-600 dark:text-gray-400">
                    No models uploaded yet. Upload your first 3D model above.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {models.map((model) => (
                    <div key={model.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {model.name}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {model.type.toUpperCase()} • {(model.size / (1024 * 1024)).toFixed(1)} MB
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteModel(model.id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          🗑️
                        </button>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          Assigned to:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {model.assignedViewers?.length > 0 ? (
                            model.assignedViewers.map((viewerId) => {
                              const viewer = viewers.find(v => v.id === viewerId);
                              return (
                                <span key={viewerId} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                                  {viewer?.name || viewerId}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                              Not assigned
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          Quick assign:
                        </p>
                        <div className="grid grid-cols-2 gap-1">
                          {viewers.map((viewer) => (
                            <label key={viewer.id} className="flex items-center text-xs">
                              <input
                                type="checkbox"
                                checked={model.assignedViewers?.includes(viewer.id) || false}
                                onChange={(e) => {
                                  const currentViewers = model.assignedViewers || [];
                                  const newViewers = e.target.checked 
                                    ? [...currentViewers, viewer.id]
                                    : currentViewers.filter(id => id !== viewer.id);
                                  handleAssignModel(model.id, newViewers);
                                }}
                                className="rounded mr-1"
                              />
                              <span className="text-gray-700 dark:text-gray-300 truncate">
                                {viewer.name}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}