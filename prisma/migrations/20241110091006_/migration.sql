/*
  Warnings:

  - You are about to drop the column `companyCode` on the `companies` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "companies" DROP COLUMN "companyCode",
ADD COLUMN     "companyCodes" TEXT;
