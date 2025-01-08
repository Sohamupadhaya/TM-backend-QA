import { sendNotificationFromCompanyToEmployee, sendNotificationToAdminAboutLateEmployee, sendNotificationToAdminAboutRiskUser } from "../controllers/notification.controller.js";

export async function handleLateEmployeeNotifications(
  tx: any,
  employee: any,
  lateCount: number
): Promise<void> {
  if (lateCount === 3) {
    const employeeMessage = `You have clocked in late 3 times. Please ensure to clock in on time.`;
    const adminMessage = `Employee ${employee.employeeName} (ID: ${employee.employeeId}) has clocked in late ${lateCount} times.`;

    await Promise.all([
      sendNotificationFromCompanyToEmployee(employee.companyId, employee.employeeId, employeeMessage),
      sendNotificationToAdminAboutLateEmployee(employee.companyId, employee.email, lateCount),
      tx.attendance.updateMany({
        where: {
          employeeId: employee.employeeId,
          companyId: employee.companyId,
          lateClockIn: { not: null },
          notificationSent: false
        },
        data: { notificationSent: true }
      })
    ]);
  }

  if (lateCount === 7) {
    const existingRiskUser = await tx.riskUser.findFirst({
      where: { employeeId: employee.employeeId }
    });

    if (!existingRiskUser) {
      await Promise.all([
        tx.riskUser.create({
          data: {
            employeeId: employee.employeeId,
            employeeName: employee.employeeName,
            departmentId: employee.departmentId,
            companyId: employee.companyId,
            isSafe: false,
          }
        }),
        sendNotificationFromCompanyToEmployee(
          employee.companyId,
          employee.employeeId,
          'You have been classified as a risk user due to frequent late clock-ins.'
        ),
        sendNotificationToAdminAboutRiskUser(
          employee.companyId,
          employee.employeeName,
          employee.employeeId
        )
      ]);
    }
  }
}

