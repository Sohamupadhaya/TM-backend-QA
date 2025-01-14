import dotenv from "dotenv";
import nodemailer from "nodemailer"
dotenv.config({ path: "./.env" });

const clientUrl = process.env.CLIENT_URL


const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_MAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

export const otpVerification = async ({ email, subject, companyName, otp }:any) => {
  const mailOption = {
    from: `Team Monitor <${process.env.SMTP_MAIL}>`,
    to: email,
    subject,
    html: `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; background-color: #f3f3f3;">
      <tr>
        <td align="center" style="padding: 30px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; max-width: 600px; background-color: #ffffff; border-radius: 10px; box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);">
            <tr>
              <td align="center" style="padding: 40px;">
                <h1 style="color: #333333; margin: 0;">Verify Your OTP</h1>
                <p style="color: #777777; margin: 20px 0;">Hi, ${companyName},</p>
                <p style="color: #777777; margin: 20px 0;">In order to complete your registration, please click the button below to verify your email:</p>
              ${otp}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    `,
  };
  await transporter.sendMail(mailOption);
};



export const forgetPwOTP = async ({ email, subject, otp, companyName} :any) => {
  const pwMail = {
    from: `Team Monitor <${process.env.SMTP_MAIL}>`,
    to : email,
    subject,
    html:`
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; background-color: #f3f3f3;">
      <tr>
        <td align="center" style="padding: 30px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; max-width: 600px; background-color: #ffffff; border-radius: 10px; box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);">
            <tr>
              <td align="center" style="padding: 40px;">
                <h1 style="color: #333333; margin: 0;">Verify Your OTP</h1>
                <p style="color: #777777; margin: 20px 0;">Hi, ${companyName},</p>
                <p style="color: #777777; margin: 20px 0;"> Here is ypur OTP to reset your password. </p>
                ${otp}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    `,
  }
  await transporter.sendMail(pwMail);
}

export const deadLineReminder = async ({
  email,
  subject,
  employeeName,
  task_name,
}: any) => {
  const pwMail = {
    from: `Team Monitor <${process.env.SMTP_MAIL}>`,
    to: email,
    subject,
    html: `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; background-color: #f3f3f3;">
      <tr>
        <td align="center" style="padding: 30px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; max-width: 600px; background-color: #ffffff; border-radius: 10px; box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);">
            <tr>
              <td align="center" style="padding: 40px;">
                <h1 style="color: #333333; margin: 0;">Hurry Up</h1>
                <p style="color: #777777; margin: 20px 0;">Hi, ${employeeName},</p>
                <p style="color: #777777; margin: 20px 0;"> You juist have 24 hours for  ${task_name} task submission. </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    `,
  };
  await transporter.sendMail(pwMail);
};


export const deadlineEnded = async ({
  email,
  subject,
  employeeName,
  companyName,
  task_name,
  deadline
}: any) => {
  const pwMail = {
    from: `Team Monitor <${process.env.SMTP_MAIL}>`,
    to: email,
    subject,
    html: `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; background-color: #f3f3f3;">
      <tr>
        <td align="center" style="padding: 30px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; max-width: 600px; background-color: #ffffff; border-radius: 10px; box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);">
            <tr>
              <td align="center" style="padding: 40px;">
                <h1 style="color: #333333; margin: 0;">Hurry Up</h1>
                <p style="color: #777777; margin: 20px 0;">Hi, ${employeeName},</p>
                <p style="color: #777777; margin: 20px 0;"> Dear [Name],
                I wanted to remind you that the deadline for ${task_name} has passed as of ${deadline}. Please let me know if there are any issues or if you need assistance moving forward.
                Best regards,
                ${companyName}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    `,
  };
  await transporter.sendMail(pwMail);
};


export const sendRiskUserDetails = async ({ email, subject, companyName, employeeName, attachments }: any) => {
  const mailOption = {
    from: `Team Monitor <${process.env.SMTP_MAIL}>`,
    to: email,
    subject,
    html: `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; background-color: #f3f3f3;">
      <tr>
        <td align="center" style="padding: 30px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; max-width: 600px; background-color: #ffffff; border-radius: 10px; box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);">
            <tr>
              <td align="center" style="padding: 40px;">
                <h1 style="color: #333333; margin: 0;">Screenshots</h1>
                <p style="color: #777777; margin: 20px 0;">Hi, ${companyName},</p>
                <p style="color: #777777; margin: 20px 0;">Here are the screenshots for ${employeeName}.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    `,
    attachments // Attach the zip file
  };
  await transporter.sendMail(mailOption);
};

export const leaveSummaryPdf = async ({ email, subject, companyName, attachment }: any) => {
  const mailOption = {
    from: `Team Monitor <${process.env.SMTP_MAIL}>`,
    to: email,
    subject,
    html: `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; background-color: #f3f3f3;">
      <tr>
        <td align="center" style="padding: 30px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; max-width: 600px; background-color: #ffffff; border-radius: 10px; box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);">
            <tr>
              <td align="center" style="padding: 40px;">
                <h1 style="color: #333333; margin: 0;">Leave Report</h1>
                <p style="color: #777777; margin: 20px 0;">Hi, ${companyName},</p>
                <p style="color: #777777; margin: 20px 0;">This is the leave report taken in your company.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    `,
    attachments: [{
      filename: 'LeaveReport.pdf',
      content: attachment,
      contentType: 'application/pdf',
    }],
  };
  
  // Send the email
  await transporter.sendMail(mailOption);
};


