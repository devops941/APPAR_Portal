import nodemailer from "nodemailer";

interface StudentCredentialsMailParams {
  studentName: string;
  email: string;
  registerNumber: string;
  temporaryPassword: string;
  institutionName?: string;
  portalUrl?: string;
}

/**
 * Creates and returns the nodemailer transporter using configured SMTP credentials.
 */
function getEmailTransporter() {
  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || "587", 10);
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD;

  if (!user || !pass) {
    console.warn("⚠️ SMTP credentials not found in environment. Email will not be sent.");
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

/**
 * Sends student login credentials to their registered email address.
 */
export async function sendStudentCredentialsEmail(
  params: StudentCredentialsMailParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = getEmailTransporter();
    if (!transporter) {
      return { success: false, error: "SMTP not configured" };
    }

    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || "devops@kaizeninfinities.com";
    const fromName = process.env.FROM_NAME || "APAAR Academic Platform";
    const appUrl = params.portalUrl || process.env.APP_URL || "http://localhost:3000";
    const loginUrl = `${appUrl}/login`;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
    .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .header { background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; }
    .content { padding: 32px 28px; }
    .greeting { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
    .intro { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
    .card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
    .credential-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #edf2f7; font-size: 13px; }
    .credential-row:last-child { border-bottom: none; }
    .label { color: #64748b; font-weight: 600; }
    .value { color: #0f172a; font-weight: 700; font-family: 'Courier New', monospace; }
    .btn-container { text-align: center; margin: 28px 0 16px; }
    .btn { display: inline-block; background-color: #059669; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 32px; border-radius: 10px; box-shadow: 0 2px 4px rgba(5, 150, 105, 0.2); }
    .security-note { font-size: 12px; color: #64748b; line-height: 1.5; background-color: #f1f5f9; padding: 12px; border-radius: 8px; margin-top: 20px; }
    .footer { text-align: center; padding: 20px; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>APAAR Academic Registry</h1>
      <p>Automated Permanent Academic Account Registry</p>
    </div>
    <div class="content">
      <div class="greeting">Welcome, ${params.studentName}!</div>
      <div class="intro">
        Your student profile has been registered in the National Academic APAAR Platform under <strong>${params.institutionName || "your institution"}</strong>.
        Use the credentials below to access your student portal.
      </div>

      <div class="card">
        <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 13px;">
          <tr>
            <td style="color: #64748b; font-weight: 600;">Register / Roll No:</td>
            <td style="color: #059669; font-weight: 800; font-family: monospace; text-align: right;">${params.registerNumber}</td>
          </tr>
          <tr>
            <td style="color: #64748b; font-weight: 600;">Username (Email):</td>
            <td style="color: #0f172a; font-weight: 700; font-family: monospace; text-align: right;">${params.email}</td>
          </tr>
          <tr>
            <td style="color: #64748b; font-weight: 600;">Temporary Password:</td>
            <td style="color: #0f172a; font-weight: 700; font-family: monospace; text-align: right; background: #e2e8f0; padding: 2px 8px; border-radius: 4px;">${params.temporaryPassword}</td>
          </tr>
        </table>
      </div>

      <div class="btn-container">
        <a href="${loginUrl}" class="btn" target="_blank">Sign in to Student Portal</a>
      </div>

      <div class="security-note">
         <strong>Security Advice:</strong> This is a system-generated credential. Please log in and change your password immediately in your profile settings.
      </div>
    </div>
    <div class="footer">
      Automated email from National APAAR Portal. Please do not reply directly to this email.
    </div>
  </div>
</body>
</html>
    `;

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to: params.email,
      subject: ` Welcome to APAAR Portal - Your Student Login Credentials`,
      text: `Welcome to APAAR Academic Registry, ${params.studentName}!\n\nYour Login Credentials:\n- Username: ${params.email}\n- Roll No: ${params.registerNumber}\n- Password: ${params.temporaryPassword}\n- Login URL: ${loginUrl}\n\nPlease sign in and change your password.`,
      html: htmlContent,
    });

    console.log(`📧 Student credentials email sent to ${params.email}: messageId=${info.messageId}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Failed to send student credentials email:", error);
    return { success: false, error: (error as Error).message };
  }
}
