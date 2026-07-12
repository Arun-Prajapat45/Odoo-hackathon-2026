import { NextResponse } from 'next/server';
import { queryDb } from '@/lib/db.js';

export async function GET() {
  try {
    const roles = await queryDb('SELECT * FROM role ORDER BY id ASC');
    return NextResponse.json({ success: true, roles }, { status: 200 });
  } catch (err) {
    console.error('[GET /api/roles Error]:', err);
    return NextResponse.json({ error: 'Failed to fetch roles.' }, { status: 500 });
  }
}
