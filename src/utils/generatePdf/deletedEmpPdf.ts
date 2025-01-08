import puppeteer from 'puppeteer';

export const generateDeletedEmpPDF = async (deletedEmp: Array<any>): Promise<Buffer> => {
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
            <h1>Deleted Employee Report</h1>
            <table>
                <tr>
                    <th>SN</th>
                    <th>Employee Name</th>
                    <th>Reason</th>
                    <th>Deleted At</th>
                </tr>`;

    // Populate table rows
    deletedEmp.forEach((emp, index) => {
        htmlContent += `
            <tr>                
                <td>${index + 1}</td>
                <td>${emp.employeeName}</td>
                <td>${emp.reason}</td>
                <td>${(emp.addedAt).toLocaleString()}</td>
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