export const attendancePdf = async ({ email, subject, companyName, attachment, date }: any) => {
  const mailOption = {
    from: `Team Monitor <${process.env.SMTP_MAIL}>`,
    to: email,
    subject,
    html: `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; background-color: #f3f3f3;">
      <tr>
        <td align="center" style="padding: 30px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; max-width: 600px; background-color: #ffffff; border-radius: 10px; box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);">
            <tr>
              <td align="center" style="padding: 40px;">
                <h1 style="color: #333333; margin: 0;">Attendance Report</h1>
                <p style="color: #777777; margin: 20px 0;">Hi, ${companyName},</p>
                <p style="color: #777777; margin: 20px 0;">This is your ${date} attendance of the company.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    `,
    attachments: [{
      filename: `Attendance.pdf`,
      content: attachment,
      contentType: 'application/pdf',
    }],
  };
  
  // Send the email
  await transporter.sendMail(mailOption);
};


export const deletedEmpPdf = async ({ email, subject, companyName, attachment }: any) => {
  const mailOption = {
    from: `Team Monitor <${process.env.SMTP_MAIL}>`,
    to: email,
    subject,
    html: `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; background-color: #f3f3f3;">
      <tr>
        <td align="center" style="padding: 30px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; max-width: 600px; background-color: #ffffff; border-radius: 10px; box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);">
            <tr>
              <td align="center" style="padding: 40px;">
                <h1 style="color: #333333; margin: 0;">Daily Attendance Report</h1>
                <p style="color: #777777; margin: 20px 0;">Hi, ${companyName},</p>
                <p style="color: #777777; margin: 20px 0;">This deleted employees report of your company.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    `,
    attachments: [{
      filename: `Deleted Employee Report.pdf`,
      content: attachment,
      contentType: 'application/pdf',
    }],
  };
  
  // Send the email
  await transporter.sendMail(mailOption);
};



export const monthlyInOutPdf = async ({ email, subject, companyName, attachment, date }: any) => {
  const mailOption = {
    from: `Team Monitor <${process.env.SMTP_MAIL}>`,
    to: email,
    subject,
    html: `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; background-color: #f3f3f3;">
      <tr>
        <td align="center" style="padding: 30px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; max-width: 600px; background-color: #ffffff; border-radius: 10px; box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);">
            <tr>
              <td align="center" style="padding: 40px;">
                <h1 style="color: #333333; margin: 0;">Monthy In-Out Report</h1>
                <p style="color: #777777; margin: 20px 0;">Hi, ${companyName},</p>
                <p style="color: #777777; margin: 20px 0;">This is your monthly in out report.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    `,
    attachments: [{
      filename: `Monthly-In-Out.pdf`,
      content: attachment,
      contentType: 'application/pdf',
    }],
  };
  
  // Send the email
  await transporter.sendMail(mailOption);
};



export const appHistortPdf = async ({ email, subject, companyName, attachment, date }: any) => {
  const mailOption = {
    from: `Team Monitor <${process.env.SMTP_MAIL}>`,
    to: email,
    subject,
    html: `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; background-color: #f3f3f3;">
      <tr>
        <td align="center" style="padding: 30px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; max-width: 600px; background-color: #ffffff; border-radius: 10px; box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);">
            <tr>
              <td align="center" style="padding: 40px;">
                <h1 style="color: #333333; margin: 0;">Monthy In-Out Report</h1>
                <p style="color: #777777; margin: 20px 0;">Hi, ${companyName},</p>
                <p style="color: #777777; margin: 20px 0;">This is your monthly in out report.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    `,
    attachments: [{
      filename: `Monthly-In-Out.pdf`,
      content: attachment,
      contentType: 'application/pdf',
    }],
  };
  
  // Send the email
  await transporter.sendMail(mailOption);
};

export const forgetPasswordEmployee = async ({ email, subject, otp, companyName,employeeName} :any) => {
  const pwMail = {
    from: `Team Monitor <${process.env.SMTP_MAIL}>`,
    to : email,
    subject,
    html:`
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; background-color: #f3f3f3;">
      <tr>
        <td align="center" style="padding: 30px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; max-width: 600px; background-color: #ffffff; border-radius: 10px; box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);">
            <tr>
              <td align="center" style="padding: 40px;">
                <h1 style="color: #333333; margin: 0;">Verify Your OTP</h1>
                <p style="color: #777777; margin: 20px 0;">Hi, ${employeeName},from ${companyName} company</p>
                <p style="color: #777777; margin: 20px 0;"> Here is ypur OTP to reset your password. </p>
                ${otp}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    `,
  }
  await transporter.sendMail(pwMail);
}