import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { ApiResponse } from '../../types';
import { requireAdmin } from '../../utils/auth';

export const config = {
  api: {
    bodyParser: false,
  },
};

const MODELS_DIR = path.join(process.cwd(), 'public', 'models');

// Ensure models directory exists
if (!fs.existsSync(MODELS_DIR)) {
  fs.mkdirSync(MODELS_DIR, { recursive: true });
}

async function handleUpload(req: NextApiRequest, res: NextApiResponse<ApiResponse<{ message: string; filename: string }>>) {
  try {
    const form = formidable({
      uploadDir: MODELS_DIR,
      keepExtensions: true,
      maxFileSize: 50 * 1024 * 1024, // 50MB limit
      filter: ({ mimetype, originalFilename }) => {
        // Accept GLB and OBJ files
        return (
          mimetype === 'model/gltf-binary' ||
          mimetype === 'application/octet-stream' ||
          (originalFilename && (originalFilename.endsWith('.glb') || originalFilename.endsWith('.obj')))
        );
      },
    });

    const [fields, files] = await form.parse(req);
    
    const uploadedFile = Array.isArray(files.file) ? files.file[0] : files.file;
    
    if (!uploadedFile) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    // Validate file extension
    const originalFilename = uploadedFile.originalFilename || '';
    if (!originalFilename.endsWith('.glb') && !originalFilename.endsWith('.obj')) {
      // Clean up uploaded file
      fs.unlinkSync(uploadedFile.filepath);
      return res.status(400).json({ 
        success: false, 
        error: 'Only GLB and OBJ files are allowed' 
      });
    }

    // Move file to proper location with original name
    const finalPath = path.join(MODELS_DIR, originalFilename);
    
    // Check if file already exists
    if (fs.existsSync(finalPath)) {
      fs.unlinkSync(uploadedFile.filepath);
      return res.status(409).json({ 
        success: false, 
        error: 'File with this name already exists' 
      });
    }

    fs.renameSync(uploadedFile.filepath, finalPath);

    return res.status(200).json({
      success: true,
      data: { 
        message: 'File uploaded successfully',
        filename: originalFilename
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to upload file' 
    });
  }
}

export default requireAdmin(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method === 'POST') {
    return handleUpload(req, res);
  } else {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
});