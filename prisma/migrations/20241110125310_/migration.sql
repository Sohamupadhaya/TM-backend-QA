-- AlterTable
ALTER TABLE "departments" ADD COLUMN     "departmentCode" TEXT;

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "employeeDepartmentCode" TEXT,
ADD COLUMN     "employeeTeamCode" TEXT;

-- AlterTable
ALTER TABLE "teams" ADD COLUMN     "teamCode" TEXT;
