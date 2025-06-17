// app/api/clinics/upload-logo/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import cloudinary from '@/lib/cloudinary';
import prisma from '@/lib/prisma';
import type { UploadApiResponse } from 'cloudinary';

export async function POST(req: NextRequest) {
  try {
    // Vérification des credentials Cloudinary
    if (!cloudinary.config().cloud_name || !cloudinary.config().api_key || !cloudinary.config().api_secret) {
      throw new Error('Cloudinary credentials not configured');
    }

    const { userId } = getAuth(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const clinicId = formData.get('clinicId') as string;

    if (!file || !clinicId) {
      return NextResponse.json(
        { error: 'File and clinicId are required' },
        { status: 400 }
      );
    }

    // Vérification du type de fichier
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    
    const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `dentiste-pro/clinics/${clinicId}`,
          public_id: 'logo',
          overwrite: true,
          transformation: [{ width: 300, height: 300, crop: 'limit' }]
        },
        (error, result) => {
          if (error) return reject(error);
          if (!result) return reject(new Error('Upload failed'));
          resolve(result);
        }
      );
      
      uploadStream.end(Buffer.from(buffer));
    });

    await prisma.clinic.update({
      where: { id: clinicId },
      data: { logoUrl: uploadResult.secure_url }
    });

    return NextResponse.json({ 
      success: true,
      url: uploadResult.secure_url
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { 
        error: 'Upload failed',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}