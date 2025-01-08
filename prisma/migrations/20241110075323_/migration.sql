/*
Warnings:
- You are about to drop the column `body` on the `Message` table. All the data in the column will be lost.
- You are about to drop the column `conversationId` on the `Message` table. All the data in the column will be lost.
- You are about to drop the column `updatedAt` on the `Message` table. All the data in the column will be lost.
- You are about to drop the column `isApproved` on the `companies` table. All the data in the column will be lost.
- You are about to drop the column `location` on the `companies` table. All the data in the column will be lost.
- You are about to drop the column `position` on the `employees` table. All the data in the column will be lost.
- You are about to drop the `Conversation` table. If the table is not empty, all the data it contains will be lost.
- You are about to drop the `_ConversationToEmployee` table. If the table is not empty, all the data it contains will be lost.
- A unique constraint covering the columns `[employeeId]` on the table `riskusers` will be added. If there are existing duplicate values, this will fail.
- Added the required column `content` to the `Message` table without a default value. This is not possible if the table is not empty.
- Added the required column `receiverId` to the `Message` table without a default value. This is not possible if the table is not empty.
- Added the required column `roomId` to the `Message` table without a default value. This is not possible if the table is not empty.
*/
-- CreateEnum
CREATE TYPE "CurrentEmployeeStatus" AS ENUM ('WORKING', 'ONBREAK', 'INACTIVE');

-- CreateEnum
CREATE TYPE "SubscriptionStatusType" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('PAID', 'UNPAID');

-- CreateEnum
CREATE TYPE "PaymentStatusType" AS ENUM ('SUCCESS', 'FAILED', 'PENDING');

-- CreateEnum
CREATE TYPE "TaskStatusType" AS ENUM ('PENDING', 'COMPLETED', 'EXPIRED');

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_senderId_fkey";

-- DropForeignKey
ALTER TABLE "_ConversationToEmployee"
DROP CONSTRAINT "_ConversationToEmployee_A_fkey";

-- DropForeignKey
ALTER TABLE "_ConversationToEmployee"
DROP CONSTRAINT "_ConversationToEmployee_B_fkey";

-- DropForeignKey
ALTER TABLE "actualtimeofcompany"
DROP CONSTRAINT "actualtimeofcompany_companyId_fkey";

-- DropForeignKey
ALTER TABLE "apps" DROP CONSTRAINT "apps_companyId_fkey";

-- DropForeignKey
ALTER TABLE "apps" DROP CONSTRAINT "apps_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "apps" DROP CONSTRAINT "apps_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "apps" DROP CONSTRAINT "apps_teamId_fkey";

-- DropForeignKey
ALTER TABLE "attendances"
DROP CONSTRAINT "attendances_companyId_fkey";

-- DropForeignKey
ALTER TABLE "attendances"
DROP CONSTRAINT "attendances_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "attendances"
DROP CONSTRAINT "attendances_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "attendances" DROP CONSTRAINT "attendances_teamId_fkey";

-- DropForeignKey
ALTER TABLE "departments"
DROP CONSTRAINT "departments_companyId_fkey";

-- DropForeignKey
ALTER TABLE "employees" DROP CONSTRAINT "employees_companyId_fkey";

-- DropForeignKey
ALTER TABLE "employees"
DROP CONSTRAINT "employees_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "employees" DROP CONSTRAINT "employees_teamId_fkey";

-- DropForeignKey
ALTER TABLE "holidays" DROP CONSTRAINT "holidays_companyId_fkey";

-- DropForeignKey
ALTER TABLE "holidays" DROP CONSTRAINT "holidays_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "holidays" DROP CONSTRAINT "holidays_teamId_fkey";

-- DropForeignKey
ALTER TABLE "leaves" DROP CONSTRAINT "leaves_companyId_fkey";

-- DropForeignKey
ALTER TABLE "leaves" DROP CONSTRAINT "leaves_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "leaves" DROP CONSTRAINT "leaves_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "leaves" DROP CONSTRAINT "leaves_teamId_fkey";

-- DropForeignKey
ALTER TABLE "notifications"
DROP CONSTRAINT "notifications_receiverCompanyId_fkey";

-- DropForeignKey
ALTER TABLE "notifications"
DROP CONSTRAINT "notifications_receiverEmployeeId_fkey";

-- DropForeignKey
ALTER TABLE "notifications"
DROP CONSTRAINT "notifications_senderCompanyId_fkey";

