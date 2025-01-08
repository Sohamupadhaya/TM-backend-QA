/*
  Warnings:

  - You are about to drop the column `companyCodes` on the `companies` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "companies" DROP COLUMN "companyCodes",
ADD COLUMN     "companyCode" TEXT;
