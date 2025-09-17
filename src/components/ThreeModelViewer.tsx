import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Model, ModelViewerSettings, LightingSettings, ScreenshotOptions } from '../types';

interface ThreeModelViewerProps {
  model: Model | null;
  settings: ModelViewerSettings;
  onSettingsChange: (settings: ModelViewerSettings) => void;
  className?: string;
}

export default function ThreeModelViewer({ 
  model, 
  settings, 
  onSettingsChange, 
  className = '' 
}: ThreeModelViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelObjectRef = useRef<THREE.Object3D | null>(null);
  const animationIdRef = useRef<number | undefined>(undefined);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const initializeScene = useCallback(() => {
    if (!mountRef.current) return;

    try {
      // Create scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf5f5f5);
      sceneRef.current = scene;

      // Create camera
      const camera = new THREE.PerspectiveCamera(
        75,
        mountRef.current.clientWidth / mountRef.current.clientHeight,
        0.1,
        1000
      );
      camera.position.set(5, 5, 5);
      cameraRef.current = camera;

      // Create renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      rendererRef.current = renderer;

      // Clear any existing children
      mountRef.current.innerHTML = '';
      mountRef.current.appendChild(renderer.domElement);

      // Create controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controlsRef.current = controls;

      // Setup lighting
      setupLighting(scene, settings.lightingMode);

      const animate = () => {
        animationIdRef.current = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

    } catch (err) {
      console.error('Failed to initialize Three.js scene:', err);
      setError('Failed to initialize 3D viewer. Please try refreshing the page.');
    }
  }, [settings.lightingMode]);

  const setupLighting = (scene: THREE.Scene, mode: string) => {
    // Remove existing lights
    const existingLights = scene.children.filter(child => child instanceof THREE.Light);
    existingLights.forEach(light => scene.remove(light));

    switch (mode) {
      case 'studio':
        // Studio lighting - key, fill, and rim lights
        const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
        keyLight.position.set(5, 10, 5);
        keyLight.castShadow = true;
        scene.add(keyLight);

        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-5, 5, 5);
        scene.add(fillLight);

        const rimLight = new THREE.DirectionalLight(0xffffff, 0.5);
        rimLight.position.set(0, 5, -10);
        scene.add(rimLight);

        const ambientStudio = new THREE.AmbientLight(0x404040, 0.2);
        scene.add(ambientStudio);
        break;

      case 'bright':
        // Bright lighting
        const brightMain = new THREE.DirectionalLight(0xffffff, 1.5);
        brightMain.position.set(10, 10, 10);
        brightMain.castShadow = true;
        scene.add(brightMain);

        const brightSecondary = new THREE.DirectionalLight(0xffffff, 0.8);
        brightSecondary.position.set(-10, 10, -10);
        scene.add(brightSecondary);

        const ambientBright = new THREE.AmbientLight(0x404040, 0.6);
        scene.add(ambientBright);
        break;

      case 'dramatic':
        // Dramatic lighting - single strong light with deep shadows
        const dramaticLight = new THREE.DirectionalLight(0xffffff, 2.0);
        dramaticLight.position.set(10, 15, 5);
        dramaticLight.castShadow = true;
        scene.add(dramaticLight);

        const ambientDramatic = new THREE.AmbientLight(0x202020, 0.1);
        scene.add(ambientDramatic);
        break;

      default: // 'standard'
        // Standard lighting
        const standardLight = new THREE.DirectionalLight(0xffffff, 1);
        standardLight.position.set(5, 10, 5);
        standardLight.castShadow = true;
        scene.add(standardLight);

        const ambientStandard = new THREE.AmbientLight(0x404040, 0.4);
        scene.add(ambientStandard);
    }
  };

  const loadModel = useCallback(async (modelToLoad: Model) => {
    if (!sceneRef.current) return;

    setIsLoading(true);
    setError(null);
    setLoadingProgress(0);

    try {
      // Remove existing model
      if (modelObjectRef.current) {
        sceneRef.current.remove(modelObjectRef.current);
        modelObjectRef.current = null;
      }

      let loadedObject: THREE.Object3D;

      if (modelToLoad.name.toLowerCase().endsWith('.gltf') || modelToLoad.name.toLowerCase().endsWith('.glb')) {
        // Load GLTF/GLB
        const loader = new GLTFLoader();
        const gltf = await new Promise<any>((resolve, reject) => {
          loader.load(
            modelToLoad.path,
            (gltf) => resolve(gltf),
            (progress) => {
              if (progress.total > 0) {
                setLoadingProgress((progress.loaded / progress.total) * 100);
              }
            },
            (error) => reject(error)
          );
        });
        loadedObject = gltf.scene;
      } else if (modelToLoad.name.toLowerCase().endsWith('.obj')) {
        // Load OBJ
        const loader = new OBJLoader();
        loadedObject = await new Promise<THREE.Object3D>((resolve, reject) => {
          loader.load(
            modelToLoad.path,
            (object) => resolve(object),
            (progress) => {
              if (progress.total > 0) {
                setLoadingProgress((progress.loaded / progress.total) * 100);
              }
            },
            (error) => reject(error)
          );
        });
      } else {
        throw new Error('Unsupported file format');
      }

      // Center and scale the model
      const box = new THREE.Box3().setFromObject(loadedObject);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = 10 / maxDim;

      loadedObject.scale.setScalar(scale);
      loadedObject.position.sub(center.multiplyScalar(scale));

      // Apply settings
      loadedObject.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => {
                if (mat instanceof THREE.MeshStandardMaterial) {
                  mat.wireframe = settings.showWireframe;
                  if (!settings.showMaterials) {
                    mat.color.setHex(0x808080);
                  }
                  if (!settings.showTextures) {
                    mat.map = null;
                  }
                }
              });
            } else if (child.material instanceof THREE.MeshStandardMaterial) {
              child.material.wireframe = settings.showWireframe;
              if (!settings.showMaterials) {
                child.material.color.setHex(0x808080);
              }
              if (!settings.showTextures) {
                child.material.map = null;
              }
            }
          }
        }
      });

      sceneRef.current.add(loadedObject);
      modelObjectRef.current = loadedObject;

      // Focus camera on model
      if (controlsRef.current && cameraRef.current) {
        const modelBox = new THREE.Box3().setFromObject(loadedObject);
        const modelCenter = modelBox.getCenter(new THREE.Vector3());
        const modelSize = modelBox.getSize(new THREE.Vector3());
        const maxModelDim = Math.max(modelSize.x, modelSize.y, modelSize.z);
        
        controlsRef.current.target.copy(modelCenter);
        
        const distance = maxModelDim * 2;
        const direction = cameraRef.current.position.clone().sub(modelCenter).normalize();
        cameraRef.current.position.copy(modelCenter).add(direction.multiplyScalar(distance));
        
        controlsRef.current.update();
      }

      setIsLoading(false);
      setLoadingProgress(100);
    } catch (err) {
      console.error('Failed to load model:', err);
      setError('Failed to load the 3D model. Please check the file format and try again.');
      setIsLoading(false);
    }
  }, [settings.showWireframe, settings.showMaterials, settings.showTextures]);

  // Update model when settings change
  useEffect(() => {
    if (modelObjectRef.current) {
      modelObjectRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => {
              if (mat instanceof THREE.MeshStandardMaterial) {
                mat.wireframe = settings.showWireframe;
                if (!settings.showMaterials) {
                  mat.color.setHex(0x808080);
                } else {
                  // Restore original color if available
                  mat.color.setHex(0xffffff);
                }
                if (!settings.showTextures) {
                  mat.map = null;
                }
              }
            });
          } else if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.wireframe = settings.showWireframe;
            if (!settings.showMaterials) {
              child.material.color.setHex(0x808080);
            } else {
              // Restore original color if available
              child.material.color.setHex(0xffffff);
            }
            if (!settings.showTextures) {
              child.material.map = null;
            }
          }
        }
      });
    }
  }, [settings.showWireframe, settings.showMaterials, settings.showTextures]);

  // Update lighting when mode changes
  useEffect(() => {
    if (sceneRef.current) {
      setupLighting(sceneRef.current, settings.lightingMode);
    }
  }, [settings.lightingMode]);

  // Initialize scene
  useEffect(() => {
    initializeScene();

    const handleResize = () => {
      if (mountRef.current && cameraRef.current && rendererRef.current) {
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(width, height);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [initializeScene]);

  // Load model when it changes
  useEffect(() => {
    if (model && sceneRef.current) {
      loadModel(model);
    }
  }, [model, loadModel]);

  const takeScreenshot = useCallback((): string => {
    if (!rendererRef.current) {
      throw new Error('Renderer not initialized');
    }
    return rendererRef.current.domElement.toDataURL('image/png');
  }, []);

  const lightingPresets = [
    { value: 'standard', label: 'Standard' },
    { value: 'studio', label: 'Studio' },
    { value: 'bright', label: 'Bright' },
    { value: 'dramatic', label: 'Dramatic' }
  ];

  const materialPresets = [
    { value: 'full', label: 'Full', showMaterials: true, showTextures: true },
    { value: 'no-textures', label: 'No Textures', showMaterials: true, showTextures: false },
    { value: 'clay', label: 'Clay', showMaterials: false, showTextures: false }
  ];

  if (error && !model) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg`}>
        <div className="text-center p-4">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
            3D Viewer Error
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error}
          </p>
          <button
            onClick={() => {
              setError(null);
              if (model) loadModel(model);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!model) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg`}>
        <div className="text-center">
          <div className="text-4xl mb-4">📦</div>
          <p className="text-gray-600 dark:text-gray-400">No model selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      {/* Compact Controls Above Viewport */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 mb-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Display Mode */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Display:</span>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.showWireframe}
                onChange={(e) => onSettingsChange({ ...settings, showWireframe: e.target.checked })}
                className="rounded"
              />
              <span className="ml-1 text-sm text-gray-600 dark:text-gray-400">Wireframe</span>
            </label>
          </div>

          {/* Lighting Presets */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Lighting:</span>
            <select
              value={settings.lightingMode}
              onChange={(e) => onSettingsChange({ ...settings, lightingMode: e.target.value })}
              className="text-sm border rounded px-2 py-1 bg-white dark:bg-gray-700 dark:border-gray-600"
            >
              {lightingPresets.map(preset => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>

          {/* Material Presets */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Material:</span>
            <select
              value={materialPresets.find(p => 
                p.showMaterials === settings.showMaterials && 
                p.showTextures === settings.showTextures
              )?.value || 'full'}
              onChange={(e) => {
                const preset = materialPresets.find(p => p.value === e.target.value);
                if (preset) {
                  onSettingsChange({
                    ...settings,
                    showMaterials: preset.showMaterials,
                    showTextures: preset.showTextures
                  });
                }
              }}
              className="text-sm border rounded px-2 py-1 bg-white dark:bg-gray-700 dark:border-gray-600"
            >
              {materialPresets.map(preset => (
                <option key={preset.value} value={preset.value}>
                  {preset.label}
                </option>
              ))}
            </select>
          </div>

          {/* Screenshot Button */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => {
                try {
                  const dataUrl = takeScreenshot();
                  const link = document.createElement('a');
                  link.download = `${model.name}_screenshot.png`;
                  link.href = dataUrl;
                  link.click();
                } catch (error) {
                  console.error('Screenshot failed:', error);
                }
              }}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              📸 Screenshot
            </button>
          </div>
        </div>
      </div>

      {/* 3D Viewport */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg overflow-hidden" style={{ minHeight: '500px' }}>
        {isLoading && (
          <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-75 dark:bg-opacity-75 flex items-center justify-center z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Loading model...</p>
              <div className="w-48 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${loadingProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {Math.round(loadingProgress)}%
              </p>
            </div>
          </div>
        )}
        
        <div ref={mountRef} className="w-full h-full" style={{ minHeight: '500px' }} />
        
        {/* Status Indicators */}
        <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 space-y-3 min-w-[200px]">
          <h4 className="font-semibold text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-600 pb-2">
            Model Status
          </h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">File:</span>
              <span className="text-gray-800 dark:text-gray-200 font-medium truncate ml-2" title={model.name}>
                {model.name}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Size:</span>
              <span className="text-gray-800 dark:text-gray-200">
                {(model.size / (1024 * 1024)).toFixed(1)} MB
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Lighting:</span>
              <span className="text-gray-800 dark:text-gray-200 capitalize">
                {settings.lightingMode}
              </span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-1 pt-2 border-t border-gray-200 dark:border-gray-600">
            {settings.showWireframe && (
              <span className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">
                Wireframe
              </span>
            )}
            {!settings.showMaterials && (
              <span className="px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded">
                No Materials
              </span>
            )}
            {!settings.showTextures && (
              <span className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded">
                No Textures
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}