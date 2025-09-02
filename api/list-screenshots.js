import { list } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get('prefix') || 'screenshots/';
    
    const { blobs } = await list({
      prefix: prefix,
      limit: 100
    });
    
    return NextResponse.json({ screenshots: blobs });
  } catch (error) {
    console.error('List error:', error);
    return NextResponse.json({ error: 'Failed to list screenshots' }, { status: 500 });
  }
}

export const runtime = 'edge';
