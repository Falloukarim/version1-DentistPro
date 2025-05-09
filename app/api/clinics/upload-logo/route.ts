import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';
import cloudinary from '@/lib/cloudinary';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  const { userId } = getAuth(req as any);
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

  try {
    const buffer = await file.arrayBuffer();
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: `dentiste-pro/clinics/${clinicId}`,
          public_id: 'logo',
          overwrite: true,
          transformation: [{ width: 300, height: 300, crop: 'limit' }]
        },
        (error, result) => error ? reject(error) : resolve(result)
      ).end(Buffer.from(buffer));
    });

    await prisma.clinic.update({
      where: { id: clinicId },
      data: { logoUrl: (uploadResult as any).secure_url }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}