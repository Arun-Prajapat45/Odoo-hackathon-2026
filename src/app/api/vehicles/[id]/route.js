import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const vehicleId = parseInt(id, 10);

    const vehicle = await db.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        category: true,
        documents: true,
        trips: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    return NextResponse.json(vehicle);
  } catch (error) {
    console.error('GET /api/vehicles/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch vehicle' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const vehicleId = parseInt(id, 10);
    const body = await request.json();
    const {
      registrationNumber,
      vehicleName,
      categoryId,
      manufacturer,
      model,
      year,
      capacity,
      odometer,
      fuelType,
      purchaseCost,
      status,
      currentLocation,
      insuranceExpiry,
      pollutionExpiry
    } = body;

    // Validate required fields
    if (!registrationNumber || !vehicleName || !categoryId || !capacity || !fuelType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check unique registration number (excluding current vehicle)
    const existing = await db.vehicle.findFirst({
      where: {
        registrationNumber,
        NOT: { id: vehicleId }
      }
    });

    if (existing) {
      return NextResponse.json({ error: 'Registration number already exists' }, { status: 400 });
    }

    const vehicle = await db.vehicle.update({
      where: { id: vehicleId },
      data: {
        registrationNumber,
        vehicleName,
        categoryId: parseInt(categoryId, 10),
        manufacturer,
        model,
        year: year ? parseInt(year, 10) : null,
        capacity: parseFloat(capacity),
        odometer: odometer ? parseFloat(odometer) : 0,
        fuelType,
        purchaseCost: purchaseCost ? parseFloat(purchaseCost) : 0,
        status,
        currentLocation,
        insuranceExpiry: insuranceExpiry || null,
        pollutionExpiry: pollutionExpiry || null
      },
      include: {
        category: true
      }
    });

    return NextResponse.json(vehicle);
  } catch (error) {
    console.error('PUT /api/vehicles/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update vehicle' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const vehicleId = parseInt(id, 10);

    // Check for active trips (DRAFT or DISPATCHED status)
    const activeTrips = await db.trip.findMany({
      where: {
        vehicleId,
        status: { in: ['DRAFT', 'DISPATCHED'] }
      }
    });

    if (activeTrips.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete vehicle with active trips (DRAFT or DISPATCHED)'
      }, { status: 400 });
    }

    // Cascade delete vehicle documents is set up in schema via onDelete: Cascade
    await db.vehicle.delete({
      where: { id: vehicleId }
    });

    return NextResponse.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/vehicles/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete vehicle' }, { status: 500 });
  }
}
