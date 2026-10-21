-- CreateTable
CREATE TABLE "project_reviews" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "status" "ProjectStatus" NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_reviews_projectId_createdAt_idx" ON "project_reviews"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "project_reviews_reviewerId_createdAt_idx" ON "project_reviews"("reviewerId", "createdAt");

-- AddForeignKey
ALTER TABLE "project_reviews" ADD CONSTRAINT "project_reviews_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_reviews" ADD CONSTRAINT "project_reviews_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill. Until now only the latest decision was kept, on the project row itself. Turn each
-- decision that already exists into the first history entry, so nothing recorded so far is lost.
INSERT INTO "project_reviews" ("id", "projectId", "reviewerId", "status", "note", "createdAt")
SELECT gen_random_uuid()::text, "id", "reviewerId", "status", "reviewNote", "reviewedAt"
FROM "projects"
WHERE "reviewerId" IS NOT NULL AND "reviewedAt" IS NOT NULL AND "status" <> 'PENDING';
