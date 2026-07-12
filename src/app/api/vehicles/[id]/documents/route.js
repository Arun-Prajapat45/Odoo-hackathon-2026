import { queryDb } from '@/lib/db';
import { NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const vehicleId = parseInt(id, 10);

    // Verify vehicle exists
    const vehicle = await db.vehicle.findUnique({
      where: { id: vehicleId }
    });

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const documentType = formData.get('documentType');
    const expiryDate = formData.get('expiryDate');

    if (!file || !documentType) {
      return NextResponse.json({ error: 'Missing file or documentType' }, { status: 400 });
    }

    // Convert file to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary under 'vehicle_documents' folder
    const documentUrl = await uploadToCloudinary(buffer, 'vehicle_documents');

    // Create database record
    const document = await db.vehicleDocument.create({
      data: {
        vehicleId,
        documentType: String(documentType),
        documentUrl,
        expiryDate: expiryDate ? String(expiryDate) : null,
        verified: false
      }
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('POST /api/vehicles/[id]/documents error:', error);
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 });
  }
}
