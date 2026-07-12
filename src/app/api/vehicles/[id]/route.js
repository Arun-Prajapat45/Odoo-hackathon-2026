import { queryDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const vehicleId = parseInt(id, 10);

    const vehicleResult = await queryDb('SELECT * FROM vehicle WHERE id = ?', [vehicleId]);
    if (!vehicleResult || vehicleResult.length === 0) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }
    const vehicle = vehicleResult[0];

    const categoryResult = await queryDb('SELECT * FROM vehicle_category WHERE id = ?', [vehicle.category_id || vehicle.categoryId]);
    const documents = await queryDb('SELECT * FROM vehicle_document WHERE vehicle_id = ?', [vehicleId]);
    const trips = await queryDb('SELECT * FROM trip WHERE vehicle_id = ? ORDER BY created_at DESC', [vehicleId]);

    const mappedVehicle = {
      ...vehicle,
      id: vehicle.id,
      vehicleName: vehicle.vehicle_name || vehicle.vehicleName,
      registrationNumber: vehicle.registration_number || vehicle.registrationNumber,
      categoryId: vehicle.category_id || vehicle.categoryId,
      fuelType: vehicle.fuel_type || vehicle.fuelType,
      purchaseCost: vehicle.purchase_cost || vehicle.purchaseCost,
      currentLocation: vehicle.current_location || vehicle.currentLocation,
      insuranceExpiry: vehicle.insurance_expiry || vehicle.insuranceExpiry,
      pollutionExpiry: vehicle.pollution_expiry || vehicle.pollutionExpiry,
      category: categoryResult?.[0] || null,
      documents: documents || [],
      trips: trips || []
    };

    return NextResponse.json(mappedVehicle);
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
      registrationNumber, vehicleName, categoryId, manufacturer, model,
      year, capacity, odometer, fuelType, purchaseCost, status,
      currentLocation, insuranceExpiry, pollutionExpiry
    } = body;

    if (!registrationNumber || !vehicleName || !categoryId || !capacity || !fuelType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const existing = await queryDb('SELECT id FROM vehicle WHERE registration_number = ? AND id != ?', [registrationNumber, vehicleId]);
    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'Registration number already exists' }, { status: 400 });
    }

    await queryDb(`
      UPDATE vehicle SET
        registration_number = ?, vehicle_name = ?, category_id = ?, manufacturer = ?, model = ?,
        year = ?, capacity = ?, odometer = ?, fuel_type = ?, purchase_cost = ?, status = ?,
        current_location = ?, insurance_expiry = ?, pollution_expiry = ?
      WHERE id = ?
    `, [
      registrationNumber, vehicleName, parseInt(categoryId, 10), manufacturer || null, model || null,
      year ? parseInt(year, 10) : null, parseFloat(capacity), odometer ? parseFloat(odometer) : 0,
      fuelType, purchaseCost ? parseFloat(purchaseCost) : 0, status || 'AVAILABLE',
      currentLocation || null, insuranceExpiry || null, pollutionExpiry || null,
      vehicleId
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/vehicles/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update vehicle' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const vehicleId = parseInt(id, 10);

    const activeTrips = await queryDb('SELECT id FROM trip WHERE vehicle_id = ? AND status IN ("DRAFT", "DISPATCHED")', [vehicleId]);
    if (activeTrips && activeTrips.length > 0) {
      return NextResponse.json({ error: 'Cannot delete vehicle with active trips' }, { status: 400 });
    }

    await queryDb('DELETE FROM vehicle WHERE id = ?', [vehicleId]);
    return NextResponse.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/vehicles/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete vehicle' }, { status: 500 });
  }
}
