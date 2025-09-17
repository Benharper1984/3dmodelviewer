import { NextApiRequest, NextApiResponse } from 'next';
import { ApiResponse } from '../../../types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<{ message: string }>>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // Clear the auth cookie
  res.setHeader('Set-Cookie', 'auth-token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict');

  return res.status(200).json({
    success: true,
    data: { message: 'Logged out successfully' }
  });
}