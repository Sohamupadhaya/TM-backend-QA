import puppeteer from 'puppeteer';

export const generateLeavePDF = async (leaveData: any[], styles: string = '', hasEmployeeId: boolean): Promise<Buffer> => {
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
                ${styles} /* Custom styles will be injected here */
            </style>
        </head>
        <body>
            <h1>Leave Report</h1>`;

    if (hasEmployeeId) {
        // If employee ID exists, include employee details and the first table
        htmlContent += `
            <h2>Employee Code: ${leaveData[0].employee.employeeCode}</h2>
            <h2>Employee Name: ${leaveData[0].employee.employeeName}</h2>
            <table>
                <tr>
                    <th>Leave Type</th>
                    <th>Leave Session</th>
                    <th>Leave Status</th>
                    <th>Reason</th>
                    <th>No of Days</th>
                    <th>Leave From</th>
                    <th>Leave To</th>
                </tr>`;

        // Populate table rows for the employee
        leaveData.forEach((leave) => {
            htmlContent += `
            <tr>
                <td>${leave.leaveType}</td>
                <td>${leave.leaveSession}</td>
                <td>${leave.leaveStatus}</td>
                <td>${leave.reason}</td>
                <td>${leave.noOfDays}</td>
                <td>${leave.leaveFrom ? leave.leaveFrom.toISOString().split('T')[0] : ''}</td>
                <td>${leave.leaveTo ? leave.leaveTo.toISOString().split('T')[0] : ''}</td>
            </tr>`;
        });

        htmlContent += `
            </table>`;
    } else {
        // If no employee ID, print a different table structure
        htmlContent += `
        <table>
            <tr>
                <th>Employee Id</th>
                <th>Employee Name</th>
                <th>Leave Type</th>
                <th>Leave Session</th>
                <th>Leave Status</th>
                <th>Reason</th>
                <th>No of Days</th>
                <th>Leave From</th>
                <th>Leave To</th>
            </tr>`;

        // Populate table rows without employee details
        leaveData.forEach((leave) => {
            htmlContent += `
            <tr>                
                <td>${leave.employee ? leave.employee.employeeCode : ''}</td>
                <td>${leave.employee ? leave.employee.employeeName : ''}</td>
                <td>${leave.leaveType}</td>
                <td>${leave.leaveSession}</td>
                <td>${leave.leaveStatus}</td>
                <td>${leave.reason}</td>
                <td>${leave.noOfDays}</td>
                <td>${leave.leaveFrom ? leave.leaveFrom.toISOString().split('T')[0] : ''}</td>
                <td>${leave.leaveTo ? leave.leaveTo.toISOString().split('T')[0] : ''}</td>
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

    // Convert Uint8Array to Buffer
    return Buffer.from(pdfBuffer);
};