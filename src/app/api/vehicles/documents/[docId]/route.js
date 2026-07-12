import { queryDb } from '@/lib/db';
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

    let sql = 'UPDATE vehicle_document SET ';
    const params = [];
    if (verified !== undefined) {
      sql += 'verified = ?, ';
      params.push(verified ? 1 : 0);
    }
    if (expiryDate !== undefined) {
      sql += 'expiry_date = ?, ';
      params.push(expiryDate || null);
    }
    
    if (params.length > 0) {
      sql = sql.slice(0, -2);
      sql += ' WHERE id = ?';
      params.push(documentId);
      await queryDb(sql, params);
    }

    return NextResponse.json({ success: true });
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
    const docs = await queryDb('SELECT document_url FROM vehicle_document WHERE id = ?', [documentId]);

    if (!docs || docs.length === 0) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    const document = docs[0];

    // Delete record from DB first
    await queryDb('DELETE FROM vehicle_document WHERE id = ?', [documentId]);

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
