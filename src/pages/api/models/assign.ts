import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { Model, ApiResponse } from '../../../types';
import { requireAdmin } from '../../../utils/auth';

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

async function handleAssignModel(req: NextApiRequest, res: NextApiResponse<ApiResponse<{ message: string }>>) {
  try {
    const { modelId, viewerIds } = req.body;
    
    if (!modelId || !Array.isArray(viewerIds)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Model ID and viewer IDs array are required' 
      });
    }

    const validViewers = ['client1', 'client2', 'client3', 'general'];
    const invalidViewers = viewerIds.filter(id => !validViewers.includes(id));
    
    if (invalidViewers.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid viewer IDs: ${invalidViewers.join(', ')}` 
      });
    }

    const modelsData = loadModels();
    const model = modelsData.models[modelId];
    
    if (!model) {
      return res.status(404).json({ 
        success: false, 
        error: 'Model not found' 
      });
    }

    // Update model's assigned viewers
    model.assignedViewers = [...new Set(viewerIds)]; // Remove duplicates
    modelsData.models[modelId] = model;

    const saved = saveModels(modelsData);
    if (!saved) {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to save model assignments' 
      });
    }

    return res.status(200).json({
      success: true,
      data: { 
        message: `Model assigned to ${viewerIds.length} viewer(s)` 
      }
    });

  } catch (error) {
    console.error('Error assigning model:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to assign model' 
    });
  }
}

export default requireAdmin(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method === 'POST') {
    return handleAssignModel(req, res);
  } else {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
});