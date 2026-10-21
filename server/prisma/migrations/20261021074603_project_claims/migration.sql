-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "claimedAt" TIMESTAMP(3),
ADD COLUMN     "claimedById" TEXT;

-- CreateIndex
CREATE INDEX "projects_claimedById_idx" ON "projects"("claimedById");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_claimedById_fkey" FOREIGN KEY ("claimedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
