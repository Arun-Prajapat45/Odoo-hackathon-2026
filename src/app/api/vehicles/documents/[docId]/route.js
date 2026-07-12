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

    const data = {};
    if (verified !== undefined) {
      data.verified = Boolean(verified);
    }
    if (expiryDate !== undefined) {
      data.expiryDate = expiryDate || null;
    }

    const document = await db.vehicleDocument.update({
      where: { id: documentId },
      data
    });

    return NextResponse.json(document);
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
    const document = await db.vehicleDocument.findUnique({
      where: { id: documentId }
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Delete record from DB first
    await db.vehicleDocument.delete({
      where: { id: documentId }
    });

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
