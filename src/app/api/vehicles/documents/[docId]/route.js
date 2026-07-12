import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { deleteFromCloudinary } from '@/lib/cloudinary';
import { unlink } from 'fs/promises';
import path from 'path';

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

export async function PATCH(request, { params }) {
  try {
    const { docId } = await params;
    const documentId = parseInt(docId, 10);
    const body = await request.json();
    const { verified, expiryDate } = body;

    // Fetch vehicle_id of document
    const docData = await db.query("SELECT vehicle_id FROM vehicle_document WHERE id = ?", [documentId]);
    if (docData.length === 0) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    const vehicleId = docData[0].vehicle_id;

    // Build conditional updates
    if (verified !== undefined && expiryDate !== undefined) {
      await db.query("UPDATE vehicle_document SET verified = ?, expiry_date = ? WHERE id = ?", [Boolean(verified) ? 1 : 0, expiryDate || null, documentId]);
    } else if (verified !== undefined) {
      await db.query("UPDATE vehicle_document SET verified = ? WHERE id = ?", [Boolean(verified) ? 1 : 0, documentId]);
    } else if (expiryDate !== undefined) {
      await db.query("UPDATE vehicle_document SET expiry_date = ? WHERE id = ?", [expiryDate || null, documentId]);
    }

    // Sync expiry dates to vehicle table
    await syncVehicleExpiryDates(vehicleId);

    const docList = await db.query(`
      SELECT 
        id, 
        vehicle_id AS vehicleId, 
        document_type AS documentType, 
        document_url AS documentUrl, 
        expiry_date AS expiryDate, 
        verified 
      FROM vehicle_document 
      WHERE id = ?
    `, [documentId]);

    return NextResponse.json(docList[0]);
  } catch (error) {
    console.error('PATCH /api/vehicles/documents/[docId] error:', error);
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { docId } = await params;
    const documentId = parseInt(docId, 10);

    // Fetch document to get file path and vehicle_id
    const docList = await db.query("SELECT vehicle_id, document_url FROM vehicle_document WHERE id = ?", [documentId]);
    if (docList.length === 0) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const document = docList[0];
    const vehicleId = document.vehicle_id;

    // Delete record from DB first
    await db.query("DELETE FROM vehicle_document WHERE id = ?", [documentId]);

    // Sync expiry dates to vehicle table
    await syncVehicleExpiryDates(vehicleId);

    // Attempt to delete file from Cloudinary (or fallback to local disk)
    try {
      if (document.document_url) {
        if (document.document_url.includes('cloudinary.com') || document.document_url.startsWith('http')) {
          await deleteFromCloudinary(document.document_url);
        } else if (document.document_url.startsWith('/uploads/')) {
          const filePath = path.join(process.cwd(), 'public', document.document_url);
          await unlink(filePath);
        }
      }
    } catch (delError) {
      console.warn('Document file deletion failed:', delError.message);
    }

    return NextResponse.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/vehicles/documents/[docId] error:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
