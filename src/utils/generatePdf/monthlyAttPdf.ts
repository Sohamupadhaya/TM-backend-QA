import puppeteer from 'puppeteer';

export const generateMonthlyAttPDF = async (attendanceRecords: Array<any>, employeeName: string, employeeCode: string, year: number, month: number): Promise<Buffer> => {
    
    // Create an array to hold all dates for the specified month
    const allDates = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate(); // Get the number of days in the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        allDates.push({
            date: dateStr,
            attendance: attendanceRecords.find(record => record.actualDate === dateStr)
        });
    }

    // Create HTML content for the PDF
    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;

    let htmlContent = `
    <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; }
                h1 { text-align: center; }
                h2 { text-align: center; color: #555; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; }
                th { background-color: #f2f2f2; }
                th, td { text-align: left; }
            </style>
        </head>
        <body>
            <h1>Monthly Attendance Report</h1>
            <h2>Date: ${formattedDate}</h2>
            <h2>Employee Name: ${employeeName}</h2>
            <h2>Employee Code: ${employeeCode}</h2>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Clock-In</th>
                        <th>Clock-Out</th>
                        <th>Late Clock-In</th>
                        <th>Early Clock-Out</th>
                        <th>Over Time</th>
                    </tr>
                </thead>
                <tbody>`;

    // Populate table rows with all dates
    allDates.forEach(({ date, attendance }) => {
        let clockIn = "-";
        let clockOut = "-";
        let lateClockIn = "-";
        let earlyClockOut = "-";
        let overTime = "-";
        if (attendance) {
            clockIn = attendance.employeeLoginTime !== "N/A" ? new Date(attendance.employeeLoginTime).toLocaleTimeString() : "N/A";
            clockOut = attendance.employeeLogoutTime !== "N/A" ? new Date(attendance.employeeLogoutTime).toLocaleTimeString() : "N/A";
            lateClockIn = attendance.lateClockIn || "N/A";
            earlyClockOut = attendance.earlyClockOut || "N/A";
            overTime = attendance.overTime || "N/A";
        } 
        htmlContent += `
            <tr>
                <td>${date}</td>
                <td>${clockIn}</td>
                <td>${clockOut}</td>
                <td>${lateClockIn}</td>
                <td>${earlyClockOut}</td>
                <td>${overTime}</td>
            </tr>`;
    });

    htmlContent += `
                </tbody>
            </table>
        </body>
    </ html>`;
    
    // Launch Puppeteer and generate PDF
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({ format: 'A4' });
    await browser.close();
    return Buffer.from(pdfBuffer);
};