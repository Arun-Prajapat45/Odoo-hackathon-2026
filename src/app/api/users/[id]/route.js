import { NextResponse } from 'next/server';
import { queryDb } from '@/lib/db.js';
import { verifyToken, hasRole } from '@/lib/auth.js';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const token = request.cookies.get('transitops_token')?.value || request.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await verifyToken(token);
    if (!user || !hasRole(user.roleName, ['Admin', 'Fleet Manager'])) {
      return NextResponse.json({ error: 'Permission denied. Only Admins or Fleet Managers can modify accounts.' }, { status: 403 });
    }

    const { status, role_id } = await request.json();

    // Prevent modifying Admin root account if not admin
    if (user.roleName !== 'Admin' && Number(id) === 1) {
      return NextResponse.json({ error: 'Cannot modify root Admin account.' }, { status: 403 });
    }

    if (status) {
      await queryDb('UPDATE user SET status = ? WHERE id = ?', [status, id]);
    }
    if (role_id) {
      await queryDb('UPDATE user SET role_id = ? WHERE id = ?', [role_id, id]);
    }

    const updated = await queryDb(
      'SELECT u.id, u.name, u.email, u.role_id, u.status, r.name as role_name FROM user u JOIN role r ON u.role_id = r.id WHERE u.id = ?',
      [id]
    );

    return NextResponse.json({ success: true, message: 'User updated successfully.', user: updated[0] }, { status: 200 });
  } catch (err) {
    console.error('[PUT /api/users/[id] Error]:', err);
    return NextResponse.json({ error: 'Failed to update user.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const token = request.cookies.get('transitops_token')?.value || request.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await verifyToken(token);
    if (!user || !hasRole(user.roleName, ['Admin'])) {
      return NextResponse.json({ error: 'Permission denied. Only Admins can delete accounts.' }, { status: 403 });
    }

    if (Number(id) === 1 || Number(id) === user.userId) {
      return NextResponse.json({ error: 'Cannot delete yourself or the root Admin account.' }, { status: 400 });
    }

    await queryDb('DELETE FROM user WHERE id = ?', [id]);
    return NextResponse.json({ success: true, message: 'User deleted successfully.' }, { status: 200 });
  } catch (err) {
    console.error('[DELETE /api/users/[id] Error]:', err);
    return NextResponse.json({ error: 'Failed to delete user.' }, { status: 500 });
  }
}
