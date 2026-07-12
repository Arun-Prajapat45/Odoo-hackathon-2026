import { queryDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';

    const where = {};

    if (status) {
      where.status = status;
    }

    if (type) {
      where.categoryId = parseInt(type, 10);
    }

    if (search) {
      where.OR = [
        { registrationNumber: { contains: search } },
        { vehicleName: { contains: search } },
        { manufacturer: { contains: search } },
        { model: { contains: search } },
        {
          category: {
            name: { contains: search }
          }
        }
      ];
    }

    const vehicles = await db.vehicle.findMany({
      where,
      include: {
        category: true,
        documents: true,
        _count: {
          select: {
            trips: {
              where: {
                status: { in: ['DRAFT', 'DISPATCHED'] }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(vehicles);
  } catch (error) {
    console.error('GET /api/vehicles error:', error);
    return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
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

    // Check unique registration number
    const existing = await db.vehicle.findUnique({
      where: { registrationNumber }
    });

    if (existing) {
      return NextResponse.json({ error: 'Registration number already exists' }, { status: 400 });
    }

    const vehicle = await db.vehicle.create({
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
        status: status || 'AVAILABLE',
        currentLocation,
        insuranceExpiry: insuranceExpiry || null,
        pollutionExpiry: pollutionExpiry || null
      },
      include: {
        category: true
      }
    });

    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    console.error('POST /api/vehicles error:', error);
    return NextResponse.json({ error: 'Failed to create vehicle' }, { status: 500 });
  }
}
