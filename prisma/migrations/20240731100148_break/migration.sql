/*
  Warnings:

  - The primary key for the `attendances` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `OverTime` on the `attendances` table. All the data in the column will be lost.
  - You are about to drop the column `actualLoginTime` on the `attendances` table. All the data in the column will be lost.
  - You are about to drop the column `actualLogoutTime` on the `attendances` table. All the data in the column will be lost.
  - You are about to drop the column `attendanceDate` on the `attendances` table. All the data in the column will be lost.
  - You are about to drop the column `attendanceId` on the `attendances` table. All the data in the column will be lost.
  - You are about to drop the column `holidaySesson` on the `holidays` table. All the data in the column will be lost.
  - The `holidayType` column on the `holidays` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `leaveDate` on the `leaves` table. All the data in the column will be lost.
  - The `leaveType` column on the `leaves` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `noOfTeams` on the `teams` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[companyEmail]` on the table `companies` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[companyPhoneNumber]` on the table `companies` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `employees` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phoneNumber]` on the table `employees` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `apps` table without a default value. This is not possible if the table is not empty.
  - Added the required column `actualDate` to the `attendances` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `attendances` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyPhoneNumber` to the `companies` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `companies` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `companies` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `departments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `employees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isActive` to the `employees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `employees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phoneNumber` to the `employees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `employees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `holidaySession` to the `holidays` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `holidays` table without a default value. This is not possible if the table is not empty.
  - Added the required column `leaveFrom` to the `leaves` table without a default value. This is not possible if the table is not empty.
  - Added the required column `leaveTo` to the `leaves` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `leaves` table without a default value. This is not possible if the table is not empty.
  - Added the required column `employeeName` to the `riskusers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `riskusers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `screenshots` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `teams` table without a default value. This is not possible if the table is not empty.
  - Added the required column `time` to the `timelapsevideos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `timelapsevideos` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "leaveType" AS ENUM ('CASUALLEAVE', 'SICKLEAVE');

-- CreateEnum
CREATE TYPE "HolidayType" AS ENUM ('PUBLIC', 'PRIVATE', 'OFFICIAL');

-- DropForeignKey
ALTER TABLE "apps" DROP CONSTRAINT "apps_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "apps" DROP CONSTRAINT "apps_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "apps" DROP CONSTRAINT "apps_teamId_fkey";

-- DropForeignKey
ALTER TABLE "employees" DROP CONSTRAINT "employees_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "employees" DROP CONSTRAINT "employees_teamId_fkey";

-- DropForeignKey
ALTER TABLE "holidays" DROP CONSTRAINT "holidays_companyId_fkey";

-- DropForeignKey
ALTER TABLE "holidays" DROP CONSTRAINT "holidays_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "holidays" DROP CONSTRAINT "holidays_teamId_fkey";

-- DropForeignKey
ALTER TABLE "leaves" DROP CONSTRAINT "leaves_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "leaves" DROP CONSTRAINT "leaves_teamId_fkey";

-- DropForeignKey
ALTER TABLE "riskusers" DROP CONSTRAINT "riskusers_departmentId_fkey";

-- AlterTable
ALTER TABLE "apps" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "appUsedDuration" DROP NOT NULL,
ALTER COLUMN "departmentId" DROP NOT NULL,
ALTER COLUMN "teamId" DROP NOT NULL,
ALTER COLUMN "employeeId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "attendances" DROP CONSTRAINT "attendances_pkey",
DROP COLUMN "OverTime",
DROP COLUMN "actualLoginTime",
DROP COLUMN "actualLogoutTime",
DROP COLUMN "attendanceDate",
DROP COLUMN "attendanceId",
ADD COLUMN     "actualDate" TEXT NOT NULL,
ADD COLUMN     "breakIn" TEXT,
ADD COLUMN     "breakInMinutes" TEXT,
ADD COLUMN     "breakOut" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "earlyClockOut" TEXT,
ADD COLUMN     "overTime" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "employeeLogoutTime" DROP NOT NULL,
ALTER COLUMN "lateClockIn" DROP NOT NULL,
ADD CONSTRAINT "attendances_pkey" PRIMARY KEY ("employeeId", "actualDate");

-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "companyPhoneNumber" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isApproved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "noOfEmployees" INTEGER DEFAULT 0,
ADD COLUMN     "noOfTeams" INTEGER DEFAULT 0,
ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "resetToken" TEXT,
ADD COLUMN     "resetTokenExperiation" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "noOfDepartments" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "departments" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "noOfTeams" SET DEFAULT 0,
ALTER COLUMN "departmentHead" DROP NOT NULL;

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "conversationsIds" TEXT[],
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL,
ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "phoneNumber" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "departmentId" DROP NOT NULL,
ALTER COLUMN "teamId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "holidays" DROP COLUMN "holidaySesson",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "holidaySession" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "departmentId" DROP NOT NULL,
ALTER COLUMN "teamId" DROP NOT NULL,
ALTER COLUMN "companyId" DROP NOT NULL,
DROP COLUMN "holidayType",
ADD COLUMN     "holidayType" "HolidayType" NOT NULL DEFAULT 'PUBLIC';

-- AlterTable
ALTER TABLE "leaves" DROP COLUMN "leaveDate",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "leaveFrom" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "leaveTo" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "departmentId" DROP NOT NULL,
ALTER COLUMN "teamId" DROP NOT NULL,
DROP COLUMN "leaveType",
ADD COLUMN     "leaveType" "leaveType" NOT NULL DEFAULT 'CASUALLEAVE';

-- AlterTable
ALTER TABLE "riskusers" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "employeeName" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "departmentId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "screenshots" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "teams" DROP COLUMN "noOfTeams",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "noOfEmployee" INTEGER DEFAULT 0,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "timelapsevideos" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "time" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "SuperAdmin" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SuperAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companyotps" (
    "companyOtpId" TEXT NOT NULL,
    "companyEmail" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companyotps_pkey" PRIMARY KEY ("companyOtpId")
);

-- CreateTable
CREATE TABLE "forgetpwotps" (
    "forgetPwId" TEXT NOT NULL,
    "companyEmail" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forgetpwotps_pkey" PRIMARY KEY ("forgetPwId")
);

-- CreateTable
CREATE TABLE "deleted_employees" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deleted_employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actualtimeofcompany" (
    "actualTimeId" TEXT NOT NULL,
    "actualLoginTime" TEXT NOT NULL,
    "actualLogoutTime" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "actualtimeofcompany_pkey" PRIMARY KEY ("actualTimeId")
);

-- CreateTable
CREATE TABLE "notifications" (
    "notificationId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "senderEmployeeId" TEXT,
    "senderCompanyId" TEXT,
    "receiverCompanyId" TEXT,
    "receiverEmployeeId" TEXT,
    "links" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("notificationId")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "participantIds" TEXT[],
    "messageIds" TEXT[],

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ConversationToEmployee" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_ConversationToEmployee_AB_unique" ON "_ConversationToEmployee"("A", "B");

-- CreateIndex
CREATE INDEX "_ConversationToEmployee_B_index" ON "_ConversationToEmployee"("B");

-- CreateIndex
CREATE UNIQUE INDEX "companies_companyEmail_key" ON "companies"("companyEmail");

-- CreateIndex
CREATE UNIQUE INDEX "companies_companyPhoneNumber_key" ON "companies"("companyPhoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");

-- CreateIndex
CREATE UNIQUE INDEX "employees_phoneNumber_key" ON "employees"("phoneNumber");

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("departmentId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("teamId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "riskusers" ADD CONSTRAINT "riskusers_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("departmentId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actualtimeofcompany" ADD CONSTRAINT "actualtimeofcompany_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("companyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaves" ADD CONSTRAINT "leaves_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("departmentId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaves" ADD CONSTRAINT "leaves_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("teamId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holidays" ADD CONSTRAINT "holidays_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("departmentId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holidays" ADD CONSTRAINT "holidays_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("companyId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holidays" ADD CONSTRAINT "holidays_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("teamId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apps" ADD CONSTRAINT "apps_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("departmentId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apps" ADD CONSTRAINT "apps_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("teamId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apps" ADD CONSTRAINT "apps_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("employeeId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_senderEmployeeId_fkey" FOREIGN KEY ("senderEmployeeId") REFERENCES "employees"("employeeId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_receiverEmployeeId_fkey" FOREIGN KEY ("receiverEmployeeId") REFERENCES "employees"("employeeId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_senderCompanyId_fkey" FOREIGN KEY ("senderCompanyId") REFERENCES "companies"("companyId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_receiverCompanyId_fkey" FOREIGN KEY ("receiverCompanyId") REFERENCES "companies"("companyId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "employees"("employeeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ConversationToEmployee" ADD CONSTRAINT "_ConversationToEmployee_A_fkey" FOREIGN KEY ("A") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ConversationToEmployee" ADD CONSTRAINT "_ConversationToEmployee_B_fkey" FOREIGN KEY ("B") REFERENCES "employees"("employeeId") ON DELETE CASCADE ON UPDATE CASCADE;
