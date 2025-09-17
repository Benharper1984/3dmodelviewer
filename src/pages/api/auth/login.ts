import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { User, ApiResponse } from '../../../types';

export interface LoginRequest {
  password: string;
  role: 'admin' | 'client';
  clientId?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<{ user: User; token: string }>>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { password, role, clientId }: LoginRequest = req.body;

    if (!password || !role) {
      return res.status(400).json({ 
        success: false, 
        error: 'Password and role are required' 
      });
    }

    let isValidPassword = false;
    let user: User;

    if (role === 'admin') {
      const adminPassword = process.env.ADMIN_PASSWORD;
      if (!adminPassword) {
        return res.status(500).json({ 
          success: false, 
          error: 'Admin password not configured' 
        });
      }
      
      isValidPassword = password === adminPassword;
      user = { role: 'admin' };
    } else if (role === 'client') {
      if (!clientId) {
        return res.status(400).json({ 
          success: false, 
          error: 'Client ID is required for client login' 
        });
      }

      const clientPasswordsStr = process.env.CLIENT_PASSWORDS;
      if (!clientPasswordsStr) {
        return res.status(500).json({ 
          success: false, 
          error: 'Client passwords not configured' 
        });
      }

      try {
        const clientPasswords = JSON.parse(clientPasswordsStr);
        const expectedPassword = clientPasswords[clientId];
        
        if (!expectedPassword) {
          return res.status(401).json({ 
            success: false, 
            error: 'Invalid client ID' 
          });
        }

        isValidPassword = password === expectedPassword;
        user = { role: 'client', clientId };
      } catch (e) {
        return res.status(500).json({ 
          success: false, 
          error: 'Invalid client password configuration' 
        });
      }
    } else {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid role' 
      });
    }

    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid password' 
      });
    }

    // Create a simple token (in production, use JWT)
    const token = Buffer.from(JSON.stringify({ user, timestamp: Date.now() })).toString('base64');
    console.log('Creating token for user:', user);
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
    console.error('Login error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
}