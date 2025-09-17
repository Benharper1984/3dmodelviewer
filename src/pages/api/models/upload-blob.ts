import { NextApiRequest, NextApiResponse } from 'next';
import { put } from '@vercel/blob';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { Model, ApiResponse } from '../../../types';
import { requireAdmin } from '../../../utils/auth';

export const config = {
  api: {
    bodyParser: false,
  },
};

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

async function handleUpload(
  req: NextApiRequest, 
  res: NextApiResponse<ApiResponse<{ model: Model; message: string }>>
) {
  try {
    const form = formidable({
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
    const assignedViewers = Array.isArray(fields.assignedViewers) 
      ? fields.assignedViewers 
      : fields.assignedViewers ? [fields.assignedViewers] : [];
    
    if (!uploadedFile) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    // Validate file extension
    const originalFilename = uploadedFile.originalFilename || '';
    if (!originalFilename.endsWith('.glb') && !originalFilename.endsWith('.obj')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Only GLB and OBJ files are allowed' 
      });
    }

    // Check if BLOB_READ_WRITE_TOKEN is configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(500).json({ 
        success: false, 
        error: 'Vercel Blob storage not configured. Please add BLOB_READ_WRITE_TOKEN to your environment variables.' 
      });
    }

    // Read file data
    const fileBuffer = fs.readFileSync(uploadedFile.filepath);
    
    // Upload to Vercel Blob
    const blob = await put(originalFilename, fileBuffer, {
      access: 'public',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    // Clean up temporary file
    fs.unlinkSync(uploadedFile.filepath);

    // Create model record
    const modelId = originalFilename.replace(/\.(glb|obj)$/, '');
    const model: Model = {
      id: modelId,
      name: modelId.replace(/[-_]/g, ' '),
      filename: originalFilename,
      path: blob.url, // Use Vercel Blob URL
      blobUrl: blob.url,
      uploadDate: new Date().toISOString(),
      size: uploadedFile.size || 0,
      type: originalFilename.endsWith('.glb') ? 'glb' : 'obj',
      assignedViewers: Array.isArray(assignedViewers) 
        ? assignedViewers.filter(id => ['client1', 'client2', 'client3', 'general'].includes(id as string))
        : []
    };

    // Save to models.json
    const modelsData = loadModels();
    
    // Check if model already exists
    if (modelsData.models[modelId]) {
      return res.status(409).json({ 
        success: false, 
        error: 'A model with this filename already exists' 
      });
    }
    
    modelsData.models[modelId] = model;
    
    const saved = saveModels(modelsData);
    if (!saved) {
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to save model record' 
      });
    }

    return res.status(200).json({
      success: true,
      data: { 
        model,
        message: 'File uploaded successfully to Vercel Blob'
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ 
      success: false, 
      error: `Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}` 
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