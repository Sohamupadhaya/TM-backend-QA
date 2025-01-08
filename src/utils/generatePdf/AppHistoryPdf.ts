import puppeteer from 'puppeteer';

export const generateAppHistoryPDF = async (enployeeUsedApp: Array<any>, date?: string, month?: string): Promise<Buffer> => {
    // Create HTML content for the PDF
    let htmlContent = `
    <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; }
                h1 { text-align: center; }
                h2 { text-align: center; color: #555; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
            </style>
        </head>
        <body>
            <h1>App Usage Report</h1>
            <h2>${month ? `For the month of ${month}` : ''}</h2>
            <table>
                <tr>
                    <th>Employee Name</th>
                    <th>Employee Code</th>
                    <th>Usage Day</th>
                </tr>
                ${enployeeUsedApp.map(app => `
                    <tr>
                        <td>${app.employee.employeeName}</td>
                        <td>${app.employee.employeeCode}</td>
                        <td>${app.day}</td>
                    </tr>
                `).join('')}
            </table>
        </body>
    </html>
    `;

    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({ format: 'A4' });
    await browser.close();

    // return pdfBuffer;
    return Buffer.from(pdfBuffer);
};