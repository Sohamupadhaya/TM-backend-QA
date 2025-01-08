-- CreateEnum
CREATE TYPE "leaveStatus" AS ENUM ('PENDING', 'APPROVE', 'DECLINED');

-- CreateEnum
CREATE TYPE "AppType" AS ENUM ('PRODUCTIVE', 'UNPRODUCTIVE', 'NEUTRAL');

-- CreateTable
CREATE TABLE "companies" (
    "companyId" TEXT NOT NULL,
    "companyEmail" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "document" TEXT,
    "location" TEXT NOT NULL,
    "noOfDepartments" INTEGER,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("companyId")
);

-- CreateTable
CREATE TABLE "departments" (
    "departmentId" TEXT NOT NULL,
    "departmentName" TEXT NOT NULL,
    "noOfTeams" INTEGER,
    "departmentHead" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("departmentId")
);

-- CreateTable
CREATE TABLE "teams" (
    "teamId" TEXT NOT NULL,
    "teamName" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "noOfTeams" INTEGER,
    "teamHead" TEXT,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("teamId")
);

-- CreateTable
CREATE TABLE "employees" (
    "employeeId" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "employeeAddress" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("employeeId")
);

-- CreateTable
CREATE TABLE "screenshots" (
    "screenshotId" TEXT NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "imageLink" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "screenshots_pkey" PRIMARY KEY ("screenshotId")
);

-- CreateTable
CREATE TABLE "timelapsevideos" (
    "timeLapseVideoId" TEXT NOT NULL,
    "videoLink" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "timelapsevideos_pkey" PRIMARY KEY ("timeLapseVideoId")
);

-- CreateTable
CREATE TABLE "riskusers" (
    "riskUserId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "isSafe" BOOLEAN NOT NULL,

    CONSTRAINT "riskusers_pkey" PRIMARY KEY ("riskUserId")
);

-- CreateTable
CREATE TABLE "attendances" (
    "attendanceId" TEXT NOT NULL,
    "attendanceDate" TIMESTAMP(3) NOT NULL,
    "actualLoginTime" TIMESTAMP(3) NOT NULL,
    "actualLogoutTime" TIMESTAMP(3) NOT NULL,
    "employeeLoginTime" TIMESTAMP(3) NOT NULL,
    "employeeLogoutTime" TIMESTAMP(3) NOT NULL,
    "lateClockIn" TEXT NOT NULL,
    "OverTime" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("attendanceId")
);

-- CreateTable
CREATE TABLE "leaves" (
    "leaveId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "leaveType" TEXT NOT NULL,
    "leaveStatus" "leaveStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT NOT NULL,
    "noOfDays" TEXT NOT NULL,
    "leaveSession" TEXT NOT NULL,
    "leaveDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leaves_pkey" PRIMARY KEY ("leaveId")
);

-- CreateTable
CREATE TABLE "holidays" (
    "holidayId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "fromDate" TIMESTAMP(3) NOT NULL,
    "toDate" TIMESTAMP(3) NOT NULL,
    "holidayTitle" TEXT NOT NULL,
    "holidayType" TEXT NOT NULL,
    "holidaySesson" TEXT NOT NULL,

    CONSTRAINT "holidays_pkey" PRIMARY KEY ("holidayId")
);

-- CreateTable
CREATE TABLE "apps" (
    "appId" TEXT NOT NULL,
    "appName" TEXT NOT NULL,
    "appLogo" TEXT NOT NULL,
    "appUsedDuration" TEXT NOT NULL,
    "appType" "AppType" NOT NULL DEFAULT 'NEUTRAL',
    "departmentId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,

    CONSTRAINT "apps_pkey" PRIMARY KEY ("appId")
);

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("companyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("departmentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("companyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("departmentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("teamId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("companyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "screenshots" ADD CONSTRAINT "screenshots_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("employeeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "screenshots" ADD CONSTRAINT "screenshots_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("departmentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "screenshots" ADD CONSTRAINT "screenshots_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("teamId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "screenshots" ADD CONSTRAINT "screenshots_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("companyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timelapsevideos" ADD CONSTRAINT "timelapsevideos_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("employeeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timelapsevideos" ADD CONSTRAINT "timelapsevideos_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("departmentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timelapsevideos" ADD CONSTRAINT "timelapsevideos_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("teamId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timelapsevideos" ADD CONSTRAINT "timelapsevideos_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("companyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "riskusers" ADD CONSTRAINT "riskusers_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("employeeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "riskusers" ADD CONSTRAINT "riskusers_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("departmentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "riskusers" ADD CONSTRAINT "riskusers_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("companyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("employeeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("departmentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("companyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("teamId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaves" ADD CONSTRAINT "leaves_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("employeeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaves" ADD CONSTRAINT "leaves_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("departmentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaves" ADD CONSTRAINT "leaves_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("companyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaves" ADD CONSTRAINT "leaves_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("teamId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holidays" ADD CONSTRAINT "holidays_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("departmentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holidays" ADD CONSTRAINT "holidays_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("companyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "holidays" ADD CONSTRAINT "holidays_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("teamId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apps" ADD CONSTRAINT "apps_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("departmentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apps" ADD CONSTRAINT "apps_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("companyId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apps" ADD CONSTRAINT "apps_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("teamId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apps" ADD CONSTRAINT "apps_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("employeeId") ON DELETE RESTRICT ON UPDATE CASCADE;
