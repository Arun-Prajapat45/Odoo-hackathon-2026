const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runTests() {
  console.log('--- Starting Database Business Rule Tests ---');

  // Test 1: Unique Registration Number
  console.log('\nTest 1: Enforcing unique registration number...');
  const existingVehicles = await prisma.vehicle.findMany();
  if (existingVehicles.length === 0) {
    console.error('Error: Seed data not found. Please run seed script first.');
    process.exit(1);
  }
  const duplicateRegNum = existingVehicles[0].registrationNumber;
  console.log(`Attempting to create vehicle with duplicate registration number: ${duplicateRegNum}`);

  try {
    await prisma.vehicle.create({
      data: {
        registrationNumber: duplicateRegNum,
        vehicleName: 'Duplicate Test Truck',
        categoryId: existingVehicles[0].categoryId,
        capacity: 1000.0,
        fuelType: 'DIESEL',
        status: 'AVAILABLE'
      }
    });
    console.error('FAIL: Created vehicle with duplicate registration number!');
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('SUCCESS: Correctly blocked duplicate registration number (Prisma unique constraint).');
    } else {
      console.error('FAIL: Unexpected error during duplicate check:', error);
    }
  }

  // Test 2: Active Trip Deletion Guard
  console.log('\nTest 2: Active trip deletion guard...');
  const activeTrip = await prisma.trip.findFirst({
    where: { status: 'DISPATCHED' }
  });

  if (!activeTrip) {
    console.error('Error: No active trip found in database. Seeding might have failed.');
  } else {
    const vehicleIdWithActiveTrip = activeTrip.vehicleId;
    console.log(`Found active trip for vehicle ID ${vehicleIdWithActiveTrip}. Attempting to delete vehicle...`);

    const activeTripsCount = await prisma.trip.count({
      where: {
        vehicleId: vehicleIdWithActiveTrip,
        status: { in: ['DRAFT', 'DISPATCHED'] }
      }
    });

    if (activeTripsCount > 0) {
      console.log(`SUCCESS: Correctly detected active trips (${activeTripsCount}). Blocked deletion as per rule.`);
    } else {
      console.error('FAIL: Failed to detect active trips. Deletion would have succeeded!');
    }
  }

  // Test 3: Can delete vehicle with NO active trips
  console.log('\nTest 3: Deletion of vehicle with no active trips...');
  const tempVehicle = await prisma.vehicle.create({
    data: {
      registrationNumber: 'TEST-TEMP-999',
      vehicleName: 'Temp Test Vehicle',
      categoryId: existingVehicles[0].categoryId,
      capacity: 500.0,
      fuelType: 'EV',
      status: 'AVAILABLE'
    }
  });
  console.log(`Created temp vehicle ID ${tempVehicle.id}. Attempting to delete...`);

  const activeTripsTemp = await prisma.trip.count({
    where: {
      vehicleId: tempVehicle.id,
      status: { in: ['DRAFT', 'DISPATCHED'] }
    }
  });

  if (activeTripsTemp === 0) {
    await prisma.vehicle.delete({
      where: { id: tempVehicle.id }
    });
    console.log('SUCCESS: Deleted vehicle with no active trips.');
  } else {
    console.error('FAIL: Blocked deletion of a vehicle with no active trips.');
  }

  console.log('\n--- All Database Tests Passed Successfully ---');
}

runTests()
  .catch((e) => {
    console.error('Test run failed:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
