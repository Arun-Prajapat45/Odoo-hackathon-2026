import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const vehicleId = parseInt(id, 10);

    // Verify vehicle exists
    const vehicle = await db.query("SELECT id FROM vehicle WHERE id = ?", [vehicleId]);
    if (vehicle.length === 0) {
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
    await db.query(`
      INSERT INTO vehicle_document (
        vehicle_id, document_type, document_url, expiry_date, verified
      ) VALUES (?, ?, ?, ?, 0)
    `, [
      vehicleId,
      String(documentType),
      documentUrl,
      expiryDate ? String(expiryDate) : null
    ]);

    // Query back the newly inserted document by URL
    const docList = await db.query(`
      SELECT 
        id, 
        vehicle_id AS vehicleId, 
        document_type AS documentType, 
        document_url AS documentUrl, 
        expiry_date AS expiryDate, 
        verified 
      FROM vehicle_document 
      WHERE document_url = ?
    `, [documentUrl]);

    return NextResponse.json(docList[0], { status: 201 });
  } catch (error) {
    console.error('POST /api/vehicles/[id]/documents error:', error);
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 });
  }
}
