import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  ...(process.env.NODE_ENV === 'development' && {
    logger: true,
    debug: true
  }),
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === 'production'
  }
});

export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    if (!to || !subject || !html) {
      throw new Error("Missing required email parameters");
    }

    if (!validateEmail(to)) {
      throw new Error(`Invalid recipient email address: ${to}`);
    }

    const info = await transporter.sendMail({
      from: `"${process.env.FROM_NAME || '59Minutes'}" <${process.env.FROM_EMAIL}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '') 
    });

    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
    return { ok: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Error sending email:", error);
    
    return { 
      ok: false, 
      error: {
        message: error.message,
        code: error.code,
        command: error.command
      }
    };
  }
};

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

export const verifyEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log("✅ Email configuration verified successfully");
    return true;
  } catch (error) {
    console.error("❌ Email configuration error:", error);
    return false;
  }
};
