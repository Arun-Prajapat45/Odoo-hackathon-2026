const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Clear tables in reverse dependency order
  await prisma.trip.deleteMany({});
  await prisma.vehicleDocument.deleteMany({});
  await prisma.vehicle.deleteMany({});
  await prisma.vehicleCategory.deleteMany({});

  // Seed Vehicle Categories
  const truckCat = await prisma.vehicleCategory.create({ data: { name: 'Truck' } });
  const miniTruckCat = await prisma.vehicleCategory.create({ data: { name: 'Mini Truck' } });
  const vanCat = await prisma.vehicleCategory.create({ data: { name: 'Van' } });
  const bikeCat = await prisma.vehicleCategory.create({ data: { name: 'Bike' } });
  const containerCat = await prisma.vehicleCategory.create({ data: { name: 'Container' } });

  console.log('Categories seeded.');

  // Seed Vehicles
  const v1 = await prisma.vehicle.create({
    data: {
      registrationNumber: 'MH-12-HE-1234',
      vehicleName: 'Eicher Pro 2049',
      categoryId: truckCat.id,
      manufacturer: 'Eicher',
      model: 'Pro 2049',
      year: 2023,
      capacity: 3500.0,
      odometer: 15200.0,
      fuelType: 'DIESEL',
      purchaseCost: 1200000.0,
      status: 'AVAILABLE',
      currentLocation: 'Depot-A',
      insuranceExpiry: '2027-12-31',
      pollutionExpiry: '2026-11-30',
    }
  });

  const v2 = await prisma.vehicle.create({
    data: {
      registrationNumber: 'DL-01-AB-7890',
      vehicleName: 'Tata Ace Gold',
      categoryId: miniTruckCat.id,
      manufacturer: 'Tata',
      model: 'Ace Gold',
      year: 2021,
      capacity: 750.0,
      odometer: 8900.0,
      fuelType: 'CNG',
      purchaseCost: 450000.0,
      status: 'IN_SHOP',
      currentLocation: 'Workshop-1',
      insuranceExpiry: '2025-06-30', // Expired
      pollutionExpiry: '2026-08-31',
    }
  });

  const v3 = await prisma.vehicle.create({
    data: {
      registrationNumber: 'KA-03-MM-5678',
      vehicleName: 'Mahindra Supro',
      categoryId: vanCat.id,
      manufacturer: 'Mahindra',
      model: 'Supro',
      year: 2022,
      capacity: 1000.0,
      odometer: 24500.0,
      fuelType: 'DIESEL',
      purchaseCost: 600000.0,
      status: 'ON_TRIP',
      currentLocation: 'Route 10',
      insuranceExpiry: '2027-01-15',
      pollutionExpiry: '2026-09-20',
    }
  });

  const v4 = await prisma.vehicle.create({
    data: {
      registrationNumber: 'MH-15-JK-9012',
      vehicleName: 'Hero Electric Nyx',
      categoryId: bikeCat.id,
      manufacturer: 'Hero Electric',
      model: 'Nyx',
      year: 2024,
      capacity: 150.0,
      odometer: 1200.0,
      fuelType: 'EV',
      purchaseCost: 90000.0,
      status: 'AVAILABLE',
      currentLocation: 'Hub-South',
      insuranceExpiry: '2028-03-01',
      pollutionExpiry: '2027-03-01',
    }
  });

  const v5 = await prisma.vehicle.create({
    data: {
      registrationNumber: 'DL-03-CD-3456',
      vehicleName: 'BharatBenz 2823C',
      categoryId: containerCat.id,
      manufacturer: 'BharatBenz',
      model: '2823C',
      year: 2020,
      capacity: 15000.0,
      odometer: 45000.0,
      fuelType: 'DIESEL',
      purchaseCost: 3200000.0,
      status: 'RETIRED',
      currentLocation: 'Scrap Yard',
      insuranceExpiry: '2024-12-31',
      pollutionExpiry: '2024-12-31',
    }
  });

  console.log('Vehicles seeded.');

  // Seed Documents
  await prisma.vehicleDocument.createMany({
    data: [
      {
        vehicleId: v1.id,
        documentType: 'RC',
        documentUrl: '/uploads/rc_eicher.pdf',
        expiryDate: '2033-05-12',
        verified: true,
      },
      {
        vehicleId: v1.id,
        documentType: 'Insurance',
        documentUrl: '/uploads/insurance_eicher.pdf',
        expiryDate: '2027-12-31',
        verified: true,
      },
      {
        vehicleId: v2.id,
        documentType: 'RC',
        documentUrl: '/uploads/rc_tata.pdf',
        expiryDate: '2031-10-10',
        verified: true,
      },
      {
        vehicleId: v2.id,
        documentType: 'Insurance',
        documentUrl: '/uploads/insurance_tata.pdf',
        expiryDate: '2025-06-30', // Expired
        verified: false,
      }
    ]
  });

  console.log('Documents seeded.');

  // Seed Trips
  // v3 (Mahindra Supro) is ON_TRIP and has an active trip (DISPATCHED)
  await prisma.trip.create({
    data: {
      tripNumber: 'TRIP-1001',
      vehicleId: v3.id,
      status: 'DISPATCHED', // Active trip
      cargoWeight: 800.0,
      source: 'Warehouse Bangalore',
      destination: 'Retail Hub Chennai',
    }
  });

  // v2 (Tata Ace Gold) has a completed trip
  await prisma.trip.create({
    data: {
      tripNumber: 'TRIP-1002',
      vehicleId: v2.id,
      status: 'COMPLETED', // Completed/terminal trip
      cargoWeight: 500.0,
      source: 'Mumbai Port',
      destination: 'Pune Distribution Depot',
    }
  });

  console.log('Trips seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
