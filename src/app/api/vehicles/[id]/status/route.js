import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const vehicleId = parseInt(id, 10);
    const body = await request.json();
    const { status } = body;

    const allowedStatuses = ['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED'];
    if (!status || !allowedStatuses.includes(status)) {
      return NextResponse.json({
        error: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`
      }, { status: 400 });
    }

    const vehicle = await db.vehicle.update({
      where: { id: vehicleId },
      data: { status }
    });

    return NextResponse.json(vehicle);
  } catch (error) {
    console.error('PATCH /api/vehicles/[id]/status error:', error);
    return NextResponse.json({ error: 'Failed to update vehicle status' }, { status: 500 });
  }
}
