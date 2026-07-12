import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const vehicleId = parseInt(id, 10);

    const list = await db.query(`
      SELECT 
        v.id,
        v.registration_number AS registrationNumber,
        v.vehicle_name AS vehicleName,
        v.category_id AS categoryId,
        v.manufacturer,
        v.model,
        v.year,
        v.capacity,
        v.odometer,
        v.fuel_type AS fuelType,
        v.purchase_cost AS purchaseCost,
        v.status,
        v.current_location AS currentLocation,
        v.insurance_expiry AS insuranceExpiry,
        v.pollution_expiry AS pollutionExpiry,
        c.name AS category_name
      FROM vehicle v
      LEFT JOIN vehicle_category c ON v.category_id = c.id
      WHERE v.id = ?
    `, [vehicleId]);

    if (list.length === 0) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    const v = list[0];
    const documents = await db.query(
      "SELECT id, document_type AS documentType, document_url AS documentUrl, expiry_date AS expiryDate, verified FROM vehicle_document WHERE vehicle_id = ?",
      [vehicleId]
    );

    // Trips list formatted to camelCase
    const trips = await db.query(`
      SELECT 
        id,
        trip_number AS tripNumber,
        vehicle_id AS vehicleId,
        driver_id AS driverId,
        source,
        destination,
        cargo_weight AS cargoWeight,
        status,
        created_at AS createdAt
      FROM trip 
      WHERE vehicle_id = ? 
      ORDER BY created_at DESC
    `, [vehicleId]);

    const responseData = {
      ...v,
      category: { id: v.categoryId, name: v.category_name },
      documents,
      trips
    };

    return NextResponse.json(responseData);
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
    const existing = await db.query(
      "SELECT id FROM vehicle WHERE registration_number = ? AND id != ?",
      [registrationNumber, vehicleId]
    );

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Registration number already exists' }, { status: 400 });
    }

    await db.query(`
      UPDATE vehicle SET 
        registration_number = ?,
        vehicle_name = ?,
        category_id = ?,
        manufacturer = ?,
        model = ?,
        year = ?,
        capacity = ?,
        odometer = ?,
        fuel_type = ?,
        purchase_cost = ?,
        status = ?,
        current_location = ?,
        insurance_expiry = ?,
        pollution_expiry = ?
      WHERE id = ?
    `, [
      registrationNumber,
      vehicleName,
      parseInt(categoryId, 10),
      manufacturer || null,
      model || null,
      year ? parseInt(year, 10) : null,
      parseFloat(capacity),
      odometer ? parseFloat(odometer) : 0,
      fuelType,
      purchaseCost ? parseFloat(purchaseCost) : 0,
      status,
      currentLocation || null,
      insuranceExpiry || null,
      pollutionExpiry || null,
      vehicleId
    ]);

    const updatedList = await db.query(`
      SELECT 
        v.id,
        v.registration_number AS registrationNumber,
        v.vehicle_name AS vehicleName,
        v.category_id AS categoryId,
        v.manufacturer,
        v.model,
        v.year,
        v.capacity,
        v.odometer,
        v.fuel_type AS fuelType,
        v.purchase_cost AS purchaseCost,
        v.status,
        v.current_location AS currentLocation,
        v.insurance_expiry AS insuranceExpiry,
        v.pollution_expiry AS pollutionExpiry,
        c.name AS category_name
      FROM vehicle v
      LEFT JOIN vehicle_category c ON v.category_id = c.id
      WHERE v.id = ?
    `, [vehicleId]);

    const uv = updatedList[0];
    return NextResponse.json({
      ...uv,
      category: { id: uv.categoryId, name: uv.category_name }
    });
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
    const activeTrips = await db.query(
      "SELECT id FROM trip WHERE vehicle_id = ? AND status IN ('DRAFT', 'DISPATCHED')",
      [vehicleId]
    );

    if (activeTrips.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete vehicle with active trips (DRAFT or DISPATCHED)'
      }, { status: 400 });
    }

    // Cascade delete vehicle documents from Cloudinary
    const documents = await db.query("SELECT document_url FROM vehicle_document WHERE vehicle_id = ?", [vehicleId]);
    for (const doc of documents) {
      try {
        if (doc.document_url && (doc.document_url.includes('cloudinary.com') || doc.document_url.startsWith('http'))) {
          const { deleteFromCloudinary } = require('@/lib/cloudinary');
          await deleteFromCloudinary(doc.document_url);
        }
      } catch (err) {
        console.warn('Failed to delete doc from Cloudinary during cascade:', err.message);
      }
    }

    // Delete records from database
    await db.query("DELETE FROM vehicle_document WHERE vehicle_id = ?", [vehicleId]);
    await db.query("DELETE FROM vehicle WHERE id = ?", [vehicleId]);

    return NextResponse.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/vehicles/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete vehicle' }, { status: 500 });
  }
}
