/*
  Warnings:

  - Added the required column `employeeCode` to the `employees` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "companyCode" TEXT;

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "employeeCode" TEXT NOT NULL;
