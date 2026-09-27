-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "accountType" TEXT NOT NULL DEFAULT 'individual',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayName" TEXT,
    "jobTitle" TEXT,
    "department" TEXT,
    "bio" TEXT,
    "aboutText" TEXT,
    "avatarUrl" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "website" TEXT,
    "address" TEXT,
    "businessHours" TEXT,
    "leadFormEnabled" BOOLEAN NOT NULL DEFAULT false,
    "theme" TEXT NOT NULL DEFAULT 'default',
    "template" TEXT NOT NULL DEFAULT 'minimal',
    "bgType" TEXT NOT NULL DEFAULT 'solid',
    "bgColor" TEXT NOT NULL DEFAULT '#f3f3f1',
    "bgGradient" TEXT,
    "bgImage" TEXT,
    "buttonStyle" TEXT NOT NULL DEFAULT 'rounded',
    "buttonSize" TEXT NOT NULL DEFAULT 'medium',
    "buttonColor" TEXT NOT NULL DEFAULT '#ffffff',
    "buttonTextColor" TEXT NOT NULL DEFAULT '#000000',
    "fontFamily" TEXT NOT NULL DEFAULT 'Inter',
    "textColor" TEXT NOT NULL DEFAULT '#000000',
    "plan" TEXT NOT NULL DEFAULT 'free',
    "planExpiresAt" DATETIME,
    "businessId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("aboutText", "accountType", "address", "avatarUrl", "bgColor", "bgGradient", "bgImage", "bgType", "bio", "businessHours", "businessId", "buttonColor", "buttonSize", "buttonStyle", "buttonTextColor", "createdAt", "department", "displayName", "email", "fontFamily", "id", "jobTitle", "leadFormEnabled", "password", "phone", "plan", "planExpiresAt", "template", "textColor", "theme", "updatedAt", "username", "website", "whatsapp") SELECT "aboutText", "accountType", "address", "avatarUrl", "bgColor", "bgGradient", "bgImage", "bgType", "bio", "businessHours", "businessId", "buttonColor", "buttonSize", "buttonStyle", "buttonTextColor", "createdAt", "department", "displayName", "email", "fontFamily", "id", "jobTitle", "leadFormEnabled", "password", "phone", "plan", "planExpiresAt", "template", "textColor", "theme", "updatedAt", "username", "website", "whatsapp" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
