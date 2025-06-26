class emailTemplates {
  loginHTML(vendorName, timestamp, ipAddress) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Login Alert</title>
        </head>
        <body style="font-family: Arial, sans-serif; color: #333;">
          <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
            <h2 style="color: #dc3545;">Login Alert 🚨</h2>
            <p>Hello, <strong>${vendorName}</strong></p>
            
            <p>We detected a login to your <strong>59Minutes</strong> account:</p>
            
            <ul style="line-height: 1.6;">
              <li><strong>Time:</strong> ${timestamp}</li>
              <li><strong>IP Address:</strong> ${ipAddress}</li>
            </ul>
  
            <p>If this was <strong>you</strong>, no further action is needed.</p>
            <p>If you do not recognize this activity, please <strong>change your password</strong> immediately and contact support.</p>
  
            <p>Stay secure,<br/>The 59Minutes Team</p>
  
            <hr style="margin-top: 30px;"/>
            <small style="color: #777;">This is an automated message. Please do not reply to this email.</small>
          </div>
        </body>
      </html>
  `;
  }

  signupHTML(vendorName, timestamp, ipAddress) {
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Welcome to 59Minutes</title>
      </head>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #007bff;">Welcome, ${vendorName}! 🎉</h2>
           <ul style="line-height: 1.6;">
              <li><strong>Time:</strong> ${timestamp}</li>
              <li><strong>IP Address:</strong> ${ipAddress}</li>
            </ul>
          <p>Thank you for signing up with <strong>59Minutes</strong>.</p>
          
          <p>We're excited to have you onboard. You can now access your dashboard and start managing your products and services efficiently.</p>
  
          <p>If you have any questions or need help, feel free to contact our support team at <a href="mailto:support@59minutes.com">support@59minutes.com</a>.</p>
  
          <p>Cheers, <br/>The 59Minutes Team</p>
  
          <hr style="margin-top: 30px;"/>
          <small style="color: #777;">You received this email because you created an account on 59Minutes.</small>
        </div>
      </body>
    </html>
  
  `;
  }
}

export default new emailTemplates();
