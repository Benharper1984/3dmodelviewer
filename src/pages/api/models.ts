import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { Model, ApiResponse } from '../../types';
import { requireAuth, requireAdmin } from '../../utils/auth';

const MODELS_DIR = path.join(process.cwd(), 'public', 'models');

// Ensure models directory exists
if (!fs.existsSync(MODELS_DIR)) {
  fs.mkdirSync(MODELS_DIR, { recursive: true });
}

const MODELS_FILE = path.join(process.cwd(), 'data', 'models.json');

function loadModels(): { models: Record<string, Model> } {
  try {
    const data = fs.readFileSync(MODELS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading models:', error);
    return { models: {} };
  }
}

function saveModels(modelsData: { models: Record<string, Model> }): boolean {
  try {
    fs.writeFileSync(MODELS_FILE, JSON.stringify(modelsData, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving models:', error);
    return false;
  }
}

async function getModels(): Promise<Model[]> {
  try {
    const modelsData = loadModels();
    const models = Object.values(modelsData.models);
    
    // Sort by upload date, newest first
    return models.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime());
  } catch (error) {
    console.error('Error reading models:', error);
    return [];
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse<ApiResponse<Model[]>>) {
  try {
    const models = await getModels();
    return res.status(200).json({ success: true, data: models });
  } catch (error) {
    console.error('Error fetching models:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch models' });
  }
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse<ApiResponse<{ message: string }>>, user: any) {
  try {
    const { modelId } = req.body;
    
    if (!modelId) {
      return res.status(400).json({ success: false, error: 'Model ID is required' });
    }

    const modelsData = loadModels();
    const model = modelsData.models[modelId];
    
    if (!model) {
      return res.status(404).json({ success: false, error: 'Model not found' });
    }

    // Remove from models data
    delete modelsData.models[modelId];
    
    const saved = saveModels(modelsData);
    if (!saved) {
      return res.status(500).json({ success: false, error: 'Failed to save model data' });
    }
    
    // Note: In production, you might also want to delete from Vercel Blob
    // This would require additional API call to delete the blob
    
    return res.status(200).json({
      success: true,
      data: { message: 'Model deleted successfully' }
    });
  } catch (error) {
    console.error('Error deleting model:', error);
    return res.status(500).json({ success: false, error: 'Failed to delete model' });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return requireAuth(async (req, res, user) => {
      return handleGet(req, res);
    })(req, res);
  } else if (req.method === 'DELETE') {
    return requireAdmin(async (req, res, user) => {
      return handleDelete(req, res, user);
    })(req, res);
  } else {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
}
