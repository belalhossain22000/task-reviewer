-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'MENTOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "repoUrl" TEXT NOT NULL,
    "repoKey" TEXT NOT NULL,
    "liveUrl" TEXT NOT NULL,
    "liveKey" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "studentId" TEXT NOT NULL,
    "reviewerId" TEXT,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "projects_repoKey_key" ON "projects"("repoKey");

-- CreateIndex
CREATE UNIQUE INDEX "projects_liveKey_key" ON "projects"("liveKey");

-- CreateIndex
CREATE INDEX "projects_status_createdAt_idx" ON "projects"("status", "createdAt");

-- CreateIndex
CREATE INDEX "projects_studentId_createdAt_idx" ON "projects"("studentId", "createdAt");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
