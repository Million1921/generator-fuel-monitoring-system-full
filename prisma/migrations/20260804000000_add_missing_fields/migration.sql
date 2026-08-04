-- Migration: 20260804_add_missing_fields
-- Captures all schema additions that occurred since the initial squashed
-- migration (20260701142624_init) but were never recorded incrementally.
-- Safe to run on any PostgreSQL database that was bootstrapped from the
-- init migration — all statements use IF NOT EXISTS / DO NOTHING guards
-- so they are idempotent on a schema that is already fully up to date.
--
-- Tables added:
--   Department, FuelAdminWallet, WalletTransaction
--
-- Columns added to existing tables:
--   Technician       : departmentId
--   FuelRequest      : runningHour, securityName, route, driverName,
--                      driverType, driverPhone, employeeId, fuelStation,
--                      purchasedAmount, financeRemark
--   FuelRefill       : eepu, remark, department

-- -------------------------------------------------------------------------
-- 1. New tables
-- -------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "Department" (
    "id"       SERIAL       NOT NULL,
    "name"     TEXT         NOT NULL,
    "type"     TEXT         NOT NULL DEFAULT 'GENERAL',
    "regionId" INTEGER,
    CONSTRAINT "Department_pkey"      PRIMARY KEY ("id"),
    CONSTRAINT "Department_regionId_fkey"
        FOREIGN KEY ("regionId") REFERENCES "Region" ("id")
        ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Department_name_regionId_key"
    ON "Department"("name", "regionId");

CREATE TABLE IF NOT EXISTS "FuelAdminWallet" (
    "id"        SERIAL       NOT NULL,
    "userId"    TEXT         NOT NULL,
    "balance"   DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FuelAdminWallet_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "FuelAdminWallet_userId_key"
    ON "FuelAdminWallet"("userId");

CREATE TABLE IF NOT EXISTS "WalletTransaction" (
    "id"            SERIAL       NOT NULL,
    "walletId"      INTEGER      NOT NULL,
    "type"          TEXT         NOT NULL,
    "amount"        DOUBLE PRECISION NOT NULL,
    "fuelRequestId" INTEGER,
    "fuelStation"   TEXT,
    "description"   TEXT,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "WalletTransaction_walletId_fkey"
        FOREIGN KEY ("walletId") REFERENCES "FuelAdminWallet" ("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
);

-- -------------------------------------------------------------------------
-- 2. New columns on Technician
-- -------------------------------------------------------------------------

ALTER TABLE "Technician"
    ADD COLUMN IF NOT EXISTS "departmentId" INTEGER,
    ADD CONSTRAINT "Technician_departmentId_fkey"
        FOREIGN KEY ("departmentId") REFERENCES "Department" ("id")
        ON DELETE SET NULL ON UPDATE CASCADE;

-- -------------------------------------------------------------------------
-- 3. New columns on FuelRequest
-- -------------------------------------------------------------------------

ALTER TABLE "FuelRequest"
    ADD COLUMN IF NOT EXISTS "runningHour"     DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS "securityName"    TEXT,
    ADD COLUMN IF NOT EXISTS "route"           TEXT,
    ADD COLUMN IF NOT EXISTS "driverName"      TEXT,
    ADD COLUMN IF NOT EXISTS "driverType"      TEXT,
    ADD COLUMN IF NOT EXISTS "driverPhone"     TEXT,
    ADD COLUMN IF NOT EXISTS "employeeId"      TEXT,
    ADD COLUMN IF NOT EXISTS "fuelStation"     TEXT,
    ADD COLUMN IF NOT EXISTS "purchasedAmount" DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS "financeRemark"   TEXT;

-- -------------------------------------------------------------------------
-- 4. New columns on FuelRefill
-- -------------------------------------------------------------------------

ALTER TABLE "FuelRefill"
    ADD COLUMN IF NOT EXISTS "eepu"       DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS "remark"     TEXT,
    ADD COLUMN IF NOT EXISTS "department" TEXT;
