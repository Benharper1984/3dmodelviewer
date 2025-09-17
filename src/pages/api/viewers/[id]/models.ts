import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { Model, ViewerConfig, ApiResponse } from '../../../../types';
import { parseAuthToken } from '../../../../utils/auth';

const VIEWERS_FILE = path.join(process.cwd(), 'data', 'viewers.json');
const MODELS_FILE = path.join(process.cwd(), 'data', 'models.json');

function loadViewers(): Record<string, ViewerConfig> {
  try {
    const data = fs.readFileSync(VIEWERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading viewers:', error);
    return {};
  }
}

function loadModels(): { models: Record<string, Model> } {
  try {
    const data = fs.readFileSync(MODELS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading models:', error);
    return { models: {} };
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<Model[]> & { viewerConfig?: ViewerConfig }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ success: false, error: 'Invalid viewer ID' });
  }

  const validViewers = ['client1', 'client2', 'client3', 'general'];
  if (!validViewers.includes(id)) {
    return res.status(404).json({ success: false, error: 'Viewer not found' });
  }

  // Check if user is authenticated for this viewer
  const user = parseAuthToken(req);
  if (!user || (user.role !== 'admin' && user.viewerId !== id)) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }

  try {
    const viewers = loadViewers();
    const viewerConfig = viewers[id];
    
    if (!viewerConfig || !viewerConfig.isActive) {
      return res.status(404).json({ success: false, error: 'Viewer not found or inactive' });
    }

    const modelsData = loadModels();
    const allModels = Object.values(modelsData.models);
    
    // Filter models assigned to this viewer
    const assignedModels = allModels.filter(model => 
      model.assignedViewers && model.assignedViewers.includes(id)
    );

    // Sort by upload date, newest first
    const sortedModels = assignedModels.sort((a, b) => 
      new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
    );

    return res.status(200).json({ 
      success: true, 
      data: sortedModels,
      viewerConfig: viewerConfig
    });
  } catch (error) {
    console.error('Error fetching viewer models:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch models' });
  }
}