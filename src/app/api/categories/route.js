import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const categories = await db.vehicleCategory.findMany({
      orderBy: { name: 'asc' }
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error('GET /api/categories error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
