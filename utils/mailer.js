import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();


// Configure transporter with additional safety checks
const getTransporterConfig = () => {
  // Validate required environment variables
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.table({
      Host: process.env.SMTP_HOST,
      User: process.env.SMTP_USER,
      Pass: process.env.SMTP_PASS
    })
    throw new Error('Missing required SMTP environment variables');
  }

  return {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 5000,    // 5 seconds
    ...(process.env.NODE_ENV === 'development' && {
      logger: true,
      debug: true
    }),
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
      minVersion: 'TLSv1.2'
    }
  };
};

const transporter = nodemailer.createTransport(getTransporterConfig());

// Enhanced email validation
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!re.test(String(email).toLowerCase())) {
    throw new Error(`Invalid email format: ${email}`);
  }
};

// Improved email sending with retries
export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    // Validate parameters
    if (!to || !subject || !html) {
      throw new Error("Missing required email parameters");
    }

    // Validate email format
    validateEmail(to);

    // Prepare email content
    const mailOptions = {
      from: `"${process.env.FROM_NAME || '59Minutes'}" <${process.env.FROM_EMAIL}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
      headers: {
        'X-Mailer': '59MinutesMailer/1.0'
      }
    };

    // Send with retry logic
    let retries = 3;
    while (retries > 0) {
      try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${to}: ${info.messageId}`);
        return { ok: true, messageId: info.messageId };
      } catch (error) {
        retries--;
        if (retries === 0) throw error;
        console.warn(`Retrying email send (${retries} attempts left)...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  } catch (error) {
    console.error("❌ Email send failed:", {
      error: error.message,
      code: error.code,
      command: error.command,
      stack: error.stack
    });
    
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

// Enhanced configuration verification
export const verifyEmailConfig = async () => {
  try {
    if (!transporter) {
      throw new Error('Transporter not initialized');
    }

    const { host, port } = transporter.options;
    console.log(`🔍 Verifying SMTP connection to ${host}:${port}`);

    const success = await transporter.verify();
    if (success) {
      console.log("✅ SMTP connection verified successfully");
      return true;
    }
    return false;
  } catch (error) {
    console.error("❌ SMTP verification failed:", {
      host: transporter.options.host,
      port: transporter.options.port,
      error: error.message,
      code: error.code
    });
    
    // Provide troubleshooting tips
    console.log("\nTroubleshooting Tips:");
    console.log("1. Check SMTP credentials in environment variables");
    console.log("2. Verify network connectivity to SMTP server");
    console.log("3. Test port access: telnet ${host} ${port}");
    console.log("4. Check firewall/security group settings");
    console.log("5. Validate SSL/TLS configuration");
    
    return false;
  }
};

// Add health check endpoint
export const emailHealthCheck = async () => {
  const config = getTransporterConfig();
  return {
    status: await verifyEmailConfig() ? 'healthy' : 'unhealthy',
    config: {
      host: config.host,
      port: config.port,
      secure: config.secure,
      authUser: config.auth.user ? '*****' : 'missing'
    }
  };
};