-- DropForeignKey
ALTER TABLE "notifications"
DROP CONSTRAINT "notifications_senderEmployeeId_fkey";

-- DropForeignKey
ALTER TABLE "riskusers" DROP CONSTRAINT "riskusers_companyId_fkey";

-- DropForeignKey
ALTER TABLE "riskusers"
DROP CONSTRAINT "riskusers_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "riskusers" DROP CONSTRAINT "riskusers_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "screenshots"
DROP CONSTRAINT "screenshots_companyId_fkey";

-- DropForeignKey
ALTER TABLE "screenshots"
DROP CONSTRAINT "screenshots_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "screenshots"
DROP CONSTRAINT "screenshots_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "screenshots" DROP CONSTRAINT "screenshots_teamId_fkey";

-- DropForeignKey
ALTER TABLE "teams" DROP CONSTRAINT "teams_companyId_fkey";

-- DropForeignKey
ALTER TABLE "teams" DROP CONSTRAINT "teams_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "timelapsevideos"
DROP CONSTRAINT "timelapsevideos_companyId_fkey";

-- DropForeignKey
ALTER TABLE "timelapsevideos"
DROP CONSTRAINT "timelapsevideos_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "timelapsevideos"
DROP CONSTRAINT "timelapsevideos_employeeId_fkey";

-- DropForeignKey
ALTER TABLE "timelapsevideos"
DROP CONSTRAINT "timelapsevideos_teamId_fkey";

-- AlterTable
ALTER TABLE "Message"
DROP COLUMN "body",
DROP COLUMN "conversationId",
DROP COLUMN "updatedAt",
ADD COLUMN "content" TEXT NOT NULL,
ADD COLUMN "read" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "receiverId" TEXT NOT NULL,
ADD COLUMN "roomId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "actualtimeofcompany"
ADD COLUMN "teamId" TEXT,
ADD COLUMN "timeZone" TEXT NOT NULL DEFAULT 'UTC';

-- AlterTable
ALTER TABLE "apps"
ADD COLUMN "day" TEXT,
ALTER COLUMN "appLogo"
DROP NOT NULL,
ALTER COLUMN "appType"
DROP DEFAULT;

-- AlterTable
ALTER TABLE "attendances"
ADD COLUMN "notificationSent" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "departmentId"
DROP NOT NULL,
ALTER COLUMN "teamId"
DROP NOT NULL;

-- AlterTable
ALTER TABLE "companies"
DROP COLUMN "isApproved",
DROP COLUMN "location",
ADD COLUMN "city" TEXT,
ADD COLUMN "companyPhoto" TEXT,
ADD COLUMN "companyWebsite" TEXT,
ADD COLUMN "country" TEXT,
ADD COLUMN "dailyScreenshotCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "lastScreenshotReset" TIMESTAMP(3),
ADD COLUMN "postalCodeNo" TEXT,
ADD COLUMN "state" TEXT,
ADD COLUMN "totalScreenShots" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "companyPhoneNumber"
DROP NOT NULL;

-- AlterTable
ALTER TABLE "employees"
DROP COLUMN "position",
ADD COLUMN "currentEmployeeStatus" "CurrentEmployeeStatus" NOT NULL DEFAULT 'INACTIVE',
ADD COLUMN "isProductiveEmployee" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "profilePicture" TEXT;

-- AlterTable
ALTER TABLE "holidays"
ADD COLUMN "fromTime" TEXT,
ADD COLUMN "halfSelection" TEXT,
ADD COLUMN "toTime" TEXT;

-- AlterTable
ALTER TABLE "leaves"
ADD COLUMN "actionReason" TEXT,
ADD COLUMN "fromTime" TEXT,
ADD COLUMN "halfDayType" TEXT,
ADD COLUMN "toTime" TEXT,
ALTER COLUMN "leaveFrom"
DROP NOT NULL,
ALTER COLUMN "leaveTo"
DROP NOT NULL;

-- AlterTable
ALTER TABLE "notifications"
ADD COLUMN "senderName" TEXT,
ADD COLUMN "taskId" TEXT;

-- AlterTable
ALTER TABLE "screenshots"
ALTER COLUMN "departmentId"
DROP NOT NULL,
ALTER COLUMN "teamId"
DROP NOT NULL;

-- AlterTable
ALTER TABLE "timelapsevideos"
ALTER COLUMN "departmentId"
DROP NOT NULL,
ALTER COLUMN "teamId"
DROP NOT NULL;

