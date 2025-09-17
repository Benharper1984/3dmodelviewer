export interface Model {
  id: string;
  name: string;
  filename: string;
  path: string;
  blobUrl?: string; // Vercel Blob URL
  uploadDate: string;
  size: number;
  type: 'glb' | 'obj';
  assignedViewers: string[]; // Array of viewer IDs
}

export interface ViewerConfig {
  id: 'client1' | 'client2' | 'client3' | 'general';
  name: string;
  password: string;
  isActive: boolean;
  assignedModels: string[];
  createdAt: string;
}

export interface User {
  role: 'admin' | 'client';
  clientId?: string;
  viewerId?: string; // For viewer-specific authentication
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

export interface ModelViewerSettings {
  showWireframe: boolean;
  showMaterials: boolean;
  showTextures: boolean;
  autoRotate: boolean;
  lightingMode: string;
  lightingIntensity: number;
  backgroundColor: string;
  renderMode: 'solid' | 'wireframe' | 'points';
}

export interface LightingSettings {
  ambientLight: {
    intensity: number;
    color: string;
  };
  directionalLight: {
    intensity: number;
    color: string;
    position: { x: number; y: number; z: number };
  };
  pointLights: Array<{
    intensity: number;
    color: string;
    position: { x: number; y: number; z: number };
  }>;
}

export interface ScreenshotOptions {
  width: number;
  height: number;
  format: 'png' | 'jpeg';
  quality: number;
  transparent: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}