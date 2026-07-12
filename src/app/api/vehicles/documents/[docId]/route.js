import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { deleteFromCloudinary } from '@/lib/cloudinary';
import { unlink } from 'fs/promises';
import path from 'path';

export async function PATCH(request, { params }) {
  try {
    const { docId } = await params;
    const documentId = parseInt(docId, 10);
    const body = await request.json();
    const { verified, expiryDate } = body;

    // Build conditional updates
    if (verified !== undefined && expiryDate !== undefined) {
      await db.query("UPDATE vehicle_document SET verified = ?, expiry_date = ? WHERE id = ?", [Boolean(verified) ? 1 : 0, expiryDate || null, documentId]);
    } else if (verified !== undefined) {
      await db.query("UPDATE vehicle_document SET verified = ? WHERE id = ?", [Boolean(verified) ? 1 : 0, documentId]);
    } else if (expiryDate !== undefined) {
      await db.query("UPDATE vehicle_document SET expiry_date = ? WHERE id = ?", [expiryDate || null, documentId]);
    }

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

    // Fetch document to get file path
    const docList = await db.query("SELECT document_url AS documentUrl FROM vehicle_document WHERE id = ?", [documentId]);
    if (docList.length === 0) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const document = docList[0];

    // Delete record from DB first
    await db.query("DELETE FROM vehicle_document WHERE id = ?", [documentId]);

    // Attempt to delete file from Cloudinary (or fallback to local disk)
    try {
      if (document.documentUrl) {
        if (document.documentUrl.includes('cloudinary.com') || document.documentUrl.startsWith('http')) {
          await deleteFromCloudinary(document.documentUrl);
        } else if (document.documentUrl.startsWith('/uploads/')) {
          const filePath = path.join(process.cwd(), 'public', document.documentUrl);
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
