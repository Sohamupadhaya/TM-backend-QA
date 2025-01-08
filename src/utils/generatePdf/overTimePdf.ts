import puppeteer from 'puppeteer';
import { formatTime } from '../formatTime.js';

export const generateOverTimePDF = async (attendanceRecord: Array<any>, timeZone: string): Promise<Buffer> => {
    // Create HTML content for the PDF
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
                /* Custom styles will be injected here */
            </style>
        </head>
        <body>
            <h1>Daily Attendance Report</h1>
            <table>
                <tr>
                    <th>Employee Id</th>
                    <th>Employee Name</th>
                    <th>Clock-In</th>
                    <th>Clock-Out</th>
                    <th>Over Time</th>
                    <th>Early Clock Out</th>
                </tr>`;

    // Populate table rows
    attendanceRecord.forEach((attendance) => {
        htmlContent += `
            <tr>                
                <td>${attendance.employee?.employeeCode || ''}</td>
                <td>${attendance.employee?.employeeName || ''}</td>
                <td>${formatTime(attendance.metadata?.loginTime, timeZone)}</td>
                <td>${formatTime(attendance.metadata?.logoutTime, timeZone)}</td>
                <td>${attendance.overTime ? `Overtime: ${attendance.overTime}` : 'Regular'}</td>
                <td>${attendance.earlyClockOut || ''}</td>
            </tr>`;
    });

    htmlContent += `
            </table>
        </body>
    </html>`;

    // Launch Puppeteer and generate PDF
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({ format: 'A4' });
    await browser.close();

    return Buffer.from(pdfBuffer);
};