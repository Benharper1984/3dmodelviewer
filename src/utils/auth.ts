import { NextApiRequest } from 'next';
import { User } from '../types';

export function parseAuthToken(req: NextApiRequest): User | null {
  try {
    const token = req.cookies['auth-token'];
    console.log('Auth token from cookies:', token ? 'present' : 'missing');
    if (!token) return null;

    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    console.log('Decoded token:', decoded);
    
    // Check if token is not too old (24 hours)
    const now = Date.now();
    const tokenAge = now - decoded.timestamp;
    console.log('Token age (ms):', tokenAge);
    if (tokenAge > 86400000) return null; // 24 hours in milliseconds

    return decoded.user;
  } catch (error) {
    console.error('Auth token parsing error:', error);
    return null;
  }
}

export function requireAuth(handler: (req: NextApiRequest, res: any, user: User) => Promise<void>) {
  return async (req: NextApiRequest, res: any) => {
    const user = parseAuthToken(req);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    return handler(req, res, user);
  };
}

export function requireAdmin(handler: (req: NextApiRequest, res: any, user: User) => Promise<void>) {
  return requireAuth(async (req, res, user) => {
    if (user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Admin access required' 
      });
    }

    return handler(req, res, user);
  });
}