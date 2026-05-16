-- CreateTable
CREATE TABLE "RecurringExpense" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "category" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "RecurringExpense_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BudgetMonth" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "net_income" REAL NOT NULL DEFAULT 0,
    "rent" REAL NOT NULL DEFAULT 0,
    "savings_goal" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "BudgetMonth_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_BudgetMonth" ("id", "month", "net_income", "rent", "user_id", "year") SELECT "id", "month", "net_income", "rent", "user_id", "year" FROM "BudgetMonth";
DROP TABLE "BudgetMonth";
ALTER TABLE "new_BudgetMonth" RENAME TO "BudgetMonth";
CREATE UNIQUE INDEX "BudgetMonth_user_id_year_month_key" ON "BudgetMonth"("user_id", "year", "month");
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT,
    "phone" TEXT,
    "password_hash" TEXT NOT NULL,
    "name" TEXT,
    "avatar_url" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "default_net_income" REAL NOT NULL DEFAULT 0,
    "default_rent" REAL NOT NULL DEFAULT 0,
    "default_savings_goal" REAL NOT NULL DEFAULT 0
);
INSERT INTO "new_User" ("avatar_url", "created_at", "email", "id", "name", "password_hash", "phone") SELECT "avatar_url", "created_at", "email", "id", "name", "password_hash", "phone" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_phone_idx" ON "User"("phone");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "RecurringExpense_user_id_idx" ON "RecurringExpense"("user_id");
