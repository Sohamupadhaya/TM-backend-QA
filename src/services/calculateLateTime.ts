import moment from 'moment-timezone';

interface LateTime {
  lateHours: number;
  lateMinutes: number;
  lateSeconds: number;
}

export const calculateLateTime = (
  actualEmployeeLoginTime: string, // e.g., "09:00"
  employeeLoginTime: string,      // e.g., "09:15"
  timeZone: string                // e.g., "Asia/Kolkata"
): LateTime | null => {
  // Parse the `actualEmployeeLoginTime` and `employeeLoginTime` in the specified time zone
  const currentDate = moment().tz(timeZone).format("YYYY-MM-DD"); // Use the current date in the specified time zone
  const actualLogin = moment.tz(`${currentDate} ${actualEmployeeLoginTime}`, "YYYY-MM-DD HH:mm", timeZone);
  const employeeLogin = moment.tz(`${currentDate} ${employeeLoginTime}`, "YYYY-MM-DD HH:mm", timeZone);

  console.log("Actual login time:", actualLogin.format("HH:mm"));
  console.log("Employee login time:", employeeLogin.format("HH:mm"));

  // Validate the parsed times
  if (!actualLogin.isValid() || !employeeLogin.isValid()) {
    throw new Error("Invalid time format provided");
  }

  // Check if the employee logged in late
  if (employeeLogin.isAfter(actualLogin)) {
    const diffInSeconds = employeeLogin.diff(actualLogin, "seconds");
    const lateHours = Math.floor(diffInSeconds / 3600);
    const lateMinutes = Math.floor((diffInSeconds % 3600) / 60);
    const lateSeconds = diffInSeconds % 60;

    console.log(`${lateHours} hrs ${lateMinutes} mins ${lateSeconds} sec late`);

    return { lateHours, lateMinutes, lateSeconds };
  }

  return null; 
};