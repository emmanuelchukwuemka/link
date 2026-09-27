-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "subtitle" TEXT,
    "category" TEXT NOT NULL DEFAULT 'NFC Cards',
    "sku" TEXT,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "images" TEXT,
    "length" REAL,
    "width" REAL,
    "colors" TEXT,
    "priceRegular" REAL NOT NULL,
    "priceSale" REAL,
    "productionTime" TEXT NOT NULL DEFAULT '3-5 business days',
    "availability" TEXT NOT NULL DEFAULT 'available',
    "customizationPrice" REAL NOT NULL DEFAULT 5000,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Product" ("availability", "colors", "createdAt", "customizationPrice", "description", "id", "images", "length", "name", "priceRegular", "priceSale", "productionTime", "slug", "updatedAt", "width") SELECT "availability", "colors", "createdAt", "customizationPrice", "description", "id", "images", "length", "name", "priceRegular", "priceSale", "productionTime", "slug", "updatedAt", "width" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
