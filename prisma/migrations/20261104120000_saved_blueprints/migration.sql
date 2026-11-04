-- CreateTable
CREATE TABLE "SavedBlueprint" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "moduleKey" TEXT NOT NULL,
    "enabledSections" JSONB NOT NULL DEFAULT '[]',
    "theme" JSONB NOT NULL DEFAULT '{}',
    "content" JSONB NOT NULL DEFAULT '{}',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedBlueprint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavedBlueprint_moduleKey_idx" ON "SavedBlueprint"("moduleKey");

-- AddForeignKey
ALTER TABLE "SavedBlueprint" ADD CONSTRAINT "SavedBlueprint_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

