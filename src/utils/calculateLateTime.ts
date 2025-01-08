// // Helper function to calculate if the employee is late
// export const calculateLateTime = (actualEmployeeLoginTime: string, employeeLoginTime: string) => {
//     const [actualLoginHour, actualLoginMinutes, actualLoginSeconds] = actualEmployeeLoginTime.split(':').map(Number);
//     const [employeeHour, employeeMinute, employeeSecond] = employeeLoginTime.split(':').map(Number);
  
//     if (
//       employeeHour > actualLoginHour ||
//       (employeeHour === actualLoginHour && employeeMinute > actualLoginMinutes) ||
//       (employeeHour === actualLoginHour && employeeMinute === actualLoginMinutes && employeeSecond > actualLoginSeconds)
//     ) {
//       const totalLateMinutes = (employeeHour - actualLoginHour) * 60 + (employeeMinute - actualLoginMinutes);
//       const lateHours = Math.floor(totalLateMinutes / 60);
//       const lateMinutes = totalLateMinutes % 60;
//       let lateSeconds = (employeeSecond || 0) - (actualLoginSeconds || 0);
  
//       if (lateSeconds < 0) {
//         lateSeconds += 60;
//       }
  
//       return `${lateHours} hrs, ${lateMinutes} mins, ${lateSeconds} sec late`;
//     }
//     return 'On time';
// };


export const calculateLateTime = (actualEmployeeLoginTime: string, employeeLoginTime: string) => {
  // Split and parse "actualEmployeeLoginTime" into hours and minutes
  const [actualHours, actualMinutes] = actualEmployeeLoginTime
      .replace(/AM|PM/i, '')
      .split(':')
      .map(Number);
  const isPM = actualEmployeeLoginTime.toUpperCase().includes('PM');
  const actualLoginTotalMinutes = (isPM ? actualHours % 12 + 12 : actualHours) * 60 + actualMinutes;

  // Split and parse "employeeLoginTime" into hours, minutes, and seconds
  const [empHours, empMinutes, empSeconds] = employeeLoginTime.split(':').map(Number);
  const employeeLoginTotalMinutes = empHours * 60 + empMinutes;
  const lateSeconds = empSeconds || 0;

  // Calculate the difference in minutes
  const totalLateMinutes = employeeLoginTotalMinutes - actualLoginTotalMinutes;

  // Check if employee clocked in late
  if (totalLateMinutes > 0 || (totalLateMinutes === 0 && lateSeconds > 0)) {
      const lateHours = Math.floor(totalLateMinutes / 60);
      const lateMinutesFinal = totalLateMinutes % 60;

      console.log(`Late by: ${lateHours} hrs, ${lateMinutesFinal} mins, ${lateSeconds} sec`);
      return {
          lateDescription: `${lateHours > 0 ? `${lateHours} hrs, ` : ''}${lateMinutesFinal} mins, ${lateSeconds} sec late`,
          isLate: true
      };
  }

  console.log("Employee is on time.");
  return { lateDescription: 'On time', isLate: false };
};

// // Helper function to calculate if the employee is late
// export const calculateLateTime = (actualEmployeeLoginTime: string, employeeLoginTime: string) => {
//     const [actualLoginHour, actualLoginMinutes, actualLoginSeconds] = actualEmployeeLoginTime.split(':').map(Number);
//     const [employeeHour, employeeMinute, employeeSecond] = employeeLoginTime.split(':').map(Number);
  
//     if (
//       employeeHour > actualLoginHour ||
//       (employeeHour === actualLoginHour && employeeMinute > actualLoginMinutes) ||
//       (employeeHour === actualLoginHour && employeeMinute === actualLoginMinutes && employeeSecond > actualLoginSeconds)
//     ) {
//       const totalLateMinutes = (employeeHour - actualLoginHour) * 60 + (employeeMinute - actualLoginMinutes);
//       const lateHours = Math.floor(totalLateMinutes / 60);
//       const lateMinutes = totalLateMinutes % 60;
//       let lateSeconds = (employeeSecond || 0) - (actualLoginSeconds || 0);
  
//       if (lateSeconds < 0) {
//         lateSeconds += 60;
//       }
  
//       return `${lateHours} hrs, ${lateMinutes} mins, ${lateSeconds} sec late`;
//     }
//     return 'On time';
//   };
