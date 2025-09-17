import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { User, ViewerConfig, ApiResponse } from '../../../types';

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

export interface ViewerLoginRequest {
  viewerId: string;
  password: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<{ user: User; token: string }>>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { viewerId, password }: ViewerLoginRequest = req.body;

    if (!viewerId || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Viewer ID and password are required' 
      });
    }

    const validViewers = ['client1', 'client2', 'client3', 'general'];
    if (!validViewers.includes(viewerId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid viewer ID' 
      });
    }

    const viewers = loadViewers();
    const viewerConfig = viewers[viewerId];
    
    if (!viewerConfig) {
      return res.status(404).json({ 
        success: false, 
        error: 'Viewer not found' 
      });
    }

    if (!viewerConfig.isActive) {
      return res.status(403).json({ 
        success: false, 
        error: 'Viewer is currently disabled' 
      });
    }

    if (password !== viewerConfig.password) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid password' 
      });
    }

    // Create a simple token (in production, use JWT)
    const user: User = { role: 'client', viewerId };
    const token = Buffer.from(JSON.stringify({ user, timestamp: Date.now() })).toString('base64');
    
    console.log('Creating token for viewer:', viewerId);
    console.log('Token created:', token);

    // Set the auth cookie
    const cookieOptions = process.env.NODE_ENV === 'production' 
      ? 'Path=/; Max-Age=86400; Secure; SameSite=Strict' 
      : 'Path=/; Max-Age=86400; SameSite=Lax; HttpOnly=false';
    
    console.log('Setting cookie:', `auth-token=${token}; ${cookieOptions}`);
    res.setHeader('Set-Cookie', `auth-token=${token}; ${cookieOptions}`);

    return res.status(200).json({
      success: true,
      data: { user, token }
    });

  } catch (error) {
    console.error('Viewer login error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
}