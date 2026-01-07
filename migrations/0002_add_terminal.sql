-- CreateTable
CREATE TABLE
    "Terminal" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "code" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "city" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
    );

-- CreateIndex
CREATE UNIQUE INDEX "Terminal_code_key" ON "Terminal" ("code");