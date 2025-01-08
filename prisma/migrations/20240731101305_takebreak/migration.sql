/*
  Warnings:

  - The `breakIn` column on the `attendances` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `breakOut` column on the `attendances` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "attendances" DROP COLUMN "breakIn",
ADD COLUMN     "breakIn" TIMESTAMP(3),
DROP COLUMN "breakOut",
ADD COLUMN     "breakOut" TIMESTAMP(3);
