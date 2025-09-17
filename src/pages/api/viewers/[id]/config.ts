import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { ViewerConfig, ApiResponse } from '../../../../types';

const VIEWERS_FILE = path.join(process.cwd(), 'data', 'viewers.json');

function loadViewers(): Record<string, ViewerConfig> {
  try {
    const data = fs.readFileSync(VIEWERS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading viewers:', error);
    return {};
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<ViewerConfig>>
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

  try {
    const viewers = loadViewers();
    const viewerConfig = viewers[id];
    
    if (!viewerConfig) {
      return res.status(404).json({ success: false, error: 'Viewer not found' });
    }

    // Don't return the password in the config
    const { password, ...safeConfig } = viewerConfig;
    
    return res.status(200).json({ 
      success: true, 
      data: safeConfig as ViewerConfig 
    });
  } catch (error) {
    console.error('Error fetching viewer config:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch viewer config' });
  }
}