import { NextResponse } from 'next/server';
import { queryDb } from '@/lib/db.js';
import { verifyToken } from '@/lib/auth.js';

export async function GET(request) {
  try {
    const token = request.cookies.get('transitops_token')?.value || request.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await verifyToken(token);
    if (!user || !user.userId) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const rows = await queryDb(
      'SELECT id, question, response, created_at FROM chat WHERE user_id = ? ORDER BY id DESC LIMIT 50',
      [user.userId]
    );

    // Return chronological order for UI display
    const history = (rows || []).reverse().map(r => [
      { id: `q-${r.id}`, role: 'user', content: r.question, timestamp: r.created_at },
      { id: `a-${r.id}`, role: 'assistant', content: r.response, timestamp: r.created_at }
    ]).flat();

    return NextResponse.json({ success: true, history: history }, { status: 200 });
  } catch (err) {
    console.error('[GET /api/ai/history Error]:', err);
    return NextResponse.json({ error: 'Failed to retrieve chat history.' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const token = request.cookies.get('transitops_token')?.value || request.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await verifyToken(token);
    if (!user || !user.userId) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    await queryDb('DELETE FROM chat WHERE user_id = ?', [user.userId]);

    return NextResponse.json({ success: true, message: 'Chat history cleared.' }, { status: 200 });
  } catch (err) {
    console.error('[DELETE /api/ai/history Error]:', err);
    return NextResponse.json({ error: 'Failed to clear chat history.' }, { status: 500 });
  }
}
