/*
  Warnings:

  - Added the required column `endTime` to the `IdleTimeOfEmployee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startTime` to the `IdleTimeOfEmployee` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reason` to the `deleted_employees` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "CurrentEmployeeStatus" ADD VALUE 'IDLE';

-- AlterTable
ALTER TABLE "IdleTimeOfEmployee" ADD COLUMN     "endTime" TEXT NOT NULL,
ADD COLUMN     "startTime" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "workingDays" TEXT[];

-- AlterTable
ALTER TABLE "deleted_employees" ADD COLUMN     "reason" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "screenshots" ADD COLUMN     "workingStatus" "CurrentEmployeeStatus" NOT NULL DEFAULT 'WORKING',
ALTER COLUMN "time" SET DATA TYPE TEXT;
