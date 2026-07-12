-- CreateTable
CREATE TABLE "VehicleCategory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "registrationNumber" TEXT NOT NULL,
    "vehicleName" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "manufacturer" TEXT,
    "model" TEXT,
    "year" INTEGER,
    "capacity" REAL NOT NULL,
    "odometer" REAL NOT NULL DEFAULT 0,
    "fuelType" TEXT NOT NULL,
    "purchaseCost" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "currentLocation" TEXT,
    "insuranceExpiry" TEXT,
    "pollutionExpiry" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Vehicle_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "VehicleCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VehicleDocument" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "vehicleId" INTEGER NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentUrl" TEXT NOT NULL,
    "expiryDate" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "VehicleDocument_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Trip" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tripNumber" TEXT NOT NULL,
    "vehicleId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "cargoWeight" REAL NOT NULL,
    "source" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Trip_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "VehicleCategory_name_key" ON "VehicleCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_registrationNumber_key" ON "Vehicle"("registrationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Trip_tripNumber_key" ON "Trip"("tripNumber");
