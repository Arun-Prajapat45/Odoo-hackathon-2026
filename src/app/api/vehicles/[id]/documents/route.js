import { queryDb } from '@/lib/db';
import { NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const vehicleId = parseInt(id, 10);

    // Verify vehicle exists
    const vehicle = await queryDb('SELECT id FROM vehicle WHERE id = ?', [vehicleId]);
    if (!vehicle || vehicle.length === 0) {
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
    await queryDb(`
      INSERT INTO vehicle_document (vehicle_id, document_type, document_url, expiry_date, verified)
      VALUES (?, ?, ?, ?, ?)
    `, [vehicleId, String(documentType), documentUrl, expiryDate ? String(expiryDate) : null, 0]);

    const docs = await queryDb('SELECT * FROM vehicle_document WHERE vehicle_id = ? ORDER BY id DESC LIMIT 1', [vehicleId]);
    return NextResponse.json(docs?.[0] || { success: true }, { status: 201 });
  } catch (error) {
    console.error('POST /api/vehicles/[id]/documents error:', error);
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 });
  }
}
