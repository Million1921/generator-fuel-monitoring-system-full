-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'TECHNICIAN',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Region" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Site" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "siteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tankerCapacity" REAL,
    "dgCapacity" TEXT,
    "dgType" TEXT,
    "gpsCoordinates" TEXT,
    "region" TEXT,
    "installationDate" DATETIME,
    "regionId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Site_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Generator" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "genId" TEXT NOT NULL,
    "model" TEXT,
    "capacity" TEXT,
    "capacityKVA" REAL DEFAULT 0,
    "stdFuelConsumption" REAL DEFAULT 0,
    "serialNumber" TEXT,
    "lastRunningHours" REAL DEFAULT 0,
    "installationDate" DATETIME,
    "displayHistory" TEXT,
    "siteId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Generator_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Technician" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT,
    "name" TEXT,
    "department" TEXT,
    "regionId" INTEGER,
    "phone" TEXT,
    "email" TEXT,
    CONSTRAINT "Technician_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Technician_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FuelRequest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "workRequestNumber" TEXT,
    "workOrderNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT,
    "actualRefueled" REAL DEFAULT 0,
    "literRequired" REAL,
    "requestedAmount" REAL,
    "siteId" INTEGER NOT NULL,
    "technicianId" INTEGER,
    "supervisorId" INTEGER,
    "managerId" INTEGER,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" DATETIME,
    "rejectedAt" DATETIME,
    "rejectionReason" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "FuelRequest_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FuelRequest_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "Technician" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FuelRefill" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "refillDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fuelDelivered" REAL NOT NULL,
    "beforeLevel" REAL NOT NULL,
    "afterLevel" REAL NOT NULL,
    "beforeHours" REAL NOT NULL,
    "afterHours" REAL NOT NULL,
    "tankerVehicle" TEXT,
    "driverName" TEXT,
    "driverId" TEXT,
    "technicianName" TEXT,
    "technicianIdStr" TEXT,
    "employmentType" TEXT,
    "siteId" INTEGER NOT NULL,
    "technicianId" INTEGER,
    "fuelRequestId" INTEGER,
    "workOrderNumber" TEXT,
    "unitPrice" REAL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FuelRefill_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FuelRefill_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "Technician" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FuelRefill_fuelRequestId_fkey" FOREIGN KEY ("fuelRequestId") REFERENCES "FuelRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "receiptNo" TEXT,
    "senderAccount" TEXT,
    "receiverAccount" TEXT,
    "paidAmount" REAL DEFAULT 0,
    "senderAmount" REAL DEFAULT 0,
    "payerName" TEXT,
    "location" TEXT,
    "fuelStation" TEXT,
    "fuelType" TEXT NOT NULL DEFAULT 'Diesel',
    "type" TEXT NOT NULL,
    "remark" TEXT,
    "errors" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "siteId" INTEGER,
    "technicianId" INTEGER,
    CONSTRAINT "Transaction_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "Technician" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Region_name_key" ON "Region"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Site_siteId_key" ON "Site"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "Generator_genId_key" ON "Generator"("genId");

-- CreateIndex
CREATE UNIQUE INDEX "Generator_siteId_key" ON "Generator"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "Technician_userId_key" ON "Technician"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FuelRequest_workRequestNumber_key" ON "FuelRequest"("workRequestNumber");

-- CreateIndex
CREATE UNIQUE INDEX "FuelRequest_workOrderNumber_key" ON "FuelRequest"("workOrderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "FuelRefill_fuelRequestId_key" ON "FuelRefill"("fuelRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_receiptNo_key" ON "Transaction"("receiptNo");
