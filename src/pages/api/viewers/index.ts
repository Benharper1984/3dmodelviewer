import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { ViewerConfig, ApiResponse } from '../../../types';
import { requireAdmin } from '../../../utils/auth';

const VIEWERS_FILE = path.join(process.cwd(), 'data', 'viewers.json');

// Ensure viewers file exists
if (!fs.existsSync(VIEWERS_FILE)) {
  const defaultViewers = {
    "client1": {
      "id": "client1",
      "name": "Client 1",
      "password": "client123",
      "isActive": true,
      "assignedModels": [],
      "createdAt": new Date().toISOString()
    },
    "client2": {
      "id": "client2", 
      "name": "Client 2",
      "password": "design456",
      "isActive": true,
      "assignedModels": [],
      "createdAt": new Date().toISOString()
    },
    "client3": {
      "id": "client3",
      "name": "Client 3", 
      "password": "build789",
      "isActive": true,
      "assignedModels": [],
      "createdAt": new Date().toISOString()
    },
    "general": {
      "id": "general",
      "name": "General Viewer",
      "password": "temp123",
      "isActive": true,
      "assignedModels": [],
      "createdAt": new Date().toISOString()
    }
  };
  fs.writeFileSync(VIEWERS_FILE, JSON.stringify(defaultViewers, null, 2));
}

function loadViewers(): Record<string, ViewerConfig> {
  try {
    const data = fs.readFileSync(VIEWERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading viewers:', error);
    return {};
  }
}

function saveViewers(viewers: Record<string, ViewerConfig>): boolean {
  try {
    fs.writeFileSync(VIEWERS_FILE, JSON.stringify(viewers, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving viewers:', error);
    return false;
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse<ApiResponse<ViewerConfig[]>>) {
  try {
    const viewers = loadViewers();
    const viewerArray = Object.values(viewers);
    return res.status(200).json({ success: true, data: viewerArray });
  } catch (error) {
    console.error('Error fetching viewers:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch viewers' });
  }
}

async function handlePut(req: NextApiRequest, res: NextApiResponse<ApiResponse<ViewerConfig[]>>) {
  try {
    const { viewers: updatedViewers } = req.body;
    
    if (!updatedViewers || typeof updatedViewers !== 'object') {
      return res.status(400).json({ success: false, error: 'Invalid viewers data' });
    }

    // Convert array to object if needed
    let viewersObj: Record<string, ViewerConfig>;
    if (Array.isArray(updatedViewers)) {
      viewersObj = {};
      updatedViewers.forEach((viewer: ViewerConfig) => {
        viewersObj[viewer.id] = viewer;
      });
    } else {
      viewersObj = updatedViewers;
    }

    const saved = saveViewers(viewersObj);
    if (!saved) {
      return res.status(500).json({ success: false, error: 'Failed to save viewers' });
    }

    const viewerArray = Object.values(viewersObj);
    return res.status(200).json({ success: true, data: viewerArray });
  } catch (error) {
    console.error('Error updating viewers:', error);
    return res.status(500).json({ success: false, error: 'Failed to update viewers' });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return requireAdmin(async (req, res, user) => {
      return handleGet(req, res);
    })(req, res);
  } else if (req.method === 'PUT') {
    return requireAdmin(async (req, res, user) => {
      return handlePut(req, res);
    })(req, res);
  } else {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
}