-- DropTable
DROP TABLE "Conversation";

-- DropTable
DROP TABLE "_ConversationToEmployee";

-- CreateTable
CREATE TABLE "Keyword" (
    "KeywordId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    CONSTRAINT "Keyword_pkey" PRIMARY KEY ("KeywordId")
);

-- CreateTable
CREATE TABLE "KeywordFoundEmployee" (
    "employeeKeywordId" TEXT NOT NULL,
    "keywords" JSONB NOT NULL,
    "count" INTEGER NOT NULL,
    "employeeId" TEXT NOT NULL,
    CONSTRAINT "KeywordFoundEmployee_pkey" PRIMARY KEY ("employeeKeywordId")
);

-- CreateTable
CREATE TABLE "attendance_metadata" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "actualDate" TEXT NOT NULL,
    "originalTimezone" TEXT NOT NULL,
    "loginTime" TEXT NOT NULL,
    "logoutTime" TEXT,
    CONSTRAINT "attendance_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appreviews" (
    "appName" TEXT NOT NULL,
    "appLogo" TEXT,
    "appReview" "AppType" NOT NULL DEFAULT 'NEUTRAL',
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "appreviews_pkey" PRIMARY KEY ("appName", "companyId")
);

-- CreateTable
CREATE TABLE "MessageMedia" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "companyAndEmployeeMessageId" TEXT,
    "messageId" TEXT,
    CONSTRAINT "MessageMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeTemp" (
    "employeeId" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "employeeAddress" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EmployeeTemp_pkey" PRIMARY KEY ("employeeId")
);

-- CreateTable
CREATE TABLE "CompanyAndEmployeeMessage" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "employeeSenderId" TEXT,
    "employeeReceiverId" TEXT,
    "companySenderId" TEXT,
    "companyReceiverId" TEXT,
    "roomId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CompanyAndEmployeeMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyAndEmployeeRoom" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    CONSTRAINT "CompanyAndEmployeeRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomParticipant" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "employeeId" TEXT,
    "companyId" TEXT,
    CONSTRAINT "RoomParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPlans" (
    "id" TEXT NOT NULL,
    "subscriptionName" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "billingCycle" TEXT NOT NULL,
    "feature" JSONB NOT NULL,
    CONSTRAINT "SubscriptionPlans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSubscription" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "subscriptionPlansId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "SubscriptionStatusType" NOT NULL,
    "autoRenew" BOOLEAN NOT NULL,
    CONSTRAINT "UserSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payments" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userSubscriptionId" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "status" "PaymentStatusType" NOT NULL,
    CONSTRAINT "Payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userSubscriptionId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "InvoiceStatus" NOT NULL,
    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FreeTrail" (
    "freeTrailId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isExpired" BOOLEAN NOT NULL,
    CONSTRAINT "FreeTrail_pkey" PRIMARY KEY ("freeTrailId")
);

-- CreateTable
CREATE TABLE "tasks" (
    "task_id" TEXT NOT NULL,
    "task_name" TEXT NOT NULL,
    "deadline" TIMESTAMPTZ (3) NOT NULL,
    "statusType" "TaskStatusType" NOT NULL DEFAULT 'PENDING',
    "taskReceiver" TEXT NOT NULL,
    "taskAssigner" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tasks_pkey" PRIMARY KEY ("task_id")
);

-- CreateTable
CREATE TABLE "roles" (
    "roleId" TEXT NOT NULL,
    "roleName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "roles_pkey" PRIMARY KEY ("roleId")
);

