// import moment from 'moment-timezone';

// // Helper function to calculate overtime or early clock-out
// export const calculateTimeDifference = (actualEmployeeLogoutTime: string, employeeLogoutTime: string, timeZone: string) => {
//   const currentDate = moment().tz(timeZone).format('YYYY-MM-DD'); // Use the current date in the specified time zone
//   const actualLogout = moment.tz(`${currentDate} ${actualEmployeeLogoutTime}`, 'YYYY-MM-DD HH:mm', timeZone);
//   const employeeLogout = moment.tz(`${currentDate} ${employeeLogoutTime}`, 'YYYY-MM-DD HH:mm', timeZone);

//   console.log('Actual logout time:', actualLogout.format('HH:mm'));
//   console.log('Employee logou t time:', employeeLogout.format('HH:mm'));

//   if (!actualLogout.isValid() || !employeeLogout.isValid()) {
//     throw new Error('Invalid time format provided');
//   }

//   const diffInSeconds = Math.abs(employeeLogout.diff(actualLogout, 'seconds'));
//   const hours = Math.floor(diffInSeconds / 3600);
//   const minutes = Math.floor((diffInSeconds % 3600) / 60);
//   const seconds = diffInSeconds % 60;

//   if (employeeLogout.isAfter(actualLogout)) {
//     return `${hours} hrs, ${minutes} mins, ${seconds} sec overtime`;
//   } else if (employeeLogout.isBefore(actualLogout)) {
//     return `${hours} hrs, ${minutes} mins, ${seconds} sec early clock-out`;
//   }
//   return 'On-time';
// };

import moment from 'moment-timezone';

// Helper function to calculate overtime or early clock-out
export const calculateTimeDifference = (workingHoursDuration: number, employeeWorkingTime: number) => {
  const diffInSeconds = Math.abs(employeeWorkingTime - workingHoursDuration);
  const hours = Math.floor(diffInSeconds / 3600);
  const minutes = Math.floor((diffInSeconds % 3600) / 60);
  const seconds = diffInSeconds % 60;

  console.log(`Difference: ${hours} hrs, ${minutes} mins, ${seconds} sec`);

  if (employeeWorkingTime > workingHoursDuration) {
    return `${hours} hrs, ${minutes} mins, ${seconds} sec overtime`;
  } else if (employeeWorkingTime < workingHoursDuration) {
    return `${hours} hrs, ${minutes} mins, ${seconds} sec early clock-out`;
  }

  return 'On-time';
};