-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'TECHNICIAN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'GENERAL',
    "regionId" INTEGER,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Region" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Site" (
    "id" SERIAL NOT NULL,
    "siteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tankerCapacity" DOUBLE PRECISION,
    "dgCapacity" TEXT,
    "dgType" TEXT,
    "gpsCoordinates" TEXT,
    "region" TEXT,
    "installationDate" TIMESTAMP(3),
    "regionId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Generator" (
    "id" SERIAL NOT NULL,
    "genId" TEXT NOT NULL,
    "model" TEXT,
    "capacity" TEXT,
    "capacityKVA" DOUBLE PRECISION DEFAULT 0,
    "stdFuelConsumption" DOUBLE PRECISION DEFAULT 0,
    "serialNumber" TEXT,
    "lastRunningHours" DOUBLE PRECISION DEFAULT 0,
    "installationDate" TIMESTAMP(3),
    "displayHistory" TEXT,
    "siteId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Generator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Technician" (
    "id" SERIAL NOT NULL,
    "userId" TEXT,
    "name" TEXT,
    "department" TEXT,
    "departmentId" INTEGER,
    "regionId" INTEGER,
    "phone" TEXT,
    "email" TEXT,

    CONSTRAINT "Technician_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FuelRequest" (
    "id" SERIAL NOT NULL,
    "workRequestNumber" TEXT,
    "workOrderNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT,
    "actualRefueled" DOUBLE PRECISION DEFAULT 0,
    "literRequired" DOUBLE PRECISION,
    "requestedAmount" DOUBLE PRECISION,
    "runningHour" DOUBLE PRECISION,
    "securityName" TEXT,
    "route" TEXT,
    "driverName" TEXT,
    "driverType" TEXT,
    "driverPhone" TEXT,
    "employeeId" TEXT,
    "siteId" INTEGER NOT NULL,
    "technicianId" INTEGER,
    "supervisorId" INTEGER,
    "managerId" INTEGER,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "notes" TEXT,
    "fuelStation" TEXT,
    "purchasedAmount" DOUBLE PRECISION,
    "financeRemark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FuelRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FuelAdminWallet" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FuelAdminWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletTransaction" (
    "id" SERIAL NOT NULL,
    "walletId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "fuelRequestId" INTEGER,
    "fuelStation" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FuelRefill" (
    "id" SERIAL NOT NULL,
    "refillDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fuelDelivered" DOUBLE PRECISION NOT NULL,
    "beforeLevel" DOUBLE PRECISION NOT NULL,
    "afterLevel" DOUBLE PRECISION NOT NULL,
    "beforeHours" DOUBLE PRECISION NOT NULL,
    "afterHours" DOUBLE PRECISION NOT NULL,
    "tankerVehicle" TEXT,
    "driverName" TEXT,
    "driverId" TEXT,
    "technicianName" TEXT,
    "technicianIdStr" TEXT,
    "employmentType" TEXT,
    "eepu" DOUBLE PRECISION,
    "remark" TEXT,
    "department" TEXT,
    "siteId" INTEGER NOT NULL,
    "technicianId" INTEGER,
    "fuelRequestId" INTEGER,
    "workOrderNumber" TEXT,
    "unitPrice" DOUBLE PRECISION DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FuelRefill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" SERIAL NOT NULL,
    "receiptNo" TEXT,
    "senderAccount" TEXT,
    "receiverAccount" TEXT,
    "paidAmount" DOUBLE PRECISION DEFAULT 0,
    "senderAmount" DOUBLE PRECISION DEFAULT 0,
    "payerName" TEXT,
    "location" TEXT,
    "fuelStation" TEXT,
    "fuelType" TEXT NOT NULL DEFAULT 'Diesel',
    "type" TEXT NOT NULL,
    "remark" TEXT,
    "errors" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "siteId" INTEGER,
    "technicianId" INTEGER,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_regionId_key" ON "Department"("name", "regionId");

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
CREATE UNIQUE INDEX "FuelAdminWallet_userId_key" ON "FuelAdminWallet"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FuelRefill_fuelRequestId_key" ON "FuelRefill"("fuelRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_receiptNo_key" ON "Transaction"("receiptNo");

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Site" ADD CONSTRAINT "Site_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Generator" ADD CONSTRAINT "Generator_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Technician" ADD CONSTRAINT "Technician_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Technician" ADD CONSTRAINT "Technician_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Technician" ADD CONSTRAINT "Technician_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelRequest" ADD CONSTRAINT "FuelRequest_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelRequest" ADD CONSTRAINT "FuelRequest_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "Technician"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "FuelAdminWallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelRefill" ADD CONSTRAINT "FuelRefill_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelRefill" ADD CONSTRAINT "FuelRefill_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "Technician"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelRefill" ADD CONSTRAINT "FuelRefill_fuelRequestId_fkey" FOREIGN KEY ("fuelRequestId") REFERENCES "FuelRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "Technician"("id") ON DELETE SET NULL ON UPDATE CASCADE;

