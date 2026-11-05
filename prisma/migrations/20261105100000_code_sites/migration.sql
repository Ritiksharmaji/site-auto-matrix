-- CreateEnum
CREATE TYPE "CodeFramework" AS ENUM ('HTML', 'REACT', 'NEXTJS');

-- CreateEnum
CREATE TYPE "DeployStatus" AS ENUM ('BUILDING', 'LIVE', 'FAILED', 'REPLACED');

-- CreateTable
CREATE TABLE "CodeProject" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "framework" "CodeFramework" NOT NULL,
    "repoOwner" TEXT NOT NULL,
    "repoName" TEXT NOT NULL,
    "branch" TEXT NOT NULL DEFAULT 'main',
    "webhookId" INTEGER,
    "liveDeployId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CodeProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deploy" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "runUrl" TEXT NOT NULL,
    "commitSha" TEXT NOT NULL,
    "commitMessage" TEXT NOT NULL DEFAULT '',
    "author" TEXT NOT NULL DEFAULT '',
    "status" "DeployStatus" NOT NULL DEFAULT 'BUILDING',
    "error" TEXT,
    "fileCount" INTEGER,
    "sizeBytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "Deploy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CodeProject_siteId_key" ON "CodeProject"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "CodeProject_repoOwner_repoName_key" ON "CodeProject"("repoOwner", "repoName");

-- CreateIndex
CREATE UNIQUE INDEX "Deploy_runId_key" ON "Deploy"("runId");

-- CreateIndex
CREATE INDEX "Deploy_projectId_createdAt_idx" ON "Deploy"("projectId", "createdAt");

-- AddForeignKey
ALTER TABLE "CodeProject" ADD CONSTRAINT "CodeProject_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deploy" ADD CONSTRAINT "Deploy_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "CodeProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

