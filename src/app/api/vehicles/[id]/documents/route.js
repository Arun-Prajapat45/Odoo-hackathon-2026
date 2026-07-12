import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary';

async function syncVehicleExpiryDates(vehicleId) {
  try {
    // Get latest Insurance document expiry date
    const insuranceDoc = await db.query(
      "SELECT expiry_date FROM vehicle_document WHERE vehicle_id = ? AND document_type = 'Insurance' ORDER BY id DESC LIMIT 1",
      [vehicleId]
    );
    const insuranceExpiry = insuranceDoc[0]?.expiry_date || null;

    // Get latest Pollution document expiry date
    const pollutionDoc = await db.query(
      "SELECT expiry_date FROM vehicle_document WHERE vehicle_id = ? AND document_type = 'Pollution' ORDER BY id DESC LIMIT 1",
      [vehicleId]
    );
    const pollutionExpiry = pollutionDoc[0]?.expiry_date || null;

    // Update vehicle table
    await db.query(
      "UPDATE vehicle SET insurance_expiry = ?, pollution_expiry = ? WHERE id = ?",
      [insuranceExpiry, pollutionExpiry, vehicleId]
    );
  } catch (err) {
    console.error(`Failed to sync vehicle expiry dates for vehicle ${vehicleId}:`, err);
  }
}

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

    // Replace existing document of the same category to prevent duplicates
    const existingDocs = await db.query(
      "SELECT id, document_url FROM vehicle_document WHERE vehicle_id = ? AND document_type = ?",
      [vehicleId, String(documentType)]
    );
    for (const doc of existingDocs) {
      // Delete record from DB
      await db.query("DELETE FROM vehicle_document WHERE id = ?", [doc.id]);
      // Delete old file from Cloudinary
      try {
        if (doc.document_url && (doc.document_url.includes('cloudinary.com') || doc.document_url.startsWith('http'))) {
          await deleteFromCloudinary(doc.document_url);
        }
      } catch (err) {
        console.warn('Failed to delete old document from Cloudinary:', err.message);
      }
    }

    // Convert file to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary, passing original filename to preserve extension
    const documentUrl = await uploadToCloudinary(buffer, 'vehicle_documents', file.name);

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

    // Sync the vehicle table columns (insurance_expiry, pollution_expiry)
    await syncVehicleExpiryDates(vehicleId);

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
