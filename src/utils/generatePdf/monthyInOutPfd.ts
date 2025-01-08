import puppeteer from 'puppeteer';
import { formatTime } from '../formatTime.js';

export const generateMonthlyInOutPDF = async (attendanceRecords: Array<any>, timeZone: string, hasEmployeeId: boolean): Promise<Buffer> => {
    // Create HTML content for the PDF
    let htmlContent = `
    <html>
        <head>
            <style>
                #monthly-in-out {
                    padding: 20px;
                    background-color: #f9f9f9;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }

                .upper-content-headings {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 20px;
                    padding-left: 10px;
                }

                .upper-content-headings h2 {
                    font-size: 1.2rem;
                    font-family: Arial, Helvetica, sans-serif;
                    color: #000000;
                    margin-bottom: 8px;
                }

                .upper-content-headings h4 {
                    font-size: 1.1rem;
                    font-family: Arial, Helvetica, sans-serif;
                    color: #000000;
                    padding-top: 15px;
                }

                .lower-content-body {
                    background-color: #fff;
                    padding: 15px;
                    border-radius: 8px;
                    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
                }

                .lower-content-body div {
                    margin-bottom: 15px;
                    padding: 10px;
                    border-bottom: 1px solid #e0e0e0;
                }

                .lower-content-body h2 {
                    font-size: 1.2rem;
                    font-family: Arial, Helvetica, sans-serif;
                    color: #000000;
                    margin-bottom: 8px;
                }

                .lower-content-body h4 {
                    font-size: 1.1rem;
                    font-family: Arial, Helvetica, sans-serif;
                    color: #000000;
                    padding-top: 15px;
                }

                .lower-content-body div:last-child {
                    border-bottom: none;
                }

                .in-out {
                    display: flex;
                    justify-content: space-between;
                    background-color: #f9f9f9;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }

                .in-out h5 {
                    font-size: 1rem;
                    color: #555;
                    margin: 5px 0;
                }

                .lower-content-body p {
                    color: #999;
                    font-style: italic;
                }
            </style>
        </head>
        <body>
            <h1>Monthly In-Out Report</h1>
            <div id="monthly-in-out">
                <div class="upper-content-headings">
                    <div>
                        ${hasEmployeeId ? `<h2><b>Employee Id:</b> ${attendanceRecords[0].employee.employeeCode}</h2>` : ''}
                        ${hasEmployeeId ? `<h2><b>Employee Name:</b> ${attendanceRecords[0].employee.employeeName}</h2>` : ''}
                    </div>
                    ${hasEmployeeId ? `<h4><b>Total Worked Days:</b> ${attendanceRecords.length}</h4>` : ''}
                </div>
                <div class="lower-content-body">
                    ${attendanceRecords.length > 0 ? attendanceRecords.map(attendance => `
                        <div key="${attendance.id}">
                            ${!hasEmployeeId ? `<h2><b>Employee Id:</b> ${attendance.employee.employeeCode}</h2>` : ''}
                            ${!hasEmployeeId ? `<h2><b>Employee Name:</b> ${attendance.employee.employeeName}</h2>` : ''}
                            <h4>Date: ${attendance.actualDate}</h4>
                            <div class="in-out">
                                <h5>Clock-In: ${formatTime(attendance.metadata?.loginTime, timeZone)}</h5>
                                <h5>Clock-Out: ${formatTime(attendance.metadata?.logoutTime, timeZone)}</h5>
                            </div>
                        </div>
                    `).join('') : '<p>No data available</p>'}
                </div>
            </div>
        </body>
    </html>`;

    // Launch Puppeteer and generate PDF
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    return Buffer.from(pdfBuffer);
};