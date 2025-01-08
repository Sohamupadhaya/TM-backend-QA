import moment from 'moment-timezone';

interface LateTime {
  lateHours: number;
  lateMinutes: number;
  lateSeconds: number;
}

export const calculateLateTime = (
  actualEmployeeLoginTime: string,
  employeeLoginTime: string,
  timeZone: string
): LateTime | null => {
  // Parse times with the specific timezone
  const currentDate = moment().format('YYYY-MM-DD');
  const actualLogin = moment.tz(`${currentDate} ${actualEmployeeLoginTime}`, 'YYYY-MM-DD HH:mm', timeZone);
  const [hours, minutes] = employeeLoginTime.split(':');
  const employeeLogin = moment.tz(`${currentDate} ${hours}:${minutes}`, 'YYYY-MM-DD HH:mm', timeZone);
  console.log('Actual login time:', actualLogin.format('HH:mm'));
  console.log('Employee login time:', employeeLogin.format('HH:mm'));

  if (!actualLogin.isValid() || !employeeLogin.isValid()) {
    throw new Error('Invalid time format provided');
  }

  if (employeeLogin.isAfter(actualLogin)) {
    const diffInSeconds = employeeLogin.diff(actualLogin, 'seconds');
    const lateHours = Math.floor(diffInSeconds / 3600);
    const lateMinutes = Math.floor((diffInSeconds % 3600) / 60);
    const lateSeconds = diffInSeconds % 60;
    console.log(`${lateHours} hrs ${lateMinutes} mins ${lateSeconds} sec late`);

    return { lateHours, lateMinutes, lateSeconds };
  }

  return null; 
};