-- CreateTable
CREATE TABLE "rolePermission" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    CONSTRAINT "rolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "userRoles" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "userRoles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyProductivityratio" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "dailyRatio" DOUBLE PRECISION NOT NULL,
    "weeklyRatio" DOUBLE PRECISION NOT NULL,
    "workingDays" INTEGER NOT NULL,
    "pointsPerMinuteLateClockin" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "pointsPerMinuteAppUsed" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "pointsPerIncompleteTask" DOUBLE PRECISION NOT NULL DEFAULT 1,
    CONSTRAINT "CompanyProductivityratio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Productivity" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "dailyProductiveRatio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "weeklyProductiveRatio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "dateFrom" TIMESTAMP(3) NOT NULL,
    "dateTo" TIMESTAMP(3) NOT NULL,
    "isProductive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Productivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdleTimeOfEmployee" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "idleTimeDuration" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "IdleTimeOfEmployee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_RoomParticipants" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "KeywordFoundEmployee_employeeId_key" ON "KeywordFoundEmployee" ("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_metadata_employeeId_actualDate_key" ON "attendance_metadata" ("employeeId", "actualDate");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeTemp_email_key" ON "EmployeeTemp" ("email");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeTemp_phoneNumber_key" ON "EmployeeTemp" ("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "RoomParticipant_roomId_employeeId_companyId_key" ON "RoomParticipant" (
    "roomId",
    "employeeId",
    "companyId"
);

-- CreateIndex
CREATE UNIQUE INDEX "FreeTrail_companyId_key" ON "FreeTrail" ("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "_RoomParticipants_AB_unique" ON "_RoomParticipants" ("A", "B");

-- CreateIndex
CREATE INDEX "_RoomParticipants_B_index" ON "_RoomParticipants" ("B");

-- CreateIndex
CREATE UNIQUE INDEX "riskusers_employeeId_key" ON "riskusers" ("employeeId");

-- AddForeignKey
ALTER TABLE "departments"
ADD CONSTRAINT "departments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams"
ADD CONSTRAINT "teams_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("departmentId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams"
ADD CONSTRAINT "teams_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees"
ADD CONSTRAINT "employees_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("departmentId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees"
ADD CONSTRAINT "employees_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams" ("teamId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees"
ADD CONSTRAINT "employees_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "screenshots"
ADD CONSTRAINT "screenshots_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("employeeId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "screenshots"
ADD CONSTRAINT "screenshots_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("departmentId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "screenshots"
ADD CONSTRAINT "screenshots_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams" ("teamId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "screenshots"
ADD CONSTRAINT "screenshots_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timelapsevideos"
ADD CONSTRAINT "timelapsevideos_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("employeeId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timelapsevideos"
ADD CONSTRAINT "timelapsevideos_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("departmentId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timelapsevideos"
ADD CONSTRAINT "timelapsevideos_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams" ("teamId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timelapsevideos"
ADD CONSTRAINT "timelapsevideos_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Keyword"
ADD CONSTRAINT "Keyword_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("companyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KeywordFoundEmployee"
ADD CONSTRAINT "KeywordFoundEmployee_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("employeeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "riskusers"
ADD CONSTRAINT "riskusers_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("employeeId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "riskusers"
ADD CONSTRAINT "riskusers_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("departmentId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "riskusers"
ADD CONSTRAINT "riskusers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actualtimeofcompany"
ADD CONSTRAINT "actualtimeofcompany_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "actualtimeofcompany"
ADD CONSTRAINT "actualtimeofcompany_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams" ("teamId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances"
ADD CONSTRAINT "attendances_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("employeeId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances"
ADD CONSTRAINT "attendances_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("departmentId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances"
ADD CONSTRAINT "attendances_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances"
ADD CONSTRAINT "attendances_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams" ("teamId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance_metadata"
ADD CONSTRAINT "attendance_metadata_employeeId_actualDate_fkey" FOREIGN KEY ("employeeId", "actualDate") REFERENCES "attendances" ("employeeId", "actualDate") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaves"
ADD CONSTRAINT "leaves_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("employeeId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaves"
ADD CONSTRAINT "leaves_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("departmentId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaves"
ADD CONSTRAINT "leaves_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaves"
ADD CONSTRAINT "leaves_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams" ("teamId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holidays"
ADD CONSTRAINT "holidays_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("departmentId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holidays"
ADD CONSTRAINT "holidays_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holidays"
ADD CONSTRAINT "holidays_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams" ("teamId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apps"
ADD CONSTRAINT "apps_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments" ("departmentId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apps"
ADD CONSTRAINT "apps_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apps"
ADD CONSTRAINT "apps_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams" ("teamId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apps"
ADD CONSTRAINT "apps_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("employeeId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appreviews"
ADD CONSTRAINT "appreviews_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications"
ADD CONSTRAINT "notifications_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks" ("task_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications"
ADD CONSTRAINT "notifications_senderEmployeeId_fkey" FOREIGN KEY ("senderEmployeeId") REFERENCES "employees" ("employeeId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications"
ADD CONSTRAINT "notifications_receiverEmployeeId_fkey" FOREIGN KEY ("receiverEmployeeId") REFERENCES "employees" ("employeeId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications"
ADD CONSTRAINT "notifications_senderCompanyId_fkey" FOREIGN KEY ("senderCompanyId") REFERENCES "companies" ("companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications"
ADD CONSTRAINT "notifications_receiverCompanyId_fkey" FOREIGN KEY ("receiverCompanyId") REFERENCES "companies" ("companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageMedia"
ADD CONSTRAINT "MessageMedia_companyAndEmployeeMessageId_fkey" FOREIGN KEY ("companyAndEmployeeMessageId") REFERENCES "CompanyAndEmployeeMessage" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MessageMedia"
ADD CONSTRAINT "MessageMedia_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message"
ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "employees" ("employeeId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message"
ADD CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "employees" ("employeeId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message"
ADD CONSTRAINT "Message_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyAndEmployeeMessage"
ADD CONSTRAINT "CompanyAndEmployeeMessage_employeeSenderId_fkey" FOREIGN KEY ("employeeSenderId") REFERENCES "employees" ("employeeId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyAndEmployeeMessage"
ADD CONSTRAINT "CompanyAndEmployeeMessage_employeeReceiverId_fkey" FOREIGN KEY ("employeeReceiverId") REFERENCES "employees" ("employeeId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyAndEmployeeMessage"
ADD CONSTRAINT "CompanyAndEmployeeMessage_companySenderId_fkey" FOREIGN KEY ("companySenderId") REFERENCES "companies" ("companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyAndEmployeeMessage"
ADD CONSTRAINT "CompanyAndEmployeeMessage_companyReceiverId_fkey" FOREIGN KEY ("companyReceiverId") REFERENCES "companies" ("companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyAndEmployeeMessage"
ADD CONSTRAINT "CompanyAndEmployeeMessage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "CompanyAndEmployeeRoom" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomParticipant"
ADD CONSTRAINT "RoomParticipant_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "CompanyAndEmployeeRoom" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomParticipant"
ADD CONSTRAINT "RoomParticipant_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("employeeId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomParticipant"
ADD CONSTRAINT "RoomParticipant_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubscription"
ADD CONSTRAINT "UserSubscription_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSubscription"
ADD CONSTRAINT "UserSubscription_subscriptionPlansId_fkey" FOREIGN KEY ("subscriptionPlansId") REFERENCES "SubscriptionPlans" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payments"
ADD CONSTRAINT "Payments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payments"
ADD CONSTRAINT "Payments_userSubscriptionId_fkey" FOREIGN KEY ("userSubscriptionId") REFERENCES "UserSubscription" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice"
ADD CONSTRAINT "Invoice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice"
ADD CONSTRAINT "Invoice_userSubscriptionId_fkey" FOREIGN KEY ("userSubscriptionId") REFERENCES "UserSubscription" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FreeTrail"
ADD CONSTRAINT "FreeTrail_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks"
ADD CONSTRAINT "tasks_taskReceiver_fkey" FOREIGN KEY ("taskReceiver") REFERENCES "employees" ("employeeId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks"
ADD CONSTRAINT "tasks_taskAssigner_fkey" FOREIGN KEY ("taskAssigner") REFERENCES "companies" ("companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles"
ADD CONSTRAINT "roles_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rolePermission"
ADD CONSTRAINT "rolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles" ("roleId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rolePermission"
ADD CONSTRAINT "rolePermission_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "userRoles"
ADD CONSTRAINT "userRoles_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("employeeId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "userRoles"
ADD CONSTRAINT "userRoles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles" ("roleId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyProductivityratio"
ADD CONSTRAINT "CompanyProductivityratio_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Productivity"
ADD CONSTRAINT "Productivity_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Productivity"
ADD CONSTRAINT "Productivity_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("employeeId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdleTimeOfEmployee"
ADD CONSTRAINT "IdleTimeOfEmployee_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("companyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdleTimeOfEmployee"
ADD CONSTRAINT "IdleTimeOfEmployee_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees" ("employeeId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoomParticipants"
ADD CONSTRAINT "_RoomParticipants_A_fkey" FOREIGN KEY ("A") REFERENCES "employees" ("employeeId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoomParticipants"
ADD CONSTRAINT "_RoomParticipants_B_fkey" FOREIGN KEY ("B") REFERENCES "Room" ("id") ON DELETE CASCADE ON UPDATE CASCADE;