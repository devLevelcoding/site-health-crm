-- CreateTable
CREATE TABLE "clients" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" DATETIME
);

-- CreateTable
CREATE TABLE "lighthouse_scans" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clientId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "scannedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "https" BOOLEAN NOT NULL DEFAULT false,
    "hsts" BOOLEAN NOT NULL DEFAULT false,
    "xfo" BOOLEAN NOT NULL DEFAULT false,
    "csp" BOOLEAN NOT NULL DEFAULT false,
    "xcto" BOOLEAN NOT NULL DEFAULT false,
    "xssHeader" BOOLEAN NOT NULL DEFAULT false,
    "secScore" INTEGER NOT NULL DEFAULT 0,
    "hasTitle" BOOLEAN NOT NULL DEFAULT false,
    "hasMeta" BOOLEAN NOT NULL DEFAULT false,
    "hasH1" BOOLEAN NOT NULL DEFAULT false,
    "hasCanonical" BOOLEAN NOT NULL DEFAULT false,
    "hasOg" BOOLEAN NOT NULL DEFAULT false,
    "hasRobots" BOOLEAN NOT NULL DEFAULT false,
    "hasSitemap" BOOLEAN NOT NULL DEFAULT false,
    "seoScore" INTEGER NOT NULL DEFAULT 0,
    "hasGa" BOOLEAN NOT NULL DEFAULT false,
    "hasGtm" BOOLEAN NOT NULL DEFAULT false,
    "hasFbPixel" BOOLEAN NOT NULL DEFAULT false,
    "hasLinkedIn" BOOLEAN NOT NULL DEFAULT false,
    "hasSchemaOrg" BOOLEAN NOT NULL DEFAULT false,
    "hasHotjar" BOOLEAN NOT NULL DEFAULT false,
    "semScore" INTEGER NOT NULL DEFAULT 0,
    "statusCode" INTEGER,
    "error" TEXT,
    CONSTRAINT "lighthouse_scans_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "scan_reminders" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clientId" INTEGER NOT NULL,
    "dueAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "scan_reminders_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "monitor_settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "intervalDays" INTEGER NOT NULL DEFAULT 30,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "lighthouse_scans_clientId_idx" ON "lighthouse_scans"("clientId");
