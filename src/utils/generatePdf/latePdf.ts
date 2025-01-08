import puppeteer from 'puppeteer';
import { formatTime } from '../formatTime.js';

export const generateLateAttPDF = async (attendanceRecords: Array<any>, timeZone: string, hasEmployeeId: boolean): Promise<Buffer> => {
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
            <h1>Late Clock-In Report</h1>`;
    
    if (hasEmployeeId){
        htmlContent += `
            <h2>Employee ID: ${attendanceRecords[0].employee.employeeCode}</h2>
            <h2>Employee Name: ${attendanceRecords[0].employee.employeeName}</h2>

            <table>
                <tr>
                    <th>Date</th>
                    <th>Clock-In</th>
                    <th>Clock-Out</th>
                    <th>Late Clock In</th>
                </tr>`;

            // Populate table rows
            attendanceRecords.forEach((attendance) => {
                htmlContent += `
                    <tr>                
                        <td>${attendance.actualDate}</td>
                        <td>${formatTime(attendance.metadata?.loginTime, timeZone)}</td>
                        <td>${formatTime(attendance.metadata?.logoutTime, timeZone)}</td>
                        <td>${attendance.lateClockIn || ''}</td>
                    </tr>`;
            });

        htmlContent += `
            </table>`;
    } else {
        htmlContent += `
            <table>
                <tr>
                    <th>Employee Id</th>
                    <th>Employee Name</th>
                    <th>Date</th>
                    <th>Clock-In</th>
                    <th>Clock-Out</th>
                    <th>Late Clock In</th>
                </tr>`;

            // Populate table rows
            attendanceRecords.forEach((attendance) => {
                htmlContent += `
                    <tr>                
                        <td>${attendance.employee?.employeeCode || ''}</td>
                        <td>${attendance.employee?.employeeName || ''}</td>
                        <td>${attendance.actualDate}</td>
                        <td>${formatTime(attendance.metadata?.loginTime, timeZone)}</td>
                        <td>${formatTime(attendance.metadata?.logoutTime, timeZone)}</td>
                        <td>${attendance.lateClockIn || ''}</td>
                    </tr>`;
            });

        htmlContent += `
            </table>`;
    }

    htmlContent += `
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